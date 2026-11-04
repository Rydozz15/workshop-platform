/**
 * Tier 2: Boundary & Corner Cases — Empty Inputs (>= 5 tests)
 * Tests empty messages, blank prompts, missing share codes,
 * empty survey payloads, and whitespace-only text.
 */
import { TestSuite, assert, assertEqual } from '../harness/test-utils.js';
import { apiClient } from '../harness/api-client.js';
import { setupTestDatabase } from '../harness/memory-db-harness.js';
import { POST as chatRoute } from '../../../app/api/session/[sessionId]/chat/route.js';

export function createEmptyInputsSuite() {
  const suite = new TestSuite('Boundary: Empty Inputs (Tier 2)', 2);

  // Test 1: Empty message rejected with HTTP 400
  suite.test('POST /api/session/[sessionId]/chat with empty string returns HTTP 400', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'Tester' });
    const sId = joinRes.data.session_id;

    const req = new Request(`http://localhost:3000/api/session/${sId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '' }),
    });
    const res = await chatRoute(req, { params: Promise.resolve({ sessionId: sId }) });
    assertEqual(res.status, 400);
    const data = await res.json();
    assert(data.error.includes('required'));
  });

  // Test 2: Whitespace-only message handled safely
  suite.test('POST /api/session/[sessionId]/chat with whitespace-only payload rejects or trims', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'Tester' });
    const sId = joinRes.data.session_id;

    const req = new Request(`http://localhost:3000/api/session/${sId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '   \n\t  ' }),
    });
    const res = await chatRoute(req, { params: Promise.resolve({ sessionId: sId }) });
    assert(res.status === 400 || res.status === 200);
  });

  // Test 3: Missing share code in join endpoint returns HTTP 400
  suite.test('POST /api/session/join with missing share code returns HTTP 400', async () => {
    setupTestDatabase();
    const res = await apiClient.joinSession({ code: '', participant_name: 'Tester' });
    assertEqual(res.status, 400);
    assert(res.data.error.includes('required'));
  });

  // Test 4: Workshop creation with empty version array returns HTTP 400
  suite.test('POST /api/admin/workshops with empty selected_version_ids returns HTTP 400', async () => {
    setupTestDatabase();
    const res = await apiClient.createWorkshop({
      name: 'Workshop Without Versions',
      selected_version_ids: [],
    });
    assertEqual(res.status, 400);
    assert(res.data.error.includes('required'));
  });

  // Test 5: Empty survey answer payload handled without server exception
  suite.test('POST /api/session/[sessionId]/survey with empty object succeeds and stores empty answers', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'Tester' });
    const sId = joinRes.data.session_id;

    const res = await apiClient.submitSurvey(sId, { survey_answers: {} });
    assertEqual(res.status, 200);
    assertEqual(res.data.success, true);
  });

  return suite;
}
