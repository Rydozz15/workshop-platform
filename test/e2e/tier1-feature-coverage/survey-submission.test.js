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

  // Test 6: Every question type is accepted when the answer follows its rules, and "Otro" text is kept
  const typedConfig = [
    { id: 'q_scale', text: 'Escala', type: 'likert', minLabel: 'Nada', maxLabel: 'Todo' },
    { id: 'q_one', text: 'Una opción', type: 'multiple', options: ['a', 'b'], allowOther: true },
    { id: 'q_many', text: 'Varias', type: 'checklist', options: ['x', 'y', 'z'], allowOther: true, minSelections: 1, maxSelections: 2 },
    { id: 'q_drop', text: 'Lista', type: 'dropdown', options: ['p', 'q'] },
    { id: 'q_text', text: 'Abierta', type: 'text', minChars: 3, maxChars: 20 },
  ];
  const joinTypedWorkshop = async () => {
    setupTestDatabase();
    const created = await apiClient.createWorkshop({
      name: 'Typed survey',
      selected_version_ids: ['ver-a-baseline'],
      survey_config: typedConfig,
    });
    assertEqual(created.status, 201);
    const joinRes = await apiClient.joinSession({ code: created.data.share_code, participant_name: 'Typed Survey User' });
    return joinRes.data.session_id;
  };

  suite.test('Survey accepts valid answers for every question type and stores the "Otro" text', async () => {
    const sId = await joinTypedWorkshop();
    const answers = {
      q_scale: '4',
      q_one: '__other__',
      q_one__other: 'otra cosa',
      q_many: ['x', '__other__'],
      q_many__other: 'mi opción',
      q_drop: 'q',
      q_text: 'respuesta',
    };
    const res = await apiClient.submitSurvey(sId, { survey_answers: answers });
    assertEqual(res.status, 200);
    const stored = (await apiClient.getSession(sId)).data.survey_answers;
    assertEqual(stored.q_one__other, 'otra cosa');
    assertEqual(stored.q_many.length, 2);
  });

  // Test 7: Answers that break a question's rules are rejected with HTTP 400 and nothing is stored
  suite.test('Survey rejects answers that break the question rules with HTTP 400', async () => {
    const sId = await joinTypedWorkshop();
    const bad = [
      { q_scale: '9' },
      { q_one: 'zzz' },
      { q_many: ['x', 'y', 'z'] },
      { q_many: ['__other__'] },
      { q_drop: 'nope' },
      { q_text: 'a' },
      { q_text: 'x'.repeat(21) },
    ];
    for (const survey_answers of bad) {
      const res = await apiClient.submitSurvey(sId, { survey_answers });
      assertEqual(res.status, 400, `Expected 400 for ${JSON.stringify(survey_answers)}`);
      assert(res.data.errors && Object.keys(res.data.errors).length > 0, 'Response must list the failing questions');
    }
    const stored = (await apiClient.getSession(sId)).data.survey_answers;
    assert(!stored || Object.keys(stored).length === 0, 'Rejected answers must not be stored');
  });

  return suite;
}
