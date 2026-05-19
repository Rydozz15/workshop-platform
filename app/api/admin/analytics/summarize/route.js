import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export async function POST(request) {
  try {
    const { texts, ai_provider = 'openrouter', model = 'meta-llama/llama-3.1-8b-instruct' } = await request.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: 'No texts provided' }, { status: 400 });
    }

    // Load global settings as fallback
    let settings = {};
    try { settings = await getSettings(); } catch (e) { /* ignore */ }

    const systemPrompt = "You are an expert qualitative data analyst. Read the following survey responses and provide a concise summary of the main topics and themes mentioned by the participants. Use bullet points. Respond in the same language as the responses (mostly Spanish).";
    
    // Limit to 50 most recent responses to avoid LLM context window overflow
    const sampledTexts = texts.slice(-50);
    const userPrompt = "Here are the responses:\n" + sampledTexts.map((t, i) => `${i + 1}. ${t}`).join('\n');

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    
    // Fallback logic for LLM Provider
    const provider = openrouterKey ? 'openrouter' : (groqKey ? 'groq' : null);
    if (!provider) {
      return NextResponse.json({ summary: "No AI provider configured (Missing API keys)." });
    }

    const apiUrl = provider === 'openrouter' 
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.groq.com/openai/v1/chat/completions';
      
    const apiKey = provider === 'openrouter' ? openrouterKey : groqKey;

    // Model priority: request body → settings → env var → hardcoded
    const usedModel = provider === 'openrouter' 
      ? (model || settings.default_ai_model || process.env.DEFAULT_MODEL || 'meta-llama/llama-3.1-8b-instruct')
      : 'llama-3.3-70b-versatile';

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(provider === 'openrouter' ? { 'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000', 'X-Title': 'ISSDE Workshop Analytics' } : {})
      },
      body: JSON.stringify({
        model: usedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('LLM error:', errText);
      return NextResponse.json({ error: 'LLM API Error' }, { status: 500 });
    }

    const data = await res.json();
    const responseText = data.choices?.[0]?.message?.content || "No summary generated.";

    return NextResponse.json({ summary: responseText });
  } catch (error) {
    console.error('LLM Summarize Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
