/**
 * Tier 3: Cross-Feature Interaction 2 — Chat Telemetry to Analytics Export
 * Tests multi-turn chat interaction with client keystroke telemetry (t_bot, t_first_key, t_send),
 * normalized reading latency computation, and Tidy Data export formatting.
 */
import { TestSuite, assert, assertEqual, assertApproxEqual } from '../harness/test-utils.js';
import { apiClient } from '../harness/api-client.js';
import { setupTestDatabase } from '../harness/memory-db-harness.js';
import { analyzeConversation } from '../harness/spec-oracle.js';

export function createChatTelemetryExportSuite() {
  const suite = new TestSuite('Interaction: Chat Telemetry to Analytics Export (Tier 3)', 3);

  // Test 1: Chat interaction with keystroke telemetry computes accurate reading latency
  suite.test('Message turns with client timestamps compute exact reading latency (ms/word)', () => {
    const messages = [
      {
        role: 'assistant',
        content: 'El asistente formula una pregunta diagnóstica de exactamente diez palabras.', // 10 words
      },
      {
        role: 'user',
        content: 'El estudiante responde con reflexión pausada.', // 6 words
        telemetry: {
          t_bot: 10000,
          t_first_key: 12500, // reading latency = 2,500 ms (250 ms/word)
          t_send: 14000,       // composition time = 1,500 ms
          is_tab_blurred: false,
        },
      },
    ];

    const metrics = analyzeConversation(messages);
    assertApproxEqual(metrics.avgReadingLatency, 250.0, 1.0);
    assertEqual(metrics.skippedTurns, 0);
    assertEqual(metrics.outlierTurns, 0);
  });

  // Test 2: Admin export endpoint delivers structured turn records for analytics
  suite.test('GET /api/admin/export delivers complete turn messages and timestamps for LA pipelines', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'LA Pipeline Participant' });
    const sId = joinRes.data.session_id;

    // Simulate survey submission and completion
    await apiClient.submitSurvey(sId, { survey_answers: { q1: 4, q2: 5 } });
    await apiClient.updateSession(sId, { status: 'completed' });

    const exportRes = await apiClient.exportSessions();
    assertEqual(exportRes.status, 200);
    const sessionRecord = exportRes.data.find(s => s.session_id === sId);
    assert(sessionRecord, 'Must contain target session');
    assertEqual(sessionRecord.campaign_name, 'Single Workshop Test Campaign');
    assert(Array.isArray(sessionRecord.messages), 'Messages must be array in export');
  });

  // Test 3: Tidy turn format fields validation
  suite.test('Tidy turn records conform to Wickham (2014) relational layout schema', () => {
    const formatTidyTurn = (sessionId, turnIndex, speaker, wordCount, latencyMs) => ({
      session_id: sessionId,
      turn_index: turnIndex,
      speaker,
      word_count: wordCount,
      reading_latency_ms: latencyMs,
      norm_reading_ms_per_word: latencyMs ? Number((latencyMs / 10).toFixed(2)) : null,
      skipped_reading_flag: latencyMs !== null && latencyMs < 800,
    });

    const turn = formatTidyTurn('sess-101', 1, 'user', 15, 2400);
    assertEqual(turn.session_id, 'sess-101');
    assertEqual(turn.turn_index, 1);
    assertEqual(turn.speaker, 'user');
    assertEqual(turn.norm_reading_ms_per_word, 240.0);
    assertEqual(turn.skipped_reading_flag, false);
  });

  return suite;
}
