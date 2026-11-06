/** Tests: live monitor status and alerts. Run with: node test/live-monitor.test.js */
import assert from 'node:assert/strict';
import { computeLiveStatus } from '../lib/live-monitor.js';

let passed = 0;
const check = (name, fn) => {
  fn();
  passed++;
  console.log(`  [PASS] ${name}`);
};

const now = Date.parse('2026-11-05T12:00:00Z');
const ago = (min) => new Date(now - min * 60000).toISOString();
const campaign = {
  id: 'c1',
  share_code: 'abc123',
  steps: [
    { id: 's1', name: 'Inicio', chain_order: 1, selected_version_ids: ['A', 'B'], is_active: true },
    { id: 's2', name: 'Cierre', chain_order: 2, selected_version_ids: ['A'], is_active: false },
  ],
};
const versions = [{ id: 'A', title: 'Neutro' }, { id: 'B', title: 'Socrático' }];
const mk = (id, over) => ({ id, workshop_id: 's1', version_id: 'A', status: 'active', interaction_count: 3, started_at: ago(5), ...over });

check('empty campaign tells the facilitator how to get participants in', () => {
  const r = computeLiveStatus({ campaign, versions, sessions: [] });
  assert.equal(r.totals.sessions, 0);
  assert.ok(r.alerts.some((a) => a.id === 'no-sessions' && a.detail.includes('abc123')));
});

check('totals, steps and condition counts', () => {
  const sessions = [mk('1'), mk('2', { version_id: 'B' }), mk('3', { status: 'completed', interaction_count: 5 })];
  const r = computeLiveStatus({ campaign, versions, sessions, now });
  assert.equal(r.totals.active, 2);
  assert.equal(r.totals.completed, 1);
  assert.equal(r.totals.participants, 3);
  assert.equal(r.totals.avgMessages, 3.7);
  const s1 = r.steps[0];
  assert.equal(s1.conditions.find((c) => c.title === 'Neutro').count, 2);
  assert.equal(s1.conditions.find((c) => c.title === 'Socrático').count, 1);
});

check('warns about people who joined and never wrote, and about paused steps', () => {
  const r = computeLiveStatus({ campaign, versions, now, sessions: [mk('1', { interaction_count: 0, started_at: ago(15) }), mk('2', { interaction_count: 0, started_at: ago(2) })] });
  const stalled = r.alerts.find((a) => a.id === 'stalled');
  assert.match(stalled.title, /^1 persona entró y no ha escrito/);
  assert.ok(r.alerts.some((a) => a.id === 'paused-s2'));
});

check('flags a clearly unbalanced assignment but not a small or even one', () => {
  const uneven = Array.from({ length: 8 }, (_, i) => mk(`u${i}`, { version_id: i < 7 ? 'A' : 'B' }));
  assert.ok(computeLiveStatus({ campaign, versions, sessions: uneven, now }).steps[0].imbalanced);
  const even = Array.from({ length: 8 }, (_, i) => mk(`e${i}`, { version_id: i % 2 ? 'A' : 'B' }));
  assert.ok(!computeLiveStatus({ campaign, versions, sessions: even, now }).steps[0].imbalanced);
  assert.ok(!computeLiveStatus({ campaign, versions, sessions: uneven.slice(0, 3), now }).steps[0].imbalanced);
});

check('simulated AI is the first thing to show; alerts sorted by severity', () => {
  const r = computeLiveStatus({ campaign, versions, sessions: [], aiIsSimulated: true });
  assert.equal(r.alerts[0].id, 'ai-simulated');
  assert.equal(r.alerts[0].severity, 'warning');
});

check('recent list is newest first and capped', () => {
  const sessions = Array.from({ length: 12 }, (_, i) => mk(`r${i}`, { started_at: ago(i + 1) }));
  const r = computeLiveStatus({ campaign, versions, sessions, now });
  assert.equal(r.recent.length, 8);
  assert.equal(r.recent[0].id, 'r0');
});

console.log(`\nlive-monitor: ${passed} tests passed`);
