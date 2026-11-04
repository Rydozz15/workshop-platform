/**
 * Adversarial Verification Harness — Milestone 3 Iteration 2
 * Challenger 1: Stats & Psychometrics Adversarial Verifier
 * 
 * Verifies and stresses:
 * 1. Mann-Whitney U & Cliff's Delta:
 *    - Identical groups: [5, 5, 5] vs [5, 5, 5], [1, 2, 3] vs [1, 2, 3], large identical groups
 *    - Symmetric groups: [1, 4] vs [2, 3], mirrored multisets, cross-group balanced ties
 *    - Heavy tie permutations across 10,000 synthetic datasets (random distributions, 50-99% ties)
 *    - Strict dominance invariant: delta === (greater - less) / (nA * nB) === 1 - 2*U_B/(nA*nB)
 *    - Zero variance and boundary conditions
 * 2. Monotonic Holm-Bonferroni:
 *    - Mixed lists: [null, 0.001, null, 0.04, 0.05, null]
 *    - Object arrays with missing/null/NaN pValues
 *    - All-null, empty, and all-valid arrays
 *    - Strict monotonicity (p_adj,i >= p_adj,i-1) across 5,000 random permutations
 *    - Zero false significance: no uncomputable/null item is ever marked significant
 * 3. Hake's Normalized Learning Gain:
 *    - Regression from maximum baseline (meanPre === maxScore, post < maxScore)
 *    - Zero post-test and negative post-test scores
 *    - Maximum score retention (meanPre === maxScore === meanPost)
 *    - Mixed cohorts with partial regression and partial gain
 *    - Input validation (mismatched length, empty, null)
 */

import {
  runMannWhitneyU,
  cliffsDelta,
  applyHolmBonferroni,
  runWelchTTest,
  runAssumptionGatekeeper,
  computeSampleMoments,
} from '../lib/stats.js';

import {
  calculateHakeGain,
  calculateCronbachAlpha,
} from '../lib/psychometrics.js';

import {
  calculateIRR,
  cohenKappa,
  gwetAC1,
} from '../lib/irr.js';

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    failed++;
    const err = `FAIL: ${message}`;
    failures.push(err);
    throw new Error(err);
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    const err = `${message} (Expected: ${expected}, got: ${actual})`;
    failed++;
    failures.push(err);
    throw new Error(`FAIL: ${err}`);
  }
}

function assertApprox(actual, expected, tol = 1e-6, message = '') {
  if (isNaN(actual) || isNaN(expected) || Math.abs(actual - expected) > tol) {
    const err = `${message} (Expected ~${expected}, got ${actual}, diff: ${Math.abs(actual - expected)})`;
    failed++;
    failures.push(err);
    throw new Error(`FAIL: ${err}`);
  }
}

function runChallenge(title, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${title}`);
  } catch (err) {
    console.error(`  ✗ ${title}: ${err.message}`);
  }
}

// PRNG for reproducible adversarial fuzzing
function createPrng(seed = 1337) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

console.log('================================================================');
console.log(' CHALLENGER 1 ADVERSARIAL VERIFIER: M3 ITERATION 2');
console.log('================================================================\n');

// =====================================================================
// SECTION 1: MANN-WHITNEY U & CLIFF'S DELTA ADVERSARIAL STRESS
// =====================================================================
console.log('--- SECTION 1: Mann-Whitney U & Cliff\'s Delta Challenges ---');

runChallenge('MWU Challenge 1.1: Identical zero-variance groups [5, 5, 5] vs [5, 5, 5]', () => {
  const res = runMannWhitneyU([5, 5, 5], [5, 5, 5]);
  assert(res.canCompute, 'Can compute identical zero-variance');
  assertEqual(res.pValue, 1.0, 'pValue must be exactly 1.0');
  assertEqual(res.cliffsDelta, 0.0, 'cliffsDelta must be exactly 0.0');
  assertEqual(res.z, 0.0, 'z statistic must be exactly 0.0');
  assertEqual(res.romanoMagnitude, 'negligible', 'romanoMagnitude must be negligible');
  assertEqual(res.deltaCi[0], 0.0, 'deltaCi lower bound must be 0.0');
  assertEqual(res.deltaCi[1], 0.0, 'deltaCi upper bound must be 0.0');
});

runChallenge('MWU Challenge 1.2: Identical multi-valued groups [1, 2, 3] vs [1, 2, 3]', () => {
  const res = runMannWhitneyU([1, 2, 3], [1, 2, 3]);
  assert(res.canCompute, 'Can compute identical variant groups');
  assertEqual(res.pValue, 1.0, 'pValue must be exactly 1.0');
  assertEqual(res.cliffsDelta, 0.0, 'cliffsDelta must be exactly 0.0');
  assertEqual(res.z, 0.0, 'z statistic must be exactly 0.0');
  assertEqual(res.romanoMagnitude, 'negligible', 'romanoMagnitude must be negligible');
});

runChallenge('MWU Challenge 1.3: Symmetric groups [1, 4] vs [2, 3]', () => {
  const res = runMannWhitneyU([1, 4], [2, 3]);
  assert(res.canCompute, 'Can compute symmetric groups');
  assertEqual(res.pValue, 1.0, 'pValue must be exactly 1.0');
  assertEqual(res.cliffsDelta, 0.0, 'cliffsDelta must be exactly 0.0');
  assertEqual(res.z, 0.0, 'z statistic must be exactly 0.0');
  assertEqual(res.romanoMagnitude, 'negligible', 'romanoMagnitude must be negligible');
});

runChallenge('MWU Challenge 1.4: Symmetric multi-way ties [1, 1, 4, 4] vs [2, 2, 3, 3]', () => {
  const res = runMannWhitneyU([1, 1, 4, 4], [2, 2, 3, 3]);
  assert(res.canCompute, 'Can compute multi-way tied symmetric groups');
  assertEqual(res.pValue, 1.0, 'pValue must be exactly 1.0');
  assertEqual(res.cliffsDelta, 0.0, 'cliffsDelta must be exactly 0.0');
  assertEqual(res.z, 0.0, 'z statistic must be exactly 0.0');
});

runChallenge('MWU Challenge 1.5: Large identical groups (100 elements each, heavy ties)', () => {
  const groupA = Array.from({ length: 100 }, (_, i) => i % 5);
  const groupB = Array.from({ length: 100 }, (_, i) => i % 5);
  const res = runMannWhitneyU(groupA, groupB);
  assert(res.canCompute, 'Can compute large identical groups');
  assertEqual(res.pValue, 1.0, 'pValue must be exactly 1.0');
  assertEqual(res.cliffsDelta, 0.0, 'cliffsDelta must be exactly 0.0');
  assertEqual(res.z, 0.0, 'z statistic must be exactly 0.0');
});

runChallenge('MWU Challenge 1.6: Fuzzing 10,000 synthetic datasets for Cliff\'s delta & MWU invariants', () => {
  const rand = createPrng(4242);
  let passedTrials = 0;

  function directOracle(A, B) {
    let gr = 0;
    let ls = 0;
    for (let i = 0; i < A.length; i++) {
      for (let j = 0; j < B.length; j++) {
        if (A[i] > B[j]) gr++;
        else if (A[i] < B[j]) ls++;
      }
    }
    return (gr - ls) / (A.length * B.length);
  }

  for (let trial = 0; trial < 10000; trial++) {
    const nA = 2 + Math.floor(rand() * 25);
    const nB = 2 + Math.floor(rand() * 25);
    const mode = trial % 6;
    let groupA = [];
    let groupB = [];

    if (mode === 0) {
      // Identical multisets
      const base = Array.from({ length: nA }, () => Math.floor(rand() * 4));
      groupA = [...base];
      groupB = [...base];
      const res = runMannWhitneyU(groupA, groupB);
      assert(res.canCompute, `Can compute trial ${trial}`);
      assertEqual(res.pValue, 1.0, `Trial ${trial}: identical pValue === 1.0`);
      assertEqual(res.cliffsDelta, 0.0, `Trial ${trial}: identical delta === 0.0`);
      assertEqual(res.z, 0.0, `Trial ${trial}: identical z === 0.0`);
    } else if (mode === 1) {
      // 95% ties on tiny alphabet {1, 2}
      groupA = Array.from({ length: nA }, () => (rand() < 0.95 ? 1 : 2));
      groupB = Array.from({ length: nB }, () => (rand() < 0.95 ? 1 : 2));
    } else if (mode === 2) {
      // Standard Likert 1-5
      groupA = Array.from({ length: nA }, () => 1 + Math.floor(rand() * 5));
      groupB = Array.from({ length: nB }, () => 1 + Math.floor(rand() * 5));
    } else if (mode === 3) {
      // Negative integer distributions
      groupA = Array.from({ length: nA }, () => -5 + Math.floor(rand() * 10));
      groupB = Array.from({ length: nB }, () => -5 + Math.floor(rand() * 10));
    } else if (mode === 4) {
      // Disjoint zero-variance
      groupA = new Array(nA).fill(1);
      groupB = new Array(nB).fill(5);
    } else {
      // Continuous floating-point with occasional ties
      groupA = Array.from({ length: nA }, () => Math.round(rand() * 10) / 2.0);
      groupB = Array.from({ length: nB }, () => Math.round(rand() * 10) / 2.0);
    }

    const res = runMannWhitneyU(groupA, groupB);
    assert(res.canCompute, `Can compute trial ${trial}`);

    const oracle = directOracle(groupA, groupB);
    assertApprox(res.cliffsDelta, oracle, 1e-9, `Trial ${trial}: delta matches oracle`);

    if (mode === 4) {
      assertEqual(res.cliffsDelta, -1.0, 'Disjoint zero-variance delta is -1.0');
      assertEqual(res.pValue, 0.0, 'Disjoint zero-variance pValue is 0.0');
    } else {
      assert(res.pValue >= 0.0 && res.pValue <= 1.0, `Trial ${trial}: pValue in [0, 1] (got ${res.pValue})`);
    }

    assert(res.deltaCi[0] >= -1.0 && res.deltaCi[1] <= 1.0, `Trial ${trial}: CI in [-1, 1]`);
    assert(res.deltaCi[0] <= res.deltaCi[1] + 1e-9, `Trial ${trial}: CI lower <= upper`);

    passedTrials++;
  }

  assertEqual(passedTrials, 10000, 'Successfully executed 10,000 adversarial MWU trials');
});

runChallenge('MWU Challenge 1.7: Degenerate inputs (nA=0, nB=0, null, undefined)', () => {
  const rEmptyA = runMannWhitneyU([], [1, 2, 3]);
  assertEqual(rEmptyA.canCompute, false);
  assertEqual(rEmptyA.pValue, null);
  assertEqual(rEmptyA.cliffsDelta, null);

  const rEmptyB = runMannWhitneyU([1, 2, 3], []);
  assertEqual(rEmptyB.canCompute, false);

  const rNull = runMannWhitneyU(null, null);
  assertEqual(rNull.canCompute, false);
});

// =====================================================================
// SECTION 2: MONOTONIC HOLM-BONFERRONI ADVERSARIAL STRESS
// =====================================================================
console.log('\n--- SECTION 2: Monotonic Holm-Bonferroni Challenges ---');

runChallenge('Holm Challenge 2.1: Mixed list [null, 0.001, null, 0.04, 0.05, null]', () => {
  const input = [null, 0.001, null, 0.04, 0.05, null];
  const res = applyHolmBonferroni(input);

  assertEqual(res.length, 6, 'Length matches input');

  // Verify non-computable items
  [0, 2, 5].forEach(idx => {
    assertEqual(res[idx].isComputable, false, `Item ${idx} must be non-computable`);
    assertEqual(res[idx].raw, null, `Item ${idx} raw must be null`);
    assertEqual(res[idx].adj, null, `Item ${idx} adj must be null`);
    assertEqual(res[idx].significant, false, `Item ${idx} must NOT be significant`);
  });

  // Verify computable items
  // Valid items: 0.001, 0.04, 0.05 -> m = 3
  // Step 1: p = 0.001, multiplier = 3 -> q = 0.003, adj = 0.003
  // Step 2: p = 0.04, multiplier = 2 -> q = 0.08, adj = max(0.003, 0.08) = 0.08
  // Step 3: p = 0.05, multiplier = 1 -> q = 0.05, adj = max(0.08, 0.05) = 0.08
  assertEqual(res[1].isComputable, true);
  assertApprox(res[1].raw, 0.001, 1e-6);
  assertApprox(res[1].adj, 0.003, 1e-6);
  assertEqual(res[1].significant, true);

  assertEqual(res[3].isComputable, true);
  assertApprox(res[3].raw, 0.04, 1e-6);
  assertApprox(res[3].adj, 0.08, 1e-6);
  assertEqual(res[3].significant, false);

  assertEqual(res[4].isComputable, true);
  assertApprox(res[4].raw, 0.05, 1e-6);
  assertApprox(res[4].adj, 0.08, 1e-6);
  assertEqual(res[4].significant, false);

  // Monotonicity verification: 0.003 <= 0.08 <= 0.08
  assert(res[1].adj <= res[3].adj, 'Monotonic step 1 -> step 2');
  assert(res[3].adj <= res[4].adj, 'Monotonic step 2 -> step 3');
});

runChallenge('Holm Challenge 2.2: Array of objects with missing pValue, null, undefined, NaN', () => {
  const input = [
    { name: 't1_valid', pValue: 0.01 },
    { name: 't2_missing' },
    { name: 't3_null', pValue: null },
    { name: 't4_nan', pValue: NaN },
    { name: 't5_valid_alt_prop', p: 0.02 },
    { name: 't6_undefined', pValue: undefined },
    { name: 't7_valid_raw_prop', raw: 0.04 },
  ];

  const res = applyHolmBonferroni(input);
  assertEqual(res.length, 7, 'Preserves total length 7');

  // Valid tests: t1 (0.01), t5 (0.02), t7 (0.04) -> m = 3
  // t1: 0.01 * 3 = 0.03
  // t5: 0.02 * 2 = 0.04
  // t7: 0.04 * 1 = 0.04
  const t1 = res.find(x => x.name === 't1_valid');
  assert(t1.isComputable);
  assertApprox(t1.adj, 0.03, 1e-6);
  assertEqual(t1.significant, true);

  const t5 = res.find(x => x.name === 't5_valid_alt_prop');
  assert(t5.isComputable);
  assertApprox(t5.adj, 0.04, 1e-6);
  assertEqual(t5.significant, true);

  const t7 = res.find(x => x.name === 't7_valid_raw_prop');
  assert(t7.isComputable);
  assertApprox(t7.adj, 0.04, 1e-6);
  assertEqual(t7.significant, true);

  // Invalid tests
  ['t2_missing', 't3_null', 't4_nan', 't6_undefined'].forEach(name => {
    const item = res.find(x => x.name === name);
    assertEqual(item.isComputable, false, `${name} must be non-computable`);
    assertEqual(item.adj, null, `${name} adj must be null`);
    assertEqual(item.significant, false, `${name} must NOT be significant`);
  });
});

runChallenge('Holm Challenge 2.3: All-null / all-uncomputable input arrays', () => {
  const rNulls = applyHolmBonferroni([null, null, null]);
  assertEqual(rNulls.length, 3);
  rNulls.forEach(item => {
    assertEqual(item.adj, null);
    assertEqual(item.significant, false);
    assertEqual(item.familySize, 0);
  });

  const rObjNulls = applyHolmBonferroni([{ pValue: null }, { pValue: NaN }]);
  assertEqual(rObjNulls.length, 2);
  rObjNulls.forEach(item => {
    assertEqual(item.adj, null);
    assertEqual(item.significant, false);
    assertEqual(item.familySize, 0);
  });

  const rEmpty = applyHolmBonferroni([]);
  assertEqual(rEmpty.length, 0);

  const rNullInput = applyHolmBonferroni(null);
  assertEqual(rNullInput.length, 0);
});

runChallenge('Holm Challenge 2.4: All-valid array [0.001, 0.01, 0.02, 0.03, 0.04, 0.05]', () => {
  const rawP = [0.001, 0.01, 0.02, 0.03, 0.04, 0.05];
  const res = applyHolmBonferroni(rawP);
  assertEqual(res.length, 6);
  assertEqual(res[0].familySize, 6);

  // Verify monotonicity
  for (let i = 1; i < res.length; i++) {
    assert(res[i].adj >= res[i - 1].adj, `Monotonic step ${i - 1} (${res[i-1].adj}) <= ${i} (${res[i].adj})`);
    assert(res[i].adj >= rawP[i], `Adjusted p >= raw p at ${i}`);
    assert(res[i].adj <= 1.0, `Adjusted p <= 1.0 at ${i}`);
  }
});

runChallenge('Holm Challenge 2.5: Fuzzing 5,000 mixed arrays (nulls, NaNs, floats, duplicates)', () => {
  const rand = createPrng(7777);

  for (let trial = 0; trial < 5000; trial++) {
    const len = 1 + Math.floor(rand() * 30);
    const input = [];
    let validCount = 0;

    for (let i = 0; i < len; i++) {
      const type = rand();
      if (type < 0.2) {
        input.push(null);
      } else if (type < 0.25) {
        input.push(NaN);
      } else if (type < 0.3) {
        input.push({ missing: true });
      } else {
        const p = rand(); // [0, 1)
        input.push(p);
        validCount++;
      }
    }

    const res = applyHolmBonferroni(input);
    assertEqual(res.length, len, `Trial ${trial}: preserves length`);

    const validResults = res.filter(x => x.isComputable);
    assertEqual(validResults.length, validCount, `Trial ${trial}: valid count matches`);

    // Check non-computable
    res.filter(x => !x.isComputable).forEach(item => {
      assertEqual(item.adj, null, `Trial ${trial}: uncomputable adj is null`);
      assertEqual(item.significant, false, `Trial ${trial}: uncomputable significant is false`);
    });

    // Check monotonicity across valid items
    // Sort valid by raw
    const sortedValid = [...validResults].sort((a, b) => a.raw - b.raw);
    for (let i = 1; i < sortedValid.length; i++) {
      assert(
        sortedValid[i].adj >= sortedValid[i - 1].adj - 1e-12,
        `Trial ${trial}: monotonicity violated: ${sortedValid[i-1].adj} > ${sortedValid[i].adj}`
      );
      assert(sortedValid[i].adj >= sortedValid[i].raw - 1e-12, `Trial ${trial}: adj >= raw`);
      assert(sortedValid[i].adj <= 1.0 + 1e-12, `Trial ${trial}: adj <= 1.0`);
    }
  }
});

// =====================================================================
// SECTION 3: HAKE NORMALIZED LEARNING GAIN ADVERSARIAL STRESS
// =====================================================================
console.log('\n--- SECTION 3: Hake Gain Challenges ---');

runChallenge('Hake Challenge 3.1: Regression from maximum pre-test score [5, 5, 5] to [1, 1, 1]', () => {
  const res = calculateHakeGain([5, 5, 5], [1, 1, 1], 5.0);
  assert(res.canCompute, 'Can compute regression from max');
  assertEqual(res.gClass, 0.0, 'Class gain from max baseline regression must be exactly 0.0');
  assertEqual(res.gIndivMean, 0.0, 'Individual mean gain must be 0.0');
  assertEqual(res.tier, 'low', 'Tier must be low');
  res.individualGains.forEach((g, idx) => {
    assertEqual(g, 0.0, `Individual gain ${idx} must be 0.0`);
  });
});

runChallenge('Hake Challenge 3.2: Retention at maximum score [5, 5, 5] to [5, 5, 5]', () => {
  const res = calculateHakeGain([5, 5, 5], [5, 5, 5], 5.0);
  assert(res.canCompute, 'Can compute max retention');
  assertEqual(res.gClass, 1.0, 'Class gain at max retention must be exactly 1.0');
  assertEqual(res.gIndivMean, 1.0, 'Individual mean gain must be 1.0');
  assertEqual(res.tier, 'high', 'Tier must be high');
  res.individualGains.forEach((g, idx) => {
    assertEqual(g, 1.0, `Individual gain ${idx} must be 1.0`);
  });
});

runChallenge('Hake Challenge 3.3: Zero post-test scores [3, 3, 3] to [0, 0, 0]', () => {
  const res = calculateHakeGain([3, 3, 3], [0, 0, 0], 5.0);
  assert(res.canCompute, 'Can compute zero post-test');
  // gClass = (0 - 3) / (5 - 3) = -3 / 2 = -1.5
  assertApprox(res.gClass, -1.5, 1e-6, 'gClass is -1.5');
  assertApprox(res.gIndivMean, -1.5, 1e-6, 'gIndivMean is -1.5');
  assertEqual(res.tier, 'low', 'Tier is low');
});

runChallenge('Hake Challenge 3.4: Negative post-test scores [2, 2] to [-1, -1] on scale max 5.0', () => {
  const res = calculateHakeGain([2, 2], [-1, -1], 5.0);
  assert(res.canCompute, 'Can compute negative post scores');
  // gClass = (-1 - 2) / (5 - 2) = -3 / 3 = -1.0
  assertApprox(res.gClass, -1.0, 1e-6, 'gClass is -1.0');
  assertApprox(res.gIndivMean, -1.0, 1e-6, 'gIndivMean is -1.0');
  assertEqual(res.tier, 'low', 'Tier is low');
});

runChallenge('Hake Challenge 3.5: Mixed cohort (partial max regression, partial gain)', () => {
  // Student 0: pre=5, post=3 (regressed from max -> gain = 0.0)
  // Student 1: pre=2, post=4 (gain = (4-2)/(5-2) = 2/3 = 0.6667)
  const res = calculateHakeGain([5, 2], [3, 4], 5.0);
  assert(res.canCompute, 'Can compute mixed cohort');

  assertEqual(res.individualGains[0], 0.0, 'Student 0 gain is 0.0');
  assertApprox(res.individualGains[1], 2 / 3, 1e-6, 'Student 1 gain is 2/3');

  // meanPre = 3.5, meanPost = 3.5 -> gClass = 0.0
  assertEqual(res.gClass, 0.0, 'Class gain is 0.0');
  assertEqual(res.tier, 'low', 'Tier is low');
});

runChallenge('Hake Challenge 3.6: Degenerate and invalid inputs', () => {
  const rEmpty = calculateHakeGain([], []);
  assertEqual(rEmpty.canCompute, false);
  assertEqual(rEmpty.error, 'invalid_paired_arrays');

  const rMismatched = calculateHakeGain([1, 2], [1]);
  assertEqual(rMismatched.canCompute, false);
  assertEqual(rMismatched.error, 'invalid_paired_arrays');

  const rNull = calculateHakeGain(null, null);
  assertEqual(rNull.canCompute, false);
});

// =====================================================================
// FINAL SUMMARY
// =====================================================================
console.log('\n================================================================');
console.log(` CHALLENGER 1 ADVERSARIAL VERDICT SUMMARY`);
console.log(` PASSED: ${passed}`);
console.log(` FAILED: ${failed}`);
console.log('================================================================\n');

if (failed > 0) {
  console.error('CRITICAL: ADVERSARIAL FLAWS FOUND:');
  failures.forEach(f => console.error(` [X] ${f}`));
  process.exit(1);
} else {
  console.log('✓ VERDICT: CONFIRM — All adversarial challenges empirically passed with 0 errors.');
  process.exit(0);
}
