/** Tests: SUS scoring and usability summary. Run with: node test/usability.test.js */
import assert from 'node:assert/strict';
import { susScore, summarizeUsability } from '../lib/usability.js';

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`  [PASS] ${name}`); };

check('SUS: all best answers = 100, all worst = 0, neutral = 50', () => {
  assert.equal(susScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]), 100);
  assert.equal(susScore([1, 5, 1, 5, 1, 5, 1, 5, 1, 5]), 0);
  assert.equal(susScore([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]), 50);
  assert.equal(susScore([5, 1, 5]), null);
  assert.equal(susScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 9]), null);
});

check('summary computes unaided rate, medians and the acceptance criteria', () => {
  const rows = [
    { participant: 'P1', task: '1.1', result: 'si', seconds: 100, errors: 0 },
    { participant: 'P2', task: '1.1', result: 'ayuda', seconds: 200, errors: 2 },
    { participant: 'P1', task: '2.1', result: 'si', seconds: 15, errors: 0 },
    { participant: 'P2', task: '2.1', result: 'si', seconds: 25, errors: 1 },
  ];
  const r = summarizeUsability(rows, { P1: [5, 1, 5, 1, 5, 1, 5, 1, 5, 1], P2: [4, 2, 4, 2, 4, 2, 4, 2, 4, 2] });
  assert.equal(r.participants, 2);
  assert.equal(r.unaidedRate, 0.75);
  assert.equal(r.perTask.find((t) => t.task === '2.1').medianSeconds, 20);
  assert.equal(r.sus, 87.5);
  assert.equal(r.meets.unaided80, false);
  assert.equal(r.meets.sus68, true);
  assert.equal(r.meets.live60s, true);
});

console.log(`\nusability: ${passed} tests passed`);
