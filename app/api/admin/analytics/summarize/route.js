import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { texts, ai_provider = 'openrouter', model = 'meta-llama/llama-3.1-8b-instruct' } = await request.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: 'No texts provided' }, { status: 400 });
    }

    const systemPrompt = "You are an expert qualitative data analyst. Read the following survey responses and provide a concise summary of the main topics and themes mentioned by the participants. Use bullet points. Respond in the same language as the responses (mostly Spanish).";
    
    // Limit to 50 most recent responses to avoid LLM context window overflow
    const sampledTexts = texts.slice(-50);
    const userPrompt = "Here are the responses:\n" + sampledTexts.map((t, i) => `${i + 1}. ${t}`).join('\n');

    let responseText = '';

    if (ai_provider === 'groq') {
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) throw new Error('GROQ_API_KEY is not configured');

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Groq API Error');
      responseText = data.choices[0].message.content;
    } else {
      const openRouterKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterKey) throw new Error('OPENROUTER_API_KEY is not configured');

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
          'X-Title': 'ISSDE Workshop Analytics',
        },
        body: JSON.stringify({
          model: model || 'meta-llama/llama-3.1-8b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'OpenRouter API Error');
      responseText = data.choices[0].message.content;
    }

    return NextResponse.json({ summary: responseText });
  } catch (error) {
    console.error('LLM Summarize Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
