/**
 * Comparisons across three or more conditions.
 *   - Kruskal-Wallis H (non-parametric) with tie correction and epsilon-squared effect size
 *   - Welch's ANOVA (unequal variances) with eta-squared effect size
 *   - Pairwise follow-ups (Welch t or Mann-Whitney U) with Holm-Bonferroni correction
 *   - runMultiGroupComparison(): picks the omnibus test with the same assumption-first logic as the
 *     two-group gatekeeper and returns a plain-language summary.
 */
import {
  ibeta,
  gammln,
  mean,
  variance,
  shapiroWilk,
  runWelchTTest,
  runMannWhitneyU,
  applyHolmBonferroni,
} from './stats.js';

/** Regularized upper incomplete gamma Q(a, x) (series / continued fraction). */
function gammaQ(a, x) {
  if (x <= 0) return 1;
  if (x < a + 1) {
    let sum = 1 / a;
    let term = sum;
    for (let n = 1; n < 500; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-14) break;
    }
    return 1 - sum * Math.exp(-x + a * Math.log(x) - gammln(a));
  }
  const FPMIN = 1e-300;
  let b = x + 1 - a;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-14) break;
  }
  return Math.exp(-x + a * Math.log(x) - gammln(a)) * h;
}

export function chiSquareSurvival(x, df) {
  return Math.min(1, Math.max(0, gammaQ(df / 2, x / 2)));
}

export function fSurvival(f, d1, d2) {
  if (!(f > 0)) return 1;
  return Math.min(1, Math.max(0, ibeta(d2 / 2, d1 / 2, d2 / (d2 + d1 * f))));
}

const clean = (arr) => (arr || []).filter((v) => typeof v === 'number' && Number.isFinite(v));

/** @param {number[][]} groups */
export function runKruskalWallis(groups) {
  const gs = groups.map(clean);
  const k = gs.length;
  if (k < 3 || gs.some((g) => g.length < 2)) {
    return { canCompute: false, error: 'insufficient_sample', H: null, df: null, pValue: null };
  }
  const all = [];
  gs.forEach((g, gi) => g.forEach((v) => all.push({ v, gi })));
  all.sort((a, b) => a.v - b.v);
  const N = all.length;
  const rankSum = new Array(k).fill(0);
  let tieTerm = 0;
  for (let i = 0; i < N; ) {
    let j = i;
    while (j < N - 1 && all[j + 1].v === all[i].v) j++;
    const rank = (i + 1 + j + 1) / 2;
    for (let m = i; m <= j; m++) rankSum[all[m].gi] += rank;
    const t = j - i + 1;
    tieTerm += t ** 3 - t;
    i = j + 1;
  }
  const correction = 1 - tieTerm / (N ** 3 - N);
  if (correction === 0) {
    return { canCompute: true, H: 0, df: k - 1, pValue: 1, epsilonSquared: 0, magnitude: 'negligible', k, N };
  }
  let H = 0;
  gs.forEach((g, gi) => {
    H += rankSum[gi] ** 2 / g.length;
  });
  H = (12 / (N * (N + 1))) * H - 3 * (N + 1);
  H /= correction;
  const df = k - 1;
  const epsilonSquared = Math.max(0, Math.min(1, (H * (N + 1)) / (N ** 2 - 1)));
  const magnitude =
    epsilonSquared < 0.01 ? 'negligible' : epsilonSquared < 0.08 ? 'small' : epsilonSquared < 0.26 ? 'medium' : 'large';
  return { canCompute: true, H, df, pValue: chiSquareSurvival(H, df), epsilonSquared, magnitude, k, N };
}

/** @param {number[][]} groups */
export function runWelchAnova(groups) {
  const gs = groups.map(clean);
  const k = gs.length;
  if (k < 3 || gs.some((g) => g.length < 2)) {
    return { canCompute: false, error: 'insufficient_sample', F: null, df1: null, df2: null, pValue: null };
  }
  const n = gs.map((g) => g.length);
  const m = gs.map((g) => mean(g));
  const v = gs.map((g) => variance(g, 1));
  if (v.some((x) => !(x > 0))) {
    return { canCompute: false, error: 'zero_variance', F: null, df1: k - 1, df2: null, pValue: null };
  }
  const w = n.map((ni, i) => ni / v[i]);
  const W = w.reduce((a, b) => a + b, 0);
  const grand = w.reduce((a, wi, i) => a + wi * m[i], 0) / W;
  const A = w.reduce((a, wi, i) => a + wi * (m[i] - grand) ** 2, 0) / (k - 1);
  const lambda = w.reduce((a, wi, i) => a + (1 - wi / W) ** 2 / (n[i] - 1), 0);
  const B = 1 + ((2 * (k - 2)) / (k ** 2 - 1)) * lambda;
  const F = A / B;
  const df1 = k - 1;
  const df2 = (k ** 2 - 1) / (3 * lambda);

  const allVals = gs.flat();
  const gm = mean(allVals);
  const ssBetween = gs.reduce((a, g) => a + g.length * (mean(g) - gm) ** 2, 0);
  const ssTotal = allVals.reduce((a, x) => a + (x - gm) ** 2, 0);
  const etaSquared = ssTotal > 0 ? ssBetween / ssTotal : 0;
  const magnitude = etaSquared < 0.01 ? 'negligible' : etaSquared < 0.06 ? 'small' : etaSquared < 0.14 ? 'medium' : 'large';
  return { canCompute: true, F, df1, df2, pValue: fSurvival(F, df1, df2), etaSquared, magnitude, k, N: allVals.length };
}

/**
 * All pairs with Holm-Bonferroni across the family of comparisons.
 * @param {Record<string, number[]>} groupsByLabel
 * @param {'parametric'|'nonparametric'} mode
 */
export function pairwiseComparisons(groupsByLabel, mode = 'nonparametric') {
  const labels = Object.keys(groupsByLabel);
  const pairs = [];
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      const a = clean(groupsByLabel[labels[i]]);
      const b = clean(groupsByLabel[labels[j]]);
      const res = mode === 'parametric' ? runWelchTTest(a, b) : runMannWhitneyU(a, b);
      pairs.push({
        a: labels[i],
        b: labels[j],
        test: mode === 'parametric' ? 'welch-t' : 'mann-whitney-u',
        pValue: res.canCompute === false ? null : res.pValue,
        effectSize: mode === 'parametric' ? res.cohensD ?? null : res.cliffsDelta ?? null,
        effectLabel: mode === 'parametric' ? "d de Cohen" : 'δ de Cliff',
      });
    }
  }
  const adjusted = applyHolmBonferroni(pairs.map((p) => p.pValue));
  return pairs.map((p, i) => ({ ...p, adjustedP: adjusted[i].adj, significant: adjusted[i].significant }));
}

/**
 * Omnibus test + follow-ups for 3+ conditions, assumption-first.
 * @param {Record<string, number[]>} groupsByLabel
 * @param {{forceNonparametric?: boolean}} options  use for ordinal data such as Likert items
 */
export function runMultiGroupComparison(groupsByLabel, { forceNonparametric = false } = {}) {
  const labels = Object.keys(groupsByLabel);
  const groups = labels.map((l) => clean(groupsByLabel[l]));
  if (labels.length < 3) return { canCompute: false, error: 'needs_three_groups' };

  const normality = labels.map((label, i) => ({ label, ...shapiroWilk(groups[i]) }));
  const allNormal = normality.every((r) => r.isNormal === true);
  const parametric = !forceNonparametric && allNormal && groups.every((g) => g.length >= 3);

  const omnibus = parametric ? runWelchAnova(groups) : runKruskalWallis(groups);
  const test = parametric ? 'welch-anova' : 'kruskal-wallis';
  if (!omnibus.canCompute) return { canCompute: false, error: omnibus.error, test };

  const significant = omnibus.pValue < 0.05;
  const posthoc = significant ? pairwiseComparisons(groupsByLabel, parametric ? 'parametric' : 'nonparametric') : [];
  const magnitudeEs = { negligible: 'insignificante', small: 'pequeña', medium: 'mediana', large: 'grande' }[omnibus.magnitude];
  const summary = significant
    ? `Hay diferencias entre las ${labels.length} condiciones (p = ${omnibus.pValue.toFixed(3)}), con un efecto ${magnitudeEs}. Revisa las comparaciones por pares para ver cuáles se distinguen.`
    : `No hay evidencia de diferencias entre las ${labels.length} condiciones (p = ${omnibus.pValue.toFixed(3)}).`;

  return { canCompute: true, test, parametric, normality, omnibus, significant, posthoc, summary };
}
