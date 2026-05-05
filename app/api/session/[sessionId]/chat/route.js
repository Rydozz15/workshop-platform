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
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'completed') {
      return NextResponse.json({ error: 'This session has been completed' }, { status: 403 });
    }

    // Get the workshop model
    const workshop = getWorkshop(session.workshop_id);
    const model = workshop?.openrouter_model || process.env.DEFAULT_MODEL;
    const provider = workshop?.ai_provider || 'openrouter';

    // Save the user message
    createMessage({
      session_id: sessionId,
      role: 'user',
      content: message,
    });

    // Increment interaction count
    incrementInteractionCount(sessionId);

    // Build conversation history from stored messages
    const storedMessages = getMessages(sessionId);
    
    // Add a basic system prompt to prevent the AI from "thinking out loud", 
    // but without giving it any scenario context (keeping it a naive chatbot)
    const conversationHistory = [
      {
        role: 'system',
        content: 'You are a helpful conversational AI. Respond directly and naturally to the user. Do NOT analyze the input or explain your thought process out loud, just reply directly to the user.'
      },
      ...storedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))
    ];

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
      flush() {
        // Save the complete assistant response when stream ends
        if (fullResponse) {
          createMessage({
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
