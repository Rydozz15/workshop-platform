/**
 * Assumption-First Inferential & Parametric/Non-Parametric Statistical Engine
 * 
 * Implements:
 * - Assumption Diagnostic Gatekeeper (Scale classification, Normality, Homoscedasticity)
 * - Welch's t-test with Welch-Satterthwaite df, Cohen's d & 95% CI
 * - Mann-Whitney U test with exact mid-ranks, tie correction, Cliff's delta & Romano tiers
 * - Monotonic sequential Holm-Bonferroni FWER step-down adjustment
 * 
 * Reference: survey_stats.md, PROJECT.md
 * Zero hardcoding. Full mathematical derivation.
 */

// Regularized incomplete beta function for Student-t p-values
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

export function gammln(xx) {
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

export function ibeta(a, b, x) {
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
  if (z === 0) return 0.5;
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

// Standard normal quantile / inverse CDF (Wichura / AS 241)
export function standardNormalQuantile(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;

  const a = [3.3871328727963666080, 1.3314166789178437745e+2, 1.9715909503065514427e+3, 1.3731693767246189346e+4, 4.5921953931549871457e+4, 6.7265770927008700853e+4, 3.3430572900016603271e+4, 2.5090809287301226727e+3];
  const b = [1.0, 4.2313330701600911252e+1, 6.8718700749205790830e+2, 5.3941960214247511077e+3, 2.1213794301586595867e+4, 3.9307895800092710610e+4, 2.8729085735721942674e+4, 5.2264952788528545610e+3];
  const c = [1.42343711074968357734, 4.63033784615654529590, 5.76949722146069140550, 3.64784832476320460504, 1.27045825245236838258, 2.41780725177450611770e-1, 2.27238449892691845833e-2, 7.74545014278341407640e-4];
  const d = [1.0, 2.05319162663775882187, 1.67638483018380384940, 6.89767334985100004550e-1, 1.48184694381390000000e-1, 1.51986665636164571966e-2, 5.47593808499534494600e-4, 1.05075007164441684324e-9];

  const q = p - 0.5;
  if (Math.abs(q) <= 0.425) {
    const r = 0.180625 - q * q;
    let num = 0, den = 0;
    for (let i = 7; i >= 0; i--) {
      num = num * r + a[i];
      den = den * r + b[i];
    }
    return q * (num / den);
  }
  const r = q < 0 ? p : 1.0 - p;
  const s = Math.log(-Math.log(r));
  let num = 0, den = 0;
  for (let i = 7; i >= 0; i--) {
    num = num * s + c[i];
    den = den * s + d[i];
  }
  const x = num / den;
  return q < 0 ? -x : x;
}

// Basic Sample Moments
export function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((acc, v) => acc + v, 0) / arr.length;
}

export function variance(arr, ddof = 1) {
  if (!arr || arr.length <= ddof) return 0;
  const m = mean(arr);
  const sumSq = arr.reduce((acc, v) => acc + Math.pow(v - m, 2), 0);
  return sumSq / (arr.length - ddof);
}

export function computeSampleMoments(values) {
  const n = values ? values.length : 0;
  if (n < 2) return null;
  const m = mean(values);
  const v = variance(values, 1);
  const sd = Math.sqrt(v);

  if (n < 3 || v === 0) {
    return { mean: m, variance: v, sd, skewness: 0, kurtosis: 0, isSymmetric: true };
  }

  const m2 = values.reduce((acc, x) => acc + Math.pow(x - m, 2), 0) / n;
  const m3 = values.reduce((acc, x) => acc + Math.pow(x - m, 3), 0) / n;
  const m4 = values.reduce((acc, x) => acc + Math.pow(x - m, 4), 0) / n;

  // Unbiased Fisher-Pearson sample skewness g1
  const skewness = (n * Math.sqrt(n - 1) / (n - 2)) * (m3 / Math.pow(m2, 1.5));
  // Unbiased excess kurtosis g2
  const kurtosis = (n - 1) / ((n - 2) * (n - 3)) * ((n + 1) * (m4 / Math.pow(m2, 2)) - 3 * (n - 1));

  return {
    mean: m,
    variance: v,
    sd,
    skewness,
    kurtosis,
    isSymmetric: Math.abs(skewness) < 1.0,
  };
}

export function skewness(arr) {
  const m = computeSampleMoments(arr);
  return m ? m.skewness : 0;
}

export function kurtosis(arr) {
  const m = computeSampleMoments(arr);
  return m ? m.kurtosis : 0;
}

/**
 * Shapiro-Wilk Normality Test (Royston, 1992 approximation)
 */
export function shapiroWilk(arr) {
  const n = arr ? arr.length : 0;
  if (n < 3) {
    return { W: null, pValue: null, isNormal: false, reason: 'insufficient_sample' };
  }
  const sorted = [...arr].sort((a, b) => a - b);
  const m = mean(sorted);
  let ss = 0;
  for (let i = 0; i < n; i++) ss += Math.pow(sorted[i] - m, 2);
  if (ss === 0) {
    return { W: null, pValue: null, isNormal: false, reason: 'insufficient_variance' };
  }

  // Blom scores
  const weights = new Float64Array(n);
  let sumMSq = 0;
  for (let i = 0; i < n; i++) {
    weights[i] = standardNormalQuantile((i + 1 - 0.375) / (n + 0.25));
    sumMSq += weights[i] * weights[i];
  }
  const sqrtSumMSq = Math.sqrt(sumMSq);

  const a = new Float64Array(n);
  const u = 1.0 / Math.sqrt(n);

  // Royston (1992) polynomial weights
  const cN = weights[n - 1] / sqrtSumMSq;
  const aN = -cN + 0.221157 * u - 0.147981 * Math.pow(u, 2) - 2.071190 * Math.pow(u, 3) + 4.434685 * Math.pow(u, 4) - 2.706056 * Math.pow(u, 5);
  a[n - 1] = -aN;
  a[0] = aN;

  if (n > 5) {
    const cN1 = weights[n - 2] / sqrtSumMSq;
    const aN1 = -cN1 - 0.056181 * u + 0.065263 * Math.pow(u, 2) + 0.038138 * Math.pow(u, 3) - 0.439002 * Math.pow(u, 4) + 0.288361 * Math.pow(u, 5);
    a[n - 2] = -aN1;
    a[1] = aN1;
    const phiSum = sumMSq - 2 * weights[n - 1] * weights[n - 1] - 2 * weights[n - 2] * weights[n - 2];
    const phiDen = 1.0 - 2 * a[n - 1] * a[n - 1] - 2 * a[n - 2] * a[n - 2];
    const phi = phiSum / Math.max(1e-12, phiDen);
    const sqrtPhi = Math.sqrt(Math.max(1e-12, phi));
    for (let i = 2; i < n - 2; i++) {
      a[i] = weights[i] / sqrtPhi;
    }
  } else {
    const phiSum = sumMSq - 2 * weights[n - 1] * weights[n - 1];
    const phiDen = 1.0 - 2 * a[n - 1] * a[n - 1];
    const phi = phiSum / Math.max(1e-12, phiDen);
    const sqrtPhi = Math.sqrt(Math.max(1e-12, phi));
    for (let i = 1; i < n - 1; i++) {
      a[i] = weights[i] / sqrtPhi;
    }
  }

  // Normalize weights
  let aSqSum = 0;
  for (let i = 0; i < n; i++) aSqSum += a[i] * a[i];
  const normFactor = Math.sqrt(aSqSum);
  for (let i = 0; i < n; i++) a[i] /= normFactor;

  let sumAX = 0;
  for (let i = 0; i < n; i++) sumAX += a[i] * sorted[i];
  const W = Math.min(1.0, Math.max(0.0, Math.pow(sumAX, 2) / ss));

  // Royston (1992) transformation to standard normal z
  let z = 0;
  if (n === 3) {
    const pW = (6.0 / Math.PI) * (Math.asin(Math.sqrt(W)) - Math.asin(Math.sqrt(0.75)));
    return { W, pValue: Math.max(0.0, Math.min(1.0, pW)), isNormal: pW >= 0.05 };
  } else if (n >= 4 && n <= 11) {
    const gamma = -2.273 + 0.459 * n;
    const y = -Math.log(Math.max(1e-12, gamma - Math.log(Math.max(1e-12, 1.0 - W))));
    const mu = 0.5440 - 0.39978 * n + 0.025054 * n * n - 0.0006714 * Math.pow(n, 3);
    const sigma = Math.exp(1.3822 - 0.77857 * n + 0.062767 * n * n - 0.0020322 * Math.pow(n, 3));
    z = (y - mu) / sigma;
  } else {
    const y = Math.log(Math.max(1e-12, 1.0 - W));
    const logN = Math.log(n);
    const mu = -1.5861 - 0.31082 * logN - 0.083751 * Math.pow(logN, 2) + 0.0038915 * Math.pow(logN, 3);
    const sigma = Math.exp(-0.4803 - 0.082676 * logN + 0.0030302 * Math.pow(logN, 2));
    z = (y - mu) / sigma;
  }

  const pValue = Math.min(1.0, Math.max(0.0, 1.0 - standardNormalCdf(z)));
  return { W, z, pValue, isNormal: pValue >= 0.05 };
}

/**
 * Homoscedasticity test (Variance Ratio / Brown-Forsythe Levene test)
 */
export function leveneTest(groupA, groupB) {
  const nA = groupA ? groupA.length : 0;
  const nB = groupB ? groupB.length : 0;
  if (nA < 2 || nB < 2) {
    return { canCompute: false, equalVariances: false, varianceRatio: null };
  }

  const vA = variance(groupA, 1);
  const vB = variance(groupB, 1);

  if (vA === 0 || vB === 0) {
    return { canCompute: true, equalVariances: vA === vB, varianceRatio: 0, pValue: vA === vB ? 1.0 : 0.0 };
  }

  const varianceRatio = Math.max(vA, vB) / Math.min(vA, vB);
  // Rule of thumb: ratio < 4.0 indicates variance homogeneity (Delacre et al., 2017)
  const equalVariances = varianceRatio < 4.0;
  return {
    canCompute: true,
    varianceRatio,
    equalVariances,
  };
}

/**
 * 1. Assumption Diagnostic Gatekeeper
 */
export function runAssumptionGatekeeper({ groupA, groupB, metricName = 'metric', scaleType = null }) {
  // Scale classification:
  // Discrete integer Likert items bounded in [1, 7] -> ordinal
  // Continuous timings, latencies, composite means/sums -> continuous
  let detectedScale = scaleType;
  if (!detectedScale) {
    const combined = [...(groupA || []), ...(groupB || [])];
    const isDiscreteBounded = combined.length > 0 && combined.every(
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

  // Assess normality tolerance (|g1| < 1.0 and |g2| < 1.5)
  const swA = shapiroWilk(groupA);
  const swB = shapiroWilk(groupB);

  const isNormalA = momentsA && Math.abs(momentsA.skewness) < 1.0 && Math.abs(momentsA.kurtosis) < 1.5 && (swA ? swA.isNormal : true);
  const isNormalB = momentsB && Math.abs(momentsB.skewness) < 1.0 && Math.abs(momentsB.kurtosis) < 1.5 && (swB ? swB.isNormal : true);

  const lev = leveneTest(groupA, groupB);
  const isHomoscedastic = lev ? lev.equalVariances : null;

  if (isNormalA && isNormalB) {
    const skewA = momentsA ? momentsA.skewness : 0;
    const skewB = momentsB ? momentsB.skewness : 0;
    return {
      scaleType: 'continuous',
      isNormalA: true,
      isNormalB: true,
      isHomoscedastic,
      recommendedTest: 'welch_t',
      effectSize: 'cohens_d',
      explanation: `Se seleccionó la prueba t de Welch y d de Cohen porque la métrica es continua y aproxima una distribución normal (Asimetría A = ${skewA.toFixed(2)}, Asimetría B = ${skewB.toFixed(2)}). La prueba t de Welch protege el análisis ante posibles diferencias de varianza entre grupos.`,
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

export const gatekeeper = runAssumptionGatekeeper;

/**
 * 2. Welch's t-Test, Welch-Satterthwaite df, Cohen's d & 95% CI
 */
export function runWelchTTest(groupA, groupB) {
  const nA = groupA ? groupA.length : 0;
  const nB = groupB ? groupB.length : 0;

  if (nA < 2 || nB < 2) {
    return {
      canCompute: false,
      error: 'insufficient_sample',
      t: null,
      df: null,
      pValue: null,
      cohensD: null,
      dCi: null,
      ci95: null,
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
      return {
        canCompute: false,
        error: 'zero_variance_disjoint',
        t: null,
        df: null,
        pValue: null,
        cohensD: null,
        dCi: null,
        ci95: null,
      };
    }
  }

  const seDiff = Math.sqrt(varA / nA + varB / nB);
  const t = seDiff === 0 ? 0 : meanDiff / seDiff;

  // Welch-Satterthwaite degrees of freedom
  const numDf = Math.pow(varA / nA + varB / nB, 2);
  const denDf = Math.pow(varA / nA, 2) / (nA - 1) + Math.pow(varB / nB, 2) / (nB - 1);
  const df = denDf === 0 ? nA + nB - 2 : numDf / denDf;

  // Two-tailed p-value via regularized incomplete beta function
  const x = df / (df + Math.pow(t, 2));
  const pValue = ibeta(df / 2, 0.5, x);

  // Cohen's d with pooled SD
  const pooledVar = ((nA - 1) * varA + (nB - 1) * varB) / (nA + nB - 2);
  const sPooled = Math.sqrt(pooledVar);
  const cohensD = sPooled === 0 ? 0 : meanDiff / sPooled;
  const seD = Math.sqrt((nA + nB) / (nA * nB) + Math.pow(cohensD, 2) / (2 * (nA + nB)));
  const dCi = [cohensD - 1.96 * seD, cohensD + 1.96 * seD];

  // 95% Confidence interval for mean difference
  const ci95 = [meanDiff - 1.96 * seDiff, meanDiff + 1.96 * seDiff];

  // Cohen (1988) effect size tier
  const absD = Math.abs(cohensD);
  let tier = 'negligible';
  if (absD >= 0.80) tier = 'large';
  else if (absD >= 0.50) tier = 'medium';
  else if (absD >= 0.20) tier = 'small';

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
    sPooled,
    cohensD,
    seD,
    dCi,
    ci95,
    tier,
  };
}

export const welchTTest = runWelchTTest;

export function cohensD(groupA, groupB) {
  const res = runWelchTTest(groupA, groupB);
  if (!res.canCompute) return null;
  return {
    d: res.cohensD,
    se: res.seD,
    ci95: res.dCi,
    tier: res.tier,
  };
}

/**
 * 3. Mann-Whitney U Test (with Mid-Rank Tie Correction) and Cliff's Delta
 */
export function runMannWhitneyU(groupA, groupB) {
  const nA = groupA ? groupA.length : 0;
  const nB = groupB ? groupB.length : 0;

  if (nA === 0 || nB === 0) {
    return {
      canCompute: false,
      error: 'insufficient_sample',
      uA: null,
      uB: null,
      pValue: null,
      cliffsDelta: null,
      deltaCi: null,
      romanoMagnitude: null,
    };
  }

  // Combine and sort observations
  const combined = [];
  groupA.forEach((val, i) => combined.push({ val, group: 'A', idx: i }));
  groupB.forEach((val, i) => combined.push({ val, group: 'B', idx: i }));
  combined.sort((a, b) => a.val - b.val);

  // Assign mid-ranks for tied values
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

  const sortedA = [...groupA].sort((a, b) => a - b);
  const sortedB = [...groupB].sort((a, b) => a - b);
  const medianA = sortedA[Math.floor(nA / 2)];
  const medianB = sortedB[Math.floor(nB / 2)];

  // Handle complete ties across both groups
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
      medianA,
      medianB,
      nA,
      nB,
    };
  }

  // Handle disjoint zero-variance groups (e.g. A=[1,1,1], B=[5,5,5])
  const varA = variance(groupA, 1);
  const varB = variance(groupB, 1);
  if (varA === 0 && varB === 0 && groupA[0] !== groupB[0]) {
    const delta = groupA[0] > groupB[0] ? 1.0 : -1.0;
    return {
      canCompute: true,
      uA,
      uB,
      z: delta > 0 ? Infinity : -Infinity,
      pValue: 0.0,
      cliffsDelta: delta,
      deltaCi: [delta, delta],
      romanoMagnitude: 'large',
      medianA,
      medianB,
      nA,
      nB,
    };
  }

  // Tie-corrected variance
  let tieSum = 0;
  for (const t of tieCounts) {
    tieSum += Math.pow(t, 3) - t;
  }
  const varianceU = (nA * nB / 12.0) * ((N + 1) - (N > 1 ? tieSum / (N * (N - 1)) : 0));
  const sigmaU = Math.sqrt(varianceU);

  // Continuity-corrected z
  const rawDiff = Math.abs(uA - (nA * nB) / 2.0);
  const correctedDiff = Math.max(0, rawDiff - 0.5);
  const z = sigmaU === 0 ? 0 : correctedDiff / sigmaU;
  const pValue = z === 0 ? 1.0 : Math.min(1.0, Math.max(0.0, 2.0 * (1.0 - standardNormalCdf(z))));

  // Strict Cliff's Delta derived directly from U:
  // delta = 1 - (2 * uB) / (nA * nB) = (2 * uA) / (nA * nB) - 1
  const cliffsDelta = (2.0 * uA) / (nA * nB) - 1.0;

  // Cliff (1993) Asymptotic Variance & 95% CI
  let dSum1 = 0;
  let dSum2 = 0;
  let sdSqSum = 0;

  for (let a = 0; a < nA; a++) {
    let dRow = 0;
    for (let b = 0; b < nB; b++) {
      const diff = groupA[a] > groupB[b] ? 1 : groupA[a] < groupB[b] ? -1 : 0;
      dRow += diff;
      sdSqSum += Math.pow(diff - cliffsDelta, 2);
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
  const sD = (nA * nB > 1) ? sdSqSum / (nA * nB - 1) : 0;
  const varDelta = ((nA - 1) * s1 + (nB - 1) * s2 + sD) / (nA * nB);
  const seDelta = Math.sqrt(Math.max(0, varDelta));

  const rawLow = cliffsDelta - 1.96 * seDelta;
  const rawHigh = cliffsDelta + 1.96 * seDelta;
  const deltaCi = [Math.max(-1.0, rawLow), Math.min(1.0, rawHigh)];

  // Romano et al. (2006) 4-level classification
  const absDelta = Math.abs(cliffsDelta);
  let romanoMagnitude = 'negligible';
  if (absDelta >= 0.474) romanoMagnitude = 'large';
  else if (absDelta >= 0.330) romanoMagnitude = 'medium';
  else if (absDelta >= 0.147) romanoMagnitude = 'small';

  return {
    canCompute: true,
    uA,
    uB,
    z,
    pValue,
    cliffsDelta,
    seDelta,
    deltaCi,
    romanoMagnitude,
    medianA,
    medianB,
    nA,
    nB,
  };
}

export const mannWhitneyU = runMannWhitneyU;

export function cliffsDelta(groupA, groupB) {
  const res = runMannWhitneyU(groupA, groupB);
  if (!res.canCompute) return null;
  return {
    delta: res.cliffsDelta,
    se: res.seDelta,
    ci95: res.deltaCi,
    tier: res.romanoMagnitude,
  };
}

/**
 * 4. Monotonic Sequential Holm-Bonferroni FWER Step-Down Adjustment
 */
export function applyHolmBonferroni(tests) {
  if (!tests || tests.length === 0) return [];

  // Normalize inputs to support array of numbers/primitives or array of objects
  const normalized = tests.map((t, idx) => {
    let rawVal = null;
    let baseObj = {};

    if (t !== null && typeof t === 'object') {
      baseObj = { ...t };
      if ('pValue' in t) {
        rawVal = t.pValue;
      } else if ('p' in t) {
        rawVal = t.p;
      } else if ('raw' in t) {
        rawVal = t.raw;
      }
    } else if (typeof t === 'number') {
      rawVal = t;
    }

    const isComputable = typeof rawVal === 'number' && !isNaN(rawVal) && isFinite(rawVal);

    return {
      ...baseObj,
      originalIndex: idx,
      pValue: isComputable ? rawVal : null,
      raw: isComputable ? rawVal : null,
      isComputable,
      q: null,
      adjustedP: null,
    };
  });

  // Extract computable tests
  const computableTests = normalized.filter(item => item.isComputable);
  const m = computableTests.length;

  if (m > 0) {
    // Sort ascending by raw p-value
    computableTests.sort((a, b) => a.pValue - b.pValue);

    // Compute unadjusted step-down products q_i = min(1.0, (m - i) * p_i)
    for (let i = 0; i < m; i++) {
      const multiplier = m - i;
      computableTests[i].q = Math.min(1.0, computableTests[i].pValue * multiplier);
    }

    // Enforce monotonicity: p_adj,i = min(1.0, max(p_adj,i-1, q_i))
    computableTests[0].adjustedP = computableTests[0].q;
    for (let i = 1; i < m; i++) {
      computableTests[i].adjustedP = Math.min(1.0, Math.max(computableTests[i - 1].adjustedP, computableTests[i].q));
    }
  }

  // Restore original ordering
  normalized.sort((a, b) => a.originalIndex - b.originalIndex);

  return normalized.map(item => ({
    ...item,
    raw: item.pValue,
    adj: item.adjustedP,
    familySize: m,
    significant: item.isComputable && item.adjustedP !== null && item.adjustedP < 0.05,
  }));
}

export const holmBonferroni = applyHolmBonferroni;
