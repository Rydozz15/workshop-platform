/**
 * Tier 1: Survey Submission Tests (>= 5 tests)
 * Tests Likert and open survey submissions, session completion,
 * chained campaign transitions, and error boundaries.
 */
import { TestSuite, assert, assertEqual } from '../harness/test-utils.js';
import { apiClient } from '../harness/api-client.js';
import { setupTestDatabase } from '../harness/memory-db-harness.js';

export function createSurveySubmissionSuite() {
  const suite = new TestSuite('Survey Submission & Finalization (Tier 1)', 1);

  // Test 1: Submitting Likert survey answers persists in session record
  suite.test('Submitting survey answers stores responses accurately in session record', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'Survey Participant' });
    const sId = joinRes.data.session_id;

    const answers = { q1: 4, q2: 5, q_feedback: 'Interacción muy clara y pedagógica.' };
    const res = await apiClient.submitSurvey(sId, { survey_answers: answers });
    assertEqual(res.status, 200);
    assertEqual(res.data.success, true);

    const sessionRes = await apiClient.getSession(sId);
    assertEqual(sessionRes.data.survey_answers.q1, 4);
    assertEqual(sessionRes.data.survey_answers.q2, 5);
    assertEqual(sessionRes.data.survey_answers.q_feedback, 'Interacción muy clara y pedagógica.');
  });

  // Test 2: Finalizing session marks status as completed and assigns completed_at
  suite.test('Session completion endpoint updates status to completed and sets completed_at timestamp', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'Completion Participant' });
    const sId = joinRes.data.session_id;

    const res = await apiClient.updateSession(sId, { status: 'completed' });
    assertEqual(res.status, 200);
    assertEqual(res.data.status, 'completed');
    assert(res.data.completed_at, 'completed_at must be populated');
  });

  // Test 3: Submitting survey in a chained workshop returns next_share_code
  suite.test('Chained workshop Step 1 survey submission returns next_share_code for Step 2', async () => {
    setupTestDatabase();
    const chainUserId = 'chain-user-uuid-101';
    const joinRes = await apiClient.joinSession({
      code: 'CHAIN1',
      participant_name: 'Step 1 User',
      chain_user_id: chainUserId,
    });
    const sId = joinRes.data.session_id;

    const surveyRes = await apiClient.submitSurvey(sId, {
      survey_answers: { q_gain_pre: 2 },
      chain_user_id: chainUserId,
    });
    assertEqual(surveyRes.status, 200);
    assertEqual(surveyRes.data.next_share_code, 'CHAIN2', 'Must return Step 2 share code CHAIN2');
  });

  // Test 4: Submitting survey to a non-existent session ID returns HTTP 404
  suite.test('Submitting survey to invalid session ID returns HTTP 404', async () => {
    setupTestDatabase();
    const res = await apiClient.submitSurvey('non-existent-session-uuid', {
      survey_answers: { q1: 5 },
    });
    assertEqual(res.status, 404);
    assert(res.data.error.includes('not found'));
  });

  // Test 5: Survey handles partial/omitted questions gracefully
  suite.test('Submitting partial survey answers does not error and stores null for omitted fields', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'Partial Survey User' });
    const sId = joinRes.data.session_id;

    const answers = { q1: 5 }; // q2 and q_feedback omitted
    const res = await apiClient.submitSurvey(sId, { survey_answers: answers });
    assertEqual(res.status, 200);

    const sessionRes = await apiClient.getSession(sId);
    assertEqual(sessionRes.data.survey_answers.q1, 5);
    assertEqual(sessionRes.data.survey_answers.q2, undefined);
  });

  return suite;
}
