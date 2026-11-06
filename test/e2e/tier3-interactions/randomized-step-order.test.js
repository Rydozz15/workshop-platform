/**
 * Tier 3: Randomized step order per participant.
 * A campaign with randomize_order gives each participant their own order of steps, balanced across
 * participants, and the next step / position follow that order.
 */
import { TestSuite, assert, assertEqual } from '../harness/test-utils.js';
import { apiClient } from '../harness/api-client.js';
import { setupTestDatabase } from '../harness/memory-db-harness.js';
import { updateWorkshop } from '../../../lib/db-memory.js';

const STEPS = ['ws-chain-step1', 'ws-chain-step2'];
const setRandomized = (on) => STEPS.forEach((id) => updateWorkshop(id, { randomize_order: on }));

export function createRandomizedStepOrderSuite() {
  const suite = new TestSuite('Interaction: Randomized Step Order (Tier 3)', 3);

  suite.test('Four participants split evenly between both orders and each completes both steps in their own order', async () => {
    setupTestDatabase();
    setRandomized(true);
    try {
      const firstCodes = [];
      for (let i = 0; i < 4; i++) {
        const cuid = `rand-order-user-${i}`;
        const join1 = await apiClient.joinSession({ code: 'CHAIN1', participant_name: `P${i}`, chain_user_id: cuid });
        assertEqual(join1.status, 200);
        assertEqual(join1.data.chain_order, 1, 'The first step of anyone\'s order is position 1');
        firstCodes.push(join1.data.share_code);

        const survey1 = await apiClient.submitSurvey(join1.data.session_id, { survey_answers: {}, chain_user_id: cuid });
        assertEqual(survey1.status, 200);
        const secondCode = survey1.data.next_share_code;
        assert(secondCode && secondCode !== join1.data.share_code, 'Next step must be the other step');
        await apiClient.updateSession(join1.data.session_id, { status: 'completed' });

        const join2 = await apiClient.joinSession({ code: secondCode, participant_name: `P${i}`, chain_user_id: cuid });
        assertEqual(join2.status, 200);
        assertEqual(join2.data.chain_order, 2, 'The second step of anyone\'s order is position 2');
        const survey2 = await apiClient.submitSurvey(join2.data.session_id, { survey_answers: {}, chain_user_id: cuid });
        assertEqual(survey2.data.next_share_code, null, 'No step after the last one in the order');
      }
      assertEqual(firstCodes.filter((c) => c === 'CHAIN1').length, 2);
      assertEqual(firstCodes.filter((c) => c === 'CHAIN2').length, 2);
    } finally {
      setRandomized(false);
    }
  });

  suite.test('Coming back through the campaign code continues with the next unfinished step', async () => {
    setupTestDatabase();
    setRandomized(true);
    try {
      const cuid = 'rand-order-returning-user';
      const join1 = await apiClient.joinSession({ code: 'CHAIN1', participant_name: 'Returning', chain_user_id: cuid });
      await apiClient.submitSurvey(join1.data.session_id, { survey_answers: {}, chain_user_id: cuid });
      await apiClient.updateSession(join1.data.session_id, { status: 'completed' });

      const again = await apiClient.joinSession({ code: 'CHAIN1', participant_name: 'Returning', chain_user_id: cuid });
      assertEqual(again.status, 200);
      assert(again.data.share_code !== join1.data.share_code, 'Must land in the step they have not done');
      assertEqual(again.data.chain_order, 2);
    } finally {
      setRandomized(false);
    }
  });

  suite.test('Without randomize_order the fixed step order is untouched', async () => {
    setupTestDatabase();
    setRandomized(false);
    const join1 = await apiClient.joinSession({ code: 'CHAIN1', participant_name: 'Fixed', chain_user_id: 'fixed-order-user' });
    assertEqual(join1.data.share_code, 'CHAIN1');
    const survey1 = await apiClient.submitSurvey(join1.data.session_id, { survey_answers: {}, chain_user_id: 'fixed-order-user' });
    assertEqual(survey1.data.next_share_code, 'CHAIN2');
  });

  return suite;
}
