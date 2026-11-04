/**
 * Tier 2: Boundary & Corner Cases — Zero Variance Distributions (>= 5 tests)
 * Tests identical ratings across conditions, ceiling collapse,
 * Cliff's delta clamping, and Cronbach alpha zero-variance item handling.
 */
import { TestSuite, assert, assertEqual, assertApproxEqual } from '../harness/test-utils.js';
import {
  runWelchTTest,
  runMannWhitneyU,
  calculateCronbachAlpha,
} from '../harness/spec-oracle.js';

export function createZeroVarianceSuite() {
  const suite = new TestSuite('Boundary: Zero Variance Distributions (Tier 2)', 2);

  // Test 1: Identical ratings in both groups yield Welch t=0.0 and p=1.0
  suite.test('Identical ratings in both groups (all 5s) yield t=0.0, p=1.0, and Cohen d=0.0', () => {
    const groupA = [5.0, 5.0, 5.0, 5.0];
    const groupB = [5.0, 5.0, 5.0, 5.0];
    const res = runWelchTTest(groupA, groupB);
    assertEqual(res.canCompute, true);
    assertEqual(res.t, 0.0);
    assertEqual(res.pValue, 1.0);
    assertEqual(res.cohensD, 0.0);
  });

  // Test 2: Identical ratings in both groups yield Cliff's delta = 0.0 (negligible)
  suite.test('Identical ratings in both groups yield Cliff delta = 0.0 and tier negligible', () => {
    const groupA = [5, 5, 5, 5, 5];
    const groupB = [5, 5, 5, 5, 5];
    const res = runMannWhitneyU(groupA, groupB);
    assertEqual(res.canCompute, true);
    assertEqual(res.cliffsDelta, 0.0);
    assertEqual(res.pValue, 1.0);
    assertEqual(res.romanoMagnitude, 'negligible');
  });

  // Test 3: Completely disjoint zero-variance groups yield Cliff's delta = -1.0 (large)
  suite.test('Disjoint zero-variance groups (A=[1,1], B=[5,5]) yield Cliff delta = -1.0 clamped', () => {
    const groupA = [1, 1, 1];
    const groupB = [5, 5, 5];
    const res = runMannWhitneyU(groupA, groupB);
    assertEqual(res.canCompute, true);
    assertApproxEqual(res.cliffsDelta, -1.0, 1e-6);
    assertEqual(res.romanoMagnitude, 'large');
    assert(res.deltaCi[0] >= -1.0 && res.deltaCi[1] <= 1.0, 'CI must remain clamped');
  });

  // Test 4: Cronbach's alpha with an invariant item (zero variance)
  suite.test('Cronbach alpha handles an invariant item without division-by-zero or crash', () => {
    const matrix = [
      [3, 5, 4],
      [4, 5, 3],
      [2, 5, 2],
      [5, 5, 5],
    ]; // Column 1 has zero variance (all 5s)
    const res = calculateCronbachAlpha(matrix);
    assertEqual(res.canCompute, true);
    assert(typeof res.alpha === 'number' && !isNaN(res.alpha));
  });

  // Test 5: All survey responses identical across all participants (total variance = 0)
  suite.test('Cronbach alpha when all participants give identical responses across all items', () => {
    const matrix = [
      [5, 5, 5],
      [5, 5, 5],
      [5, 5, 5],
    ];
    const res = calculateCronbachAlpha(matrix);
    assertEqual(res.canCompute, true);
    assertEqual(res.alpha, 0.0);
    assertEqual(res.isAcceptable, false);
  });

  return suite;
}
