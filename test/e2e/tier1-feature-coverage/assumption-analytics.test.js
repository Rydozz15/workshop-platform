/**
 * Tier 1: Assumption-First Statistical & Inferential Engine Tests (>= 5 tests)
 * Tests Assumption Diagnostic Gatekeeper, Welch's t-test,
 * Mann-Whitney U with tie correction, Cliff's delta, and Holm-Bonferroni.
 */
import { TestSuite, assert, assertEqual, assertApproxEqual } from '../harness/test-utils.js';
import {
  runAssumptionGatekeeper,
  runWelchTTest,
  runMannWhitneyU,
  applyHolmBonferroni,
} from '../harness/spec-oracle.js';

export function createAssumptionAnalyticsSuite() {
  const suite = new TestSuite('Assumption-First Analytics Engine (Tier 1)', 1);

  // Test 1: Gatekeeper routes individual ordinal Likert items to Mann-Whitney U
  suite.test('Gatekeeper classifies discrete Likert items as ordinal and routes to Mann-Whitney U', () => {
    const groupA = [3, 4, 2, 4, 5, 3];
    const groupB = [4, 5, 5, 4, 5, 4];
    const result = runAssumptionGatekeeper({
      groupA,
      groupB,
      metricName: 'Autonomía Percibida',
      scaleType: 'ordinal',
    });
    assertEqual(result.scaleType, 'ordinal');
    assertEqual(result.recommendedTest, 'mann_whitney_u');
    assertEqual(result.effectSize, 'cliffs_delta');
    assert(result.explanation.includes('escala ordinal'));
  });

  // Test 2: Gatekeeper verifies normality and routes normal continuous variables to Welch t
  suite.test('Gatekeeper routes symmetric continuous distributions to Welch t-test', () => {
    // Normal continuous distributions (e.g. reading latency in ms/word)
    const groupA = [180.0, 185.0, 190.0, 190.0, 195.0, 200.0];
    const groupB = [235.0, 240.0, 245.0, 245.0, 250.0, 255.0];
    const result = runAssumptionGatekeeper({
      groupA,
      groupB,
      metricName: 'Latencia de Lectura Normalizada',
      scaleType: 'continuous',
    });
    assertEqual(result.scaleType, 'continuous');
    assertEqual(result.isNormalA, true);
    assertEqual(result.isNormalB, true);
    assertEqual(result.recommendedTest, 'welch_t');
    assertEqual(result.effectSize, 'cohens_d');
  });

  // Test 3: Welch's t-test calculation matches golden analytical reference values
  suite.test('Welch t-test and Cohen d match golden analytical benchmark vector', () => {
    // Benchmark Vector 1 from survey_stats.md
    const groupA = [2.0, 3.0, 3.0, 4.0, 4.0, 5.0];
    const groupB = [4.0, 4.0, 5.0, 5.0, 5.0, 5.0];

    const result = runWelchTTest(groupA, groupB);
    assertEqual(result.canCompute, true);
    assertApproxEqual(result.meanA, 3.500, 1e-3);
    assertApproxEqual(result.meanB, 4.667, 1e-3);
    assertApproxEqual(result.t, -2.4445, 1e-2);
    assertApproxEqual(result.df, 7.2897, 1e-2);
    assertApproxEqual(result.pValue, 0.04312, 1e-2);
    assert(result.pValue < 0.05, 'Welch t p-value should be significant at alpha=0.05');
    assertApproxEqual(result.cohensD, -1.4113, 1e-2);
  });

  // Test 4: Mann-Whitney U test with mid-rank tie correction and Cliff's delta
  suite.test('Mann-Whitney U and Cliff delta with mid-rank ties match analytical derivation', () => {
    const groupA = [2.0, 3.0, 3.0, 4.0, 4.0, 5.0];
    const groupB = [4.0, 4.0, 5.0, 5.0, 5.0, 5.0];

    const result = runMannWhitneyU(groupA, groupB);
    assertEqual(result.canCompute, true);
    assert(result.uA !== null, 'uA must be computed');
    assert(result.uB !== null, 'uB must be computed');
    assertEqual(result.uA + result.uB, groupA.length * groupB.length, 'uA + uB must equal nA * nB');

    // Strict mathematical relation: delta = (2 * uA) / (nA * nB) - 1
    const expectedDelta = (2.0 * result.uA) / (groupA.length * groupB.length) - 1.0;
    assertApproxEqual(result.cliffsDelta, expectedDelta, 1e-6);
    assert(result.cliffsDelta >= -1.0 && result.cliffsDelta <= 1.0, 'Delta must be clamped in [-1, 1]');
    assert(result.romanoMagnitude === 'large' || result.romanoMagnitude === 'medium');
  });

  // Test 5: Monotonic sequential Holm-Bonferroni correction
  suite.test('Monotonic Holm-Bonferroni enforces non-decreasing adjusted p-values bounded at 1.0', () => {
    const tests = [
      { name: 'Test 1', pValue: 0.005 },
      { name: 'Test 2', pValue: 0.021 },
      { name: 'Test 3', pValue: 0.038 },
      { name: 'Test 4', pValue: 0.045 },
    ];
    const adjusted = applyHolmBonferroni(tests);
    assertEqual(adjusted.length, 4);

    // Monotonicity check: p_adj,i >= p_adj,i-1
    for (let i = 1; i < adjusted.length; i++) {
      assert(
        adjusted[i].adjustedP >= adjusted[i - 1].adjustedP,
        `Adjusted p must be non-decreasing: ${adjusted[i].adjustedP} >= ${adjusted[i - 1].adjustedP}`
      );
    }
    // Upper bound check: p_adj <= 1.0
    assert(adjusted.every(t => t.adjustedP <= 1.0), 'All adjusted p-values must be bounded at 1.0');
    assertEqual(adjusted[0].familySize, 4);
  });

  return suite;
}
