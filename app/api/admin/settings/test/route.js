import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/ai-engine';
import { getSettings } from '@/lib/db';

const ENV_KEY_BY_PROVIDER = {
  groq: 'GROQ_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
};

export async function POST(request) {
  try {
    const body = await request.json();
    const provider = (body.provider || 'groq').toLowerCase();
    const model = body.model || undefined;

    let settings = {};
    try {
      settings = await getSettings();
    } catch {
      // Ignore settings read failure
    }

    const baseUrl =
      body.baseUrl ||
      settings.ollama_base_url ||
      process.env.OLLAMA_BASE_URL ||
      'http://localhost:11434';

    // Prefer explicit key passed in test modal, else stored custom key, else server env var
    const settingKeyName = `api_key_${provider}`;
    const envVarName = ENV_KEY_BY_PROVIDER[provider];
    const resolvedKey =
      (body.apiKey && body.apiKey.trim()) ||
      settings[settingKeyName] ||
      (envVarName ? process.env[envVarName] : undefined);

    const result = await testConnection({
      provider,
      apiKey: resolvedKey,
      model,
      baseUrl,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message, latency_ms: 0 },
      { status: 500 }
    );
  }
}
