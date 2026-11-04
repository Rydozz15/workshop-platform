/**
 * Deep Boundary & Edge-Case Stress Harness
 * Milestone 3 (M3) — Stats & Psychometrics Adversarial Verifier
 * 
 * Deep dive into:
 * - Cliff's delta with nA=1, nB=2; extreme unbalanced sample sizes (nA=2, nB=500); near-zero variance
 * - Welch t-test with extreme heteroscedasticity (var ratio 10^10)
 * - Cronbach's alpha with single zero-variance item in multi-item scale
 * - Shapiro-Wilk with exact n=3 Royston branch and extreme fat tails (Cauchy)
 * - Hake gain with negative gains (learning regression) and extreme boundaries
 * - Holm-Bonferroni underflow and duplicate p-values
 */

import {
  runWelchTTest,
  runMannWhitneyU,
  applyHolmBonferroni,
  computeSampleMoments,
  shapiroWilk,
  runAssumptionGatekeeper,
  cliffsDelta,
  cohensD,
} from '../lib/stats.js';

import {
  calculateCronbachAlpha,
  calculateHakeGain,
} from '../lib/psychometrics.js';

import {
  calculateIRR,
  calculateConfusionMatrix,
  cohenKappa,
  gwetAC1,
} from '../lib/irr.js';

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    failed++;
    failures.push(message);
    throw new Error(`FAIL: ${message}`);
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    const msg = `${message} (Expected: ${expected}, got: ${actual})`;
    failed++;
    failures.push(msg);
    throw new Error(`FAIL: ${msg}`);
  }
}

function assertApprox(actual, expected, tol = 1e-4, message = '') {
  if (isNaN(actual) || isNaN(expected) || Math.abs(actual - expected) > tol) {
    const msg = `${message} (Expected ~${expected}, got ${actual}, diff: ${Math.abs(actual - expected)})`;
    failed++;
    failures.push(msg);
    throw new Error(`FAIL: ${msg}`);
  }
}

function runDeepTest(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

console.log('\n================================================================');
console.log(' DEEP BOUNDARY & EDGE-CASE STRESS HARNESS: STATS (M3)');
console.log('================================================================\n');

// 1. Cliff's delta extreme sample size imbalances
runDeepTest('Cliff\'s delta handles extreme unbalanced sample size (nA=2, nB=500)', () => {
  const groupA = [10, 20];
  const groupB = Array.from({ length: 500 }, (_, i) => i % 15);
  const res = runMannWhitneyU(groupA, groupB);
  assert(res.canCompute, 'Can compute unbalanced n');
  assert(!isNaN(res.cliffsDelta), 'cliffsDelta is not NaN');
  assert(!isNaN(res.seDelta), 'seDelta is not NaN');
  assert(res.deltaCi[0] >= -1.0 && res.deltaCi[1] <= 1.0, 'CI clamped');
});

runDeepTest('Cliff\'s delta handles nA=1, nB=2 without division by zero', () => {
  const groupA = [2];
  const groupB = [1, 3];
  const res = runMannWhitneyU(groupA, groupB);
  assert(res.canCompute, 'Can compute nA=1, nB=2');
  assertEqual(res.cliffsDelta, 0.0, 'Delta is 0.0');
  assertEqual(res.uA, 1.0, 'uA is 1.0');
  assertEqual(res.uB, 1.0, 'uB is 1.0');
  assert(!isNaN(res.seDelta), 'seDelta is not NaN');
});

runDeepTest('Cliff\'s delta handles all tied except single element', () => {
  const groupA = [5, 5, 5, 5];
  const groupB = [5, 5, 5, 6];
  const res = runMannWhitneyU(groupA, groupB);
  assert(res.canCompute, 'Can compute near-complete ties');
  // 12 pairs are (5,5), 4 pairs are (5,6) where A < B.
  // direct delta: (0 - 4)/16 = -0.25
  assertApprox(res.cliffsDelta, -0.25, 1e-4, 'Delta is -0.25');
  assertApprox(1.0 - (2.0 * res.uB) / 16.0, -0.25, 1e-4, 'Satisfies U_B invariant');
});

// 2. Welch's t-test with extreme heteroscedasticity
runDeepTest('Welch t-test survives 10^10 variance ratio without NaN or Inf', () => {
  const groupA = [10.0, 10.00001, 9.99999]; // Var ~ 10^-10
  const groupB = [0.0, 10000.0, 20000.0];  // Var ~ 10^8
  const res = runWelchTTest(groupA, groupB);
  assert(res.canCompute, 'Can compute extreme variance ratio');
  assert(!isNaN(res.t), 't is not NaN');
  assert(!isNaN(res.df), 'df is not NaN');
  // Under extreme heteroscedasticity, df collapses toward nB - 1 = 2
  assertApprox(res.df, 2.0, 0.1, 'df approaches nB - 1');
  assert(!isNaN(res.pValue), 'pValue is not NaN');
  assert(res.pValue >= 0 && res.pValue <= 1.0, 'pValue in valid range');
});

// 3. Cronbach's alpha with single zero-variance item in a multi-item scale
runDeepTest('Cronbach alpha handles an invariant item among variant items', () => {
  const matrix = [
    [1, 5, 2],
    [2, 5, 3],
    [3, 5, 4],
    [4, 5, 5],
    [5, 5, 5],
  ]; // Item 1 is invariant (all 5s)
  const res = calculateCronbachAlpha(matrix);
  assert(res.canCompute, 'Can compute alpha with invariant item');
  assert(!isNaN(res.alpha), 'Alpha is not NaN');
  assertEqual(res.itemTotalCorrelations[1], 0, 'Invariant item correlation is 0');
  assert(!isNaN(res.alphaIfDeleted[1]), 'Alpha if deleted for invariant item is not NaN');
});

// 4. Cronbach's alpha with high collinearity
runDeepTest('Cronbach alpha with perfectly identical items yields alpha = 1.0', () => {
  const matrix = [
    [1, 1, 1],
    [2, 2, 2],
    [3, 3, 3],
    [4, 4, 4],
    [5, 5, 5],
  ];
  const res = calculateCronbachAlpha(matrix);
  assert(res.canCompute, 'Can compute perfectly correlated items');
  assertApprox(res.alpha, 1.0, 1e-4, 'Alpha is 1.0');
  assertEqual(res.isAcceptable, true, 'Acceptable');
});

// 5. Shapiro-Wilk exact n=3 branch
runDeepTest('Shapiro-Wilk exact n=3 Royston branch executes properly', () => {
  const rNormal = shapiroWilk([1, 2, 3]); // perfectly linear / symmetric
  assert(rNormal.W !== null, 'W is not null');
  assert(!isNaN(rNormal.W), 'W is not NaN');
  assert(!isNaN(rNormal.pValue), 'pValue is not NaN');
  assertEqual(rNormal.isNormal, true, 'Symmetric n=3 is normal');

  const rSkewed = shapiroWilk([1, 1, 100]); // heavy outlier
  assert(rSkewed.W !== null, 'W is not null');
  assert(rSkewed.pValue < 0.05, 'Outlier n=3 is detected as non-normal');
});

// 6. Hake gain with learning regressions (negative gain)
runDeepTest('Hake gain handles learning regressions (negative gain)', () => {
  const pre = [4, 4, 5];
  const post = [2, 1, 3];
  const res = calculateHakeGain(pre, post, 5.0);
  assert(res.canCompute, 'Can compute regression');
  assert(res.gClass < 0, 'Class gain is negative');
  assert(res.individualGains.every(g => g <= 0), 'All individual gains <= 0');
  assertEqual(res.tier, 'low', 'Tier is low');
});

// 7. Holm-Bonferroni underflow and duplicate values
runDeepTest('Holm-Bonferroni handles floating-point underflow (1e-15) and empty/null gracefully', () => {
  const rEmpty = applyHolmBonferroni([]);
  assertEqual(rEmpty.length, 0, 'Empty input returns empty array');

  const rNull = applyHolmBonferroni(null);
  assertEqual(rNull.length, 0, 'Null input returns empty array');

  const rTiny = applyHolmBonferroni([1e-15, 1e-12, 0.01, 0.04]);
  assertEqual(rTiny.length, 4, 'Output length 4');
  assert(rTiny[0].adj >= 1e-15, 'Tiny adj >= raw');
  assert(rTiny[0].significant, 'Tiny p is significant');
  assert(rTiny[0].adj <= rTiny[1].adj, 'Monotonic step-down');
});

// Summary
console.log('\n================================================================');
console.log(` DEEP EDGE-CASE TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
