/**
 * Chat endpoint with Multi-Provider AI streaming & Learning Analytics telemetry.
 * POST - Send a participant message, record client latency telemetry,
 * stream clean SSE tokens via lib/ai-engine.js, and persist provider token/cost/TTFT telemetry.
 */
import { NextResponse } from 'next/server';
import {
  getSession,
  getMessages,
  createMessage,
  incrementInteractionCount,
  getWorkshop,
  getSettings,
  addTelemetry,
} from '@/lib/db';
import { streamChat } from '@/lib/ai-engine';

export async function POST(request, { params }) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { message, client_telemetry = null } = body;

    if (!message || !String(message).trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'completed') {
      return NextResponse.json({ error: 'This session has been completed' }, { status: 403 });
    }

    const [workshop, settings] = await Promise.all([
      getWorkshop(session.workshop_id),
      Promise.resolve().then(() => getSettings()).catch(() => ({})),
    ]);

    const provider = (
      workshop?.ai_provider ||
      settings?.default_ai_provider ||
      'openrouter'
    ).toLowerCase();
    const model =
      workshop?.openrouter_model ||
      settings?.default_ai_model ||
      process.env.DEFAULT_MODEL;
    const apiKeyOverride = settings?.[`api_key_${provider}`] || undefined;
    const baseUrl = settings?.ollama_base_url || process.env.OLLAMA_BASE_URL || undefined;

    // Persist user message with client reading/composition latency metadata
    await createMessage({
      session_id: sessionId,
      role: 'user',
      content: message,
      telemetry: client_telemetry || null,
    });

    if (client_telemetry && addTelemetry) {
      await addTelemetry(sessionId, {
        event_type: 'user_turn',
        ...client_telemetry,
      });
    }

    await incrementInteractionCount(sessionId);

    const storedMessages = await getMessages(sessionId);
    const conversationHistory = [];

    if (workshop?.system_prompt && workshop.system_prompt.trim() !== '') {
      conversationHistory.push({
        role: 'system',
        content: workshop.system_prompt.trim(),
      });
    } else {
      conversationHistory.push({
        role: 'system',
        content: 'Always respond in the same language the user writes in.',
      });
    }

    conversationHistory.push(
      ...storedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))
    );

    // Initiate multi-provider stream (already strips <think>...</think> statefully and appends telemetry SSE)
    const upstream = await streamChat({
      provider,
      model,
      messages: conversationHistory,
      apiKey: apiKeyOverride,
      baseUrl,
    });

    let assistantText = '';
    let assistantTelemetry = null;
    let sseBuffer = '';
    const decoder = new TextDecoder();

    const tapStream = new TransformStream({
      transform(chunk, controller) {
        // Forward SSE chunk immediately for low TTFT
        controller.enqueue(chunk);

        sseBuffer += decoder.decode(chunk, { stream: true });
        const events = sseBuffer.split('\n\n');
        sseBuffer = events.pop() || '';

        for (const evt of events) {
          const lines = evt.split('\n');
          let isTelemetryEvent = false;
          for (const line of lines) {
            if (line.startsWith('event: telemetry')) {
              isTelemetryEvent = true;
            } else if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (isTelemetryEvent || parsed.telemetry) {
                  assistantTelemetry = parsed.telemetry || parsed;
                } else {
                  const delta = parsed.choices?.[0]?.delta?.content ?? parsed.chunk ?? '';
                  assistantText += delta;
                }
              } catch {
                // Ignore partial JSON
              }
            }
          }
        }
      },
      async flush() {
        if (sseBuffer.trim()) {
          const lines = sseBuffer.split('\n');
          let isTelemetryEvent = false;
          for (const line of lines) {
            if (line.startsWith('event: telemetry')) {
              isTelemetryEvent = true;
            } else if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (isTelemetryEvent || parsed.telemetry) {
                  assistantTelemetry = parsed.telemetry || parsed;
                } else {
                  const delta = parsed.choices?.[0]?.delta?.content ?? parsed.chunk ?? '';
                  assistantText += delta;
                }
              } catch {
                // ignore
              }
            }
          }
        }

        const cleanFinal = assistantText.trim();
        if (cleanFinal) {
          await createMessage({
            session_id: sessionId,
            role: 'assistant',
            content: cleanFinal,
            telemetry: assistantTelemetry,
          });
        }

        if (assistantTelemetry && addTelemetry) {
          await addTelemetry(sessionId, {
            event_type: 'assistant_turn',
            ...assistantTelemetry,
          });
        }
      },
    });

    const responseStream = upstream.pipeThrough(tapStream);

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
