/** Tests: model catalog (curated lists, OpenRouter normalization, cache and offline fallback). */
import assert from 'node:assert/strict';
import { getModels, normalizeOpenRouterModels, curatedModels, resetModelCache } from '../lib/model-catalog.js';

let passed = 0;
const check = async (name, fn) => {
  await fn();
  passed++;
  console.log(`  [PASS] ${name}`);
};

const payload = {
  data: [
    { id: 'zeta/model', name: 'Zeta', pricing: { prompt: '0.000001', completion: '0.000002' }, context_length: 8000, supported_parameters: ['reasoning'] },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', pricing: { prompt: '0.0000004', completion: '0.0000004' }, supported_parameters: [] },
    { id: 'alpha/model', name: 'Alpha', pricing: { prompt: 'x', completion: null } },
  ],
};

await check('normalizes prices to USD per million tokens, flags reasoning, recommended first', () => {
  const m = normalizeOpenRouterModels(payload);
  assert.equal(m[0].id, 'meta-llama/llama-3.3-70b-instruct');
  assert.equal(m[0].inputPer1M, 0.4);
  const zeta = m.find((x) => x.id === 'zeta/model');
  assert.equal(zeta.inputPer1M, 1);
  assert.equal(zeta.outputPer1M, 2);
  assert.equal(zeta.reasoning, true);
  assert.equal(m.find((x) => x.id === 'alpha/model').inputPer1M, null, 'bad prices become unknown, not zero');
});

await check('curated lists carry known prices from the pricing table', () => {
  const groq = curatedModels('groq').find((m) => m.id === 'llama-3.3-70b-versatile');
  assert.equal(groq.inputPer1M, 0.59);
  assert.equal(curatedModels('ollama')[0].inputPer1M, 0);
});

await check('live fetch is cached for an hour; failures fall back to the curated list', async () => {
  resetModelCache();
  let calls = 0;
  const ok = async () => { calls++; return { ok: true, json: async () => payload }; };
  const first = await getModels('openrouter', { fetchImpl: ok, now: 1000 });
  assert.equal(first.source, 'live');
  await getModels('openrouter', { fetchImpl: ok, now: 2000 });
  assert.equal(calls, 1);
  resetModelCache();
  const down = await getModels('openrouter', { fetchImpl: async () => { throw new Error('offline'); } });
  assert.equal(down.source, 'curated');
  assert.ok(down.models.length > 0);
  assert.equal((await getModels('groq')).source, 'curated');
});

console.log(`\nmodel-catalog: ${passed} tests passed`);
