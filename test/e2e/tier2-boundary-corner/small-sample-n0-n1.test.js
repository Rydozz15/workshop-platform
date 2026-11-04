/**
 * Tier 2: Boundary & Corner Cases — Small Sample Sizes (n=0, n=1) (>= 5 tests)
 * Tests statistical robustness against degenerate sample sizes, preventing
 * division-by-zero, NaN, and unhandled runtime exceptions.
 */
import { TestSuite, assert, assertEqual } from '../harness/test-utils.js';
import {
  runWelchTTest,
  runMannWhitneyU,
  calculateHakeGain,
  calculateCronbachAlpha,
} from '../harness/spec-oracle.js';

export function createSmallSampleSuite() {
  const suite = new TestSuite('Boundary: Small Sample Sizes n=0/n=1 (Tier 2)', 2);

  // Test 1: Welch's t-test with n=0 in one group returns error
  suite.test('Welch t-test with nA=0 or nB=0 returns canCompute=false without crash', () => {
    const res = runWelchTTest([], [4.0, 5.0, 4.5]);
    assertEqual(res.canCompute, false);
    assertEqual(res.error, 'insufficient_sample');
  });

  // Test 2: Welch's t-test with n=1 in one group returns error (n-1=0 in df denominator)
  suite.test('Welch t-test with single observation (n=1) returns error preventing division by zero', () => {
    const res = runWelchTTest([3.5], [4.0, 5.0, 4.5]);
    assertEqual(res.canCompute, false);
    assertEqual(res.error, 'insufficient_sample');
  });

  // Test 3: Mann-Whitney U with n=0 returns canCompute=false
  suite.test('Mann-Whitney U with empty group returns canCompute=false gracefully', () => {
    const res = runMannWhitneyU([1, 2, 3], []);
    assertEqual(res.canCompute, false);
    assertEqual(res.error, 'insufficient_sample');
  });

  // Test 4: Cronbach's alpha with single participant (N=1) or single item (k=1)
  suite.test('Cronbach alpha returns error when N < 2 or items k < 2', () => {
    const res1 = calculateCronbachAlpha([[4, 5, 4]]); // N=1
    assertEqual(res1.canCompute, false);
    assertEqual(res1.error, 'insufficient_sample');

    const res2 = calculateCronbachAlpha([[4], [5], [3]]); // k=1
    assertEqual(res2.canCompute, false);
    assertEqual(res2.error, 'minimum_two_items_required');
  });

  // Test 5: Hake's normalized gain with empty arrays returns canCompute=false
  suite.test('Hake gain returns error when pre or post arrays are empty', () => {
    const res = calculateHakeGain([], []);
    assertEqual(res.canCompute, false);
    assertEqual(res.error, 'invalid_paired_arrays');
  });

  return suite;
}
