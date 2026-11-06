#!/usr/bin/env node
/**
 * Usability test kit.
 *   node scripts/usability-kit.js prepare            seeds a disposable instance with the test scenario
 *   node scripts/usability-kit.js analyze obs.csv [sus.csv]
 *
 * obs.csv:  participant,task,result,seconds,errors      (result: si | ayuda | no; task like 1.1, 2.3)
 * sus.csv:  participant,a1,a2,...,a10                    (answers 1-5)
 */
const fs = require('fs');
const path = require('path');

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'prepare') {
    process.env.DB_PROVIDER = 'memory';
    process.env.DB_MEMORY_PATH = path.join('scratch', 'usabilidad.json');
    fs.rmSync(process.env.DB_MEMORY_PATH, { force: true });
    const db = await import('../lib/db.js');
    const { saveCampaign } = await import('../lib/campaign-service.js');
    const c = await saveCampaign(null, {
      name: 'Taller de prueba',
      steps: [{ name: 'Parte 1', conditions: [{ title: 'Neutro', case_content: 'Caso A' }, { title: 'Socrático', case_content: 'Caso B' }] }],
    });
    const step = c.steps[0];
    const [a, b] = step.selected_version_ids;
    const ago = (m) => new Date(Date.now() - m * 60000).toISOString();
    const mk = (n, v, over) => db.createSession({ workshop_id: step.id, version_id: v, participant_name: `Sim ${n}`, chain_user_id: `sim-${n}`, started_at: ago(15), ...over });
    await mk(1, a, { status: 'completed', interaction_count: 5, completed_at: ago(2) });
    await mk(2, b, { status: 'active', interaction_count: 3 });
    await mk(3, a, { status: 'active', interaction_count: 0 }); // joined and never wrote -> live alert
    await mk(4, b, { status: 'active', interaction_count: 0 });
    console.log('Escenario listo en', process.env.DB_MEMORY_PATH);
    console.log('Arranca la app con:  DB_PROVIDER=memory DB_MEMORY_PATH=scratch/usabilidad.json ADMIN_PASSWORD=<clave> npm run dev');
    console.log('Código de la campaña de práctica:', c.share_code);
    return;
  }
  if (cmd === 'analyze') {
    const { summarizeUsability, parseCsv } = await import('../lib/usability.js');
    const rows = parseCsv(fs.readFileSync(args[0], 'utf8')).slice(1).map(([participant, task, result, seconds, errors]) => ({ participant, task, result, seconds: Number(seconds), errors: Number(errors) }));
    const sus = {};
    if (args[1]) for (const [p, ...a] of parseCsv(fs.readFileSync(args[1], 'utf8')).slice(1)) sus[p] = a.map(Number);
    console.log(JSON.stringify(summarizeUsability(rows, sus), null, 2));
    return;
  }
  console.log('Uso: node scripts/usability-kit.js prepare | analyze obs.csv [sus.csv]');
}
main().catch((e) => { console.error(e); process.exit(1); });
