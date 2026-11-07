/**
 * Inter-Rater Reliability (IRR) Calibration Module
 *
 * Implements:
 * - Confusion matrix calculation
 * - Cohen's Kappa (kappa)
 * - Gwet's AC1 (prevalence-paradox sensitivity complement)
 * - Prevalence Paradox diagnostic detection
 *
 * Reference: survey_stats.md §4.7, PROJECT.md
 */

/** Spanish source text; the analysis screen translates it with tr(). */
export const PREVALENCE_WARNING =
  'Alerta de Paradoja de Prevalencia: una categoría concentra más del 80% de los casos, provocando el colapso artificial de Kappa de Cohen. Se reporta AC₁ de Gwet como estimador no sesgado.';

/**
 * Builds a C x C confusion matrix from paired categorical ratings.
 * 
 * @param {Array} rater1 - Ratings from first judge
 * @param {Array} rater2 - Ratings from second judge
 * @param {Array} categories - Optional explicit list of categories
 * @returns {object} { matrix, categories, sampleSize }
 */
export function calculateConfusionMatrix(rater1, rater2, categories = null) {
  const N = rater1 ? rater1.length : 0;
  if (N === 0 || !rater2 || N !== rater2.length) {
    return null;
  }

  const catSet = new Set(categories || [...rater1, ...rater2]);
  const catList = Array.from(catSet);
  const C = catList.length;

  const matrix = Array.from({ length: C }, () => new Array(C).fill(0));
  for (let i = 0; i < N; i++) {
    const idx1 = catList.indexOf(rater1[i]);
    const idx2 = catList.indexOf(rater2[i]);
    if (idx1 >= 0 && idx2 >= 0) {
      matrix[idx1][idx2]++;
    }
  }

  return {
    matrix,
    categories: catList,
    sampleSize: N,
  };
}

/**
 * Computes Cohen's Kappa from a confusion matrix.
 * 
 * @param {number[][]} matrix - C x C contingency counts
 * @returns {object} { observedAgreement, peCohen, kappa }
 */
export function cohenKappa(matrix) {
  const C = matrix.length;
  let N = 0;
  let agreeCount = 0;

  for (let i = 0; i < C; i++) {
    for (let j = 0; j < C; j++) {
      N += matrix[i][j];
      if (i === j) agreeCount += matrix[i][j];
    }
  }

  if (N === 0) return { observedAgreement: 0, peCohen: 0, kappa: 0 };

  const observedAgreement = agreeCount / N;

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

  const kappa = peCohen === 1.0 ? 1.0 : (observedAgreement - peCohen) / (1.0 - peCohen);
  return { observedAgreement, peCohen, kappa };
}

/**
 * Computes Gwet's AC1 from a confusion matrix.
 * 
 * @param {number[][]} matrix - C x C contingency counts
 * @returns {object} { observedAgreement, peGwet, gwetAC1, maxMarginal }
 */
export function gwetAC1(matrix) {
  const C = matrix.length;
  let N = 0;
  let agreeCount = 0;

  for (let i = 0; i < C; i++) {
    for (let j = 0; j < C; j++) {
      N += matrix[i][j];
      if (i === j) agreeCount += matrix[i][j];
    }
  }

  if (N === 0 || C < 2) return { observedAgreement: 0, peGwet: 0, gwetAC1: 0, maxMarginal: 0 };

  const observedAgreement = agreeCount / N;

  const rowMarginals = matrix.map(row => row.reduce((a, b) => a + b, 0) / N);
  const colMarginals = new Array(C).fill(0);
  for (let j = 0; j < C; j++) {
    for (let i = 0; i < C; i++) {
      colMarginals[j] += matrix[i][j];
    }
    colMarginals[j] /= N;
  }

  let peGwet = 0;
  let maxMarginal = 0;

  for (let c = 0; c < C; c++) {
    const pi_c = (rowMarginals[c] + colMarginals[c]) / 2.0;
    if (pi_c > maxMarginal) maxMarginal = pi_c;
    peGwet += pi_c * (1.0 - pi_c);
  }
  peGwet = peGwet / (C - 1);

  const gwetsAC1 = peGwet === 1.0 ? 1.0 : (observedAgreement - peGwet) / (1.0 - peGwet);
  return { observedAgreement, peGwet, gwetAC1: gwetsAC1, maxMarginal };
}

/**
 * Inter-Rater Reliability (IRR) Calculator
 * 
 * @param {Array} rater1 - Categorical ratings from Rater 1
 * @param {Array} rater2 - Categorical ratings from Rater 2
 * @param {Array} categories - Optional explicit categories
 * @returns {object} Observed agreement, Cohen's kappa, Gwet's AC1, prevalence warning, confusion matrix
 */
export function calculateIRR(rater1, rater2, categories = null) {
  const N = rater1 ? rater1.length : 0;
  if (N === 0 || !rater2 || N !== rater2.length) {
    return {
      canCompute: false,
      error: 'invalid_rater_arrays',
      observedAgreement: null,
      cohenKappa: null,
      gwetsAC1: null,
    };
  }

  const catSet = new Set(categories || [...rater1, ...rater2]);
  const catList = Array.from(catSet);
  const C = catList.length;

  if (C < 2) {
    return {
      canCompute: false,
      error: 'minimum_two_categories_required',
      observedAgreement: null,
      cohenKappa: null,
      gwetsAC1: null,
    };
  }

  const conf = calculateConfusionMatrix(rater1, rater2, catList);
  const matrix = conf.matrix;

  const { observedAgreement, peCohen, kappa: cohenKappaVal } = cohenKappa(matrix);
  const { peGwet, gwetAC1: gwetAC1Val, maxMarginal } = gwetAC1(matrix);

  // Prevalence Paradox Alert:
  // When a single category marginal >= 0.80 and observed agreement >= 0.85 with depressed kappa
  const prevalenceWarning = maxMarginal >= 0.80 && observedAgreement >= 0.85 && (cohenKappaVal < 0.60 || cohenKappaVal < observedAgreement - 0.08);

  const warningMessage = prevalenceWarning ? PREVALENCE_WARNING : null;

  return {
    canCompute: true,
    observedAgreement,
    cohenKappa: cohenKappaVal,
    gwetsAC1: gwetAC1Val,
    peCohen,
    peGwet,
    prevalenceWarning,
    warningMessage,
    confusionMatrix: matrix,
    categories: catList,
    sampleSize: N,
  };
}

export const irr = calculateIRR;
