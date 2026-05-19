import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export async function POST(request) {
  try {
    const { stepsData, ai_provider, model } = await request.json();

    if (!stepsData || stepsData.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    // Load global settings as fallback
    let settings = {};
    try { settings = await getSettings(); } catch (e) { /* ignore */ }

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

    const systemPrompt = "You are an expert qualitative data analyst. You are analyzing the evolution of participants' opinions across a chained workshop sequence. Read the provided survey responses broken down by steps, and provide a comparative summary. Focus on: 1) What changed between the steps? 2) Were there paradigm shifts? 3) Common longitudinal themes. Use bullet points and respond in the same language as the responses (mostly Spanish).";
    
    // Format the prompt
    let userPrompt = "Here are the qualitative responses tracked over time:\n\n";
    
    stepsData.forEach(step => {
      userPrompt += `--- ${step.step} ---\n`;
      if (step.responses.length === 0) {
        userPrompt += "No responses.\n\n";
      } else {
        // Limit to 30 most recent responses per step to avoid context window explosion
        const sampledTexts = step.responses.slice(-30);
        userPrompt += sampledTexts.map((t, i) => `${i + 1}. ${t}`).join('\n') + "\n\n";
      }
    });

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
    const summary = data.choices?.[0]?.message?.content || "No summary generated.";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarize evolution error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
