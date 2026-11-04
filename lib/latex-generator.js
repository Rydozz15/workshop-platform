/**
 * Publication-Grade LaTeX booktabs Table Generator
 *
 * Implements:
 * - Direct one-click compilable LaTeX table using strict booktabs syntax (\toprule, \midrule, \bottomrule)
 * - Safe character escaping (%, _, &, #) while preserving existing LaTeX math modes
 * - Formats continuous metrics with Welch t / Cohen's d [95% CI]
 * - Formats ordinal Likert metrics with Mann-Whitney U / Cliff's delta [95% CI]
 * - Formats raw p and Holm-Bonferroni adjusted p with significance asterisks (* for p < 0.05)
 *
 * Reference: survey_stats.md §6.3, PROJECT.md
 */

/**
 * Escapes special LaTeX characters outside math mode.
 * 
 * @param {string} str - Raw text or LaTeX snippet
 * @returns {string} Escaped LaTeX text
 */
export function escapeLatex(str) {
  if (!str || typeof str !== 'string') return '';

  // If string contains math mode $...$, preserve math chunks
  const parts = str.split(/(\$[^$]+\$)/g);
  return parts.map((part, idx) => {
    // If odd index, it is inside $...$
    if (idx % 2 === 1) {
      return part;
    }
    // Outside math mode: escape %, _, &, # only if not already escaped
    return part
      .replace(/(?<!\\)%/g, '\\%')
      .replace(/(?<!\\)_/g, '\\_')
      .replace(/(?<!\\)&/g, '\\&')
      .replace(/(?<!\\)#/g, '\\#');
  }).join('');
}

/**
 * Formats a numeric value with fixed decimals, or returns 'N/A' if null/undefined.
 */
function formatNum(val, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return Number(val).toFixed(decimals);
}

/**
 * Formats a p-value to 3 decimal places with optional significance asterisk.
 */
function formatP(val, isSignificant = false) {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  const num = Number(val);
  const pStr = num < 0.001 ? '< 0.001' : num.toFixed(3);
  return isSignificant ? `${pStr}*` : pStr;
}

/**
 * Generates compilable LaTeX table with booktabs syntax.
 * 
 * @param {object} results - Results object with continuous and/or ordinal arrays
 * @param {object} options - Table options (caption, label, familySize)
 * @returns {string} Compilable LaTeX table snippet
 */
export function generateBooktabsTable(results = {}, options = {}) {
  const caption = options.caption || 'Comparative Evaluation: Condition A vs. Condition B.';
  const label = options.label || 'tab:promptsketch_results';
  const familySize = options.familySize || (
    ((results.continuous || []).length) + ((results.ordinal || []).length)
  );

  let latex = '\\begin{table}[htbp]\n\\centering\n';
  latex += `\\caption{${escapeLatex(caption)}}\n`;
  latex += `\\label{${label}}\n`;
  latex += '\\begin{tabular}{lrrrrr}\n';
  latex += '\\toprule\n';
  latex += 'Metric & Cond. A & Cond. B & Effect Size [95\\% CI] & $p_{\\text{raw}}$ & $p_{\\text{Holm}}$ \\\\\n';

  // 1. Continuous Metrics
  const continuous = results.continuous || [];
  if (continuous.length > 0) {
    latex += '\\midrule\n';
    latex += '\\multicolumn{6}{l}{\\textit{Continuous Metrics (Welch\'s $t$-test)}} \\\\\n';
    for (const row of continuous) {
      const metricName = escapeLatex(row.name || 'Metric');
      const meanA = formatNum(row.meanA, 1);
      const meanB = formatNum(row.meanB, 1);

      let effectStr = 'N/A';
      if (row.cohensD !== null && row.cohensD !== undefined && !isNaN(row.cohensD)) {
        const dSign = row.cohensD >= 0 ? '+' : '';
        const dVal = row.cohensD.toFixed(2);
        if (row.dCi && Array.isArray(row.dCi) && row.dCi.length === 2) {
          const c0Sign = row.dCi[0] >= 0 ? '+' : '';
          const c1Sign = row.dCi[1] >= 0 ? '+' : '';
          effectStr = `$d = ${dSign}${dVal}$ [${c0Sign}${row.dCi[0].toFixed(2)}, ${c1Sign}${row.dCi[1].toFixed(2)}]`;
        } else {
          effectStr = `$d = ${dSign}${dVal}$`;
        }
      }

      const pRaw = formatP(row.pValue, false);
      const isSig = (row.adjustedP !== null && row.adjustedP !== undefined && row.adjustedP < 0.05);
      const pHolm = formatP(row.adjustedP, isSig);

      latex += `${metricName} & ${meanA} & ${meanB} & ${effectStr} & ${pRaw} & ${pHolm} \\\\\n`;
    }
  }

  // 2. Ordinal Metrics
  const ordinal = results.ordinal || [];
  if (ordinal.length > 0) {
    latex += '\\midrule\n';
    latex += '\\multicolumn{6}{l}{\\textit{Ordinal Likert Dimensions (Mann-Whitney $U$)}} \\\\\n';
    for (const row of ordinal) {
      const metricName = escapeLatex(row.name || 'Metric');
      const medA = formatNum(row.medianA !== undefined ? row.medianA : row.meanA, 1);
      const medB = formatNum(row.medianB !== undefined ? row.medianB : row.meanB, 1);

      let effectStr = 'N/A';
      if (row.cliffsDelta !== null && row.cliffsDelta !== undefined && !isNaN(row.cliffsDelta)) {
        const deltaSign = row.cliffsDelta >= 0 ? '+' : '';
        const deltaVal = row.cliffsDelta.toFixed(2);
        if (row.deltaCi && Array.isArray(row.deltaCi) && row.deltaCi.length === 2) {
          const c0Sign = row.deltaCi[0] >= 0 ? '+' : '';
          const c1Sign = row.deltaCi[1] >= 0 ? '+' : '';
          effectStr = `$\\delta = ${deltaSign}${deltaVal}$ [${c0Sign}${row.deltaCi[0].toFixed(2)}, ${c1Sign}${row.deltaCi[1].toFixed(2)}]`;
        } else {
          effectStr = `$\\delta = ${deltaSign}${deltaVal}$`;
        }
      }

      const pRaw = formatP(row.pValue, false);
      const isSig = (row.adjustedP !== null && row.adjustedP !== undefined && row.adjustedP < 0.05);
      const pHolm = formatP(row.adjustedP, isSig);

      latex += `${metricName} & ${medA} & ${medB} & ${effectStr} & ${pRaw} & ${pHolm} \\\\\n`;
    }
  }

  latex += '\\bottomrule\n';
  const familyNote = familySize > 0 ? `Family size $m=${familySize}$. ` : '';
  latex += `\\multicolumn{6}{l}{\\footnotesize Note: ${familyNote}*Significant after Holm-Bonferroni correction ($\\alpha = 0.05$).} \\\\\n`;
  latex += '\\end{tabular}\n';
  latex += '\\end{table}\n';

  return latex;
}
