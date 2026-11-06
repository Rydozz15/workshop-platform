/** Tests: quick analysis (measures + plain-language answer). Run with: node test/quick-analysis.test.js */
import assert from 'node:assert/strict';
import { extractMeasures, analyzeMeasure } from '../lib/quick-analysis.js';

let passed = 0;
const check = (name, fn) => {
  fn();
  passed++;
  console.log(`  [PASS] ${name}`);
};

const versions = [{ id: 'A', title: 'Neutro' }, { id: 'B', title: 'Socrático' }, { id: 'C', title: 'Directo' }];
const workshops = [{ id: 'w', survey_config: [{ id: 'q1', text: 'Fue útil', type: 'likert' }, { id: 'q2', text: 'Comentarios', type: 'text' }] }];
const sess = (id, version_id, util, n) => ({ id, workshop_id: 'w', version_id, interaction_count: n, survey_answers: { 'Fue útil (1 = nada, 5 = mucho)': String(util), Comentarios: 'ok' } });

check('extracts Likert items (matching keys with scale suffix) and message counts per condition', () => {
  const sessions = [sess('1', 'A', 2, 4), sess('2', 'A', 3, 5), sess('3', 'B', 5, 8), sess('4', 'B', 4, 9)];
  const ms = extractMeasures({ sessions, workshops, versions });
  const likert = ms.find((m) => m.label === 'Fue útil');
  assert.deepEqual(likert.groups, { Neutro: [2, 3], 'Socrático': [5, 4] });
  assert.equal(likert.ordinal, true);
  assert.deepEqual(ms.find((m) => m.id === 'messages').groups.Neutro, [4, 5]);
  assert.ok(!ms.some((m) => m.label === 'Comentarios'), 'open questions are not measures');
});

check('two conditions, clear difference -> plain answer naming the higher condition', () => {
  const r = analyzeMeasure({ Neutro: [2, 3, 2, 3, 2, 3, 2, 3], 'Socrático': [5, 4, 5, 4, 5, 4, 5, 5] }, { ordinal: true });
  assert.equal(r.status, 'ok');
  assert.equal(r.test, 'mann-whitney-u');
  assert.equal(r.significant, true);
  assert.match(r.summary, /“Socrático” obtuvo valores más altos/);
  assert.match(r.summary, /menos de 20 personas/);
});

check('two conditions, no difference -> says so without claiming an effect', () => {
  const r = analyzeMeasure({ A: [3, 4, 3, 4, 3, 4], B: [4, 3, 4, 3, 4, 3] }, { ordinal: true });
  assert.equal(r.significant, false);
  assert.match(r.summary, /No hay evidencia clara de diferencia/);
});

check('continuous normal-ish data uses Welch t', () => {
  const r = analyzeMeasure({ A: [10, 11, 9, 10, 12, 10, 11], B: [15, 16, 14, 15, 17, 15, 16] });
  assert.equal(r.test, 'welch-t');
  assert.equal(r.significant, true);
});

check('three conditions -> omnibus + pairwise, ordinal forces Kruskal-Wallis', () => {
  const r = analyzeMeasure({ A: [1, 2, 1, 2, 1, 2], B: [3, 3, 4, 3, 4, 3], C: [5, 5, 4, 5, 5, 4] }, { ordinal: true });
  assert.equal(r.test, 'kruskal-wallis');
  assert.equal(r.significant, true);
  assert.equal(r.posthoc.length, 3);
  assert.match(r.summary, /Hay diferencias entre las 3 condiciones/);
});

check('guards: one condition, or too few answers', () => {
  assert.equal(analyzeMeasure({ A: [1, 2, 3] }).status, 'not_enough_groups');
  assert.equal(analyzeMeasure({ A: [1, 2, 3], B: [4] }).status, 'too_few');
  assert.equal(analyzeMeasure({ A: [1, 2, 3], B: [] }).status, 'not_enough_groups');
});

import { MESSAGES, translateText } from '../lib/i18n/messages.js';
check('the sentence follows the UI language (English text and decimal point)', () => {
  const tr = (t, v) => translateText('en', t, v);
  const r = analyzeMeasure({ Neutro: [2, 3, 2, 3, 2, 3, 2, 3], 'Socrático': [5, 4, 5, 4, 5, 4, 5, 5] }, { ordinal: true, tr, decimal: '.' });
  assert.match(r.summary, /^“Socrático” got higher values \(average 4\.\d\)/);
  assert.match(r.summary, /fewer than 20 people per condition/);
  assert.match(r.summary, /effect is (large|medium|small)/);
  assert.ok(MESSAGES.en);
});
console.log(`\nquick-analysis: ${passed} tests passed`);
