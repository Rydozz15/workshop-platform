/**
 * Tests: campaign grouping + persistence service (memory provider, isolated scratch file).
 * Run with: node test/campaigns.test.js
 */
import './e2e/harness/env.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { testDbPath } from './e2e/harness/env.js';
import { groupCampaigns, stepsOfCampaign, campaignIdOf } from '../lib/campaigns.js';
import { saveCampaign, getCampaignDetail, deleteCampaign, setCampaignActive, validateCampaignPayload } from '../lib/campaign-service.js';
import { getWorkshops, getVersions, createSession, getSessions } from '../lib/db.js';
import { resetStore } from '../lib/db-memory.js';

let passed = 0;
async function check(name, fn) {
  await fn();
  passed++;
  console.log(`  [PASS] ${name}`);
}

const cond = (title, extra = {}) => ({ title, case_content: `Caso de ${title}`, ...extra });
const step = (name, conditions, extra = {}) => ({ name, conditions, ...extra });

resetStore();

await check('groups chained workshops into one campaign and solo workshops into their own', () => {
  const ws = [
    { id: 'a', name: 'Paso 1', chain_id: 'c1', chain_order: 1, share_code: 'aaa', selected_version_ids: ['v1', 'v2'], created_at: '2026-01-02' },
    { id: 'b', name: 'Paso 2', chain_id: 'c1', chain_order: 2, share_code: 'bbb', selected_version_ids: ['v2', 'v3'], created_at: '2026-01-02' },
    { id: 'c', name: 'Suelto', chain_id: null, chain_order: 1, share_code: 'ccc', selected_version_ids: ['v1'], created_at: '2026-01-01' },
  ];
  const sessions = [
    { id: 's1', workshop_id: 'a', chain_user_id: 'u1', status: 'completed' },
    { id: 's2', workshop_id: 'b', chain_user_id: 'u1', status: 'active' },
    { id: 's3', workshop_id: 'a', chain_user_id: 'u2', status: 'completed' },
  ];
  const cs = groupCampaigns(ws, sessions);
  assert.equal(cs.length, 2);
  const c1 = cs.find((c) => c.id === 'c1');
  assert.equal(c1.step_count, 2);
  assert.equal(c1.share_code, 'aaa', 'campaign code is the first step code');
  assert.deepEqual(c1.condition_ids.sort(), ['v1', 'v2', 'v3']);
  assert.equal(c1.participants, 2, 'distinct people in step 1');
  assert.equal(c1.sessions_completed, 2);
  assert.equal(cs.find((c) => c.id === 'solo:c').step_count, 1);
  assert.equal(campaignIdOf(ws[2]), 'solo:c');
  assert.deepEqual(stepsOfCampaign(ws, 'c1').map((w) => w.id), ['a', 'b']);
});

await check('validation explains what is missing', () => {
  assert.throws(() => validateCampaignPayload({ name: '', steps: [] }), /nombre/);
  assert.throws(() => validateCampaignPayload({ name: 'X', steps: [] }), /al menos un paso/);
  try {
    validateCampaignPayload({ name: 'X', steps: [{ name: 'Paso A', conditions: [] }] });
    assert.fail('should throw');
  } catch (e) {
    assert.equal(e.key, '"{step}" necesita al menos una condición.');
    assert.deepEqual(e.params, { step: 'Paso A' });
    assert.match(e.message, /"Paso A" necesita al menos una condición/);
  }
  assert.throws(() => validateCampaignPayload({ name: 'X', steps: [step('P', [])] }), /al menos una condición/);
  assert.throws(() => validateCampaignPayload({ name: 'X', steps: [step('P', [{ title: 'A', case_content: ' ' }])] }), /caso/);
  assert.throws(
    () => validateCampaignPayload({ name: 'X', consent_required: true, consent_url: 'ftp://x', steps: [step('P', [cond('A')])] }),
    /http/
  );
});

let saved;
await check('creates a campaign with 3 conditions (more than A/B) and 2 steps', async () => {
  saved = await saveCampaign(null, {
    name: 'Estudio de tutoría',
    description: 'Compara tres estilos',
    consent_required: true,
    consent_url: 'https://example.org/consent',
    steps: [
      step('Línea base', [cond('Neutro'), cond('Socrático', { system_prompt: 'Pregunta más de lo que respondes.' }), cond('Directo')], {
        survey_config: [{ id: 'q1', text: '¿Fue útil?', type: 'likert', required: true }],
      }),
      step('Seguimiento', [cond('Neutro 2')]),
    ],
  });
  assert.equal(saved.step_count, 2);
  assert.equal(saved.steps[0].conditions.length, 3);
  assert.equal(saved.steps[0].conditions[1].system_prompt, 'Pregunta más de lo que respondes.');
  assert.equal(saved.consent_required, true);
  assert.equal(saved.name, 'Estudio de tutoría');
  assert.ok(saved.share_code);
  assert.equal(saved.id, saved.steps[0].chain_id);
});

await check('editing keeps ids, reorders steps and removes dropped steps/conditions', async () => {
  const [s1, s2] = saved.steps;
  const updated = await saveCampaign(saved.id, {
    name: 'Estudio de tutoría v2',
    steps: [
      { ...s2, name: 'Seguimiento (ahora primero)', conditions: s2.conditions },
      { id: s1.id, name: s1.name, conditions: [s1.conditions[0], s1.conditions[1]], survey_config: s1.survey_config },
    ],
  });
  assert.equal(updated.id, saved.id, 'campaign identity is stable');
  assert.equal(updated.name, 'Estudio de tutoría v2');
  assert.equal(updated.steps[0].id, s2.id);
  assert.equal(updated.steps[0].chain_order, 1);
  assert.equal(updated.steps[1].conditions.length, 2);
  const versionTitles = (await getVersions()).map((v) => v.title);
  assert.ok(!versionTitles.includes('Directo'), 'orphan condition removed');
  assert.equal((await getWorkshops()).filter((w) => w.chain_id === saved.id).length, 2);
  saved = updated;
});

await check('a condition prompt is stored per condition and absent when empty', async () => {
  const c = await getCampaignDetail(saved.id);
  const socratic = c.steps.flatMap((s) => s.conditions).find((v) => v.title === 'Socrático');
  assert.ok(socratic.system_prompt);
  const neutral = c.steps.flatMap((s) => s.conditions).find((v) => v.title === 'Neutro');
  assert.equal(neutral.system_prompt, null);
});

await check('closing a campaign deactivates every step, keeps data, and reopening restores it', async () => {
  const before = (await getWorkshops()).filter((w) => w.chain_id === saved.id);
  assert.ok(before.length > 0 && before.every((w) => w.is_active));
  assert.equal(await setCampaignActive(saved.id, false), true);
  let steps = (await getWorkshops()).filter((w) => w.chain_id === saved.id);
  assert.equal(steps.length, before.length);
  assert.ok(steps.every((w) => w.is_active === false));
  assert.equal((await groupCampaigns(await getWorkshops(), await getSessions())).find((c) => c.id === saved.id).is_active, false);
  assert.equal(await setCampaignActive(saved.id, true), true);
  steps = (await getWorkshops()).filter((w) => w.chain_id === saved.id);
  assert.ok(steps.every((w) => w.is_active === true));
  assert.equal(await setCampaignActive('does-not-exist', false), false);
});

await check('deleting a campaign removes steps and unused conditions but keeps sessions untouched elsewhere', async () => {
  createSession({ workshop_id: 'other', version_id: 'x', participant_name: 'P' });
  assert.equal(await deleteCampaign(saved.id), true);
  assert.equal(await getCampaignDetail(saved.id), null);
  assert.equal((await getWorkshops()).filter((w) => w.chain_id === saved.id).length, 0);
  assert.equal((await getSessions()).length, 1);
  assert.equal(await deleteCampaign('does-not-exist'), false);
});

fs.rmSync(testDbPath, { force: true });
console.log(`\ncampaigns: ${passed} tests passed`);
