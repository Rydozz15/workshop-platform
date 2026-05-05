/**
 * OpenRouter API client.
 * Proxies chat requests through the server to keep the API key secure.
 * No system prompt — the AI responds naively.
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Send a chat completion request to OpenRouter (streaming).
 * @param {Array<{role: string, content: string}>} messages - Conversation history
 * @param {string} model - Model identifier (e.g., 'meta-llama/llama-3.1-8b-instruct')
 * @returns {ReadableStream} - SSE stream of the response
 */
export async function streamChat(messages, model, provider = 'openrouter') {
  const isGroq = provider === 'groq';
  const apiKey = isGroq ? process.env.GROQ_API_KEY : process.env.OPENROUTER_API_KEY;
  const apiUrl = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : OPENROUTER_API_URL;
  
  if (!apiKey || apiKey === 'your-openrouter-api-key-here' || apiKey === 'your-groq-api-key-here') {
    // Return a mock response if no API key is configured
    return createMockStream(`I'm a demo chatbot. Please configure the ${isGroq ? 'GROQ_API_KEY' : 'OPENROUTER_API_KEY'} environment variable to enable real AI responses.`);
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      'X-Title': 'ISSDE Workshop Chatbot',
    },
    body: JSON.stringify({
      model: model || (isGroq ? 'llama-3.3-70b-versatile' : (process.env.DEFAULT_MODEL || 'meta-llama/llama-3.1-8b-instruct')),
      messages: messages, // No system prompt — raw conversation only
      stream: true,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter error:', response.status, errorText);
    return createMockStream(`Error from AI service (${response.status}). Please try again.`);
  }

  return response.body;
}

/**
 * Non-streaming chat completion.
 */
export async function chat(messages, model, provider = 'openrouter') {
  const isGroq = provider === 'groq';
  const apiKey = isGroq ? process.env.GROQ_API_KEY : process.env.OPENROUTER_API_KEY;
  const apiUrl = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : OPENROUTER_API_URL;
  
  if (!apiKey || apiKey === 'your-openrouter-api-key-here' || apiKey === 'your-groq-api-key-here') {
    return {
      content: `I'm a demo chatbot. Please configure the ${isGroq ? 'GROQ_API_KEY' : 'OPENROUTER_API_KEY'} environment variable to enable real AI responses.`,
    };
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      'X-Title': 'ISSDE Workshop Chatbot',
    },
    body: JSON.stringify({
      model: model || (isGroq ? 'llama-3.3-70b-versatile' : (process.env.DEFAULT_MODEL || 'meta-llama/llama-3.1-8b-instruct')),
      messages: messages,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || 'No response from AI.',
  };
}

/**
 * Creates a mock ReadableStream that mimics SSE format.
 */
function createMockStream(text) {
  const encoder = new TextEncoder();
  const words = text.split(' ');
  
  return new ReadableStream({
    async start(controller) {
      for (let i = 0; i < words.length; i++) {
        const word = (i > 0 ? ' ' : '') + words[i];
        const chunk = {
          choices: [{ delta: { content: word } }],
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        await new Promise((r) => setTimeout(r, 50));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}
