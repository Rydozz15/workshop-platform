/**
 * Unit tests: change between campaign steps, question by question.
 * Reference values: closed-form exact Wilcoxon cases and scipy 1.18 (friedmanchisquare).
 * Run with: node test/step-evolution.test.js
 */
import assert from 'node:assert/strict';
import { generateTidyExport } from '../lib/tidy-export.js';
import { buildOpenResponses, wilcoxonSignedRank, friedmanTest, groupQuestions, buildStepEvolution, buildWideTable } from '../lib/step-evolution.js';

let passed = 0;
const check = (name, fn) => {
  fn();
  passed++;
  console.log(`  [PASS] ${name}`);
};
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

check('Wilcoxon: six distinct positive changes give the exact p = 2/64', () => {
  const r = wilcoxonSignedRank([0, 0, 0, 0, 0, 0], [1, 2, 3, 4, 5, 6]);
  near(r.p, 0.03125);
  assert.equal(r.exact, true);
});

check('Wilcoxon: ties and zero changes use mid-ranks and drop the zeros (scipy: 0.25)', () => {
  near(wilcoxonSignedRank([3, 3, 4, 4, 5, 2], [3, 4, 4, 5, 5, 3]).p, 0.25);
});

check('Wilcoxon: no change at all gives p = 1', () => {
  near(wilcoxonSignedRank([2, 3, 4], [2, 3, 4]).p, 1);
});

check('Wilcoxon: large samples fall back to the normal approximation and stay in [0,1]', () => {
  const a = Array.from({ length: 40 }, (_, i) => 1 + (i % 5));
  const b = a.map((v, i) => v + (i % 3 === 2 ? 0 : 1)); // 27 non-zero changes (> exact limit)
  const r = wilcoxonSignedRank(a, b);
  assert.equal(r.exact, false);
  assert.ok(r.p > 0 && r.p < 0.01);
});

check('Friedman matches scipy.stats.friedmanchisquare (chi2 11.5652, p 0.0030807)', () => {
  const f = friedmanTest([[3, 4, 5], [2, 4, 4], [3, 3, 5], [1, 3, 4], [2, 2, 5], [4, 4, 5], [3, 5, 5]]);
  near(f.chi2, 11.565217391304348, 1e-9);
  near(f.p, 0.0030806683904541768, 1e-9);
  assert.equal(f.df, 2);
  near(f.kendallW, 0.8260869565217391, 1e-9);
});

check('Friedman needs 3+ steps', () => {
  assert.equal(friedmanTest([[1, 2], [2, 3], [1, 3]]), null);
});

const likert = (id, text = `Pregunta ${id}`) => ({ id, text, type: 'likert' });
const step = (id, name, survey_config) => ({ id, name, survey_config });
const sess = (user, workshop, answers, extra = {}) => ({ chain_user_id: user, workshop_id: workshop, survey_answers: answers, started_at: '2026-05-01T10:00:00Z', ...extra });

check('same id across steps is one question; same text with different ids merges too', () => {
  const g = groupQuestions([step('s1', 'A', [likert('q1'), likert('x', 'Texto igual')]), step('s2', 'B', [likert('q1'), likert('y', 'texto  igual')])]);
  assert.equal(g.length, 2);
  assert.ok(g.every((x) => x.perStep.size === 2));
});

check('nothing to compare with a single step, with no shared question, or with fewer than 3 people', () => {
  assert.equal(buildStepEvolution({ steps: [step('s1', 'A', [likert('q1')])], sessions: [] }), null);
  const two = [step('s1', 'A', [likert('q1')]), step('s2', 'B', [likert('q2')])];
  assert.equal(buildStepEvolution({ steps: two, sessions: [sess('u1', 's1', { q1: 3 }), sess('u1', 's2', { q2: 4 })] }), null);
  const shared = [step('s1', 'A', [likert('q1')]), step('s2', 'B', [likert('q1')])];
  const few = ['u1', 'u2'].flatMap((u) => [sess(u, 's1', { q1: 2 }), sess(u, 's2', { q1: 4 })]);
  assert.equal(buildStepEvolution({ steps: shared, sessions: few }), null);
});

check('two steps: mean per step, change and paired test over people who answered both', () => {
  const steps = [step('s1', 'Antes', [likert('q1')]), step('s2', 'Después', [likert('q1')])];
  const sessions = [];
  for (let i = 0; i < 6; i++) sessions.push(sess(`u${i}`, 's1', { q1: 2 }), sess(`u${i}`, 's2', { q1: 2 + (i % 3) + 1 }));
  sessions.push(sess('solo', 's1', { q1: 5 })); // only answered step 1: excluded
  const ev = buildStepEvolution({ steps, sessions });
  assert.equal(ev.questions.length, 1);
  const q = ev.questions[0];
  assert.equal(q.n, 6);
  near(q.means[0], 2);
  near(q.change, q.means[1] - q.means[0]);
  assert.equal(q.test.kind, 'wilcoxon');
  assert.ok(q.test.p < 0.05);
  assert.equal(ev.people, 6);
});

check('three steps: Friedman plus later steps against the first, Holm-adjusted', () => {
  const steps = ['a', 'b', 'c'].map((id, i) => step(id, `Paso ${i + 1}`, [likert('q1')]));
  const sessions = [];
  const rows = [[3, 4, 5], [2, 4, 4], [3, 3, 5], [1, 3, 4], [2, 2, 5], [4, 4, 5], [3, 5, 5]];
  rows.forEach((r, i) => r.forEach((v, j) => sessions.push(sess(`u${i}`, steps[j].id, { q1: v }))));
  const q = buildStepEvolution({ steps, sessions }).questions[0];
  assert.equal(q.test.kind, 'friedman');
  near(q.test.p, 0.0030806683904541768, 1e-9);
  assert.equal(q.pairwise.length, 2);
  assert.ok(q.pairwise.every((p) => p.pAdj >= p.p));
});

check('p-values are adjusted across questions (Holm)', () => {
  const steps = [step('s1', 'A', [likert('q1'), likert('q2')]), step('s2', 'B', [likert('q1'), likert('q2')])];
  const sessions = [];
  for (let i = 0; i < 6; i++) {
    sessions.push(sess(`u${i}`, 's1', { q1: 1, q2: 3 }), sess(`u${i}`, 's2', { q1: 2 + (i % 2), q2: 3 + (i % 2 ? 1 : -1) }));
  }
  const qs = buildStepEvolution({ steps, sessions }).questions;
  assert.equal(qs.length, 2);
  assert.ok(qs.every((q) => q.test.pAdj >= q.test.p && q.test.pAdj <= 1));
  assert.equal(qs.find((q) => q.key === 'q1').test.significant, qs.find((q) => q.key === 'q1').test.pAdj < 0.05);
});

check('only the latest session of a person in a step counts', () => {
  const steps = [step('s1', 'A', [likert('q1')]), step('s2', 'B', [likert('q1')])];
  const sessions = [];
  for (let i = 0; i < 4; i++) sessions.push(sess(`u${i}`, 's1', { q1: 1 }), sess(`u${i}`, 's2', { q1: 4 }));
  sessions.push(sess('u0', 's2', { q1: 1 }, { started_at: '2026-04-01T10:00:00Z' })); // older retry, ignored
  const q = buildStepEvolution({ steps, sessions }).questions[0];
  near(q.means[1], 4);
});

check('answers stored under the question text (older data) are found', () => {
  const steps = [step('s1', 'A', [likert('q1', 'Me sentí cómodo')]), step('s2', 'B', [likert('q9', 'Me sentí cómodo')])];
  const sessions = [];
  for (let i = 0; i < 4; i++) sessions.push(sess(`u${i}`, 's1', { 'Me sentí cómodo': '2' }), sess(`u${i}`, 's2', { 'Me sentí cómodo': '4' }));
  assert.equal(buildStepEvolution({ steps, sessions }).questions[0].n, 4);
});

check('answers keyed by the text with the scale appended are found', () => {
  const steps = [step('s1', 'A', [likert('q1', 'Me sentí cómodo')]), step('s2', 'B', [likert('q1', 'Me sentí cómodo')])];
  const sessions = [];
  for (let i = 0; i < 4; i++) sessions.push(sess(`u${i}`, 's1', { 'Me sentí cómodo (1 = Nada, 5 = Mucho)': '2' }), sess(`u${i}`, 's2', { 'Me sentí cómodo (1 = Nada, 5 = Mucho)': '5' }));
  assert.equal(buildStepEvolution({ steps, sessions }).questions[0].n, 4);
});

check('wide table: one row per person, one column per question and step, any number of steps', () => {
  const steps = ['a', 'b', 'c'].map((id, i) => step(id, `P${i + 1}`, [likert('q1'), { id: `t${i}`, text: `Abierta ${i}`, type: 'text' }]));
  const sessions = [
    sess('u1', 'a', { q1: 2, t0: 'hola' }, { participant_name: 'Ana', chain_position: 1 }),
    sess('u1', 'b', { q1: 3 }, { chain_position: 2 }),
    sess('u1', 'c', { q1: 5 }, { chain_position: 3 }),
    sess('u2', 'a', { q1: 1 }, { participant_name: 'Beto' }),
  ];
  const { headers, rows } = buildWideTable({ steps, sessions, versionTitle: () => 'Cond' });
  assert.ok(['q1_paso1', 'q1_paso2', 'q1_paso3', 't0_paso1', 't1_paso2', 't2_paso3'].every((h) => headers.includes(h)));
  assert.equal(rows.length, 2);
  const u1 = rows.find((r) => r.chain_user_id === 'u1');
  assert.equal(u1.q1_paso3, 5);
  assert.equal(u1.paso1_posicion, 1);
  assert.equal(u1.t0_paso1, 'hola');
  const u2 = rows.find((r) => r.chain_user_id === 'u2');
  assert.equal(u2.q1_paso2, '');
});

check('tidy export level "wide" builds the CSV for the steps of the campaign, including unanswered steps', () => {
  const workshops = ['a', 'b', 'c'].map((id, i) => ({ id, name: `P${i + 1}`, chain_id: 'ch', chain_order: i + 1, survey_config: [likert('q1')] }));
  const sessions = [
    { workshop_id: 'a', chain_user_id: 'u1', participant_name: 'Ana', survey_answers: { q1: 2 }, version_id: 'v1' },
    { workshop_id: 'b', chain_user_id: 'u1', survey_answers: { q1: 4 }, version_id: 'v1' },
  ];
  const out = generateTidyExport({ sessions, workshops, versions: [{ id: 'v1', title: 'Naive' }], level: 'wide' });
  const [head, row] = out.csv.trim().split('\n');
  assert.ok(head.includes('q1_paso1') && head.includes('q1_paso2') && head.includes('q1_paso3'));
  assert.ok(row.includes('Ana') && row.includes('Naive'));
  assert.equal(out.data.length, 1);
});

check('open-ended answers: text only, themes for one step and change for 2+ steps', () => {
  const text = (id, t = 'Abierta') => ({ id, text: t, type: 'text' });
  const steps = [step('s1', 'A', [text('t1'), likert('q1')]), step('s2', 'B', [text('t1'), likert('q1')]), step('s3', 'C', [text('solo', 'Otra pregunta')])];
  const sessions = [
    sess('u1', 's1', { t1: '  Muy útil ', q1: 3 }, { participant_name: 'Ana' }),
    sess('u2', 's1', { t1: '' }),
    sess('u1', 's2', { t1: 'Mejoró' }),
    sess('u1', 's3', { solo: 'Otra cosa' }),
  ];
  const groups = buildOpenResponses({ steps, sessions });
  assert.equal(groups.length, 2);
  const shared = groups.find((g) => g.key === 't1');
  assert.equal(shared.mode, 'change');
  assert.deepEqual(shared.steps.map((s) => s.responses), [['Muy útil'], ['Mejoró']]);
  assert.equal(groups.find((g) => g.key === 'solo').mode, 'themes');
  assert.ok(!JSON.stringify(groups).includes('Ana'), 'no participant names in what would be sent');
});

check('open-ended answers work with a single step and ignore questions nobody answered', () => {
  const steps = [step('s1', 'A', [{ id: 't1', text: 'Abierta', type: 'text' }, { id: 't2', text: 'Vacía', type: 'text' }])];
  const g = buildOpenResponses({ steps, sessions: [sess('u1', 's1', { t1: 'Algo' })] });
  assert.equal(g.length, 1);
  assert.equal(g[0].mode, 'themes');
  assert.equal(buildOpenResponses({ steps, sessions: [] }).length, 0);
});

console.log(`\nstep-evolution: ${passed} tests passed`);
