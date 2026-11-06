/**
 * Unit tests: survey question model and answer validation.
 * Run with: node test/survey-schema.test.js
 */
import assert from 'node:assert/strict';
import { normalizeQuestion, validateAnswer, validateAnswers, canonicalType, displayAnswer, OTHER_VALUE, otherKey } from '../lib/survey-schema.js';

let passed = 0;
const check = (name, fn) => {
  fn();
  passed++;
  console.log(`  [PASS] ${name}`);
};

check('old type names map to the canonical ones and unknown types fall back to likert', () => {
  assert.equal(canonicalType('checkbox'), 'checklist');
  assert.equal(canonicalType('open'), 'text');
  assert.equal(canonicalType(undefined), 'likert');
  assert.equal(canonicalType('banana'), 'likert');
});

check('normalizeQuestion fills defaults and drops fields that do not apply', () => {
  const likert = normalizeQuestion({ id: 'a', text: 'T', type: 'likert', maxSelections: 3, options: ['x'] });
  assert.deepEqual(likert.scale, [1, 2, 3, 4, 5]);
  assert.equal(likert.required, true);
  assert.equal('maxSelections' in likert, false);
  assert.equal('options' in likert, false);
  const check3 = normalizeQuestion({ id: 'b', text: 'T', type: 'checkbox', options: 'uno\n dos \n\n', minSelections: '1', maxSelections: '', required: false });
  assert.deepEqual(check3.options, ['uno', 'dos']);
  assert.equal(check3.minSelections, 1);
  assert.equal('maxSelections' in check3, false);
  assert.equal(check3.required, false);
});

check('required defaults to true unless set to false', () => {
  assert.equal(normalizeQuestion({ id: 'a' }).required, true);
  assert.equal(normalizeQuestion({ id: 'a', required: false }).required, false);
});

check('likert answers must be on the scale', () => {
  const q = { id: 'l', text: 'T', type: 'likert' };
  assert.equal(validateAnswer(q, { l: '4' }), null);
  assert.ok(validateAnswer(q, { l: '9' }));
  assert.ok(validateAnswer(q, {}));
  assert.equal(validateAnswer({ ...q, required: false }, {}), null);
});

check('checklist enforces options and min/max selections', () => {
  const q = { id: 'c', text: 'T', type: 'checklist', options: ['a', 'b', 'c'], minSelections: 1, maxSelections: 2 };
  assert.equal(validateAnswer(q, { c: ['a'] }), null);
  assert.ok(validateAnswer(q, { c: ['a', 'b', 'c'] }));
  assert.ok(validateAnswer(q, { c: ['zzz'] }));
  assert.ok(validateAnswer(q, { c: [] }));
});

check('"Otro" needs allowOther and the typed text', () => {
  const q = { id: 'm', text: 'T', type: 'multiple', options: ['a', 'b'] };
  assert.ok(validateAnswer(q, { m: OTHER_VALUE, [otherKey('m')]: 'algo' }));
  const open = { ...q, allowOther: true };
  assert.equal(validateAnswer(open, { m: OTHER_VALUE, [otherKey('m')]: 'algo' }), null);
  assert.ok(validateAnswer(open, { m: OTHER_VALUE, [otherKey('m')]: '  ' }));
  const dd = { id: 'd', text: 'T', type: 'dropdown', options: ['x', 'y'], allowOther: true };
  assert.equal(validateAnswer(dd, { d: 'x' }), null);
  assert.ok(validateAnswer(dd, { d: 'nope' }));
});

check('open text enforces min and max characters', () => {
  const q = { id: 't', text: 'T', type: 'text', minChars: 5, maxChars: 10, required: false };
  assert.equal(validateAnswer(q, {}), null);
  assert.ok(validateAnswer(q, { t: 'abc' }));
  assert.equal(validateAnswer(q, { t: 'abcdef' }), null);
  assert.ok(validateAnswer(q, { t: 'abcdefghijk' }));
});

check('messages go through the translation function', () => {
  const q = { id: 't', text: 'T', type: 'text', minChars: 5 };
  assert.equal(validateAnswer(q, { t: 'ab' }), 'Escribe al menos 5 caracteres.');
  assert.equal(validateAnswer(q, { t: 'ab' }, { tr: (s) => `[${s}]` }), '[Escribe al menos {n} caracteres.]');
});

check('validateAnswers collects errors by question id and can skip the required check', () => {
  const config = [
    { id: 'a', text: 'A', type: 'likert' },
    { id: 'b', text: 'B', type: 'text', maxChars: 3 },
  ];
  const strict = validateAnswers(config, { b: 'toolong' });
  assert.equal(strict.ok, false);
  assert.deepEqual(Object.keys(strict.errors).sort(), ['a', 'b']);
  const lenient = validateAnswers(config, { b: 'ok' }, { enforceRequired: false });
  assert.equal(lenient.ok, true);
  assert.equal(validateAnswers(undefined, {}).ok, true);
});

check('displayAnswer shows the typed text for "Otro"', () => {
  assert.deepEqual(displayAnswer(['a', OTHER_VALUE], 'mi idea'), ['a', 'Otro: mi idea']);
  assert.equal(displayAnswer(OTHER_VALUE, '', 'Other'), 'Other: —');
  assert.equal(displayAnswer('x'), 'x');
});

console.log(`\nsurvey-schema: ${passed} tests passed`);
