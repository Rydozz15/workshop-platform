/**
 * Deep Corner & Stress Test Suite: Part 2
 */

import {
  calculateMattr,
  getMattrDetails,
  extractEpistemicConnectors,
  calculateVolumeMetrics,
  calculateLatencyMetrics,
  analyzeConversation,
} from '../lib/chat-analytics.js';

import {
  generateTidyTurns,
  generateTidySessions,
  generateTidyLongitudinal,
  generateTidyExport,
  escapeCsvCell,
} from '../lib/tidy-export.js';

import {
  generateBooktabsTable,
  escapeLatex,
} from '../lib/latex-generator.js';

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failed++;
    console.error(`  [FAIL] ${name}: ${err.message}`);
  }
}

function assert(cond, msg = '') {
  if (!cond) throw new Error(msg);
}

console.log('--- DEEP CORNER CASES & EDGE AUDIT ---');

// 1. generateBooktabsTable with empty results object
check('generateBooktabsTable with empty results: compiles cleanly in pdflatex', () => {
  const emptyTable = generateBooktabsTable({});
  assert(emptyTable.includes('\\toprule'));
  assert(emptyTable.includes('\\bottomrule'));

  const latexDoc = `\\documentclass{article}
\\usepackage{booktabs}
\\usepackage{amsmath}
\\begin{document}
${emptyTable}
\\end{document}
`;
  const scratchDir = '/tmp/adversarial_empty_latex';
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
  const texFile = path.join(scratchDir, 'empty.tex');
  fs.writeFileSync(texFile, latexDoc, 'utf8');

  try {
    execSync(`pdflatex -interaction=nonstopmode -output-directory=${scratchDir} ${texFile}`, { encoding: 'utf8', timeout: 5000 });
  } finally {
    try { fs.rmSync(scratchDir, { recursive: true, force: true }); } catch (_) {}
  }
});

// 2. generateBooktabsTable with null/undefined row values
check('generateBooktabsTable with partial/null row values produces N/A cleanly', () => {
  const results = {
    continuous: [
      {
        name: 'Incomplete_Metric',
        meanA: null,
        meanB: undefined,
        cohensD: null,
        dCi: null,
        pValue: null,
        adjustedP: null,
      },
    ],
    ordinal: [
      {
        name: 'Incomplete_Ordinal',
        medianA: null,
        medianB: null,
        cliffsDelta: null,
        deltaCi: null,
        pValue: null,
        adjustedP: null,
      },
    ],
  };

  const tableLatex = generateBooktabsTable(results);
  assert(tableLatex.includes('Incomplete\\_Metric & N/A & N/A & N/A & N/A & N/A \\\\'));
  assert(tableLatex.includes('Incomplete\\_Ordinal & N/A & N/A & N/A & N/A & N/A \\\\'));
});

// 3. calculateVolumeMetrics with weird inputs
check('calculateVolumeMetrics handles empty, null, and non-conforming message objects', () => {
  const res1 = calculateVolumeMetrics([]);
  assert(res1.studentWords === 0 && res1.botWords === 0 && res1.verbalVolumeRatio === 0);

  const res2 = calculateVolumeMetrics([
    { role: 'user', content: null },
    { role: 'assistant', content: undefined },
    { role: 'other', content: 'ignored' },
    {},
  ]);
  assert(res2.studentWords === 0 && res2.botWords === 0);
});

// 4. analyzeConversation with 0 messages
check('analyzeConversation with 0 messages produces safe default structure', () => {
  const res = analyzeConversation([]);
  assert(res.studentWords === 0);
  assert(res.botWords === 0);
  assert(res.studentTurns === 0);
  assert(res.botTurns === 0);
  assert(res.verbalVolumeRatio === 0);
  assert(res.studentMluW === 0);
  assert(res.mattr25 === 0);
  assert(res.mattr50 === 0);
  assert(res.avgReadingLatency === 0);
  assert(res.skippedReadingRatio === 0);
  assert(res.outlierTurns === 0);
  assert(res.turns.length === 0);
});

// 5. Tidy export with completely empty database
check('generateTidyExport on empty inputs returns valid CSV headers and Codebook', () => {
  const resTurn = generateTidyExport({ sessions: [], level: 'turn' });
  assert(resTurn.csv.startsWith('session_id,turn_index,speaker,timestamp'));
  assert(resTurn.data.length === 0);
  assert(resTurn.codebook.schema.length > 0);

  const resSess = generateTidyExport({ sessions: [], level: 'session' });
  assert(resSess.csv.startsWith('session_id,participant_name,campaign_id'));
  assert(resSess.data.length === 0);

  const resLong = generateTidyExport({ sessions: [], level: 'longitudinal' });
  assert(resLong.csv.startsWith('chain_user_id,participant_name,pre_session_id'));
  assert(resLong.data.length === 0);
});

// 6. Longitudinal export with mismatched or missing survey scores
check('generateTidyLongitudinal handles sessions without survey responses gracefully', () => {
  const sessions = [
    { id: 's1', chain_user_id: 'u1', chain_order: 1, messages: [] },
    { id: 's2', chain_user_id: 'u1', chain_order: 2, messages: [] },
  ];
  const res = generateTidyLongitudinal(sessions);
  assert(res.data.length === 1);
  assert(res.data[0].pre_score === null);
  assert(res.data[0].post_score === null);
  assert(res.data[0].hake_gain_g === null);
  assert(res.data[0].gain_tier === null);
});

console.log(`\nDEEP AUDIT RESULTS: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
else process.exit(0);
