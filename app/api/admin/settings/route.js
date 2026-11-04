import { NextResponse } from 'next/server';
import { getSettings, updateSetting } from '@/lib/db';

const ALLOWED_KEYS = [
  'default_ai_provider',
  'default_ai_model',
  'ollama_base_url',
  'api_key_groq',
  'api_key_openrouter',
  'api_key_openai',
  'api_key_anthropic',
];

function maskSecret(val) {
  if (!val || typeof val !== 'string') return '';
  if (val.length <= 8) return '••••••••';
  return `${val.slice(0, 4)}••••${val.slice(-4)}`;
}

function buildPublicSettings(raw = {}) {
  return {
    default_ai_provider: raw.default_ai_provider || 'groq',
    default_ai_model: raw.default_ai_model || 'llama-3.3-70b-versatile',
    ollama_base_url: raw.ollama_base_url || process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    db_provider: process.env.DB_PROVIDER || 'memory',
    env_keys: {
      groq: Boolean(process.env.GROQ_API_KEY || raw.api_key_groq),
      openrouter: Boolean(process.env.OPENROUTER_API_KEY || raw.api_key_openrouter),
      openai: Boolean(process.env.OPENAI_API_KEY || raw.api_key_openai),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY || raw.api_key_anthropic),
      ollama: true,
    },
    masked_keys: {
      groq: maskSecret(raw.api_key_groq || process.env.GROQ_API_KEY || ''),
      openrouter: maskSecret(raw.api_key_openrouter || process.env.OPENROUTER_API_KEY || ''),
      openai: maskSecret(raw.api_key_openai || process.env.OPENAI_API_KEY || ''),
      anthropic: maskSecret(raw.api_key_anthropic || process.env.ANTHROPIC_API_KEY || ''),
    },
  };
}

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(buildPublicSettings(settings));
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const updates = await request.json();

    for (const [key, value] of Object.entries(updates)) {
      if (ALLOWED_KEYS.includes(key) && typeof value === 'string') {
        const trimmed = value.trim();
        // Allow clearing custom API keys when empty string is explicitly passed, or setting non-empty values
        if (trimmed || key.startsWith('api_key_')) {
          await updateSetting(key, trimmed);
        }
      }
    }

    const settings = await getSettings();
    return NextResponse.json(buildPublicSettings(settings));
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
