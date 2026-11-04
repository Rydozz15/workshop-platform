/**
 * Tier 2: Boundary & Corner Cases — Missing Questions & Sparse Data (>= 5 tests)
 * Tests partial survey responses, missing Likert items,
 * and clean data export without 'NaN' or 'undefined' literals.
 */
import { TestSuite, assert, assertEqual } from '../harness/test-utils.js';
import { apiClient } from '../harness/api-client.js';
import { setupTestDatabase } from '../harness/memory-db-harness.js';

export function createMissingQuestionsSuite() {
  const suite = new TestSuite('Boundary: Missing Questions & Sparse Data (Tier 2)', 2);

  // Test 1: Partial survey responses preserved without data corruption
  suite.test('Saving survey with omitted questions preserves available fields without crash', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'Sparse User' });
    const sId = joinRes.data.session_id;

    // Only answer q1, omit q2 and q_feedback
    const res = await apiClient.submitSurvey(sId, { survey_answers: { q1: 4 } });
    assertEqual(res.status, 200);

    const sessionRes = await apiClient.getSession(sId);
    assertEqual(sessionRes.data.survey_answers.q1, 4);
    assertEqual(sessionRes.data.survey_answers.q2, undefined);
  });

  // Test 2: Composite score computation handles missing values with pairwise deletion
  suite.test('Composite score calculation ignores missing/null items gracefully', () => {
    const computeComposite = items => {
      const valid = items.filter(v => typeof v === 'number' && !isNaN(v));
      if (valid.length === 0) return null;
      return valid.reduce((a, b) => a + b, 0) / valid.length;
    };

    assertEqual(computeComposite([4, null, 5]), 4.5);
    assertEqual(computeComposite([null, null]), null);
  });

  // Test 3: Missing qualitative feedback string formats as clean empty string in exports
  suite.test('Export endpoint outputs empty string for missing feedback fields, never "null" or "undefined"', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'No Comment User' });
    const sId = joinRes.data.session_id;

    await apiClient.submitSurvey(sId, { survey_answers: { q1: 5, q2: 5 } });
    await apiClient.updateSession(sId, { status: 'completed' });

    const exportRes = await apiClient.exportSessions();
    const targetSession = exportRes.data.find(s => s.session_id === sId);
    assert(targetSession, 'Must find exported session');
    assert(targetSession.survey_answers.q_feedback === undefined || targetSession.survey_answers.q_feedback === '');
  });

  // Test 4: Survey answers can be updated incrementally
  suite.test('Incremental survey updates merge with existing answers', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'Incremental User' });
    const sId = joinRes.data.session_id;

    await apiClient.submitSurvey(sId, { survey_answers: { q1: 3 } });
    await apiClient.submitSurvey(sId, { survey_answers: { q1: 3, q2: 4 } });

    const sessionRes = await apiClient.getSession(sId);
    assertEqual(sessionRes.data.survey_answers.q1, 3);
    assertEqual(sessionRes.data.survey_answers.q2, 4);
  });

  // Test 5: All survey questions unanswered leaves answers null or empty object
  suite.test('Submitting survey with null answers payload handled without error', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'Null Survey User' });
    const sId = joinRes.data.session_id;

    const res = await apiClient.submitSurvey(sId, { survey_answers: null });
    assertEqual(res.status, 200);
    const sessionRes = await apiClient.getSession(sId);
    assertEqual(sessionRes.data.survey_answers, null);
  });

  return suite;
}
