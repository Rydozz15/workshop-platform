/**
 * Chat endpoint with streaming support.
 * POST - Send a message and get a streamed AI response.
 * Strips <think>...</think> reasoning tags from modern models before
 * forwarding to the client.
 */
import { NextResponse } from 'next/server';
import {
  getSession,
  getMessages,
  createMessage,
  incrementInteractionCount,
  getWorkshop,
  getVersion,
} from '@/lib/db';
import { streamChat, stripThinkingTags } from '@/lib/openrouter';

export async function POST(request, { params }) {
  try {
    const { sessionId } = await params;
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Validate session exists
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'completed') {
      return NextResponse.json({ error: 'This session has been completed' }, { status: 403 });
    }

    // Get the workshop model
    const workshop = await getWorkshop(session.workshop_id);
    const model = workshop?.openrouter_model || process.env.DEFAULT_MODEL;
    const provider = workshop?.ai_provider || 'openrouter';

    // Save the user message
    await createMessage({
      session_id: sessionId,
      role: 'user',
      content: message,
    });

    // Increment interaction count
    await incrementInteractionCount(sessionId);

    // Build conversation history from stored messages
    const storedMessages = await getMessages(sessionId);
    
    // Use custom system prompt if defined for this campaign, otherwise use a minimal default
    const conversationHistory = [];
    
    if (workshop?.system_prompt && workshop.system_prompt.trim() !== '') {
      conversationHistory.push({
        role: 'system',
        content: workshop.system_prompt.trim()
      });
    } else {
      // Minimal fallback: only ensures the model responds in the user's language
      // instead of defaulting to Chinese (common with DeepSeek/Qwen models).
      // Kept deliberately neutral to avoid biasing research interactions.
      conversationHistory.push({
        role: 'system',
        content: 'Always respond in the same language the user writes in.'
      });
    }

    // Append all previous messages
    conversationHistory.push(...storedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    })));

    // Get streaming response from AI provider
    const stream = await streamChat(conversationHistory, model, provider);

    // Create a TransformStream that:
    // 1. Accumulates the raw response (with <think> tags) for proper boundary detection
    // 2. Forwards only the clean (stripped) content to the client
    // 3. Saves the clean content to the database
    let fullResponseRaw = '';
    let lastCleanLength = 0;
    let buffer = '';
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        buffer += text;
        
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        
        for (const event of events) {
          const lines = event.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content || '';
                fullResponseRaw += content;
              } catch (e) {
                // Ignore parse errors for partial chunks
              }
            }
            if (line === 'data: [DONE]') {
              // Forward the DONE event as-is
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            }
          }
        }

        // Compute the clean version and emit only the new delta
        const cleanSoFar = stripThinkingTags(fullResponseRaw);
        if (cleanSoFar.length > lastCleanLength) {
          const newCleanContent = cleanSoFar.slice(lastCleanLength);
          lastCleanLength = cleanSoFar.length;
          // Re-encode as SSE chunk
          const sseChunk = {
            choices: [{ delta: { content: newCleanContent } }],
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(sseChunk)}\n\n`));
        }
      },
      async flush() {
        // Process any remaining buffer
        if (buffer.trim()) {
          const lines = buffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content || '';
                fullResponseRaw += content;
              } catch (e) { /* ignore */ }
            }
          }
        }

        // Final clean pass and emit any remaining clean content
        const finalClean = stripThinkingTags(fullResponseRaw);
        if (finalClean.length > lastCleanLength) {
          const remaining = finalClean.slice(lastCleanLength);
          const sseChunk = {
            choices: [{ delta: { content: remaining } }],
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(sseChunk)}\n\n`));
        }

        // Save the clean assistant response to the database
        if (finalClean) {
          await createMessage({
            session_id: sessionId,
            role: 'assistant',
            content: finalClean,
          });
        }
      },
    });

    // Pipe the AI stream through our transform (which now re-encodes clean SSE)
    const responseStream = stream.pipeThrough(transformStream);

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
