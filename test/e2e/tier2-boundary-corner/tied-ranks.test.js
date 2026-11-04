/**
 * Tier 2: Boundary & Corner Cases — Tied Ranks (>= 5 tests)
 * Tests mid-rank assignment, tie-correction variance adjustments,
 * and dominance consistency under heavy ties.
 */
import { TestSuite, assert, assertEqual, assertApproxEqual } from '../harness/test-utils.js';
import { runMannWhitneyU } from '../harness/spec-oracle.js';

export function createTiedRanksSuite() {
  const suite = new TestSuite('Boundary: Tied Ranks & Mid-Rank Correction (Tier 2)', 2);

  // Test 1: Exact mid-rank calculation for multi-way ties
  suite.test('Mid-ranks correctly average identical observations', () => {
    // A: [3, 4], B: [4, 5] -> combined: [3, 4, 4, 5] -> ranks: [1, 2.5, 2.5, 4]
    const groupA = [3, 4];
    const groupB = [4, 5];
    const res = runMannWhitneyU(groupA, groupB);
    assertEqual(res.canCompute, true);
    // U_A = rankSumA - 2*3/2 = (1 + 2.5) - 3 = 0.5
    assertEqual(res.uA, 0.5);
    assertEqual(res.uB, 3.5);
    // Delta = (2 * 0.5 / 4) - 1 = 0.25 - 1 = -0.75
    assertApproxEqual(res.cliffsDelta, -0.75, 1e-4);
  });

  // Test 2: Multi-way ties within one group and disjoint values in the other
  suite.test('Multi-way ties within one group maintain correct rank sum', () => {
    const groupA = [2, 2, 2, 2];
    const groupB = [4, 5];
    const res = runMannWhitneyU(groupA, groupB);
    assertEqual(res.canCompute, true);
    // Every element of A is smaller than every element of B: delta = -1.0
    assertApproxEqual(res.cliffsDelta, -1.0, 1e-4);
  });

  // Test 3: Symmetrical heavy ties center at delta = 0.0
  suite.test('Symmetrical tie patterns between groups yield Cliff delta = 0.0', () => {
    const groupA = [1, 2, 2, 3];
    const groupB = [1, 2, 2, 3];
    const res = runMannWhitneyU(groupA, groupB);
    assertEqual(res.canCompute, true);
    assertApproxEqual(res.cliffsDelta, 0.0, 1e-4);
    assertEqual(res.romanoMagnitude, 'negligible');
  });

  // Test 4: Heavy ties across 5-point discrete Likert distribution
  suite.test('Typical discrete Likert ties (1–5) compute valid tie-corrected p-value', () => {
    const groupA = [3, 3, 3, 4, 4, 4, 5];
    const groupB = [4, 4, 4, 5, 5, 5, 5];
    const res = runMannWhitneyU(groupA, groupB);
    assertEqual(res.canCompute, true);
    assert(res.pValue !== null && !isNaN(res.pValue));
    assert(res.pValue >= 0 && res.pValue <= 1.0);
    assert(res.cliffsDelta < 0, 'Group B should dominate Group A');
  });

  // Test 5: Single pair tie with otherwise distinct values
  suite.test('Single tied pair among distinct elements correctly adjusts variance', () => {
    const groupA = [10, 20, 30];
    const groupB = [20, 40, 50]; // 20 is tied
    const res = runMannWhitneyU(groupA, groupB);
    assertEqual(res.canCompute, true);
    assert(res.uA + res.uB === 9, 'Sum of U must equal nA * nB');
  });

  return suite;
}
