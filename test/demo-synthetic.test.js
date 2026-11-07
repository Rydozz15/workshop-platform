/** Tests: the synthetic demo campaigns load once, cover the planned cases and leave user data alone. Run with: node test/demo-synthetic.test.js */
import './e2e/harness/env.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { testDbPath } from './e2e/harness/env.js';
import * as db from '../lib/db.js';
import { resetStore } from '../lib/db-memory.js';
import { seedSyntheticData, removeSyntheticData, isSyntheticLoaded, getSyntheticRecords, getSyntheticCalibration, hasSyntheticWorkshops } from '../lib/seeds/demo-synthetic.js';
import { calculateIRR } from '../lib/irr.js';
import { saveCampaign } from '../lib/campaign-service.js';
import { groupCampaigns } from '../lib/campaigns.js';
import { computeLiveStatus } from '../lib/live-monitor.js';
import { validateAnswers } from '../lib/survey-schema.js';

resetStore();
let passed = 0;
const check = async (name, fn) => { await fn(); passed++; console.log(`  [PASS] ${name}`); };

await check('loads three campaigns and is idempotent', async () => {
  const first = await seedSyntheticData(db);
  assert.equal(first.workshopsCount, 5);
  assert.ok(first.sessionsCount > 60 && first.messagesCount > 300);
  const again = await seedSyntheticData(db);
  assert.deepEqual(again, { versionsCount: 0, workshopsCount: 0, sessionsCount: 0, messagesCount: 0 });
  assert.equal(await isSyntheticLoaded(db), true);
});

await check('main campaign has 3 randomized steps, 24 participants and all 6 step orders', async () => {
  const camps = groupCampaigns(await db.getWorkshops(), await db.getSessions());
  const main = camps.find((c) => c.share_code === 'sint01');
  assert.equal(main.step_count, 3);
  assert.equal(main.randomize_order, true);
  assert.equal(main.participants, 24);
  assert.equal(main.steps[0].selected_version_ids.length, 3);
  const orders = new Set((await db.getSessions()).filter((s) => s.step_sequence).map((s) => s.step_sequence.join()));
  assert.equal(orders.size, 6);
  assert.equal(camps.find((c) => c.share_code === 'sint11').is_active, false);
  assert.equal(camps.find((c) => c.share_code === 'sint21').sessions_total, 0);
});

await check('live monitor shows stalled, long-open and imbalance alerts', async () => {
  const workshops = await db.getWorkshops();
  const sessions = await db.getSessions();
  const main = groupCampaigns(workshops, sessions).find((c) => c.share_code === 'sint01');
  const mine = sessions.filter((s) => main.steps.some((w) => w.id === s.workshop_id));
  const ids = computeLiveStatus({ campaign: main, versions: await db.getVersions(), sessions: mine }).alerts.map((a) => a.id.split('-')[0]);
  for (const id of ['stalled', 'long', 'imbalance']) assert.ok(ids.includes(id), `missing alert ${id}`);
});

await check('every stored survey answer passes the survey validation', async () => {
  const workshops = new Map((await db.getWorkshops()).map((w) => [w.id, w]));
  for (const s of await db.getSessions()) {
    if (!s.survey_answers) continue;
    const { errors } = validateAnswers(workshops.get(s.workshop_id).survey_config, s.survey_answers, { enforceRequired: false });
    assert.deepEqual(errors, {}, `${s.participant_name}: ${JSON.stringify(errors)}`);
  }
});

await check('a fresh store starts with the same data the seeder loads', async () => {
  const rec = getSyntheticRecords();
  assert.equal(rec.workshops.length, 5);
  assert.equal(rec.versions.length, 9);
  assert.ok(rec.sessions.length > 60 && rec.messages.length > 300);
  assert.equal(hasSyntheticWorkshops(rec.workshops), true);
  assert.equal(hasSyntheticWorkshops([{ id: 'other' }]), false);
});

await check('human vs judge coding: moderate agreement on outcome, prevalence paradox on flow', async () => {
  const { pairs } = getSyntheticCalibration();
  assert.equal(pairs.length, 60);
  const outcome = pairs.filter((p) => p.dimension === 'outcome');
  const flow = pairs.filter((p) => p.dimension === 'flow_pattern');
  const o = calculateIRR(outcome.map((p) => p.rater_human), outcome.map((p) => p.rater_llm));
  const f = calculateIRR(flow.map((p) => p.rater_human), flow.map((p) => p.rater_llm));
  assert.ok(o.cohenKappa > 0.5 && o.cohenKappa < 0.8 && !o.prevalenceWarning);
  assert.ok(f.prevalenceWarning && f.gwetsAC1 > 0.8 && f.cohenKappa < 0.4);
});

await check('removing it keeps what the user created', async () => {
  const mine = await saveCampaign(null, { name: 'Mi campaña', steps: [{ name: 'Paso', conditions: [{ title: 'A', case_content: 'Caso' }] }] });
  const removed = await removeSyntheticData(db);
  assert.equal(removed.workshops, 5);
  assert.equal(await isSyntheticLoaded(db), false);
  assert.equal((await db.getSessions()).length, 0);
  assert.deepEqual((await db.getWorkshops()).map((w) => w.id), [mine.steps[0].id]);
});

fs.rmSync(testDbPath, { force: true });
console.log(`\ndemo-synthetic: ${passed} tests passed`);
