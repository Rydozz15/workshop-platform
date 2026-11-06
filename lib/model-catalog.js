/**
 * Model catalog for the settings screen: which models each provider offers, what they cost and whether
 * they reason. OpenRouter is fetched live (public endpoint, no key) and cached for an hour; everything
 * else, and the offline fallback, comes from a short curated list reusing PROVIDER_PRICING.
 */
import { PROVIDER_PRICING } from './ai-engine.js';

export const PROVIDERS = ['openrouter', 'groq', 'openai', 'anthropic', 'ollama'];

const CURATED = {
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it', 'mixtral-8x7b-32768'],
  openrouter: ['meta-llama/llama-3.3-70b-instruct', 'meta-llama/llama-3.1-8b-instruct', 'deepseek/deepseek-r1', 'qwen/qwen-2.5-72b-instruct'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
  anthropic: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
  ollama: ['llama3.2:latest', 'qwen2.5:7b', 'mistral:latest'],
};
const REASONING_HINT = /(^|[/-])(r1|o1|o3|reason|thinking|qwq)/i;

const modelFromPricing = (id, provider) => {
  const p = PROVIDER_PRICING[id];
  return {
    id,
    name: id,
    provider,
    inputPer1M: p ? p.promptPer1M : provider === 'ollama' ? 0 : null,
    outputPer1M: p ? p.completionPer1M : provider === 'ollama' ? 0 : null,
    reasoning: REASONING_HINT.test(id),
    recommended: true,
  };
};

export function curatedModels(provider) {
  return (CURATED[provider] || []).map((id) => modelFromPricing(id, provider));
}

/** Turns OpenRouter's /models payload into our shape. Prices arrive in USD per token. */
export function normalizeOpenRouterModels(json) {
  const list = Array.isArray(json?.data) ? json.data : [];
  const recommended = new Set(CURATED.openrouter);
  const perM = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n * 1e6 * 1000) / 1000 : null;
  };
  return list
    .filter((m) => m && typeof m.id === 'string')
    .map((m) => ({
      id: m.id,
      name: m.name || m.id,
      provider: 'openrouter',
      inputPer1M: perM(m.pricing?.prompt),
      outputPer1M: perM(m.pricing?.completion),
      context: m.context_length || null,
      reasoning: Array.isArray(m.supported_parameters) ? m.supported_parameters.includes('reasoning') || m.supported_parameters.includes('include_reasoning') : REASONING_HINT.test(m.id),
      recommended: recommended.has(m.id),
    }))
    .sort((a, b) => Number(b.recommended) - Number(a.recommended) || a.name.localeCompare(b.name));
}

let cache = { at: 0, models: null };
const TTL_MS = 60 * 60 * 1000;

/** @returns {Promise<{models: object[], source: 'live'|'curated'}>} */
export async function getModels(provider, { fetchImpl = fetch, now = Date.now() } = {}) {
  if (provider !== 'openrouter') return { models: curatedModels(provider), source: 'curated' };
  if (cache.models && now - cache.at < TTL_MS) return { models: cache.models, source: 'live' };
  try {
    const res = await fetchImpl('https://openrouter.ai/api/v1/models', { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const models = normalizeOpenRouterModels(await res.json());
    if (models.length === 0) throw new Error('empty');
    cache = { at: now, models: models.slice(0, 400) };
    return { models: cache.models, source: 'live' };
  } catch {
    return { models: curatedModels('openrouter'), source: 'curated' };
  }
}

export function resetModelCache() {
  cache = { at: 0, models: null };
}
