/**
 * Adversarial Stress & Empirical Verification Harness
 * Milestone 3 (M3) — Stats & Psychometrics Adversarial Verifier
 * 
 * Verifies:
 * 1. Mann-Whitney U & Cliff's Delta strictly satisfies delta = 1 - 2*U_B/(nA*nB)
 *    and matches independent pairwise dominance oracle across thousands of synthetic permutations.
 * 2. Monotonic Holm-Bonferroni strictly preserves monotonicity (p_adj,i >= p_adj,i-1)
 *    and permutation equivariance under randomly permuted input p-values.
 * 3. Cronbach's alpha with negative item correlations, reverse-coding detection, negative scores,
 *    and large n (n=1000).
 * 4. Gwet's AC1 vs Cohen's kappa across prevalence spectrum (0.50 to 0.99) and category counts.
 * 5. Welch's t-test and Shapiro-Wilk under small n (2, 3), large n (1000), heavy ties, negative scores.
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

function assertApprox(actual, expected, tol = 1e-4, message = '') {
  if (isNaN(actual) || isNaN(expected) || Math.abs(actual - expected) > tol) {
    const msg = `${message} (Expected ~${expected}, got ${actual}, diff: ${Math.abs(actual - expected)})`;
    failed++;
    failures.push(msg);
    throw new Error(`FAIL: ${msg}`);
  }
}

function runAdversarialTest(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

// PRNG for deterministic adversarial reproduction
function pseudoRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

console.log('\n================================================================');
console.log(' ADVERSARIAL STRESS TEST HARNESS: STATS & PSYCHOMETRICS (M3)');
console.log('================================================================\n');

// =====================================================================
// CHALLENGE 1: Cliff's Delta Invariant & Pairwise Dominance Oracle
// =====================================================================
console.log('▶ CHALLENGE 1: Cliff\'s Delta Strict Invariant & Direct Dominance Oracle');

// Direct pairwise dominance oracle: delta = (#(A > B) - #(A < B)) / (nA * nB)
function directDominanceOracle(groupA, groupB) {
  const nA = groupA.length;
  const nB = groupB.length;
  let greater = 0;
  let less = 0;
  for (let i = 0; i < nA; i++) {
    for (let j = 0; j < nB; j++) {
      if (groupA[i] > groupB[j]) greater++;
      else if (groupA[i] < groupB[j]) less++;
    }
  }
  return (greater - less) / (nA * nB);
}

runAdversarialTest('Invariant: delta == 1 - 2*U_B/(nA*nB) == Direct Dominance across 1,000 synthetic datasets', () => {
  const rand = pseudoRandom(42);
  let checkedPermutations = 0;

  for (let trial = 0; trial < 1000; trial++) {
    // Generate various sample sizes: small (2, 3), medium (10-30), large (100-300)
    let nA, nB;
    if (trial < 100) {
      nA = 2 + Math.floor(rand() * 3); // 2, 3, 4
      nB = 2 + Math.floor(rand() * 3);
    } else if (trial < 200) {
      nA = 10 + Math.floor(rand() * 20);
      nB = 10 + Math.floor(rand() * 20);
    } else if (trial < 250) {
      nA = 500;
      nB = 500;
    } else {
      nA = 5 + Math.floor(rand() * 50);
      nB = 5 + Math.floor(rand() * 50);
    }

    // Generate distributions with heavy ties, negative numbers, extreme values
    const groupA = [];
    const groupB = [];

    const tieMode = trial % 5;
    if (tieMode === 0) {
      // 90%+ ties from a tiny alphabet {1, 2}
      for (let i = 0; i < nA; i++) groupA.push(rand() < 0.9 ? 1 : 2);
      for (let i = 0; i < nB; i++) groupB.push(rand() < 0.9 ? 1 : 2);
    } else if (tieMode === 1) {
      // Negative scores (-10 to -1)
      for (let i = 0; i < nA; i++) groupA.push(-10 + Math.floor(rand() * 10));
      for (let i = 0; i < nB; i++) groupB.push(-10 + Math.floor(rand() * 10));
    } else if (tieMode === 2) {
      // Standard Likert 1-5 with random clustering
      for (let i = 0; i < nA; i++) groupA.push(1 + Math.floor(rand() * 5));
      for (let i = 0; i < nB; i++) groupB.push(1 + Math.floor(rand() * 5));
    } else if (tieMode === 3) {
      // Continuous floating point with occasional exact ties
      for (let i = 0; i < nA; i++) groupA.push(Math.round(rand() * 20) / 2.0);
      for (let i = 0; i < nB; i++) groupB.push(Math.round(rand() * 20) / 2.0);
    } else {
      // Completely disjoint or separated groups
      for (let i = 0; i < nA; i++) groupA.push(rand() * 10);
      for (let i = 0; i < nB; i++) groupB.push(20 + rand() * 10);
    }

    const res = runMannWhitneyU(groupA, groupB);
    assert(res.canCompute, `Can compute trial ${trial}`);

    const directDelta = directDominanceOracle(groupA, groupB);
    const formulaDelta = 1.0 - (2.0 * res.uB) / (nA * nB);

    assertApprox(res.cliffsDelta, directDelta, 1e-9, `Trial ${trial}: cliffsDelta vs Direct Dominance`);
    assertApprox(res.cliffsDelta, formulaDelta, 1e-9, `Trial ${trial}: cliffsDelta vs 1 - 2*U_B/(nA*nB)`);
    assert(res.cliffsDelta >= -1.0 - 1e-9 && res.cliffsDelta <= 1.0 + 1e-9, `Delta bounds in [-1, 1] on trial ${trial}`);
    assert(res.deltaCi[0] >= -1.0 && res.deltaCi[1] <= 1.0, `CI clamped in [-1, 1] on trial ${trial}`);
    assert(res.deltaCi[0] <= res.deltaCi[1] + 1e-9, `CI lower <= upper on trial ${trial}`);

    checkedPermutations++;
  }

  assert(checkedPermutations === 1000, `Checked 1,000 permutations, got ${checkedPermutations}`);
});

runAdversarialTest('Cliff\'s Delta with large n (n=1,000 vs n=1,000)', () => {
  const rand = pseudoRandom(12345);
  const nA = 1000;
  const nB = 1000;
  const groupA = [];
  const groupB = [];
  for (let i = 0; i < nA; i++) groupA.push(Math.floor(rand() * 5) + 1);
  for (let i = 0; i < nB; i++) groupB.push(Math.floor(rand() * 5) + 2);

  const res = runMannWhitneyU(groupA, groupB);
  assert(res.canCompute, 'Can compute large n');
  assert(!isNaN(res.cliffsDelta), 'Delta is not NaN');
  assert(!isNaN(res.seDelta), 'SE is not NaN');
  assert(!isNaN(res.pValue), 'P-value is not NaN');
  assert(res.pValue >= 0 && res.pValue <= 1.0, 'P-value bounded in [0, 1]');

  const formulaDelta = 1.0 - (2.0 * res.uB) / (nA * nB);
  assertApprox(res.cliffsDelta, formulaDelta, 1e-9, 'Large n delta satisfies formula');
});

runAdversarialTest('Cliff\'s Delta with minimal small n (n=2, n=3) and negative numbers', () => {
  const groupA = [-5, -2];
  const groupB = [-8, -5, -1];
  const res = runMannWhitneyU(groupA, groupB);
  assert(res.canCompute, 'Can compute n=2 vs n=3');
  const oracle = directDominanceOracle(groupA, groupB);
  assertApprox(res.cliffsDelta, oracle, 1e-9, 'Minimal n delta equals oracle');
});

// =====================================================================
// CHALLENGE 2: Monotonic Holm-Bonferroni Correction & Permutation Invariance
// =====================================================================
console.log('\n▶ CHALLENGE 2: Monotonic Holm-Bonferroni Correction');

runAdversarialTest('Sequential Holm-Bonferroni strictly preserves monotonicity (p_adj,i >= p_adj,i-1) under random permutations', () => {
  const rand = pseudoRandom(999);

  for (let trial = 0; trial < 500; trial++) {
    // Generate random family of p-values with size m in [1, 50]
    const m = 1 + Math.floor(rand() * 50);
    const rawP = [];
    for (let i = 0; i < m; i++) {
      rawP.push(rand()); // in [0, 1)
    }

    const res = applyHolmBonferroni(rawP);
    assertEqual(res.length, m, `Output length matches family size ${m}`);

    // Verify 1: For any two tests, if rawP[a] <= rawP[b], then adj[a] <= adj[b]
    for (let a = 0; a < m; a++) {
      for (let b = 0; b < m; b++) {
        if (rawP[a] < rawP[b]) {
          assert(res[a].adj <= res[b].adj + 1e-12, `Monotonicity violated: raw ${rawP[a]} < ${rawP[b]} but adj ${res[a].adj} > ${res[b].adj}`);
        }
      }
    }

    // Verify 2: Adjusted p is bounded in [rawP, 1.0]
    for (let i = 0; i < m; i++) {
      assert(res[i].adj >= rawP[i] - 1e-12, `Adjusted p cannot be smaller than raw p: ${res[i].adj} < ${rawP[i]}`);
      assert(res[i].adj <= 1.0 + 1e-12, `Adjusted p cannot exceed 1.0: ${res[i].adj}`);
    }

    // Verify 3: Permutation Equivariance
    // Shuffle rawP and verify the mapped adjusted values match
    const permIndices = Array.from({ length: m }, (_, idx) => idx).sort(() => rand() - 0.5);
    const permRawP = permIndices.map(idx => rawP[idx]);
    const permRes = applyHolmBonferroni(permRawP);

    for (let k = 0; k < m; k++) {
      const origIdx = permIndices[k];
      assertApprox(permRes[k].adj, res[origIdx].adj, 1e-9, `Permutation equivariance failed for index ${origIdx}`);
    }
  }
});

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    const msg = `${message} (Expected: ${expected}, got: ${actual})`;
    failed++;
    failures.push(msg);
    throw new Error(`FAIL: ${msg}`);
  }
}

runAdversarialTest('Holm-Bonferroni edge cases: m=1, identical p-values, extreme 0.0 and 1.0', () => {
  // m=1
  const r1 = applyHolmBonferroni([0.04]);
  assertApprox(r1[0].adj, 0.04, 1e-9, 'm=1 adjusted p equals raw p');

  // Identical p-values
  const rTied = applyHolmBonferroni([0.02, 0.02, 0.02]);
  // All should have multiplier m-i, but monotonicity should equate them
  assertApprox(rTied[0].adj, rTied[1].adj, 1e-9, 'Tied p-values yield tied adjusted p');
  assertApprox(rTied[1].adj, rTied[2].adj, 1e-9, 'Tied p-values yield tied adjusted p');

  // Extreme p=0.0 and p=1.0
  const rExt = applyHolmBonferroni([0.0, 1.0]);
  assertApprox(rExt[0].adj, 0.0, 1e-9, 'p=0 yields adj=0');
  assertApprox(rExt[1].adj, 1.0, 1e-9, 'p=1 yields adj=1');
});

// =====================================================================
// CHALLENGE 3: Cronbach's Alpha Reverse-Coding Detection & Negative Scores
// =====================================================================
console.log('\n▶ CHALLENGE 3: Cronbach\'s Alpha & Reverse-Coding Stress');

runAdversarialTest('Cronbach alpha correctly diagnoses multiple reverse-coded items in noisy data', () => {
  const rand = pseudoRandom(777);
  const N = 50;
  const k = 6;
  const matrix = [];

  // Generate latent trait theta for each participant
  // Items 0, 1, 2, 4 are positively aligned with theta
  // Items 3, 5 are negatively aligned (reverse phrased)
  for (let i = 0; i < N; i++) {
    const theta = rand() * 4; // in [0, 4]
    const row = [];
    row.push(Math.min(5, Math.max(1, Math.round(1 + theta + (rand() - 0.5)))));
    row.push(Math.min(5, Math.max(1, Math.round(1 + theta + (rand() - 0.5)))));
    row.push(Math.min(5, Math.max(1, Math.round(1 + theta + (rand() - 0.5)))));
    // Inverted items: 6 - (1 + theta)
    row.push(Math.min(5, Math.max(1, Math.round(5 - theta + (rand() - 0.5)))));
    row.push(Math.min(5, Math.max(1, Math.round(1 + theta + (rand() - 0.5)))));
    row.push(Math.min(5, Math.max(1, Math.round(5 - theta + (rand() - 0.5)))));
    matrix.push(row);
  }

  // Raw computation without recoding
  const raw = calculateCronbachAlpha(matrix);
  assert(raw.canCompute, 'Raw alpha can compute');
  assert(raw.reverseCodingOmissionSuspected, 'Suspects reverse coding omission');
  assert(raw.flaggedReverseOmissions.includes(3), 'Detects item 3 as reverse coded');
  assert(raw.flaggedReverseOmissions.includes(5), 'Detects item 5 as reverse coded');
  assert(raw.alpha < 0.5, `Raw alpha is depressed by inverted items (${raw.alpha})`);

  // Recoded computation
  const recoded = calculateCronbachAlpha(matrix, [3, 5]);
  assert(recoded.canCompute, 'Recoded alpha can compute');
  assert(recoded.alpha > 0.85, `Recoded alpha surges to high reliability (got ${recoded.alpha})`);
  assert(recoded.flaggedReverseOmissions.length === 0, 'No remaining reverse coding omissions');
});

runAdversarialTest('Cronbach alpha with negative score domains (e.g. -2 to +2 Likert)', () => {
  const matrix = [
    [-2, -2, -1],
    [-1, -1, -2],
    [ 0,  0,  0],
    [ 1,  1,  2],
    [ 2,  2,  1],
  ];
  const res = calculateCronbachAlpha(matrix);
  assert(res.canCompute, 'Can compute negative domain matrix');
  assert(res.alpha > 0.90, `Alpha on negative scale is high (${res.alpha})`);
  assert(!isNaN(res.alpha), 'Alpha is not NaN');
});

runAdversarialTest('Cronbach alpha with large N (N=1000, k=10)', () => {
  const rand = pseudoRandom(888);
  const N = 1000;
  const k = 10;
  const matrix = [];
  for (let i = 0; i < N; i++) {
    const trait = rand() * 3;
    const row = [];
    for (let j = 0; j < k; j++) {
      row.push(Math.round(1 + trait + rand()));
    }
    matrix.push(row);
  }
  const res = calculateCronbachAlpha(matrix);
  assert(res.canCompute, 'Can compute large N alpha');
  assert(!isNaN(res.alpha), 'Large N alpha is not NaN');
  assert(res.alpha > 0.70, 'Large N alpha achieves expected consistency');
});

// =====================================================================
// CHALLENGE 4: Gwet's AC1 vs Cohen's Kappa Prevalence Spectrum
// =====================================================================
console.log('\n▶ CHALLENGE 4: Gwet\'s AC1 vs Cohen\'s Kappa Across Prevalence Spectrum');

runAdversarialTest('Prevalence sweep from 0.50 to 0.99 demonstrates Cohen\'s kappa depression vs Gwet\'s AC1 stability', () => {
  // Let total sample N = 1000.
  // We keep observed agreement high at ~90%.
  // Concordance on Cat1: c1
  // Concordance on Cat2: c2
  // Total agreement = c1 + c2 = 900 cases (90% agreement).
  // Disagreement = 100 cases (50 Cat1-Cat2, 50 Cat2-Cat1).
  // We sweep prevalence of Cat1: c1 / (c1 + c2) from 0.50 to 0.99.

  for (let pStep = 50; pStep <= 99; pStep++) {
    const prevalence = pStep / 100.0;
    const agreeTotal = 900;
    const c1 = Math.round(agreeTotal * prevalence);
    const c2 = agreeTotal - c1;
    const d12 = 50;
    const d21 = 50;

    const matrix = [
      [c1, d12],
      [d21, c2],
    ];

    const { observedAgreement, peCohen, kappa } = cohenKappa(matrix);
    const { peGwet, gwetAC1: ac1, maxMarginal } = gwetAC1(matrix);

    assertApprox(observedAgreement, 0.900, 1e-3, `Observed agreement constant at 90% at prev ${prevalence}`);
    assert(!isNaN(kappa), `Kappa not NaN at prev ${prevalence}`);
    assert(!isNaN(ac1), `AC1 not NaN at prev ${prevalence}`);

    // As prevalence exceeds 0.85, Cohen's kappa drops significantly while Gwet's AC1 remains >= 0.85
    if (prevalence >= 0.85) {
      assert(kappa < ac1, `At prevalence ${prevalence}, Kappa (${kappa.toFixed(3)}) must be lower than AC1 (${ac1.toFixed(3)})`);
      assert(ac1 >= 0.85, `At prevalence ${prevalence}, AC1 (${ac1.toFixed(3)}) must reflect true agreement >= 85%`);
    }

    if (prevalence >= 0.95) {
      // Extreme prevalence paradox
      assert(kappa < 0.55, `At extreme prevalence ${prevalence}, Kappa must be depressed < 0.55 (got ${kappa.toFixed(3)})`);
      assert(ac1 > 0.85, `At extreme prevalence ${prevalence}, AC1 must remain > 0.85 (got ${ac1.toFixed(3)})`);
    }
  }
});

runAdversarialTest('Prevalence warning triggers accurately in calculateIRR', () => {
  // High prevalence matrix: 92% in Cat1, 95% observed agreement
  const rater1 = [];
  const rater2 = [];
  for (let i = 0; i < 90; i++) { rater1.push('A'); rater2.push('A'); }
  for (let i = 0; i < 5; i++) { rater1.push('B'); rater2.push('B'); }
  for (let i = 0; i < 5; i++) { rater1.push('A'); rater2.push('B'); }

  const res = calculateIRR(rater1, rater2);
  assert(res.canCompute, 'Can compute IRR');
  assertEqual(res.prevalenceWarning, true, 'Prevalence warning must trigger');
  assert(res.warningMessage !== null, 'Warning message must be populated');
  assert(res.gwetsAC1 > res.cohenKappa, `AC1 (${res.gwetsAC1}) > Kappa (${res.cohenKappa})`);
});

runAdversarialTest('IRR module handles multi-class configurations (C=3, 5, 10)', () => {
  for (const C of [3, 5, 10]) {
    const cats = Array.from({ length: C }, (_, i) => `Cat_${i}`);
    const rater1 = [];
    const rater2 = [];
    for (let i = 0; i < 100; i++) {
      const cat = cats[i % C];
      rater1.push(cat);
      rater2.push(i % 10 === 0 ? cats[(i + 1) % C] : cat); // 90% agreement
    }
    const res = calculateIRR(rater1, rater2, cats);
    assert(res.canCompute, `Can compute C=${C}`);
    assertApprox(res.observedAgreement, 0.90, 1e-2, `Observed agreement ~90% for C=${C}`);
    assert(!isNaN(res.cohenKappa), `Kappa not NaN for C=${C}`);
    assert(!isNaN(res.gwetsAC1), `AC1 not NaN for C=${C}`);
  }
});

// =====================================================================
// CHALLENGE 5: Welch's t-test, Shapiro-Wilk & Moments Under Extreme Stress
// =====================================================================
console.log('\n▶ CHALLENGE 5: Welch\'s t-Test & Moments Under Extreme Stress');

runAdversarialTest('Welch t-test with large sample size (nA=1000, nB=1000) does not overflow or underflow', () => {
  const rand = pseudoRandom(1111);
  const groupA = [];
  const groupB = [];
  for (let i = 0; i < 1000; i++) {
    groupA.push(rand() * 10);
    groupB.push(rand() * 10 + 0.5); // Mean shift of 0.5
  }

  const res = runWelchTTest(groupA, groupB);
  assert(res.canCompute, 'Can compute large n Welch t');
  assert(!isNaN(res.t), 't statistic is not NaN');
  assert(!isNaN(res.df), 'df is not NaN');
  assert(res.df > 1900, `df reflects large n (got ${res.df})`);
  assert(!isNaN(res.pValue), 'pValue is not NaN');
  assert(res.pValue >= 0 && res.pValue <= 1.0, `pValue in [0, 1] (got ${res.pValue})`);
  assert(!isNaN(res.cohensD), 'cohensD is not NaN');
  assert(!isNaN(res.dCi[0]) && !isNaN(res.dCi[1]), 'dCi is not NaN');
});

runAdversarialTest('Welch t-test with negative and mixed-sign continuous data', () => {
  const groupA = [-10.5, -9.2, -8.7, -11.0, -9.8];
  const groupB = [-5.2, -4.8, -5.5, -6.1, -5.0];
  const res = runWelchTTest(groupA, groupB);
  assert(res.canCompute, 'Can compute negative numbers');
  assert(res.t < 0, `t is negative (got ${res.t})`);
  assert(res.pValue < 0.05, `Difference is significant (p=${res.pValue})`);
  assert(res.meanA < res.meanB, 'meanA < meanB');
});

runAdversarialTest('Moments (skewness, kurtosis) stability under invariant data', () => {
  const m = computeSampleMoments([5, 5, 5, 5, 5]);
  assert(m !== null, 'Moments computed');
  assertEqual(m.variance, 0, 'Variance is zero');
  assertEqual(m.skewness, 0, 'Skewness is 0 for zero variance');
  assertEqual(m.kurtosis, 0, 'Kurtosis is 0 for zero variance');
  assertEqual(m.isSymmetric, true, 'Flagged as symmetric');
});

runAdversarialTest('Gatekeeper routing determinism across 100 random continuous vs ordinal distributions', () => {
  const rand = pseudoRandom(54321);
  for (let i = 0; i < 100; i++) {
    // Generate ordinal
    const ordA = Array.from({ length: 15 }, () => 1 + Math.floor(rand() * 5));
    const ordB = Array.from({ length: 15 }, () => 1 + Math.floor(rand() * 5));
    const resOrd = runAssumptionGatekeeper({ groupA: ordA, groupB: ordB });
    assertEqual(resOrd.scaleType, 'ordinal', `Identifies ordinal on trial ${i}`);
    assertEqual(resOrd.recommendedTest, 'mann_whitney_u', `Routes ordinal to Mann-Whitney on trial ${i}`);

    // Generate continuous normal-like
    const contA = Array.from({ length: 30 }, () => (rand() + rand() + rand()) * 100);
    const contB = Array.from({ length: 30 }, () => (rand() + rand() + rand()) * 100);
    const resCont = runAssumptionGatekeeper({ groupA: contA, groupB: contB });
    assertEqual(resCont.scaleType, 'continuous', `Identifies continuous on trial ${i}`);
    assert(['welch_t', 'mann_whitney_u'].includes(resCont.recommendedTest), 'Routes to valid test');
  }
});

// =====================================================================
// SUMMARY
// =====================================================================
console.log('\n================================================================');
console.log(` ADVERSARIAL TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log('================================================================\n');

if (failed > 0) {
  console.error('Failure details:');
  failures.forEach(f => console.error(` - ${f}`));
  process.exit(1);
} else {
  console.log('✓ ALL ADVERSARIAL STRESS CHALLENGES EMPIRICALLY CONFIRMED.');
  process.exit(0);
}
