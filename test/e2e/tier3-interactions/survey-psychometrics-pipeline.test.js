/**
 * Tier 3: Cross-Feature Interaction 4 — Multi-Item Survey to Psychometrics & Gatekeeper
 * Tests participant multi-item Likert responses across conditions,
 * internal consistency (Cronbach's alpha), reverse-item recoding detection,
 * composite score generation, and Assumption Diagnostic Gatekeeper routing.
 */
import { TestSuite, assert, assertEqual, assertApproxEqual } from '../harness/test-utils.js';
import {
  calculateCronbachAlpha,
  runAssumptionGatekeeper,
  runWelchTTest,
} from '../harness/spec-oracle.js';

export function createSurveyPsychometricsPipelineSuite() {
  const suite = new TestSuite('Interaction: Survey Psychometrics to Gatekeeper (Tier 3)', 3);

  // Test 1: Multi-item survey matrix evaluates scale internal consistency (Cronbach's alpha)
  suite.test('Calculates Cronbach alpha on multi-item Likert response matrix', () => {
    // 6 participants answering a 4-item construct
    const matrix = [
      [4, 4, 5, 4],
      [5, 5, 4, 5],
      [3, 3, 4, 3],
      [4, 5, 5, 4],
      [2, 3, 2, 3],
      [5, 4, 5, 5],
    ];
    const res = calculateCronbachAlpha(matrix);
    assertEqual(res.canCompute, true);
    assert(res.alpha > 0.70, `Cronbach alpha ${res.alpha} should be >= 0.70`);
    assertEqual(res.isAcceptable, true);
    assertEqual(res.itemTotalCorrelations.length, 4);
    assertEqual(res.flaggedReverseOmissions.length, 0);
  });

  // Test 2: Detects negative item-total correlation and flags reverse-coding omission
  suite.test('Flags negative item-total correlation as candidate for reverse-coding', () => {
    // Item index 2 is negatively phrased ("Me sentí desorientado") without recoding
    const matrixWithReverseItem = [
      [5, 4, 1, 5],
      [4, 5, 2, 4],
      [3, 3, 4, 3],
      [5, 5, 1, 5],
      [2, 2, 5, 2],
    ];
    const res = calculateCronbachAlpha(matrixWithReverseItem);
    assertEqual(res.canCompute, true);
    assert(res.flaggedReverseOmissions.includes(2), 'Item 2 must be flagged for reverse coding');

    // After applying reverse-coding on item 2:
    const recoded = calculateCronbachAlpha(matrixWithReverseItem, [2]);
    assert(recoded.alpha > res.alpha, 'Alpha must increase substantially after reverse-coding');
    assertEqual(recoded.flaggedReverseOmissions.length, 0);
  });

  // Test 3: Composite score derivation routes to Assumption Gatekeeper and Welch t-test
  suite.test('Multi-item composite scores are classified as continuous and routed to Welch t-test', () => {
    // Condition A composite scores (mean of 4 items)
    const compositeA = [3.25, 3.50, 3.00, 3.75, 3.50, 3.25];
    // Condition B composite scores (mean of 4 items)
    const compositeB = [4.50, 4.75, 4.25, 4.50, 4.75, 4.50];

    const gatekeeper = runAssumptionGatekeeper({
      groupA: compositeA,
      groupB: compositeB,
      metricName: 'Autonomía Constructo Compuesto',
      scaleType: 'continuous',
    });
    assertEqual(gatekeeper.scaleType, 'continuous');
    assertEqual(gatekeeper.recommendedTest, 'welch_t');

    const tRes = runWelchTTest(compositeA, compositeB);
    assertEqual(tRes.canCompute, true);
    assert(tRes.pValue < 0.01, 'Composite difference must be highly significant');
    assert(tRes.cohensD < -1.0, 'Effect size must be large');
  });

  return suite;
}
