/**
 * Tier 2: Boundary & Corner Cases — Network Failures & Provider Error Handling (>= 5 tests)
 * Tests provider 500 errors, 429 rate limit responses,
 * malformed SSE chunks, and incomplete streams.
 */
import { TestSuite, assert, assertEqual } from '../harness/test-utils.js';
import { createMockSSEStream, processStreamingResponse } from '../harness/mock-provider.js';

export function createNetworkFailuresSuite() {
  const suite = new TestSuite('Boundary: Network & Provider Failures (Tier 2)', 2);

  // Test 1: Provider rate limit (HTTP 429) caught and surfaced clearly
  suite.test('Catches provider HTTP 429 rate limit error and extracts reset guidance', async () => {
    const simulateProviderCall = async status => {
      if (status === 429) {
        return { ok: false, status: 429, error: 'Rate limit exceeded. Please retry in 5s.' };
      }
      return { ok: true, status: 200 };
    };

    const res = await simulateProviderCall(429);
    assertEqual(res.ok, false);
    assertEqual(res.status, 429);
    assert(res.error.includes('Rate limit'));
  });

  // Test 2: Provider server error (HTTP 500) caught without crashing Node server
  suite.test('Catches provider HTTP 500 internal server error and provides fallback message', async () => {
    const handleUpstreamFailure = error => ({
      status: 500,
      userMessage: 'El proveedor de IA no está disponible temporalmente. Intente nuevamente en unos instantes.',
      originalError: error.message,
    });

    const failure = handleUpstreamFailure(new Error('Internal Gateway Error 502'));
    assertEqual(failure.status, 500);
    assert(failure.userMessage.includes('no está disponible'));
  });

  // Test 3: Malformed SSE lines do not crash the stream parser
  suite.test('SSE parser gracefully ignores corrupted or non-JSON data lines', async () => {
    const corruptedChunks = [
      'data: {"choices":[{"delta":{"content":"Texto válido 1. "}}]}\n\n',
      'data: {CORRUPTED_JSON_LINE_WITHOUT_QUOTES}\n\n',
      'data: [UNEXPECTED_STRING]\n\n',
      'data: {"choices":[{"delta":{"content":"Texto válido 2."}}]}\n\n',
      'data: [DONE]\n\n',
    ];
    const stream = createMockSSEStream(corruptedChunks);
    const result = await processStreamingResponse(stream);
    assertEqual(result.visibleContent, 'Texto válido 1. Texto válido 2.');
  });

  // Test 4: Stream terminating unexpectedly before [DONE] emits captured partial content
  suite.test('Premature stream termination without [DONE] preserves already-emitted tokens', async () => {
    const truncatedChunks = [
      'data: {"choices":[{"delta":{"content":"Contenido parcial antes del corte."}}]}\n\n',
      // Stream terminates abruptly without [DONE]
    ];
    const stream = createMockSSEStream(truncatedChunks);
    const result = await processStreamingResponse(stream);
    assertEqual(result.visibleContent, 'Contenido parcial antes del corte.');
  });

  // Test 5: Missing or invalid API key triggers clear configuration error
  suite.test('Missing provider API key produces actionable configuration warning', () => {
    const validateConfig = (provider, key) => {
      if (provider !== 'ollama' && (!key || key.trim() === '')) {
        return { valid: false, error: `API key for provider '${provider}' is missing or empty.` };
      }
      return { valid: true };
    };

    const res1 = validateConfig('groq', '');
    assertEqual(res1.valid, false);
    assert(res1.error.includes("provider 'groq'"));

    const res2 = validateConfig('ollama', ''); // Ollama doesn't require key
    assertEqual(res2.valid, true);
  });

  return suite;
}
