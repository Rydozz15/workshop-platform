/**
 * Golden-value tests for 3+ condition comparisons (reference values from SciPy / an independent
 * Welch ANOVA implementation). Run with: node test/stats-multigroup.test.js
 */
import assert from 'node:assert/strict';
import {
  runKruskalWallis,
  runWelchAnova,
  pairwiseComparisons,
  runMultiGroupComparison,
  chiSquareSurvival,
  fSurvival,
} from '../lib/stats-multigroup.js';

let passed = 0;
const check = (name, fn) => {
  fn();
  passed++;
  console.log(`  [PASS] ${name}`);
};
const close = (actual, expected, tol, label) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: expected ${expected}, got ${actual}`);

check('chi-square and F survival match SciPy', () => {
  close(chiSquareSurvival(7.5, 3), 0.0575584519726364, 1e-7, 'chi2');
  close(fSurvival(3.2, 2, 12), 0.07694502378406354, 1e-7, 'F');
});

check('Kruskal-Wallis matches the Hollander & Wolfe example (with ties-free data)', () => {
  const r = runKruskalWallis([[2.9, 3.0, 2.5, 2.6, 3.2], [3.8, 2.7, 4.0, 2.4], [2.8, 3.4, 3.7, 2.2, 2.0]]);
  close(r.H, 0.7714285714285722, 1e-9, 'H');
  close(r.pValue, 0.6799647735788936, 1e-7, 'p');
  assert.equal(r.df, 2);
});

const A = [24, 26, 31, 27, 29];
const B = [30, 35, 28, 36, 33, 40];
const C = [41, 38, 44, 39, 47, 35, 50];

check('Kruskal-Wallis on separated groups, with effect size', () => {
  const r = runKruskalWallis([A, B, C]);
  close(r.H, 12.032342089728449, 1e-9, 'H');
  close(r.pValue, 0.0024389905242207985, 1e-7, 'p');
  close(r.epsilonSquared, 0.7077848288075558, 1e-9, 'epsilon2');
  assert.equal(r.magnitude, 'large');
});

check('Kruskal-Wallis handles ties', () => {
  const r = runKruskalWallis([[1, 2, 2, 3], [2, 3, 3, 4], [4, 4, 5, 5]]);
  assert.ok(r.canCompute && r.pValue > 0 && r.pValue < 1);
  const same = runKruskalWallis([[2, 2], [2, 2], [2, 2]]);
  assert.equal(same.pValue, 1);
});

check("Welch's ANOVA matches the reference implementation", () => {
  const r = runWelchAnova([A, B, C]);
  close(r.F, 18.913854642864553, 1e-9, 'F');
  close(r.df2, 9.898224280021196, 1e-9, 'df2');
  close(r.pValue, 0.0004157006744701164, 1e-8, 'p');
  close(r.etaSquared, 0.688436103663986, 1e-9, 'eta2');
});

check('insufficient or degenerate samples are reported, not thrown', () => {
  assert.equal(runKruskalWallis([[1, 2], [3, 4]]).canCompute, false);
  assert.equal(runKruskalWallis([[1], [2, 3], [4, 5]]).canCompute, false);
  assert.equal(runWelchAnova([[1, 1], [2, 2], [3, 3]]).error, 'zero_variance');
});

check('pairwise comparisons apply Holm across the whole family', () => {
  const pairs = pairwiseComparisons({ A, B, C }, 'nonparametric');
  assert.equal(pairs.length, 3);
  pairs.forEach((p) => assert.ok(p.adjustedP >= p.pValue - 1e-12));
  const ac = pairs.find((p) => p.a === 'A' && p.b === 'C');
  assert.equal(ac.significant, true);
});

check('multi-group router explains the result in plain language', () => {
  const r = runMultiGroupComparison({ Neutro: A, Socratico: B, Directo: C });
  assert.equal(r.canCompute, true);
  assert.ok(['welch-anova', 'kruskal-wallis'].includes(r.test));
  assert.equal(r.significant, true);
  assert.ok(r.posthoc.length === 3);
  assert.match(r.summary, /Hay diferencias entre las 3 condiciones/);
  const none = runMultiGroupComparison({ x: [1, 2, 3, 4], y: [2, 3, 4, 1], z: [3, 1, 2, 4] });
  assert.equal(none.significant, false);
  assert.equal(none.posthoc.length, 0);
  assert.equal(runMultiGroupComparison({ a: A, b: B }).canCompute, false);
});

console.log(`\nstats-multigroup: ${passed} tests passed`);
