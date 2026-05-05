/**
 * Chat endpoint with streaming support.
 * POST - Send a message and get a streamed AI response.
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
import { streamChat } from '@/lib/openrouter';

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
    
    // Use custom system prompt if defined for this campaign, otherwise naive mode
    const version = await getVersion(session.version_id);
    const conversationHistory = [];
    
    let finalSystemPrompt = '';
    if (workshop?.system_prompt) {
      finalSystemPrompt += workshop.system_prompt + '\n\n';
    }
    if (version?.case_content) {
      finalSystemPrompt += `--- ESCENARIO / CASO ---\n${version.case_content}`;
    }

    if (finalSystemPrompt.trim() !== '') {
      conversationHistory.push({
        role: 'system',
        content: finalSystemPrompt.trim()
      });
    }

    // Append all previous messages
    conversationHistory.push(...storedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    })));

    // Get streaming response from AI provider
    const stream = await streamChat(conversationHistory, model, provider);

    // Create a TransformStream to capture the full response for saving
    let fullResponse = '';
    let buffer = '';
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
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
                fullResponse += content;
              } catch (e) {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }
        
        // Pass through the raw SSE data
        controller.enqueue(chunk);
      },
      async flush() {
        // Save the complete assistant response when stream ends
        if (fullResponse) {
          await createMessage({
            session_id: sessionId,
            role: 'assistant',
            content: fullResponse,
          });
        }
      },
    });

    // Pipe the OpenRouter stream through our transform
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
