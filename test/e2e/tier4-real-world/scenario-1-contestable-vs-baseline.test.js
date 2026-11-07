/**
 * Tier 4: Real-World Scenario 1 — Contestable vs Baseline Mentoring (N=9 Study)
 * Models the authentic field shift where system contextual inquiry increased from
 * 0% (0/9) in Condition A (Naive) to 89% (8/9) in Condition B (Explore-before-Build),
 * completely eliminating Superficial One-shot interactions.
 */
import { TestSuite, assert, assertEqual, assertApproxEqual } from '../harness/test-utils.js';
import { runMannWhitneyU } from '../harness/spec-oracle.js';

export function createScenario1ContestableVsBaselineSuite() {
  const suite = new TestSuite('Scenario 1: Contestable vs Baseline (N=9) (Tier 4)', 4);

  // Authentic N=9 experimental vectors from docs/ICACIT/
  const conditionA_Naive = {
    contextualInquiryRates: [0, 0, 0, 0, 0, 0, 0, 0, 0], // 0/9 = 0%
    superficialOneShotCounts: [1, 1, 0, 1, 0, 1, 0, 0, 0], // 4/9 = 44.4%
    dialogueTurns: [3, 2, 4, 2, 5, 3, 4, 3, 3], // Mean turns = 3.22
  };

  const conditionB_Prompted = {
    contextualInquiryRates: [1, 1, 1, 1, 1, 1, 1, 0, 1], // 8/9 = 88.9%
    superficialOneShotCounts: [0, 0, 0, 0, 0, 0, 0, 0, 0], // 0/9 = 0%
    dialogueTurns: [6, 5, 7, 5, 8, 6, 6, 5, 7], // Mean turns = 6.11
  };

  // Test 1: Verification of 0% to 89% inquiry shift
  suite.test('Replicates 0% to 88.9% contextual inquiry increase between Naive and Prompted conditions', () => {
    const rateA = conditionA_Naive.contextualInquiryRates.reduce((a, b) => a + b, 0) / 9;
    const rateB = conditionB_Prompted.contextualInquiryRates.reduce((a, b) => a + b, 0) / 9;

    assertEqual(rateA, 0.0, 'Condition A contextual inquiry rate must be 0%');
    assertApproxEqual(rateB, 8.0 / 9.0, 1e-3, 'Condition B contextual inquiry rate must be 88.9%');
    assert(rateB - rateA >= 0.88, 'Inquiry jump must be >= 88 percentage points');
  });

  // Test 2: Complete elimination of Superficial One-shot interactions
  suite.test('Explore-before-Build prompt eliminates all 4 superficial one-shot interactions', () => {
    const superficialA = conditionA_Naive.superficialOneShotCounts.reduce((a, b) => a + b, 0);
    const superficialB = conditionB_Prompted.superficialOneShotCounts.reduce((a, b) => a + b, 0);

    assertEqual(superficialA, 4, 'Condition A has 4 superficial one-shot dialogues');
    assertEqual(superficialB, 0, 'Condition B completely eliminates superficial one-shots');
  });

  // Test 3: Dialogue depth and turn-taking expansion
  suite.test('Dialogue turns expand significantly under Explore-before-Build guidance', () => {
    const res = runMannWhitneyU(conditionA_Naive.dialogueTurns, conditionB_Prompted.dialogueTurns);
    assertEqual(res.canCompute, true);
    // Condition B has strictly more turns for all participants
    assert(res.cliffsDelta < -0.80, `Cliff delta ${res.cliffsDelta} indicates massive turn expansion`);
    assertEqual(res.romanoMagnitude, 'large');
    assert(res.pValue < 0.01, 'Turn difference must be statistically significant');
  });

  return suite;
}
