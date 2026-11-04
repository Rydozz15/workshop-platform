/**
 * Tier 2: Boundary & Corner Cases — Long Text & Maximum Token Payloads (>= 5 tests)
 * Tests multi-thousand character messages, large system prompts,
 * long conversation MATTR lexical diversity, and large SSE stream buffers.
 */
import { TestSuite, assert, assertEqual } from '../harness/test-utils.js';
import { apiClient } from '../harness/api-client.js';
import { setupTestDatabase } from '../harness/memory-db-harness.js';
import { POST as chatRoute } from '../../../app/api/session/[sessionId]/chat/route.js';
import { analyzeConversation } from '../harness/spec-oracle.js';

export function createLongTextSuite() {
  const suite = new TestSuite('Boundary: Long Text & Token Payloads (Tier 2)', 2);

  // Test 1: Multi-thousand character chat message parsed and stored without truncation
  suite.test('Sending a 3,000-character student message stores full content in database', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'Verbose Student' });
    const sId = joinRes.data.session_id;

    const longMessage = 'Esta es una consulta detallada sobre el caso. '.repeat(65); // ~3,000 chars
    assert(longMessage.length > 2800);

    const req = new Request(`http://localhost:3000/api/session/${sId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: longMessage }),
    });

    const res = await chatRoute(req, { params: Promise.resolve({ sessionId: sId }) });
    assertEqual(res.status, 200);

    const sessionRes = await apiClient.getSession(sId);
    assertEqual(sessionRes.data.messages[0].content.length, longMessage.length);
  });

  // Test 2: Large system prompt (4,000+ characters) stored in workshop
  suite.test('Workshop creation accommodates large system prompt (4,000+ characters)', async () => {
    setupTestDatabase();
    const largeSystemPrompt = 'Instrucción metodológica detallada para el asistente. '.repeat(80);
    const res = await apiClient.createWorkshop({
      name: 'Workshop with Extensive Prompt',
      selected_version_ids: ['ver-a-baseline'],
      system_prompt: largeSystemPrompt,
    });
    assertEqual(res.status, 201);
    assertEqual(res.data.system_prompt.length, largeSystemPrompt.length);
  });

  // Test 3: MATTR lexical diversity calculation on long student dialogue (1,000+ words)
  suite.test('Length-invariant MATTR computation scales cleanly on 1,000+ word student dialogue', () => {
    const words = [];
    const vocabulary = ['mentoría', 'carga', 'investigación', 'publicación', 'docencia', 'cátedra', 'análisis', 'método'];
    for (let i = 0; i < 1200; i++) {
      words.push(vocabulary[i % vocabulary.length]);
    }
    const longStudentUtterance = words.join(' ');
    const messages = [{ role: 'user', content: longStudentUtterance }];

    const metrics = analyzeConversation(messages);
    assertEqual(metrics.studentWords, 1200);
    assert(metrics.mattr25 > 0 && metrics.mattr25 <= 1.0, 'MATTR-25 must be in [0, 1]');
    assert(metrics.mattr50 > 0 && metrics.mattr50 <= 1.0, 'MATTR-50 must be in [0, 1]');
  });

  // Test 4: Extremely short student message (fewer words than sliding window W=25)
  suite.test('MATTR handles utterances shorter than window size W=25 using standard TTR fallback', () => {
    const messages = [{ role: 'user', content: 'Sí, totalmente de acuerdo.' }]; // 4 words
    const metrics = analyzeConversation(messages);
    assertEqual(metrics.studentWords, 4);
    assert(metrics.mattr25 > 0 && metrics.mattr25 <= 1.0);
  });

  // Test 5: Long case description rendered without formatting breakdown
  suite.test('Case sheet with 5,000+ characters of markdown documentation loads successfully', async () => {
    setupTestDatabase();
    const extensiveCase = '# Caso Completo\n\n' + 'Descripción exhaustiva del escenario institucional. '.repeat(100);
    const verRes = await apiClient.createVersion({
      title: 'Caso Extenso',
      case_content: extensiveCase,
    });
    assertEqual(verRes.status, 201);
    assertEqual(verRes.data.case_content.length, extensiveCase.length);
  });

  return suite;
}
