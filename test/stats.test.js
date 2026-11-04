/**
 * Unit Test Suite: Assumption-First Statistical & Psychometric Engine
 *
 * Verifies exact mathematical calculations against:
 * - 7 Golden Analytical Benchmark Vectors from survey_stats.md §8
 * - All edge cases (n=0, n=1, zero variance, tied ranks, missing values)
 * - Assumption Diagnostic Gatekeeper
 *
 * Run with: node test/stats.test.js
 */

import {
  runAssumptionGatekeeper,
  runWelchTTest,
  runMannWhitneyU,
  applyHolmBonferroni,
  computeSampleMoments,
  shapiroWilk,
  leveneTest,
} from '../lib/stats.js';

import {
  calculateHakeGain,
  calculateCronbachAlpha,
} from '../lib/psychometrics.js';

import {
  calculateIRR,
  calculateConfusionMatrix,
  cohenKappa,
  gwetAC1,
} from '../lib/irr.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    failed++;
    console.error(`  FAIL: ${message}`);
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    const msg = `${message} (Expected: ${expected}, got: ${actual})`;
    failed++;
    console.error(`  FAIL: ${msg}`);
    throw new Error(msg);
  }
}

function assertApprox(actual, expected, tol = 1e-3, message = '') {
  if (Math.abs(actual - expected) > tol) {
    const msg = `${message} (Expected ~${expected}, got ${actual}, diff ${Math.abs(actual - expected)} > ${tol})`;
    failed++;
    console.error(`  FAIL: ${msg}`);
    throw new Error(msg);
  }
}

function runTest(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    // Already logged in assert
  }
}

console.log('\n========================================================');
console.log(' PROMPTSKETCH STATS & PSYCHOMETRICS UNIT SUITE');
console.log('========================================================\n');

// ---------------------------------------------------------------------
// 1. Benchmark Vector 1: Welch t-test & Cohen d
// ---------------------------------------------------------------------
console.log('▶ Section 1: Benchmark Vector 1 — Welch t-Test & Cohen d');

runTest('Welch t-test and Cohen d match analytical golden benchmarks', () => {
  const groupA = [2.0, 3.0, 3.0, 4.0, 4.0, 5.0];
  const groupB = [4.0, 4.0, 5.0, 5.0, 5.0, 5.0];
  const res = runWelchTTest(groupA, groupB);

  assertEqual(res.canCompute, true, 'Can compute Welch t');
  assertApprox(res.meanA, 3.500, 1e-3, 'Mean A');
  assertApprox(res.meanB, 4.667, 1e-3, 'Mean B');
  assertApprox(res.t, -2.4445, 1e-3, 'Welch t statistic');
  assertApprox(res.df, 7.2897, 1e-3, 'Welch-Satterthwaite df');
  assertApprox(res.pValue, 0.04312, 1e-4, 'Two-tailed p-value');
  assert(res.pValue < 0.05, 'Statistically significant at alpha=0.05');
  assertApprox(res.sPooled, 0.8266, 1e-3, 'Pooled SD');
  assertApprox(res.cohensD, -1.4113, 1e-3, 'Cohen d');
  assertApprox(res.seD, 0.6452, 1e-3, 'SE of d');
  assertApprox(res.dCi[0], -2.6759, 1e-3, 'Cohen d 95% CI lower bound');
  assertApprox(res.dCi[1], -0.1467, 1e-3, 'Cohen d 95% CI upper bound');
  assertEqual(res.tier, 'large', 'Large effect size tier');
});

// ---------------------------------------------------------------------
// 2. Benchmark Vector 2: Mann-Whitney U & Cliff delta with ties
// ---------------------------------------------------------------------
console.log('\n▶ Section 2: Benchmark Vector 2 — Mann-Whitney U & Cliff delta');

runTest('Mann-Whitney U and Cliff delta match analytical tie-corrected benchmarks', () => {
  const groupA = [2, 3, 3, 4, 4, 5];
  const groupB = [4, 4, 5, 5, 5, 5];
  const res = runMannWhitneyU(groupA, groupB);

  assertEqual(res.canCompute, true, 'Can compute Mann-Whitney U');
  assertEqual(res.uA, 6.0, 'U_A rank statistic');
  assertEqual(res.uB, 30.0, 'U_B rank statistic');
  assertEqual(res.uA + res.uB, 36, 'U_A + U_B equals nA * nB');

  // Strict link: delta = 1 - 2*U_B/(nA*nB) = -24/36 = -0.6667
  assertApprox(res.cliffsDelta, -0.6667, 1e-3, 'Cliffs delta');
  assertApprox(res.seDelta, 0.2363, 1e-3, 'Cliffs delta asymptotic SE (Cliff 1993)');
  assertApprox(res.deltaCi[0], -1.0000, 1e-4, 'Delta 95% CI clamped lower bound');
  assertApprox(res.deltaCi[1], -0.2036, 1e-3, 'Delta 95% CI upper bound');
  assertEqual(res.romanoMagnitude, 'large', 'Romano et al. (2006) large tier');
});

// ---------------------------------------------------------------------
// 3. Benchmark Vector 3: Monotonic Holm-Bonferroni
// ---------------------------------------------------------------------
console.log('\n▶ Section 3: Benchmark Vector 3 — Monotonic Holm-Bonferroni');

runTest('Holm-Bonferroni step-down enforces monotonicity and bounds at 1.0', () => {
  const rawP = [0.008, 0.045, 0.015, 0.035];
  const res = applyHolmBonferroni(rawP);

  assertEqual(res.length, 4, 'Family size m=4');
  assertEqual(res[0].familySize, 4, 'Reports family size');

  // Golden adjusted p-values mapped back to original order:
  // p0 (0.008) -> 0.032
  // p1 (0.045) -> 0.070
  // p2 (0.015) -> 0.045
  // p3 (0.035) -> 0.070
  assertApprox(res[0].adj, 0.032, 1e-4, 'Adjusted p for p0');
  assertEqual(res[0].significant, true, 'p0 is significant');
  assertApprox(res[1].adj, 0.070, 1e-4, 'Adjusted p for p1');
  assertEqual(res[1].significant, false, 'p1 is not significant');
  assertApprox(res[2].adj, 0.045, 1e-4, 'Adjusted p for p2');
  assertEqual(res[2].significant, true, 'p2 is significant');
  assertApprox(res[3].adj, 0.070, 1e-4, 'Adjusted p for p3');
  assertEqual(res[3].significant, false, 'p3 is not significant');
});

// ---------------------------------------------------------------------
// 4. Benchmark Vector 4: Cronbach's Alpha & Reverse-Coding
// ---------------------------------------------------------------------
console.log('\n▶ Section 4: Benchmark Vector 4 — Cronbach alpha & Reverse-Coding');

runTest('Cronbach alpha correctly computes raw vs recoded alpha and flags omissions', () => {
  const matrix = [
    [4, 5, 4, 2],
    [5, 5, 5, 1],
    [3, 4, 3, 3],
    [2, 2, 3, 4],
    [4, 4, 4, 2],
    [1, 2, 1, 5],
  ];

  // 1. Raw alpha without reverse coding
  const raw = calculateCronbachAlpha(matrix);
  assertEqual(raw.canCompute, true, 'Can compute raw alpha');
  assertApprox(raw.alpha, -0.2484, 1e-3, 'Raw alpha is depressed/negative');
  assertEqual(raw.isAcceptable, false, 'Raw alpha is unacceptable');
  assert(raw.flaggedItems.includes(3), 'Flags item 3 as candidate for reverse-coding');
  assertEqual(raw.reverseCodingOmissionSuspected, true, 'Suspects reverse-coding omission');
  assert(raw.itemTotalCorrelations[3] < 0, 'Negative item-total correlation on item 3');

  // 2. Recoded alpha with column 3 inverted (6 - X)
  const recoded = calculateCronbachAlpha(matrix, [3]);
  assertEqual(recoded.canCompute, true, 'Can compute recoded alpha');
  assertApprox(recoded.alpha, 0.9826, 1e-3, 'Recoded alpha matches golden value');
  assertEqual(recoded.isAcceptable, true, 'Recoded alpha is acceptable (>= 0.70)');
  assertEqual(recoded.flaggedItems.length, 0, 'No remaining flagged items');

  // Corrected item-total correlations
  assertApprox(recoded.itemTotalCorrelations[0], 0.9959, 1e-3, 'r_it-c item 0');
  assertApprox(recoded.itemTotalCorrelations[1], 0.9019, 1e-3, 'r_it-c item 1');
  assertApprox(recoded.itemTotalCorrelations[2], 0.9316, 1e-3, 'r_it-c item 2');
  assertApprox(recoded.itemTotalCorrelations[3], 0.9959, 1e-3, 'r_it-c item 3');

  // Alpha if item deleted
  assertApprox(recoded.alphaIfDeleted[0], 0.9658, 1e-3, 'alpha-if-deleted item 0');
  assertApprox(recoded.alphaIfDeleted[1], 0.9909, 1e-3, 'alpha-if-deleted item 1');
  assertApprox(recoded.alphaIfDeleted[2], 0.9833, 1e-3, 'alpha-if-deleted item 2');
  assertApprox(recoded.alphaIfDeleted[3], 0.9658, 1e-3, 'alpha-if-deleted item 3');
});

// ---------------------------------------------------------------------
// 5. Benchmark Vector 5: Cohen's Kappa vs Gwet's AC1 (Prevalence Paradox)
// ---------------------------------------------------------------------
console.log('\n▶ Section 5: Benchmark Vector 5 — IRR Prevalence Paradox');

runTest('IRR module computes Cohen kappa and Gwet AC1, diagnosing prevalence skew', () => {
  const rater1 = [];
  const rater2 = [];
  for (let i = 0; i < 85; i++) { rater1.push('Cat1'); rater2.push('Cat1'); }
  for (let i = 0; i < 5; i++) { rater1.push('Cat2'); rater2.push('Cat2'); }
  for (let i = 0; i < 8; i++) { rater1.push('Cat1'); rater2.push('Cat2'); }
  for (let i = 0; i < 2; i++) { rater1.push('Cat2'); rater2.push('Cat1'); }

  const res = calculateIRR(rater1, rater2);
  assertEqual(res.canCompute, true, 'Can compute IRR');
  assertApprox(res.observedAgreement, 0.9000, 1e-4, 'Observed agreement 90%');
  assertApprox(res.peCohen, 0.8182, 1e-3, 'Cohen chance agreement');
  assertApprox(res.cohenKappa, 0.4499, 1e-3, 'Cohen kappa is depressed');
  assertApprox(res.peGwet, 0.1800, 1e-3, 'Gwet chance agreement');
  assertApprox(res.gwetsAC1, 0.8780, 1e-3, 'Gwet AC1 remains resiliently high');
  assertEqual(res.prevalenceWarning, true, 'Flags prevalence paradox');
  assert(res.warningMessage.includes('Paradoja de Prevalencia'), 'Includes plain-language alert');
});

// ---------------------------------------------------------------------
// 6. Benchmark Vector 7: Hake's Normalized Learning Gain
// ---------------------------------------------------------------------
console.log('\n▶ Section 6: Benchmark Vector 7 — Hake Normalized Learning Gain');

runTest('Hake gain computes class gain, individual gains, and CI', () => {
  const pre = [2, 3, 1, 4, 2];
  const post = [4, 5, 3, 5, 3];
  const res = calculateHakeGain(pre, post, 5.0);

  assertEqual(res.canCompute, true, 'Can compute Hake gain');
  assertApprox(res.meanPre, 2.400, 1e-3, 'Mean Pre');
  assertApprox(res.meanPost, 4.000, 1e-3, 'Mean Post');
  assertApprox(res.gClass, 0.6154, 1e-3, 'Class average gain');
  assertApprox(res.gIndivMean, 0.7000, 1e-3, 'Individual mean gain');
  assertEqual(res.tier, 'medium', 'Classifies as medium gain');
  assert(res.ci[0] < res.gIndivMean && res.ci[1] > res.gIndivMean, 'CI brackets mean');
});

// ---------------------------------------------------------------------
// 7. Assumption Diagnostic Gatekeeper
// ---------------------------------------------------------------------
console.log('\n▶ Section 7: Assumption Diagnostic Gatekeeper');

runTest('Gatekeeper routes ordinal individual Likert items to Mann-Whitney U', () => {
  const groupA = [1, 2, 3, 4, 3, 2];
  const groupB = [3, 4, 5, 4, 5, 4];
  const res = runAssumptionGatekeeper({ groupA, groupB, scaleType: 'ordinal' });

  assertEqual(res.scaleType, 'ordinal');
  assertEqual(res.recommendedTest, 'mann_whitney_u');
  assertEqual(res.effectSize, 'cliffs_delta');
  assert(res.explanation.includes('escala ordinal'));
});

runTest('Gatekeeper routes symmetric continuous metric to Welch t-test', () => {
  const groupA = [180.0, 185.0, 190.0, 190.0, 195.0, 200.0];
  const groupB = [235.0, 240.0, 245.0, 245.0, 250.0, 255.0];
  const res = runAssumptionGatekeeper({ groupA, groupB, scaleType: 'continuous' });

  assertEqual(res.scaleType, 'continuous');
  assertEqual(res.isNormalA, true);
  assertEqual(res.isNormalB, true);
  assertEqual(res.recommendedTest, 'welch_t');
  assertEqual(res.effectSize, 'cohens_d');
});

runTest('Gatekeeper diverts skewed continuous metric to Mann-Whitney U', () => {
  const groupA = [1.0, 1.0, 1.0, 1.0, 1.0, 25.0]; // Heavily skewed
  const groupB = [10.0, 11.0, 10.0, 12.0, 11.0, 10.0];
  const res = runAssumptionGatekeeper({ groupA, groupB, scaleType: 'continuous' });

  assertEqual(res.scaleType, 'continuous');
  assertEqual(res.isNormalA, false);
  assertEqual(res.recommendedTest, 'mann_whitney_u');
  assertEqual(res.effectSize, 'cliffs_delta');
});

// ---------------------------------------------------------------------
// 8. Edge Cases & Boundary Handling
// ---------------------------------------------------------------------
console.log('\n▶ Section 8: Edge Cases & Boundary Handling');

runTest('Welch t handles degenerate sample sizes (n=0, n=1) gracefully', () => {
  const r0 = runWelchTTest([], [1, 2, 3]);
  assertEqual(r0.canCompute, false);
  assertEqual(r0.error, 'insufficient_sample');

  const r1 = runWelchTTest([5], [4, 5, 4]);
  assertEqual(r1.canCompute, false);
  assertEqual(r1.error, 'insufficient_sample');
});

runTest('Welch t handles zero-variance identical arrays (all 5s)', () => {
  const r = runWelchTTest([5, 5, 5], [5, 5, 5]);
  assertEqual(r.canCompute, true);
  assertEqual(r.t, 0.0);
  assertEqual(r.pValue, 1.0);
  assertEqual(r.cohensD, 0.0);
});

runTest('Mann-Whitney U handles empty sample gracefully', () => {
  const r = runMannWhitneyU([1, 2, 3], []);
  assertEqual(r.canCompute, false);
  assertEqual(r.error, 'insufficient_sample');
});

runTest('Mann-Whitney U handles complete ties across both groups', () => {
  const r = runMannWhitneyU([5, 5, 5, 5], [5, 5, 5, 5]);
  assertEqual(r.canCompute, true);
  assertEqual(r.cliffsDelta, 0.0);
  assertEqual(r.pValue, 1.0);
  assertEqual(r.romanoMagnitude, 'negligible');
});

runTest('Mann-Whitney U handles disjoint zero-variance groups with clamped CI', () => {
  const r = runMannWhitneyU([1, 1, 1], [5, 5, 5]);
  assertEqual(r.canCompute, true);
  assertApprox(r.cliffsDelta, -1.0, 1e-4);
  assertEqual(r.deltaCi[0], -1.0);
  assertEqual(r.deltaCi[1], -1.0);
  assertEqual(r.romanoMagnitude, 'large');
});

runTest('Cronbach alpha handles degenerate matrix sizes', () => {
  const r1 = calculateCronbachAlpha([[4, 5, 4]]); // N=1
  assertEqual(r1.canCompute, false);
  assertEqual(r1.error, 'insufficient_sample');

  const r2 = calculateCronbachAlpha([[4], [5], [3]]); // k=1
  assertEqual(r2.canCompute, false);
  assertEqual(r2.error, 'minimum_two_items_required');
});

runTest('Hake gain handles perfect baseline (Pre=Max)', () => {
  // Pre=5, Post=5 -> g=1.0
  // Pre=5, Post=4 -> g=0.0
  const r = calculateHakeGain([5, 5], [5, 4], 5.0);
  assertEqual(r.canCompute, true);
  assertEqual(r.individualGains[0], 1.0);
  assertEqual(r.individualGains[1], 0.0);
});

runTest('Mann-Whitney U identical samples produce exact pValue === 1.0', () => {
  const r1 = runMannWhitneyU([1, 2, 3], [1, 2, 3]);
  assertEqual(r1.canCompute, true);
  assertEqual(r1.pValue, 1.0, 'pValue is exactly 1.0 for identical groups');
  assertEqual(r1.cliffsDelta, 0.0);
  assertEqual(r1.romanoMagnitude, 'negligible');

  const r2 = runMannWhitneyU([1, 4], [2, 3]);
  assertEqual(r2.canCompute, true);
  assertEqual(r2.pValue, 1.0, 'pValue is exactly 1.0 for symmetric distributions');
  assertEqual(r2.cliffsDelta, 0.0);
});

runTest('Holm-Bonferroni safely handles null/uncomputable p-values without false significance or NaN poisoning', () => {
  // Array of objects with null pValue
  const objInput = [{ pValue: 0.01 }, { pValue: null }, { pValue: 0.04 }];
  const rObj = applyHolmBonferroni(objInput);
  assertEqual(rObj.length, 3);
  assertEqual(rObj[0].significant, true);
  assertApprox(rObj[0].adj, 0.02, 1e-4);
  assertEqual(rObj[1].significant, false, 'Null test must not be marked significant');
  assertEqual(rObj[1].adj, null, 'Null test adjusted p must be null');
  assertEqual(rObj[2].significant, true);
  assertApprox(rObj[2].adj, 0.04, 1e-4);

  // Array of primitives with null
  const primInput = [0.01, null, 0.04];
  const rPrim = applyHolmBonferroni(primInput);
  assertEqual(rPrim.length, 3);
  assertEqual(rPrim[0].significant, true);
  assertApprox(rPrim[0].adj, 0.02, 1e-4);
  assertEqual(rPrim[1].significant, false, 'Primitive null must not be marked significant');
  assertEqual(rPrim[1].adj, null, 'Primitive null adjusted p must be null');
  assertEqual(rPrim[2].significant, true);
  assertApprox(rPrim[2].adj, 0.04, 1e-4);
  assert(!isNaN(rPrim[2].adj), 'No NaN poisoning across subsequent tests');
});

runTest('Hake gain regression from max pre-test produces gClass === 0.0 and low tier', () => {
  const r = calculateHakeGain([5, 5, 5], [1, 1, 1], 5.0);
  assertEqual(r.canCompute, true);
  assertEqual(r.gClass, 0.0, 'Cohort regression from max score yields gClass = 0.0');
  assertEqual(r.tier, 'low', 'Regression classifies into low tier');
  assertEqual(r.gIndivMean, 0.0);
  assertEqual(r.individualGains[0], 0.0);
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------
console.log('\n========================================================');
console.log(` STATS SUITE RESULTS: ${passed} passed, ${failed} failed`);
console.log('========================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
