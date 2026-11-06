/** Tests: demo mode loads and removes only the sample data. Run with: node test/demo-mode.test.js */
import './e2e/harness/env.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { testDbPath } from './e2e/harness/env.js';
import * as db from '../lib/db.js';
import { resetStore } from '../lib/db-memory.js';
import { seedBenchmarkData, isBenchmarkLoaded, removeBenchmarkData } from '../lib/seeds/isdde-benchmark.js';
import { saveCampaign } from '../lib/campaign-service.js';

resetStore();
let passed = 0;
const check = async (name, fn) => { await fn(); passed++; console.log(`  [PASS] ${name}`); };

await check('starts empty, loads the sample data, detects it', async () => {
  assert.equal(await isBenchmarkLoaded(db), false);
  await seedBenchmarkData(db);
  assert.equal(await isBenchmarkLoaded(db), true);
  assert.ok((await db.getSessions()).length >= 18);
});

await check('removing demo data keeps what the user created', async () => {
  const mine = await saveCampaign(null, { name: 'Mi campaña', steps: [{ name: 'Paso', conditions: [{ title: 'A', case_content: 'Caso' }] }] });
  const removed = await removeBenchmarkData(db);
  assert.ok(removed.sessions >= 18 && removed.workshops >= 2);
  assert.equal(await isBenchmarkLoaded(db), false);
  assert.equal((await db.getSessions()).length, 0);
  const left = await db.getWorkshops();
  assert.deepEqual(left.map((w) => w.id), [mine.steps[0].id]);
  assert.equal((await db.getVersions()).length, 1);
});

await check('loading again after removal works (idempotent)', async () => {
  await seedBenchmarkData(db);
  assert.equal(await isBenchmarkLoaded(db), true);
  await removeBenchmarkData(db);
});

fs.rmSync(testDbPath, { force: true });
console.log(`\ndemo-mode: ${passed} tests passed`);
