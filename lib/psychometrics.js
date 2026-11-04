/**
 * Psychometrics & Learning Gain Engine
 *
 * Implements:
 * - Hake's normalized learning gain (g) with class gain, individual gains, and 95% CI
 * - Cronbach's alpha (alpha) with reverse-coding, corrected item-total correlations (r_it-c),
 *   and alpha-if-item-deleted diagnostics
 *
 * Reference: survey_stats.md §4.5, §4.6, PROJECT.md
 */

/**
 * Hake's Normalized Learning Gain (g)
 * 
 * @param {number[]} preScores - Baseline scores for each participant
 * @param {number[]} postScores - Follow-up scores for each participant
 * @param {number} maxScore - Maximum possible score on the assessment scale (default: 5.0)
 * @returns {object} Calculated gains, confidence interval, and tier
 */
export function calculateHakeGain(preScores, postScores, maxScore = 5.0) {
  if (!preScores || !postScores || preScores.length === 0 || preScores.length !== postScores.length) {
    return {
      canCompute: false,
      error: 'invalid_paired_arrays',
      g: null,
      gClass: null,
      gIndivMean: null,
      ci: null,
    };
  }

  const n = preScores.length;
  const meanPre = preScores.reduce((acc, v) => acc + v, 0) / n;
  const meanPost = postScores.reduce((acc, v) => acc + v, 0) / n;

  // Class Average Gain (Hake, 1998): g_class = (Post_bar - Pre_bar) / (Max - Pre_bar)
  const gClass = maxScore === meanPre
    ? (meanPost === maxScore ? 1.0 : 0.0)
    : (meanPost - meanPre) / (maxScore - meanPre);

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
  const varG = n > 1
    ? individualGains.reduce((acc, v) => acc + Math.pow(v - gIndivMean, 2), 0) / (n - 1)
    : 0;
  const seG = Math.sqrt(varG / n);
  const ci = [
    Math.max(-1.0, gIndivMean - 1.96 * seG),
    Math.min(1.0, gIndivMean + 1.96 * seG),
  ];

  // Hake (1998) Tiers: low (< 0.30), medium (0.30 - 0.70), high (>= 0.70)
  let tier = 'low';
  if (gClass >= 0.70) tier = 'high';
  else if (gClass >= 0.30) tier = 'medium';

  return {
    canCompute: true,
    g: gClass,
    gClass,
    gIndivMean,
    individualGains,
    se: seG,
    ci,
    meanPre,
    meanPost,
    tier,
    n,
  };
}

export const hakeGain = calculateHakeGain;

/**
 * Cronbach's Alpha (alpha) with Reverse-Coding & Item Diagnostics
 * 
 * @param {number[][]} matrix - N x k participant-by-item response matrix
 * @param {number[]} reverseItems - 0-based indices of items to reverse-score
 * @param {number} scaleMin - Scale minimum (default: 1)
 * @param {number} scaleMax - Scale maximum (default: 5)
 * @returns {object} Alpha, corrected item-total correlations, alpha-if-deleted, flagged items
 */
export function calculateCronbachAlpha(matrix, reverseItems = [], scaleMin = 1, scaleMax = 5) {
  const N = matrix ? matrix.length : 0;
  if (N < 2) {
    return {
      canCompute: false,
      error: 'insufficient_sample',
      alpha: null,
      itemTotalCorrelations: [],
    };
  }
  const k = matrix[0] ? matrix[0].length : 0;
  if (k < 2) {
    return {
      canCompute: false,
      error: 'minimum_two_items_required',
      alpha: null,
      itemTotalCorrelations: [],
    };
  }

  // Reverse-code specified columns: X_recoded = (scaleMax + scaleMin) - X
  const recoded = matrix.map(row => {
    return row.map((val, colIdx) => {
      if (reverseItems.includes(colIdx)) {
        return (scaleMax + scaleMin) - val;
      }
      return val;
    });
  });

  // Calculate item means and item sample variances
  const itemMeans = new Array(k).fill(0);
  const itemVars = new Array(k).fill(0);

  for (let j = 0; j < k; j++) {
    for (let i = 0; i < N; i++) {
      itemMeans[j] += recoded[i][j];
    }
    itemMeans[j] /= N;

    for (let i = 0; i < N; i++) {
      itemVars[j] += Math.pow(recoded[i][j] - itemMeans[j], 2);
    }
    itemVars[j] /= (N - 1);
  }

  const sumItemVars = itemVars.reduce((acc, v) => acc + v, 0);

  // Total scores per participant and total variance
  const totalScores = recoded.map(row => row.reduce((acc, v) => acc + v, 0));
  const meanTotal = totalScores.reduce((acc, v) => acc + v, 0) / N;
  const varTotal = totalScores.reduce((acc, v) => acc + Math.pow(v - meanTotal, 2), 0) / (N - 1);

  if (varTotal === 0) {
    return {
      canCompute: true,
      alpha: 0.0,
      isAcceptable: false,
      itemTotalCorrelations: new Array(k).fill(0),
      alphaIfDeleted: new Array(k).fill(0),
      flaggedItems: [],
      flaggedReverseOmissions: [],
      reverseCodingOmissionSuspected: false,
      k,
      N,
    };
  }

  // Cronbach's alpha formula: alpha = (k / (k - 1)) * (1 - sum(sigma_j^2) / sigma_T^2)
  const alpha = (k / (k - 1)) * (1.0 - sumItemVars / varTotal);

  // Corrected item-total correlations (r_it-c) and alpha-if-deleted
  const itemTotalCorrs = [];
  const alphaIfDeleted = [];
  const flaggedReverseOmissions = [];

  for (let j = 0; j < k; j++) {
    const remainderScores = recoded.map((row, i) => totalScores[i] - row[j]);
    const meanRem = remainderScores.reduce((acc, v) => acc + v, 0) / N;
    let cov = 0;
    let varRem = 0;

    for (let i = 0; i < N; i++) {
      cov += (recoded[i][j] - itemMeans[j]) * (remainderScores[i] - meanRem);
      varRem += Math.pow(remainderScores[i] - meanRem, 2);
    }
    cov /= (N - 1);
    varRem /= (N - 1);

    const r = (itemVars[j] > 0 && varRem > 0)
      ? cov / Math.sqrt(itemVars[j] * varRem)
      : 0;

    itemTotalCorrs.push(r);
    if (r < 0) {
      flaggedReverseOmissions.push(j);
    }

    // Alpha-if-deleted for item j
    if (k > 2 && varRem > 0) {
      const subK = k - 1;
      const subSumVars = sumItemVars - itemVars[j];
      const subAlpha = (subK / (subK - 1)) * (1.0 - subSumVars / varRem);
      alphaIfDeleted.push(subAlpha);
    } else {
      alphaIfDeleted.push(0);
    }
  }

  return {
    canCompute: true,
    alpha,
    isAcceptable: alpha >= 0.70,
    itemTotalCorrelations: itemTotalCorrs,
    alphaIfDeleted,
    flaggedItems: flaggedReverseOmissions,
    flaggedReverseOmissions,
    reverseCodingOmissionSuspected: flaggedReverseOmissions.length > 0,
    k,
    N,
  };
}

export const cronbachAlpha = calculateCronbachAlpha;
