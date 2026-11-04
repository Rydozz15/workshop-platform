/**
 * Tier 1: Chat Streaming & AI Engine Tests (>= 5 tests)
 * Tests SSE streaming, stateful <think> tag stripping,
 * message persistence, and trailing telemetry events.
 */
import { TestSuite, assert, assertEqual } from '../harness/test-utils.js';
import { apiClient } from '../harness/api-client.js';
import { setupTestDatabase, readTestStore } from '../harness/memory-db-harness.js';
import { createMockSSEStream, processStreamingResponse } from '../harness/mock-provider.js';
import { POST as chatRoute } from '../../../app/api/session/[sessionId]/chat/route.js';

export function createChatStreamingSuite() {
  const suite = new TestSuite('Chat Streaming & AI Engine (Tier 1)', 1);

  // Test 1: User message submission persists in database and increments interaction count
  suite.test('Sending chat message records user message and increments session count', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'Chat Tester' });
    const sId = joinRes.data.session_id;

    // Direct route call
    const req = new Request(`http://localhost:3000/api/session/${sId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hola, tengo una consulta sobre mi caso.' }),
    });

    const res = await chatRoute(req, { params: Promise.resolve({ sessionId: sId }) });
    assertEqual(res.status, 200, 'Chat route must respond with 200');

    // Verify session interaction count incremented
    const sessionRes = await apiClient.getSession(sId);
    assertEqual(sessionRes.data.interaction_count, 1, 'Interaction count should be 1');
    assertEqual(sessionRes.data.messages.length, 1, 'Should have 1 recorded user message');
    assertEqual(sessionRes.data.messages[0].content, 'Hola, tengo una consulta sobre mi caso.');
  });

  // Test 2: SSE stream delivers text deltas cleanly
  suite.test('SSE streaming response parses chunks into complete assistant text', async () => {
    const rawChunks = [
      'data: {"choices":[{"delta":{"content":"Hola. "}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"¿Podrías contarme "}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"más detalles de tu situación?"}}]}\n\n',
      'data: [DONE]\n\n',
    ];
    const stream = createMockSSEStream(rawChunks);
    const result = await processStreamingResponse(stream);
    assertEqual(result.visibleContent, 'Hola. ¿Podrías contarme más detalles de tu situación?');
    assertEqual(result.thinkingContent, '');
    assertEqual(result.inThinkingModeAtEnd, false);
  });

  // Test 3: Stateful <think> tag stripping removes internal monologues split across chunks
  suite.test('Stateful <think> tag stripper eliminates reasoning monologues split across SSE boundaries', async () => {
    const rawChunks = [
      'data: {"choices":[{"delta":{"content":"<th"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"ink>Análisis interno: el usuario parece estresado.</th"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"ink>Entiendo tu situación."}}]}\n\n',
      'data: [DONE]\n\n',
    ];
    const stream = createMockSSEStream(rawChunks);
    const result = await processStreamingResponse(stream);
    assertEqual(result.visibleContent, 'Entiendo tu situación.');
    assertEqual(result.thinkingContent, 'Análisis interno: el usuario parece estresado.');
  });

  // Test 4: Trailing telemetry event contains TTFT, tokens, latency, and estimated USD cost
  suite.test('Trailing SSE telemetry event delivers TTFT, duration, tokens, and USD cost', async () => {
    const rawChunks = [
      'data: {"choices":[{"delta":{"content":"Respuesta"}}]}\n\n',
      'event: telemetry\n',
      'data: {"telemetry":{"ttft_ms":184,"total_duration_ms":1420,"prompt_tokens":412,"completion_tokens":128,"cost_usd":0.000344,"model":"llama-3.3-70b-versatile","provider":"groq"}}\n\n',
      'data: [DONE]\n\n',
    ];
    const stream = createMockSSEStream(rawChunks);
    const result = await processStreamingResponse(stream);
    assert(result.telemetry, 'Telemetry must be captured from stream');
    assertEqual(result.telemetry.ttft_ms, 184);
    assertEqual(result.telemetry.total_duration_ms, 1420);
    assertEqual(result.telemetry.prompt_tokens, 412);
    assertEqual(result.telemetry.completion_tokens, 128);
    assertEqual(result.telemetry.cost_usd, 0.000344);
  });

  // Test 5: Completed session rejects further chat messages with HTTP 403
  suite.test('Chat endpoint rejects messages for completed sessions with HTTP 403', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'Done User' });
    const sId = joinRes.data.session_id;

    // Complete session
    await apiClient.updateSession(sId, { status: 'completed' });

    // Attempt chat
    const req = new Request(`http://localhost:3000/api/session/${sId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Mensaje posterior a completación' }),
    });
    const res = await chatRoute(req, { params: Promise.resolve({ sessionId: sId }) });
    assertEqual(res.status, 403, 'Completed session must return 403 Forbidden');
    const data = await res.json();
    assert(data.error.includes('completed'));
  });

  return suite;
}
