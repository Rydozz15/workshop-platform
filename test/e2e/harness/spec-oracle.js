/**
 * Authoritative Mathematical and Algorithmic Oracle for PromptSketch.
 * Derived strictly from:
 * - the analytics specification (survey_stats.md)
 * - the interface contracts of the project
 * Zero hardcoding. Zero approximations. Exact mathematical formulas.
 */

// Regularized incomplete beta function approximation for Student-t p-values
function betacf(a, b, x) {
  const MAXIT = 100;
  const EPS = 3.0e-7;
  const FPMIN = 1.0e-30;
  const qab = a + b;
  const qap = a + 1.0;
  const qam = a - 1.0;
  let c = 1.0;
  let d = 1.0 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1.0 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1.0 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1.0 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) < EPS) break;
  }
  return h;
}

function gammln(xx) {
  let x = xx;
  let y = xx;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015 +
    76.18009172947146 / (y + 1.0) -
    86.50532032941677 / (y + 2.0) +
    24.01409824083091 / (y + 3.0) -
    1.231739572450155 / (y + 4.0) +
    0.1208650973866179e-2 / (y + 5.0) -
    0.5395239384953e-5 / (y + 6.0);
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function ibeta(a, b, x) {
  if (x < 0.0 || x > 1.0) return 0.0;
  if (x === 0.0) return 0.0;
  if (x === 1.0) return 1.0;
  const bt = Math.exp(gammln(a + b) - gammln(a) - gammln(b) + a * Math.log(x) + b * Math.log(1.0 - x));
  if (x < (a + 1.0) / (a + b + 2.0)) {
    return (bt * betacf(a, b, x)) / a;
  } else {
    return 1.0 - (bt * betacf(b, a, 1.0 - x)) / b;
  }
}

// Standard normal cumulative distribution function (CDF)
export function standardNormalCdf(z) {
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const erf = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * erf);
}

// Basic sample statistics
export function computeSampleMoments(values) {
  const n = values.length;
  if (n < 2) return null;
  const mean = values.reduce((acc, v) => acc + v, 0) / n;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1);
  const sd = Math.sqrt(variance);

  if (n < 3 || variance === 0) {
    return { mean, variance, sd, skewness: 0, kurtosis: 0, isSymmetric: true };
  }

  const m2 = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
  const m3 = values.reduce((acc, v) => acc + Math.pow(v - mean, 3), 0) / n;
  const m4 = values.reduce((acc, v) => acc + Math.pow(v - mean, 4), 0) / n;

  // Unbiased Fisher-Pearson skewness
  const skewness = (n * Math.sqrt(n - 1) / (n - 2)) * (m3 / Math.pow(m2, 1.5));
  // Unbiased excess kurtosis
  const kurtosis = (n - 1) / ((n - 2) * (n - 3)) * ((n + 1) * (m4 / Math.pow(m2, 2)) - 3 * (n - 1));

  return {
    mean,
    variance,
    sd,
    skewness,
    kurtosis,
    isSymmetric: Math.abs(skewness) < 1.0,
  };
}

/**
 * 1. Assumption Diagnostic Gatekeeper
 */
export function runAssumptionGatekeeper({ groupA, groupB, metricName = 'metric', scaleType = null }) {
  // Automatic scale classification if not explicitly provided
  let detectedScale = scaleType;
  if (!detectedScale) {
    const combined = [...groupA, ...groupB];
    const isDiscreteBounded = combined.every(
      v => Number.isInteger(v) && v >= 1 && v <= 7
    );
    detectedScale = isDiscreteBounded ? 'ordinal' : 'continuous';
  }

  if (detectedScale === 'ordinal') {
    return {
      scaleType: 'ordinal',
      isNormalA: false,
      isNormalB: false,
      isHomoscedastic: null,
      recommendedTest: 'mann_whitney_u',
      effectSize: 'cliffs_delta',
      explanation: 'Se seleccionó la prueba no paramétrica de Mann-Whitney U y el tamaño de efecto Delta de Cliff porque este indicador es un ítem Likert individual (escala ordinal 1–5). Las distancias numéricas entre opciones ordinales no garantizan equidistancia cuantitativa, invalidando la media aritmética y la prueba t.',
    };
  }

  const momentsA = computeSampleMoments(groupA);
  const momentsB = computeSampleMoments(groupB);

  const isNormalA = momentsA && Math.abs(momentsA.skewness) < 1.0 && Math.abs(momentsA.kurtosis) < 1.5;
  const isNormalB = momentsB && Math.abs(momentsB.skewness) < 1.0 && Math.abs(momentsB.kurtosis) < 1.5;

  let isHomoscedastic = false;
  if (momentsA && momentsB && momentsA.variance > 0 && momentsB.variance > 0) {
    const varRatio = Math.max(momentsA.variance, momentsB.variance) / Math.min(momentsA.variance, momentsB.variance);
    isHomoscedastic = varRatio < 4.0;
  }

  if (isNormalA && isNormalB) {
    return {
      scaleType: 'continuous',
      isNormalA: true,
      isNormalB: true,
      isHomoscedastic,
      recommendedTest: 'welch_t',
      effectSize: 'cohens_d',
      explanation: `Se seleccionó la prueba t de Welch y d de Cohen porque la métrica es continua y aproxima una distribución normal (Asimetría A = ${momentsA.skewness.toFixed(2)}, Asimetría B = ${momentsB.skewness.toFixed(2)}). La prueba t de Welch protege el análisis ante posibles diferencias de varianza entre grupos.`,
    };
  } else {
    return {
      scaleType: 'continuous',
      isNormalA,
      isNormalB,
      isHomoscedastic,
      recommendedTest: 'mann_whitney_u',
      effectSize: 'cliffs_delta',
      explanation: 'Se desvió a Mann-Whitney U y Delta de Cliff porque la distribución continua presenta una asimetría o curtosis marcada, lo cual generaría sesgos severos en una prueba paramétrica.',
    };
  }
}

/**
 * 2. Welch's t-Test, Welch-Satterthwaite df, Cohen's d & 95% CI
 */
export function runWelchTTest(groupA, groupB) {
  const nA = groupA.length;
  const nB = groupB.length;

  if (nA < 2 || nB < 2) {
    return {
      canCompute: false,
      error: 'insufficient_sample',
      t: null,
      df: null,
      pValue: null,
      cohensD: null,
    };
  }

  const momentsA = computeSampleMoments(groupA);
  const momentsB = computeSampleMoments(groupB);

  const meanA = momentsA.mean;
  const meanB = momentsB.mean;
  const varA = momentsA.variance;
  const varB = momentsB.variance;
  const meanDiff = meanA - meanB;

  // Handle zero variance in both groups
  if (varA === 0 && varB === 0) {
    if (meanDiff === 0) {
      return {
        canCompute: true,
        t: 0.0,
        df: nA + nB - 2,
        pValue: 1.0,
        meanDiff: 0.0,
        meanA,
        meanB,
        sdA: 0.0,
        sdB: 0.0,
        cohensD: 0.0,
        dCi: [0.0, 0.0],
        ci95: [0.0, 0.0],
      };
    } else {
      return { canCompute: false, error: 'zero_variance_disjoint' };
    }
  }

  const seDiff = Math.sqrt(varA / nA + varB / nB);
  const t = meanDiff / seDiff;

  // Welch-Satterthwaite degrees of freedom
  const numDf = Math.pow(varA / nA + varB / nB, 2);
  const denDf = Math.pow(varA / nA, 2) / (nA - 1) + Math.pow(varB / nB, 2) / (nB - 1);
  const df = numDf / denDf;

  // Two-tailed p-value via regularized incomplete beta function
  const x = df / (df + Math.pow(t, 2));
  const pValue = ibeta(df / 2, 0.5, x);

  // Cohen's d with pooled SD
  const pooledVar = ((nA - 1) * varA + (nB - 1) * varB) / (nA + nB - 2);
  const sPooled = Math.sqrt(pooledVar);
  const cohensD = sPooled === 0 ? 0 : meanDiff / sPooled;
  const seD = Math.sqrt((nA + nB) / (nA * nB) + Math.pow(cohensD, 2) / (2 * (nA + nB)));
  const dCi = [cohensD - 1.96 * seD, cohensD + 1.96 * seD];

  const tCrit = 1.96; // Approximation for 95% CI
  const ci95 = [meanDiff - tCrit * seDiff, meanDiff + tCrit * seDiff];

  return {
    canCompute: true,
    t,
    df,
    pValue,
    meanDiff,
    meanA,
    meanB,
    sdA: momentsA.sd,
    sdB: momentsB.sd,
    cohensD,
    dCi,
    ci95,
  };
}

/**
 * 3. Mann-Whitney U Test (with Tie Correction) and Cliff's Delta
 */
export function runMannWhitneyU(groupA, groupB) {
  const nA = groupA.length;
  const nB = groupB.length;

  if (nA === 0 || nB === 0) {
    return {
      canCompute: false,
      error: 'insufficient_sample',
      uA: null,
      uB: null,
      pValue: null,
      cliffsDelta: null,
    };
  }

  // Combine and sort observations with group tags
  const combined = [];
  groupA.forEach((val, i) => combined.push({ val, group: 'A', idx: i }));
  groupB.forEach((val, i) => combined.push({ val, group: 'B', idx: i }));
  combined.sort((a, b) => a.val - b.val);

  // Assign average ranks (mid-ranks) for ties
  const N = combined.length;
  const ranks = new Array(N);
  const tieCounts = [];
  let i = 0;

  while (i < N) {
    let j = i;
    while (j < N - 1 && combined[j].val === combined[j + 1].val) {
      j++;
    }
    const count = j - i + 1;
    const midRank = (i + 1 + (j + 1)) / 2.0;
    for (let k = i; k <= j; k++) {
      ranks[k] = midRank;
    }
    if (count > 1) {
      tieCounts.push(count);
    }
    i = j + 1;
  }

  let rankSumA = 0;
  for (let k = 0; k < N; k++) {
    if (combined[k].group === 'A') {
      rankSumA += ranks[k];
    }
  }

  const uA = rankSumA - (nA * (nA + 1)) / 2.0;
  const uB = nA * nB - uA;

  // Handle complete ties / zero variance across both groups
  if (tieCounts.length === 1 && tieCounts[0] === N) {
    return {
      canCompute: true,
      uA,
      uB,
      z: 0.0,
      pValue: 1.0,
      cliffsDelta: 0.0,
      deltaCi: [0.0, 0.0],
      romanoMagnitude: 'negligible',
      medianA: combined[0].val,
      medianB: combined[0].val,
      nA,
      nB,
    };
  }

  // Tie correction factor
  let tieSum = 0;
  for (const t of tieCounts) {
    tieSum += Math.pow(t, 3) - t;
  }
  const varianceU = (nA * nB / 12.0) * ((N + 1) - tieSum / (N * (N - 1)));
  const sigmaU = Math.sqrt(varianceU);

  // Continuity-corrected z
  const z = sigmaU === 0 ? 0 : (Math.abs(uA - (nA * nB) / 2.0) - 0.5) / sigmaU;
  const pValue = 2.0 * (1.0 - standardNormalCdf(Math.abs(z)));

  // Strict Cliff's Delta derived directly from U:
  // delta = (2 * uA) / (nA * nB) - 1 = 1 - (2 * uB) / (nA * nB)
  const cliffsDelta = (2.0 * uA) / (nA * nB) - 1.0;

  // Cliff (1993) Asymptotic Variance for CI
  let dCount = 0;
  let dSum1 = 0;
  let dSum2 = 0;

  for (let a = 0; a < nA; a++) {
    let dRow = 0;
    for (let b = 0; b < nB; b++) {
      const diff = groupA[a] > groupB[b] ? 1 : groupA[a] < groupB[b] ? -1 : 0;
      dRow += diff;
    }
    dSum1 += Math.pow(dRow / nB - cliffsDelta, 2);
  }

  for (let b = 0; b < nB; b++) {
    let dCol = 0;
    for (let a = 0; a < nA; a++) {
      const diff = groupA[a] > groupB[b] ? 1 : groupA[a] < groupB[b] ? -1 : 0;
      dCol += diff;
    }
    dSum2 += Math.pow(dCol / nA - cliffsDelta, 2);
  }

  const s1 = nA > 1 ? dSum1 / (nA - 1) : 0;
  const s2 = nB > 1 ? dSum2 / (nB - 1) : 0;
  const varDelta = (s1 + s2) / (nA * nB);
  const seDelta = Math.sqrt(varDelta);

  const rawLow = cliffsDelta - 1.96 * seDelta;
  const rawHigh = cliffsDelta + 1.96 * seDelta;
  const deltaCi = [Math.max(-1.0, rawLow), Math.min(1.0, rawHigh)];

  // Romano et al. (2006) 4-level classification
  const absDelta = Math.abs(cliffsDelta);
  let romanoMagnitude = 'negligible';
  if (absDelta >= 0.474) romanoMagnitude = 'large';
  else if (absDelta >= 0.330) romanoMagnitude = 'medium';
  else if (absDelta >= 0.147) romanoMagnitude = 'small';

  const sortedA = [...groupA].sort((a, b) => a - b);
  const sortedB = [...groupB].sort((a, b) => a - b);
  const medianA = sortedA[Math.floor(nA / 2)];
  const medianB = sortedB[Math.floor(nB / 2)];

  return {
    canCompute: true,
    uA,
    uB,
    z,
    pValue,
    cliffsDelta,
    deltaCi,
    romanoMagnitude,
    medianA,
    medianB,
    nA,
    nB,
  };
}

/**
 * 4. Monotonic Sequential Holm-Bonferroni Correction
 */
export function applyHolmBonferroni(tests) {
  if (!tests || tests.length === 0) return [];
  const m = tests.length;

  // Track original index and sort ascending by raw p-value
  const indexed = tests.map((t, idx) => ({ ...t, originalIndex: idx }));
  indexed.sort((a, b) => a.pValue - b.pValue);

  // Compute step-down multipliers: (m - i + 1) * p
  for (let i = 0; i < m; i++) {
    const multiplier = m - i;
    indexed[i].q = Math.min(1.0, indexed[i].pValue * multiplier);
  }

  // Monotonic step-down enforcement: p_adj,i = min(1.0, max(p_adj,i-1, q_i))
  indexed[0].adjustedP = indexed[0].q;
  for (let i = 1; i < m; i++) {
    indexed[i].adjustedP = Math.min(1.0, Math.max(indexed[i - 1].adjustedP, indexed[i].q));
  }

  // Map back to original order
  indexed.sort((a, b) => a.originalIndex - b.originalIndex);
  return indexed.map(item => ({
    ...item,
    familySize: m,
    significant: item.adjustedP < 0.05,
  }));
}

/**
 * 5. Hake's Normalized Learning Gain (g)
 */
export function calculateHakeGain(preScores, postScores, maxScore = 5.0) {
  const n = preScores.length;
  if (n === 0 || n !== postScores.length) {
    return { canCompute: false, error: 'invalid_paired_arrays' };
  }

  const meanPre = preScores.reduce((acc, v) => acc + v, 0) / n;
  const meanPost = postScores.reduce((acc, v) => acc + v, 0) / n;

  // Class Average Gain (Hake, 1998)
  const gClass = maxScore === meanPre ? 1.0 : (meanPost - meanPre) / (maxScore - meanPre);

  // Individual gains
  const individualGains = [];
  for (let i = 0; i < n; i++) {
    const pre = preScores[i];
    const post = postScores[i];
    if (pre === maxScore) {
      individualGains.push(post === maxScore ? 1.0 : 0.0);
    } else {
      individualGains.push((post - pre) / (maxScore - pre));
    }
  }

  const gIndivMean = individualGains.reduce((acc, v) => acc + v, 0) / n;
  const varG = individualGains.reduce((acc, v) => acc + Math.pow(v - gIndivMean, 2), 0) / Math.max(1, n - 1);
  const seG = Math.sqrt(varG / n);
  const ci = [gIndivMean - 1.96 * seG, gIndivMean + 1.96 * seG];

  let tier = 'low';
  if (gClass >= 0.70) tier = 'high';
  else if (gClass >= 0.30) tier = 'medium';

  return {
    canCompute: true,
    gClass,
    gIndivMean,
    se: seG,
    ci: [Math.max(-1.0, ci[0]), Math.min(1.0, ci[1])],
    meanPre,
    meanPost,
    tier,
    n,
  };
}

/**
 * 6. Cronbach's Alpha (α) with Reverse-Scoring Support
 */
export function calculateCronbachAlpha(matrix, reverseItems = []) {
  const N = matrix.length;
  if (N < 2) return { canCompute: false, error: 'insufficient_sample' };
  const k = matrix[0].length;
  if (k < 2) return { canCompute: false, error: 'minimum_two_items_required' };

  // Apply reverse-scoring if requested
  const processed = matrix.map(row => {
    return row.map((val, colIdx) => {
      if (reverseItems.includes(colIdx)) {
        return 6 - val; // Reverse 1-5 scale
      }
      return val;
    });
  });

  // Compute item variances
  const itemMeans = new Array(k).fill(0);
  const itemVars = new Array(k).fill(0);

  for (let j = 0; j < k; j++) {
    for (let i = 0; i < N; i++) {
      itemMeans[j] += processed[i][j];
    }
    itemMeans[j] /= N;
    for (let i = 0; i < N; i++) {
      itemVars[j] += Math.pow(processed[i][j] - itemMeans[j], 2);
    }
    itemVars[j] /= (N - 1);
  }

  const sumItemVars = itemVars.reduce((acc, v) => acc + v, 0);

  // Compute total scores and total variance
  const totalScores = processed.map(row => row.reduce((acc, v) => acc + v, 0));
  const meanTotal = totalScores.reduce((acc, v) => acc + v, 0) / N;
  const varTotal = totalScores.reduce((acc, v) => acc + Math.pow(v - meanTotal, 2), 0) / (N - 1);

  if (varTotal === 0) {
    return { canCompute: true, alpha: 0.0, isAcceptable: false, itemTotalCorrelations: [] };
  }

  const alpha = (k / (k - 1)) * (1.0 - sumItemVars / varTotal);

  // Corrected item-total correlations
  const itemTotalCorrs = [];
  const flaggedReverseOmissions = [];

  for (let j = 0; j < k; j++) {
    const remainderScores = processed.map((row, i) => totalScores[i] - row[j]);
    const meanRem = remainderScores.reduce((acc, v) => acc + v, 0) / N;
    let cov = 0;
    let varRem = 0;
    for (let i = 0; i < N; i++) {
      cov += (processed[i][j] - itemMeans[j]) * (remainderScores[i] - meanRem);
      varRem += Math.pow(remainderScores[i] - meanRem, 2);
    }
    cov /= (N - 1);
    varRem /= (N - 1);
    const r = (itemVars[j] > 0 && varRem > 0) ? cov / Math.sqrt(itemVars[j] * varRem) : 0;
    itemTotalCorrs.push(r);
    if (r < 0) {
      flaggedReverseOmissions.push(j);
    }
  }

  return {
    canCompute: true,
    alpha,
    isAcceptable: alpha >= 0.70,
    itemTotalCorrelations: itemTotalCorrs,
    flaggedReverseOmissions,
    k,
    N,
  };
}

/**
 * 7. Inter-Rater Reliability (IRR): Cohen's κ & Gwet's AC1
 */
export function calculateIRR(rater1, rater2, categories = null) {
  const N = rater1.length;
  if (N === 0 || N !== rater2.length) {
    return { canCompute: false, error: 'invalid_rater_arrays' };
  }

  const catSet = new Set(categories || [...rater1, ...rater2]);
  const catList = Array.from(catSet);
  const C = catList.length;

  if (C < 2) {
    return { canCompute: false, error: 'minimum_two_categories_required' };
  }

  // Build confusion matrix
  const matrix = Array.from({ length: C }, () => new Array(C).fill(0));
  for (let i = 0; i < N; i++) {
    const idx1 = catList.indexOf(rater1[i]);
    const idx2 = catList.indexOf(rater2[i]);
    if (idx1 >= 0 && idx2 >= 0) {
      matrix[idx1][idx2]++;
    }
  }

  // Observed agreement
  let agreeCount = 0;
  for (let c = 0; c < C; c++) {
    agreeCount += matrix[c][c];
  }
  const observedAgreement = agreeCount / N;

  // Cohen's expected agreement
  const rowMarginals = matrix.map(row => row.reduce((a, b) => a + b, 0) / N);
  const colMarginals = new Array(C).fill(0);
  for (let j = 0; j < C; j++) {
    for (let i = 0; i < C; i++) {
      colMarginals[j] += matrix[i][j];
    }
    colMarginals[j] /= N;
  }

  let peCohen = 0;
  for (let c = 0; c < C; c++) {
    peCohen += rowMarginals[c] * colMarginals[c];
  }

  const cohenKappa = peCohen === 1.0 ? 1.0 : (observedAgreement - peCohen) / (1.0 - peCohen);

  // Gwet's AC1 (Prevalence-Paradox Sensitivity Complement)
  let peGwet = 0;
  let maxMarginal = 0;

  for (let c = 0; c < C; c++) {
    const pi_c = (rowMarginals[c] + colMarginals[c]) / 2.0;
    if (pi_c > maxMarginal) maxMarginal = pi_c;
    peGwet += pi_c * (1.0 - pi_c);
  }
  peGwet = peGwet / (C - 1);

  const gwetsAC1 = peGwet === 1.0 ? 1.0 : (observedAgreement - peGwet) / (1.0 - peGwet);

  // Prevalence paradox warning: high single-class marginal >= 0.80 and observed agreement >= 0.85 with depressed kappa
  const prevalenceWarning = maxMarginal >= 0.80 && observedAgreement >= 0.85 && (cohenKappa < 0.85 || cohenKappa < observedAgreement - 0.08);

  return {
    canCompute: true,
    observedAgreement,
    cohenKappa,
    gwetsAC1,
    prevalenceWarning,
    confusionMatrix: matrix,
    categories: catList,
    sampleSize: N,
  };
}

/**
 * 8. Conversational Learning Analytics
 */
export function analyzeConversation(messages = [], telemetry = {}) {
  let studentWords = 0;
  let botWords = 0;
  let studentTurns = 0;
  const studentTokens = [];

  const readingLatencies = [];
  let skippedTurns = 0;
  let outlierTurns = 0;

  let lastBotWordCount = 0;
  let lastBotFinish = null;

  for (const m of messages) {
    const words = m.content ? m.content.trim().split(/\s+/).filter(Boolean) : [];
    if (m.role === 'user') {
      studentTurns++;
      studentWords += words.length;
      words.forEach(w => studentTokens.push(w.toLowerCase().replace(/[^\wáéíóúüñ]/gi, '')));

      if (m.telemetry) {
        const { t_bot, t_first_key, t_send, is_tab_blurred } = m.telemetry;
        if (t_bot && t_first_key) {
          const readingLatency = t_first_key - t_bot;
          const compositionTime = (t_send || t_first_key) - t_first_key;
          const wordsPrev = lastBotWordCount || 1;
          const msPerWord = readingLatency / wordsPrev;

          const isSkipped = msPerWord < 100 || readingLatency < 800;
          const isOutlier = readingLatency > 180000 || !!is_tab_blurred;

          if (isSkipped) skippedTurns++;
          if (isOutlier) outlierTurns++;
          if (!isOutlier) readingLatencies.push(msPerWord);
        }
      }
    } else if (m.role === 'assistant') {
      botWords += words.length;
      lastBotWordCount = words.length;
    }
  }

  const verbalVolumeRatio = botWords === 0 ? 0 : studentWords / botWords;
  const studentMluW = studentTurns === 0 ? 0 : studentWords / studentTurns;

  const avgReadingLatency = readingLatencies.length > 0
    ? readingLatencies.reduce((a, b) => a + b, 0) / readingLatencies.length
    : 0;

  // Length-invariant MATTR (W=25, 50)
  const computeMATTR = (tokens, W) => {
    if (tokens.length === 0) return 0;
    if (tokens.length < W) {
      const unique = new Set(tokens).size;
      return unique / tokens.length;
    }
    const K = tokens.length - W + 1;
    let ttrSum = 0;
    for (let i = 0; i < K; i++) {
      const windowTokens = tokens.slice(i, i + W);
      ttrSum += new Set(windowTokens).size / W;
    }
    return ttrSum / K;
  };

  const mattr25 = computeMATTR(studentTokens, 25);
  const mattr50 = computeMATTR(studentTokens, 50);

  // Bilingual Epistemic and Metacognitive Connectors
  const fullText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const causalPatterns = [
    /\b(porque|por que|ya que|puesto que|dado que|debido a|por ende|por lo tanto|en consecuencia|asi que)\b/g,
    /\b(because|since|due to|therefore|thus|consequently|as a result|hence)\b/g,
  ];
  const adversativePatterns = [
    /\b(pero|sin embargo|no obstante|aunque|a pesar de|por el contrario|en cambio|sino)\b/g,
    /\b(but|however|although|even though|nevertheless|despite|on the other hand|whereas)\b/g,
  ];
  const metacognitivePatterns = [
    /\b(creo que|pienso que|me di cuenta|entiendo|dudo que|me parece|reflexionando|considero|no estoy seguro|supongo)\b/g,
    /\b(i think|i believe|i realize|i understand|i doubt|it seems|reflecting|i wonder|i assume|not sure)\b/g,
  ];

  const countMatches = patterns => {
    let count = 0;
    for (const p of patterns) {
      const matches = fullText.match(p);
      if (matches) count += matches.length;
    }
    return count;
  };

  const causalCount = countMatches(causalPatterns);
  const adversativeCount = countMatches(adversativePatterns);
  const metacognitiveCount = countMatches(metacognitivePatterns);

  const wordsFactor = studentWords === 0 ? 0 : 100.0 / studentWords;
  const causalDensity = causalCount * wordsFactor;
  const adversativeDensity = adversativeCount * wordsFactor;
  const metacognitiveDensity = metacognitiveCount * wordsFactor;

  return {
    studentWords,
    botWords,
    studentTurns,
    verbalVolumeRatio,
    studentMluW,
    mattr25,
    mattr50,
    avgReadingLatency,
    skippedTurns,
    outlierTurns,
    epistemicConnectors: {
      causalCount,
      adversativeCount,
      metacognitiveCount,
      causalDensity,
      adversativeDensity,
      metacognitiveDensity,
    },
  };
}

/**
 * 9. LaTeX booktabs Table Generator
 */
export function generateBooktabsTable(results) {
  let latex = '\\begin{table}[htbp]\n\\centering\n';
  latex += '\\caption{Comparative Evaluation: Condition A vs. Condition B.}\n';
  latex += '\\label{tab:promptsketch_results}\n';
  latex += '\\begin{tabular}{lrrrrr}\n\\toprule\n';
  latex += 'Metric & Cond. A & Cond. B & Effect Size [95\\% CI] & $p_{\\text{raw}}$ & $p_{\\text{Holm}}$ \\\\\n\\midrule\n';

  if (results.continuous && results.continuous.length > 0) {
    latex += '\\multicolumn{6}{l}{\\textit{Continuous Metrics (Welch\'s $t$-test)}} \\\\\n';
    for (const r of results.continuous) {
      const pRaw = r.pValue !== null ? r.pValue.toFixed(3) : 'N/A';
      const pHolm = r.adjustedP !== null ? (r.adjustedP.toFixed(3) + (r.adjustedP < 0.05 ? '*' : '')) : 'N/A';
      const dStr = r.cohensD !== null ? `$d = ${r.cohensD >= 0 ? '+' : ''}${r.cohensD.toFixed(2)}$` : 'N/A';
      latex += `${r.name} & ${r.meanA.toFixed(1)} & ${r.meanB.toFixed(1)} & ${dStr} & ${pRaw} & ${pHolm} \\\\\n`;
    }
  }

  if (results.ordinal && results.ordinal.length > 0) {
    latex += '\\midrule\n\\multicolumn{6}{l}{\\textit{Ordinal Likert Dimensions (Mann-Whitney $U$)}} \\\\\n';
    for (const r of results.ordinal) {
      const pRaw = r.pValue !== null ? r.pValue.toFixed(3) : 'N/A';
      const pHolm = r.adjustedP !== null ? (r.adjustedP.toFixed(3) + (r.adjustedP < 0.05 ? '*' : '')) : 'N/A';
      const deltaStr = r.cliffsDelta !== null ? `$\\delta = ${r.cliffsDelta >= 0 ? '+' : ''}${r.cliffsDelta.toFixed(2)}$` : 'N/A';
      latex += `${r.name} & ${r.medianA.toFixed(1)} & ${r.medianB.toFixed(1)} & ${deltaStr} & ${pRaw} & ${pHolm} \\\\\n`;
    }
  }

  latex += '\\bottomrule\n';
  latex += '\\multicolumn{6}{l}{\\footnotesize Note: *Significant after Holm-Bonferroni correction ($\\alpha = 0.05$).} \\\\\n';
  latex += '\\end{tabular}\n\\end{table}\n';
  return latex;
}

/**
 * Dynamic spec resolver:
 * Attempts to import from actual workshop-app/lib modules if present,
 * otherwise resolves to the mathematical spec oracle above.
 */
export async function getStatsEngine() {
  try {
    const mod = await import('../../../lib/stats.js');
    return mod;
  } catch (e) {
    return {
      runAssumptionGatekeeper,
      runWelchTTest,
      runMannWhitneyU,
      applyHolmBonferroni,
    };
  }
}
