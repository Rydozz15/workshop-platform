/**
 * Change between the steps of a campaign, question by question.
 * Pure functions, no I/O.
 *
 * A question counts as "the same" across steps when it has the same id (what the "copy questions from
 * the previous step" button preserves) or, for older data, exactly the same text. Only scale (Likert)
 * questions are compared, and only for people who answered them in every step where they appear.
 *
 * 2 steps  -> Wilcoxon signed-rank (paired, exact for small samples).
 * 3+ steps -> Friedman test, plus each later step against the first with Holm adjustment.
 */
import { mean, gammln, standardNormalCdf, applyHolmBonferroni } from './stats.js';
import { canonicalType } from './survey-schema.js';

const MIN_PEOPLE = 3;
const EXACT_LIMIT = 25;

const num = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const normText = (t) => String(t || '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * A session's answer for a question: by id, else by its text (older data stored text keys, sometimes with
 * the scale appended, like "... (1 = Strongly Disagree, 5 = Strongly Agree)"). Same rule as quick-analysis.
 */
export function answerFor(answers, question) {
  if (!answers || typeof answers !== 'object' || !question) return undefined;
  if (question.id && answers[question.id] !== undefined) return answers[question.id];
  if (question.text) {
    if (answers[question.text] !== undefined) return answers[question.text];
    const key = Object.keys(answers).find((k) => k.startsWith(question.text));
    if (key) return answers[key];
  }
  return undefined;
}

/**
 * Groups the questions of an ordered list of steps into "same question" groups.
 * @param {{id:string,name?:string,survey_config?:object[]}[]} steps ordered by step
 * @returns {{key:string,id:string,text:string,type:string,perStep:Map<string,object>}[]}
 */
export function groupQuestions(steps) {
  const byId = new Map();
  const byText = new Map();
  const groups = [];
  for (const step of steps) {
    for (const q of step.survey_config || []) {
      if (!q) continue;
      const text = normText(q.text);
      let g = (q.id && byId.get(q.id)) || (text && byText.get(text)) || null;
      if (!g) {
        g = { key: q.id || text, id: q.id || q.text, text: q.text || q.id || '', type: canonicalType(q.type), perStep: new Map() };
        groups.push(g);
      }
      if (q.id) byId.set(q.id, g);
      if (text) byText.set(text, g);
      if (!g.perStep.has(step.id)) g.perStep.set(step.id, q);
    }
  }
  return groups;
}

/** One session per person and step (the most recent), keyed by chain_user_id. */
export function sessionsByPerson(sessions) {
  const people = new Map();
  for (const s of sessions || []) {
    if (!s.chain_user_id || !s.workshop_id) continue;
    if (!people.has(s.chain_user_id)) people.set(s.chain_user_id, new Map());
    const perStep = people.get(s.chain_user_id);
    const prev = perStep.get(s.workshop_id);
    if (!prev || new Date(s.started_at || 0) >= new Date(prev.started_at || 0)) perStep.set(s.workshop_id, s);
  }
  return people;
}

// ---------- statistics ----------

/** Mid-ranks (ties share the average rank), 1-based. */
function midRanks(values) {
  const order = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const ranks = new Array(values.length);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    const r = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[order[k][1]] = r;
    i = j + 1;
  }
  return ranks;
}

/** Two-sided Wilcoxon signed-rank test on paired values (after minus before). */
export function wilcoxonSignedRank(before, after) {
  const diffs = before.map((b, i) => after[i] - b).filter((d) => d !== 0);
  const n = diffs.length;
  if (n === 0) return { n: 0, p: 1, exact: true, medianChange: 0 };
  const abs = diffs.map(Math.abs);
  const ranks = midRanks(abs);
  const wPlus = diffs.reduce((acc, d, i) => (d > 0 ? acc + ranks[i] : acc), 0);
  const total = (n * (n + 1)) / 2;

  let p;
  let exact = false;
  if (n <= EXACT_LIMIT) {
    // Exact permutation distribution over the 2^n sign assignments, with doubled mid-ranks as integers.
    const r2 = ranks.map((r) => Math.round(r * 2));
    const sum2 = r2.reduce((a, b) => a + b, 0);
    let dp = new Array(sum2 + 1).fill(0);
    dp[0] = 1;
    for (const r of r2) {
      const next = new Array(sum2 + 1).fill(0);
      for (let s = 0; s <= sum2; s++) {
        if (!dp[s]) continue;
        next[s] += dp[s];
        next[s + r] += dp[s];
      }
      dp = next;
    }
    const obs2 = Math.round(wPlus * 2);
    const dist = Math.abs(obs2 - sum2 / 2);
    let tail = 0;
    for (let s = 0; s <= sum2; s++) if (Math.abs(s - sum2 / 2) >= dist - 1e-9) tail += dp[s];
    p = Math.min(1, tail / 2 ** n);
    exact = true;
  } else {
    const tieCounts = new Map();
    abs.forEach((a) => tieCounts.set(a, (tieCounts.get(a) || 0) + 1));
    const tieAdj = [...tieCounts.values()].reduce((acc, t) => acc + (t ** 3 - t), 0) / 48;
    const variance = (n * (n + 1) * (2 * n + 1)) / 24 - tieAdj;
    const z = (Math.abs(wPlus - total / 2) - 0.5) / Math.sqrt(variance);
    p = Math.min(1, 2 * (1 - standardNormalCdf(Math.max(0, z))));
  }
  const sorted = [...diffs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianChange = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { n, p, exact, medianChange };
}

/** Regularized upper incomplete gamma Q(a, x): chi-square survival function is Q(df/2, x/2). */
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
  const tiny = 1e-300;
  let b = x + 1 - a;
  let c = 1 / tiny;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < tiny) d = tiny;
    c = b + an / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-14) break;
  }
  return Math.exp(-x + a * Math.log(x) - gammln(a)) * h;
}

/** Friedman test: rows are people, columns are steps. Returns chi-square, df, p and Kendall's W. */
export function friedmanTest(rows) {
  const n = rows.length;
  const k = n ? rows[0].length : 0;
  if (n < 2 || k < 3) return null;
  const rankSums = new Array(k).fill(0);
  let tieTerm = 0;
  for (const row of rows) {
    const ranks = midRanks(row);
    ranks.forEach((r, j) => (rankSums[j] += r));
    const counts = new Map();
    row.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
    counts.forEach((t) => (tieTerm += t ** 3 - t));
  }
  const correction = 1 - tieTerm / (n * k * (k * k - 1));
  if (correction <= 0) return { chi2: 0, df: k - 1, p: 1, kendallW: 0 };
  const chi2 = ((12 / (n * k * (k + 1))) * rankSums.reduce((acc, r) => acc + r * r, 0) - 3 * n * (k + 1)) / correction;
  const df = k - 1;
  return { chi2, df, p: Math.min(1, Math.max(0, gammaQ(df / 2, chi2 / 2))), kendallW: chi2 / (n * (k - 1)) };
}

// ---------- evolution ----------

/**
 * @param {{steps: {id:string,name?:string,survey_config?:object[]}[], sessions: object[]}} input
 *   steps in order; sessions with survey_answers, workshop_id, chain_user_id
 * @returns {null | {steps, people, questions}} null when there is nothing worth comparing
 */
export function buildStepEvolution({ steps = [], sessions = [] } = {}) {
  if (steps.length < 2) return null;
  const stepIndex = new Map(steps.map((s, i) => [s.id, i]));
  const people = sessionsByPerson(sessions);
  const questions = [];

  for (const group of groupQuestions(steps)) {
    if (group.type !== 'likert' || group.perStep.size < 2) continue;
    const present = steps.filter((s) => group.perStep.has(s.id));
    const rows = [];
    for (const perStep of people.values()) {
      const row = present.map((s) => num(answerFor(perStep.get(s.id)?.survey_answers, group.perStep.get(s.id))));
      if (row.every((v) => v !== null)) rows.push(row);
    }
    if (rows.length < MIN_PEOPLE) continue;

    const columns = present.map((_, j) => rows.map((r) => r[j]));
    const means = columns.map((c) => mean(c));
    const entry = {
      key: group.key,
      text: group.text,
      stepIds: present.map((s) => s.id),
      stepNames: present.map((s) => s.name || ''),
      n: rows.length,
      means,
      change: means[means.length - 1] - means[0],
      test: null,
      pairwise: [],
    };

    if (present.length === 2) {
      const w = wilcoxonSignedRank(columns[0], columns[1]);
      const diffs = columns[0].map((v, i) => columns[1][i] - v);
      const m = mean(diffs);
      const sd = Math.sqrt(diffs.reduce((acc, d) => acc + (d - m) ** 2, 0) / (diffs.length - 1));
      entry.test = { kind: 'wilcoxon', p: w.p, exact: w.exact, effect: sd > 0 ? m / sd : 0 };
    } else {
      const f = friedmanTest(rows);
      entry.test = f && { kind: 'friedman', p: f.p, chi2: f.chi2, df: f.df, effect: f.kendallW };
      const pairs = columns.slice(1).map((col, j) => ({
        stepName: entry.stepNames[j + 1],
        change: mean(col) - means[0],
        p: wilcoxonSignedRank(columns[0], col).p,
      }));
      entry.pairwise = applyHolmBonferroni(pairs).map((r) => ({ stepName: r.stepName, change: r.change, p: r.p, pAdj: r.adj, significant: r.significant }));
    }
    questions.push(entry);
  }

  if (questions.length === 0) return null;
  // Several questions are tested at once: adjust the p-values across them (Holm) so a lucky one is not reported.
  const adjusted = applyHolmBonferroni(questions.map((q) => ({ p: q.test ? q.test.p : null })));
  questions.forEach((q, i) => {
    if (q.test) {
      q.test.pAdj = adjusted[i].adj;
      q.test.significant = adjusted[i].significant;
    }
  });
  const used = new Set(questions.flatMap((q) => q.stepIds));
  const peopleCount = [...people.values()].filter((perStep) => [...perStep.keys()].filter((id) => used.has(id) && stepIndex.has(id)).length >= 2).length;
  return { steps: steps.map((s) => ({ id: s.id, name: s.name || '' })), people: peopleCount, questions };
}

/**
 * Wide layout: one row per person, one column per question and step, for any number of steps.
 * @returns {{headers:string[], rows:object[]}}
 */
export function buildWideTable({ steps = [], sessions = [], versionTitle = () => '' } = {}) {
  const groups = groupQuestions(steps);
  const people = sessionsByPerson(sessions);
  const headers = ['chain_user_id', 'participant_name'];
  steps.forEach((_, i) => headers.push(`paso${i + 1}_condicion`, `paso${i + 1}_posicion`));
  const columns = [];
  for (const g of groups) {
    steps.forEach((s, i) => {
      if (g.perStep.has(s.id)) {
        const header = `${g.id}_paso${i + 1}`;
        headers.push(header);
        columns.push({ header, step: s, question: g.perStep.get(s.id) });
      }
    });
  }

  const rows = [];
  for (const [chainUserId, perStep] of people.entries()) {
    const row = { chain_user_id: chainUserId, participant_name: '' };
    steps.forEach((s, i) => {
      const sess = perStep.get(s.id);
      if (sess && !row.participant_name) row.participant_name = sess.participant_name || '';
      row[`paso${i + 1}_condicion`] = sess ? versionTitle(sess) : '';
      row[`paso${i + 1}_posicion`] = sess?.chain_position ?? '';
    });
    for (const c of columns) {
      const v = answerFor(perStep.get(c.step.id)?.survey_answers, c.question);
      row[c.header] = Array.isArray(v) ? v.join('; ') : v ?? '';
    }
    rows.push(row);
  }
  return { headers, rows };
}

/**
 * Open-ended (text) questions with at least one answer, grouped across steps. Works for a single step
 * (mode 'themes': what people wrote) and for 2+ steps with answers (mode 'change': how it changed).
 * Only the text of each answer is returned: no names, ids or session data, because this is what would
 * be sent to the AI provider.
 * @returns {{key:string,text:string,mode:'themes'|'change',steps:{id:string,name:string,responses:string[]}[]}[]}
 */
export function buildOpenResponses({ steps = [], sessions = [] } = {}) {
  const out = [];
  for (const group of groupQuestions(steps)) {
    if (group.type !== 'text') continue;
    const perStep = steps
      .filter((s) => group.perStep.has(s.id))
      .map((s) => {
        const q = group.perStep.get(s.id);
        const responses = sessions
          .filter((x) => x.workshop_id === s.id)
          .map((x) => answerFor(x.survey_answers, q))
          .filter((v) => typeof v === 'string' && v.trim())
          .map((v) => v.trim());
        return { id: s.id, name: s.name || '', responses };
      });
    const answered = perStep.filter((p) => p.responses.length > 0);
    if (answered.length === 0) continue;
    // Steps with no answers add nothing to a summary, so only the answered ones are kept.
    out.push({ key: group.key, text: group.text, mode: answered.length >= 2 ? 'change' : 'themes', steps: answered });
  }
  return out;
}
