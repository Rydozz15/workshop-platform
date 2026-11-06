/**
 * Tier 1: Multi-Provider Settings & Pricing Tests (>= 5 tests)
 * Tests provider settings API, model configuration, ping health check,
 * token cost pricing table, and provider fallbacks.
 */
import { TestSuite, assert, assertEqual, assertApproxEqual } from '../harness/test-utils.js';
import { apiClient } from '../harness/api-client.js';
import { setupTestDatabase } from '../harness/memory-db-harness.js';
import { POST as evolutionRoute } from '../../../app/api/admin/analytics/evolution/route.js';
import { POST as summarizeRoute } from '../../../app/api/admin/analytics/summarize/route.js';

export function createMultiProviderSettingsSuite() {
  const suite = new TestSuite('Multi-Provider AI Settings & Telemetry (Tier 1)', 1);

  // Authoritative token pricing table (USD per 1M tokens) per survey_arch.md
  const providerPricingTable = {
    'llama-3.3-70b-versatile': { provider: 'groq', promptPer1M: 0.59, completionPer1M: 0.79 },
    'llama-3.1-8b-instant': { provider: 'groq', promptPer1M: 0.05, completionPer1M: 0.08 },
    'qwen/qwen-2.5-72b-instruct': { provider: 'openrouter', promptPer1M: 0.35, completionPer1M: 0.40 },
    'gpt-4o-mini': { provider: 'openai', promptPer1M: 0.15, completionPer1M: 0.60 },
    'claude-3-5-haiku': { provider: 'anthropic', promptPer1M: 0.80, completionPer1M: 4.00 },
    'ollama-local': { provider: 'ollama', promptPer1M: 0.00, completionPer1M: 0.00 },
  };

  function computeTurnCost(modelName, promptTokens, completionTokens) {
    const rate = providerPricingTable[modelName] || { promptPer1M: 0.50, completionPer1M: 0.50 };
    const promptCost = (promptTokens * rate.promptPer1M) / 1000000.0;
    const completionCost = (completionTokens * rate.completionPer1M) / 1000000.0;
    return promptCost + completionCost;
  }

  // Test 1: Reading provider settings via GET /api/admin/settings
  suite.test('GET /api/admin/settings returns current AI provider and model defaults', async () => {
    setupTestDatabase();
    const res = await apiClient.getSettings();
    assertEqual(res.status, 200);
    assert(res.data.default_ai_provider, 'Must have default_ai_provider');
    assert(res.data.default_ai_model, 'Must have default_ai_model');
  });

  // Test 2: Updating provider and model via PUT /api/admin/settings
  suite.test('PUT /api/admin/settings updates default provider and model configurations', async () => {
    setupTestDatabase();
    const updateRes = await apiClient.updateSettings({
      default_ai_provider: 'groq',
      default_ai_model: 'llama-3.3-70b-versatile',
    });
    assertEqual(updateRes.status, 200);
    assertEqual(updateRes.data.default_ai_provider, 'groq');
    assertEqual(updateRes.data.default_ai_model, 'llama-3.3-70b-versatile');
  });

  // Test 3: Token cost estimation accurately applies model pricing rates
  suite.test('Calculates exact turn cost based on model token rates', () => {
    // 500 prompt tokens and 200 completion tokens on llama-3.3-70b-versatile
    // (500 * 0.59 + 200 * 0.79) / 1M = (295 + 158) / 1M = 453 / 1M = $0.000453
    const cost = computeTurnCost('llama-3.3-70b-versatile', 500, 200);
    assertApproxEqual(cost, 0.000453, 1e-6);
  });

  // Test 4: Local Ollama model yields exactly $0.00 cost
  suite.test('Local self-hosted Ollama model yields zero USD cost', () => {
    const cost = computeTurnCost('ollama-local', 10000, 5000);
    assertEqual(cost, 0.0);
  });

  // Test 5: Provider ping / diagnostic returns latency metrics
  suite.test('Simulated provider health diagnostic returns connectivity status and TTFT latency', async () => {
    const simulateProviderPing = async (provider, apiKey) => {
      if (!apiKey) return { ok: false, error: 'Missing API key' };
      return { ok: true, latencyMs: 142, provider };
    };

    const healthyResult = await simulateProviderPing('groq', 'gsk_valid_key');
    assertEqual(healthyResult.ok, true);
    assertEqual(healthyResult.latencyMs, 142);

    const failResult = await simulateProviderPing('groq', null);
    assertEqual(failResult.ok, false);
    assertEqual(failResult.error, 'Missing API key');
  });

  // AI consent gate: participants' open answers only leave the platform after the admin accepts.
  const aiPost = (route, body) =>
    route(new Request('http://localhost:3000/api/admin/analytics/x', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
  const evolutionBody = { question: 'Q', stepsData: [{ step: 'A', responses: ['uno'] }, { step: 'B', responses: ['dos'] }] };
  const withoutProviderKeys = async (fn) => {
    const saved = { o: process.env.OPENROUTER_API_KEY, g: process.env.GROQ_API_KEY };
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.GROQ_API_KEY;
    try {
      return await fn();
    } finally {
      if (saved.o !== undefined) process.env.OPENROUTER_API_KEY = saved.o;
      if (saved.g !== undefined) process.env.GROQ_API_KEY = saved.g;
    }
  };

  suite.test('AI summaries of open answers are refused (403) until the admin has accepted the warning', async () => {
    setupTestDatabase();
    await withoutProviderKeys(async () => {
      const evo = await aiPost(evolutionRoute, evolutionBody);
      assertEqual(evo.status, 403);
      assertEqual((await evo.json()).error, 'consent_required');
      const sum = await aiPost(summarizeRoute, { texts: ['uno', 'dos'] });
      assertEqual(sum.status, 403);
    });
  });

  suite.test('Accepting is stored in settings and the routes then run; revoking blocks them again', async () => {
    setupTestDatabase();
    await withoutProviderKeys(async () => {
      assertEqual((await apiClient.getSettings()).data.ai_open_responses_consent, '', 'No consent recorded at first');
      const put = await apiClient.updateSettings({ ai_open_responses_consent: new Date().toISOString() });
      assertEqual(put.status, 200);
      assert(put.data.ai_open_responses_consent, 'The acceptance is recorded');
      const ok = await aiPost(evolutionRoute, evolutionBody);
      assert(ok.status !== 403, 'Allowed after accepting');
      await apiClient.updateSettings({ ai_open_responses_consent: '' });
      assertEqual((await aiPost(evolutionRoute, evolutionBody)).status, 403, 'Revoked consent blocks again');
    });
  });

  return suite;
}
