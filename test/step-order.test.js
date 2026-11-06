/**
 * Unit tests: per-participant step order (randomized, counterbalanced).
 * Run with: node test/step-order.test.js
 */
import assert from 'node:assert/strict';
import { permutations, chooseSequence, isValidSequence, positionIn, nextStepId, sequencesPerParticipant } from '../lib/step-order.js';

let passed = 0;
const check = (name, fn) => {
  fn();
  passed++;
  console.log(`  [PASS] ${name}`);
};

check('permutations lists every order once', () => {
  assert.equal(permutations(['a', 'b', 'c']).length, 6);
  assert.deepEqual(permutations(['a', 'b']), [['a', 'b'], ['b', 'a']]);
  assert.deepEqual(permutations(['a']), [['a']]);
});

check('two steps are counterbalanced: every pair of participants gets both orders', () => {
  const given = [];
  for (let i = 0; i < 10; i++) given.push(chooseSequence(['a', 'b'], given));
  const ab = given.filter((s) => s[0] === 'a').length;
  assert.equal(ab, 5);
  assert.equal(given.length - ab, 5);
});

check('three steps use each of the 6 orders before repeating any', () => {
  const given = [];
  for (let i = 0; i < 6; i++) given.push(chooseSequence(['a', 'b', 'c'], given));
  assert.equal(new Set(given.map((s) => s.join('|'))).size, 6);
  for (let i = 0; i < 6; i++) given.push(chooseSequence(['a', 'b', 'c'], given));
  const counts = new Map();
  given.forEach((s) => counts.set(s.join('|'), (counts.get(s.join('|')) || 0) + 1));
  assert.deepEqual([...new Set(counts.values())], [2]);
});

check('ignores stored sequences that do not match the current steps', () => {
  const seq = chooseSequence(['a', 'b'], [['x', 'y'], ['a', 'a'], null]);
  assert.ok(isValidSequence(seq, ['a', 'b']));
});

check('more than 4 steps shuffles but keeps every step once; the rng decides', () => {
  const ids = ['a', 'b', 'c', 'd', 'e'];
  const seq = chooseSequence(ids, [], () => 0.5);
  assert.ok(isValidSequence(seq, ids));
  assert.deepEqual(chooseSequence(ids, [], () => 0.5), seq);
});

check('a single step has nothing to randomize', () => {
  assert.deepEqual(chooseSequence(['a']), ['a']);
});

check('position and next step follow the participant sequence', () => {
  const seq = ['b', 'a', 'c'];
  assert.equal(positionIn(seq, 'b'), 1);
  assert.equal(positionIn(seq, 'c'), 3);
  assert.equal(positionIn(seq, 'zzz'), 0);
  assert.equal(nextStepId(seq, 'b'), 'a');
  assert.equal(nextStepId(seq, 'c'), null);
  assert.equal(nextStepId(null, 'b'), null);
});

check('sequencesPerParticipant counts each participant once', () => {
  const sessions = [
    { id: '1', chain_user_id: 'u1', step_sequence: ['a', 'b'] },
    { id: '2', chain_user_id: 'u1', step_sequence: ['a', 'b'] },
    { id: '3', chain_user_id: 'u2', step_sequence: ['b', 'a'] },
    { id: '4', chain_user_id: null },
  ];
  assert.deepEqual(sequencesPerParticipant(sessions), [['a', 'b'], ['b', 'a']]);
});

console.log(`\nstep-order: ${passed} tests passed`);
