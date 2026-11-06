/**
 * Quick analysis for facilitators: pick a measure, get one plain-language answer plus the numbers
 * behind it. Built on the assumption-first tests in stats.js / stats-multigroup.js.
 */
import { mean, shapiroWilk, runWelchTTest, runMannWhitneyU } from './stats.js';
import { runMultiGroupComparison } from './stats-multigroup.js';

const num = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const makeFmt = (decimal) => {
  const fmt = (n, d = 1) => (Number.isFinite(n) ? n.toFixed(d).replace('.', decimal) : '–');
  const fmtP = (p) => (p < 0.001 ? `< 0${decimal}001` : fmt(p, 3));
  return { fmt, fmtP };
};
/** Default translator: Spanish source text with {placeholders} filled in. */
const identityTr = (text, vars) => (vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text);
const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const sd = (a) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((acc, x) => acc + (x - m) ** 2, 0) / (a.length - 1));
};
const MAGNITUDE_ES = { negligible: 'insignificante', small: 'pequeño', medium: 'mediano', large: 'grande' };
const dMagnitude = (d) => (Math.abs(d) < 0.2 ? 'negligible' : Math.abs(d) < 0.5 ? 'small' : Math.abs(d) < 0.8 ? 'medium' : 'large');

/** Find a session's answer for a survey question (answers are keyed by question text, sometimes with a scale suffix). */
function answerFor(answers, question) {
  if (!answers) return undefined;
  if (question.id in answers) return answers[question.id];
  const key = Object.keys(answers).find((k) => k === question.text || k.startsWith(question.text));
  return key ? answers[key] : undefined;
}

/**
 * Measures available for a set of sessions, each with values grouped by condition (or by step with groupBy: 'step').
 * @returns {{id:string,label:string,ordinal:boolean,groups:Record<string,number[]>}[]}
 */
export function extractMeasures({ sessions = [], workshops = [], versions = [], groupBy = 'condition' }) {
  const title = new Map(versions.map((v) => [v.id, v.title]));
  const wsById = new Map(workshops.map((w) => [w.id, w]));

  const messages = { id: 'messages', label: 'Mensajes que escribió cada participante', ordinal: false, groups: {} };
  const questions = new Map(); // text -> measure
  for (const s of sessions) {
    const cond = groupBy === 'step' ? wsById.get(s.workshop_id)?.name || 'Sin paso' : title.get(s.version_id) || 'Sin condición';
    const mCount = num(s.interaction_count);
    if (mCount !== null) (messages.groups[cond] ||= []).push(mCount);

    const cfg = wsById.get(s.workshop_id)?.survey_config || [];
    for (const q of cfg) {
      if (q.type !== 'likert') continue;
      if (!questions.has(q.text)) questions.set(q.text, { id: `q:${q.text}`, label: q.text, ordinal: true, groups: {} });
      const v = num(answerFor(s.survey_answers, q));
      if (v !== null) (questions.get(q.text).groups[cond] ||= []).push(v);
    }
  }
  return [...questions.values(), messages].filter((m) => Object.values(m.groups).some((g) => g.length > 0));
}

export function describeGroups(groups) {
  return Object.entries(groups).map(([label, values]) => ({
    label,
    n: values.length,
    mean: values.length ? mean(values) : null,
    sd: sd(values),
    median: values.length ? median(values) : null,
  }));
}

/**
 * @param {Record<string, number[]>} groups values per condition
 * @param {{ordinal?: boolean, tr?: Function, decimal?: string}} opts
 *   ordinal (Likert) data always uses rank-based tests; tr translates the Spanish sentences
 *   (pass the UI's tr); decimal is the decimal separator for numbers inside sentences.
 */
export function analyzeMeasure(groups, { ordinal = false, tr = identityTr, decimal = ',' } = {}) {
  const { fmt, fmtP } = makeFmt(decimal);
  const usable = Object.fromEntries(Object.entries(groups).filter(([, v]) => v.length > 0));
  const labels = Object.keys(usable);
  const descriptives = describeGroups(usable);
  if (labels.length < 2) {
    return { status: 'not_enough_groups', descriptives, summary: tr('Hace falta que al menos dos condiciones tengan respuestas para poder compararlas.') };
  }
  if (descriptives.some((d) => d.n < 3)) {
    return { status: 'too_few', descriptives, summary: tr('Todavía hay muy pocas respuestas en alguna condición (menos de 3). Espera a tener más antes de comparar.') };
  }

  const top = [...descriptives].sort((a, b) => b.mean - a.mean)[0];
  const minN = Math.min(...descriptives.map((d) => d.n));
  const caution = minN < 20 ? ` ${tr('Con menos de 20 personas por condición, tómalo como una pista y no como una conclusión.')}` : '';
  const base = { status: 'ok', descriptives, minN };

  if (labels.length === 2) {
    const [a, b] = labels;
    const bothNormal = !ordinal && [usable[a], usable[b]].every((g) => shapiroWilk(g).isNormal === true);
    const res = bothNormal ? runWelchTTest(usable[a], usable[b]) : runMannWhitneyU(usable[a], usable[b]);
    if (res.canCompute === false) return { ...base, status: 'cannot_compute', summary: tr('No pudimos comparar estas condiciones con los datos actuales.') };
    const p = res.pValue;
    const effect = bothNormal ? res.cohensD : res.cliffsDelta;
    const magnitude = bothNormal ? dMagnitude(effect) : res.romanoMagnitude;
    const significant = p < 0.05;
    const summary = significant
      ? tr('“{top}” obtuvo valores más altos (promedio {mean}). La diferencia entre las dos condiciones probablemente no es azar (p = {p}) y el efecto es {magnitude}.{caution}', { top: top.label, mean: fmt(top.mean), p: fmtP(p), magnitude: tr(MAGNITUDE_ES[magnitude] || magnitude), caution })
      : tr('No hay evidencia clara de diferencia entre las dos condiciones (p = {p}).{caution}', { p: fmtP(p), caution });
    return {
      ...base,
      test: bothNormal ? 'welch-t' : 'mann-whitney-u',
      testLabel: bothNormal ? 'Prueba t de Welch' : 'U de Mann-Whitney',
      pValue: p,
      effectLabel: bothNormal ? 'd de Cohen' : 'δ de Cliff',
      effectValue: effect,
      magnitude,
      significant,
      glossary: bothNormal ? 'd' : 'cliff-delta',
      summary,
    };
  }

  const multi = runMultiGroupComparison(usable, { forceNonparametric: ordinal });
  if (!multi.canCompute) return { ...base, status: 'cannot_compute', summary: tr('No pudimos comparar estas condiciones con los datos actuales.') };
  const o = multi.omnibus;
  const effectLabel = multi.test === 'kruskal-wallis' ? 'ε² (épsilon cuadrado)' : 'η² (eta cuadrado)';
  const effectValue = multi.test === 'kruskal-wallis' ? o.epsilonSquared : o.etaSquared;
  const summary = multi.significant
    ? tr('Hay diferencias entre las {n} condiciones (p = {p}); “{top}” tiene el promedio más alto ({mean}). El efecto es {magnitude}. Abajo ves qué pares se distinguen.{caution}', { n: labels.length, p: fmtP(o.pValue), top: top.label, mean: fmt(top.mean), magnitude: tr(MAGNITUDE_ES[o.magnitude]), caution })
    : tr('No hay evidencia clara de diferencias entre las {n} condiciones (p = {p}).{caution}', { n: labels.length, p: fmtP(o.pValue), caution });
  return {
    ...base,
    test: multi.test,
    testLabel: multi.test === 'kruskal-wallis' ? 'Kruskal-Wallis' : 'ANOVA de Welch',
    pValue: o.pValue,
    effectLabel,
    effectValue,
    magnitude: o.magnitude,
    significant: multi.significant,
    posthoc: multi.posthoc,
    glossary: 'p-holm',
    summary,
  };
}
