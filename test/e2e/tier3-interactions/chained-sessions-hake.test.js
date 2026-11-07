/**
 * Tier 3: Cross-Feature Interaction 1 — Chained Sessions to Hake Gain
 * Tests complete end-to-end chained workshop lifecycle:
 * Step 1 join -> Step 1 completion -> next_share_code transition ->
 * Step 2 join with chain_user_id -> Step 2 completion -> paired Hake's normalized gain (g).
 */
import { TestSuite, assert, assertEqual, assertApproxEqual } from '../harness/test-utils.js';
import { apiClient } from '../harness/api-client.js';
import { setupTestDatabase } from '../harness/memory-db-harness.js';
import { calculateHakeGain } from '../harness/spec-oracle.js';

export function createChainedSessionsHakeSuite() {
  const suite = new TestSuite('Interaction: Chained Sessions to Hake Gain (Tier 3)', 3);

  // Test 1: Full multi-step chained session flow linking pre and post scores
  suite.test('Chained session progression links Step 1 pre-survey with Step 2 post-survey for Hake gain', async () => {
    setupTestDatabase();
    const chainUserId = 'chain-longitudinal-user-42';

    // 1. Join Step 1 (Naive)
    const join1 = await apiClient.joinSession({
      code: 'CHAIN1',
      participant_name: 'Paired Participant 42',
      chain_user_id: chainUserId,
    });
    assertEqual(join1.status, 200);
    const sId1 = join1.data.session_id;

    // 2. Complete Step 1 survey with pre-test score = 2
    const survey1 = await apiClient.submitSurvey(sId1, {
      survey_answers: { q_gain_pre: 2 },
      chain_user_id: chainUserId,
    });
    assertEqual(survey1.status, 200);
    assertEqual(survey1.data.next_share_code, 'CHAIN2');
    await apiClient.updateSession(sId1, { status: 'completed' });

    // 3. Join Step 2 (Prompted) using next_share_code and same chain_user_id
    const join2 = await apiClient.joinSession({
      code: survey1.data.next_share_code,
      participant_name: 'Paired Participant 42',
      chain_user_id: chainUserId,
    });
    assertEqual(join2.status, 200);
    const sId2 = join2.data.session_id;

    // 4. Complete Step 2 survey with post-test score = 4
    const survey2 = await apiClient.submitSurvey(sId2, {
      survey_answers: { q_gain_post: 4 },
      chain_user_id: chainUserId,
    });
    assertEqual(survey2.status, 200);
    await apiClient.updateSession(sId2, { status: 'completed' });

    // 5. Compute paired Hake's normalized gain g = (Post - Pre) / (Max - Pre)
    // g = (4 - 2) / (5 - 2) = 2 / 3 ≈ 0.6667 (Medium gain tier)
    const hakeResult = calculateHakeGain([2], [4], 5.0);
    assertEqual(hakeResult.canCompute, true);
    assertApproxEqual(hakeResult.gClass, 2.0 / 3.0, 1e-4);
    assertEqual(hakeResult.tier, 'medium');
  });

  // Test 2: Cohort learning gain across multiple paired students
  suite.test('Cohort of chained participants computes class-level Hake gain and 95% CI', () => {
    // 5 paired participants: Pre vs Post
    const preScores = [2.0, 2.0, 3.0, 1.0, 2.0]; // Mean Pre = 2.0
    const postScores = [4.0, 5.0, 4.0, 3.0, 4.0]; // Mean Post = 4.0
    const maxScore = 5.0;

    const res = calculateHakeGain(preScores, postScores, maxScore);
    assertEqual(res.canCompute, true);
    // gClass = (4.0 - 2.0) / (5.0 - 2.0) = 2.0 / 3.0 = 0.6667
    assertApproxEqual(res.gClass, 2.0 / 3.0, 1e-3);
    assertEqual(res.tier, 'medium');
    assert(res.ci[0] < res.gIndivMean && res.ci[1] > res.gIndivMean, '95% CI must bracket mean gain');
  });

  // Test 3: High-gain transition reaching ceiling (Pre=3, Post=5)
  suite.test('High-gain transition (g >= 0.70) classifies accurately into high tier', () => {
    const res = calculateHakeGain([2.0, 3.0, 2.0], [5.0, 5.0, 5.0], 5.0);
    assertEqual(res.canCompute, true);
    assert(res.gClass >= 0.70, 'Class gain should be high');
    assertEqual(res.tier, 'high');
  });

  return suite;
}
