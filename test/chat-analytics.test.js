/**
 * Unit Test Suite: Conversational Learning Analytics & Publication Interoperability
 *
 * Verifies:
 * - Benchmark Vector 6 (MATTR-5 sliding window) and length-invariance properties
 * - Bilingual (Spanish/English) epistemic and metacognitive connector extraction
 * - Client-side latency metrics (reading latency vs composition time, skipped reading, inactivity outliers)
 * - Verbal Volume Ratio (R_vol) and Student MLU-w
 * - Tidy Data exports at Turn, Session, and Longitudinal levels
 * - Auto-generated Codebook documentation completeness
 * - LaTeX booktabs table generator
 *
 * Run with: node test/chat-analytics.test.js
 */

import {
  tokenize,
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
  toCSV,
} from '../lib/tidy-export.js';

import {
  generateCodebook,
  CODEBOOK_SCHEMA,
} from '../lib/codebook.js';

import {
  generateBooktabsTable,
  escapeLatex,
} from '../lib/latex-generator.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    failed++;
    console.error(`  FAIL: ${message}`);
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    const msg = `${message} (Expected: ${expected}, got: ${actual})`;
    failed++;
    console.error(`  FAIL: ${msg}`);
    throw new Error(msg);
  }
}

function assertApprox(actual, expected, tol = 1e-3, message = '') {
  if (Math.abs(actual - expected) > tol) {
    const msg = `${message} (Expected ~${expected}, got ${actual}, diff ${Math.abs(actual - expected)} > ${tol})`;
    failed++;
    console.error(`  FAIL: ${msg}`);
    throw new Error(msg);
  }
}

function runTest(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    // Already logged in assert
  }
}

console.log('\n========================================================');
console.log(' PROMPTSKETCH CHAT ANALYTICS & EXPORTS UNIT SUITE');
console.log('========================================================\n');

// ---------------------------------------------------------------------
// 1. Benchmark Vector 6: MATTR on Sliding Window
// ---------------------------------------------------------------------
console.log('▶ Section 1: Benchmark Vector 6 — MATTR on Sliding Window');

runTest('MATTR on sliding window matches analytical golden benchmark', () => {
  const tokens = [
    'the', 'quick', 'brown', 'fox', 'jumps',
    'over', 'the', 'lazy', 'dog', 'the',
    'fox', 'jumps',
  ];
  const mattr5 = calculateMattr(tokens, 5);
  assertApprox(mattr5, 0.9500, 1e-4, 'MATTR with window 5 on 12-token sequence');

  const details = getMattrDetails(tokens, 5);
  assertApprox(details.mattr, 0.9500, 1e-4);
  assertEqual(details.windowSize, 5);
  assertEqual(details.tokenCount, 12);
  assertEqual(details.shortSampleWarning, false);
});

runTest('MATTR gracefully handles short samples (L < W) with standard TTR fallback', () => {
  const shortTokens = ['hola', 'mundo', 'hola']; // L=3, unique=2 -> 2/3 = 0.6667
  const details = getMattrDetails(shortTokens, 25);
  assertApprox(details.mattr, 0.6667, 1e-3);
  assertEqual(details.shortSampleWarning, true);
  assertEqual(details.windowUsed, 3);
});

runTest('MATTR handles empty inputs without crashing', () => {
  assertEqual(calculateMattr([], 25), 0.0);
  assertEqual(calculateMattr('', 25), 0.0);
  const details = getMattrDetails([], 25);
  assertEqual(details.mattr, 0.0);
});

// ---------------------------------------------------------------------
// 2. Bilingual Epistemic & Metacognitive Connectors
// ---------------------------------------------------------------------
console.log('\n▶ Section 2: Bilingual Epistemic & Metacognitive Connectors');

runTest('Detects Spanish epistemic markers with accents and uppercase', () => {
  const text = 'POR QUÉ debería aceptar más alumnos si DADO QUE estoy sobrecargada no tengo tiempo? SIN EMBARGO, CREO QUE el decano insistirá.';
  const res = extractEpistemicConnectors(text);

  assert(res.causalCount >= 2, 'Detects causal connectors: por que, dado que');
  assertEqual(res.adversativeCount, 1, 'Detects adversative connector: sin embargo');
  assertEqual(res.metacognitiveCount, 1, 'Detects metacognitive marker: creo que');
  assert(res.causalDensity > 0, 'Computes non-zero causal density');
});

runTest('Detects English epistemic markers in research interactions', () => {
  const text = 'I believe this publication strategy is flawed because our sample size is limited. However, we could run a pilot study.';
  const res = extractEpistemicConnectors(text);

  assertEqual(res.causalCount, 1, 'Detects causal connector: because');
  assertEqual(res.adversativeCount, 1, 'Detects adversative connector: however');
  assertEqual(res.metacognitiveCount, 1, 'Detects metacognitive marker: i believe');
});

runTest('Computes exact connector density scaled per 100 student words', () => {
  // 50 words with 2 causal markers -> density = 2 / 50 * 100 = 4.0
  const words = new Array(48).fill('palabra');
  words.splice(10, 0, 'porque');
  words.splice(20, 0, 'dado');
  words.splice(21, 0, 'que');
  const text = words.join(' ');

  const res = extractEpistemicConnectors(text, 50);
  assertEqual(res.causalCount, 2);
  assertApprox(res.causalDensity, 4.0, 1e-4);
});

// ---------------------------------------------------------------------
// 3. Client-Side Latency Metrics
// ---------------------------------------------------------------------
console.log('\n▶ Section 3: Client-Side Latency Metrics');

runTest('Dissects reading latency from active composition time', () => {
  const turnData = {
    t_bot: 10000,
    t_first_key: 15000, // 5000 ms reading latency
    t_send: 22000,      // 7000 ms composition time
    is_tab_blurred: false,
    botWordCount: 25,   // 5000 / 25 = 200 ms/word
  };
  const lat = calculateLatencyMetrics(turnData);

  assertEqual(lat.canCompute, true);
  assertEqual(lat.readingLatencyMs, 5000);
  assertEqual(lat.compositionTimeMs, 7000);
  assertEqual(lat.msPerWord, 200);
  assertEqual(lat.skippedReading, false);
  assertEqual(lat.inactivityOutlier, false);
});

runTest('Flags skipped reading when reading latency < 100 ms/word', () => {
  const turnData = {
    t_bot: 10000,
    t_first_key: 11000, // 1000 ms on a 30-word response = 33.3 ms/word
    t_send: 14000,
    is_tab_blurred: false,
    botWordCount: 30,
  };
  const lat = calculateLatencyMetrics(turnData);

  assertEqual(lat.canCompute, true);
  assertEqual(lat.skippedReading, true);
  assertEqual(lat.inactivityOutlier, false);
});

runTest('Flags inactivity outlier when reading latency > 180,000 ms or tab was blurred', () => {
  const turnData1 = {
    t_bot: 10000,
    t_first_key: 200000, // 190,000 ms (> 3 min)
    t_send: 210000,
    is_tab_blurred: false,
    botWordCount: 20,
  };
  const lat1 = calculateLatencyMetrics(turnData1);
  assertEqual(lat1.inactivityOutlier, true);

  const turnData2 = {
    t_bot: 10000,
    t_first_key: 14000,
    t_send: 18000,
    is_tab_blurred: true, // Tab blurred
    botWordCount: 20,
  };
  const lat2 = calculateLatencyMetrics(turnData2);
  assertEqual(lat2.inactivityOutlier, true);
});

runTest('Spec E14: Reading latency with 0 bot words produces msPerWord === null and skippedReading === false', () => {
  const lat = calculateLatencyMetrics({
    t_bot: 1000,
    t_first_key: 1050,
    t_send: 2000,
    botWordCount: 0,
  });
  assertEqual(lat.canCompute, true);
  assertEqual(lat.msPerWord, null, 'msPerWord is null when bot words = 0');
  assertEqual(lat.skippedReading, false, 'skippedReading is false when bot words = 0');

  // Verify conversation pipeline ignores null msPerWord in validReadingLatencies
  const conv = analyzeConversation([
    {
      role: 'user',
      content: 'Hello bot',
      telemetry: { t_bot: 1000, t_first_key: 1050, t_send: 2000, is_tab_blurred: false },
    },
  ]);
  assertEqual(conv.studentTurns, 1);
  assertEqual(conv.avgReadingLatency, 0, 'No reading latencies recorded for 0-word bot turns');
  assertEqual(conv.skippedReadingRatio, 0.0);
});

// ---------------------------------------------------------------------
// 4. Verbal Volume Ratio (R_vol) and Student MLU-w
// ---------------------------------------------------------------------
console.log('\n▶ Section 4: Verbal Volume Ratio & MLU-w');

runTest('Calculates turn-taking verbosity balance and student utterance length', () => {
  const messages = [
    { role: 'assistant', content: 'Welcome to the STEM mentoring case. What is your initial hypothesis?' }, // 11 words
    { role: 'user', content: 'I hypothesize that students need more hands-on activities because engagement is low.' }, // 12 words
    { role: 'assistant', content: 'What evidence supports that?' }, // 4 words
    { role: 'user', content: 'Survey feedback from last semester showed high disinterest.' }, // 8 words
  ];

  const vol = calculateVolumeMetrics(messages);
  assertEqual(vol.studentWords, 20);
  assertEqual(vol.botWords, 15);
  assertEqual(vol.studentTurns, 2);
  assertEqual(vol.botTurns, 2);
  assertApprox(vol.verbalVolumeRatio, 20 / 15, 1e-3);
  assertEqual(vol.studentMluW, 10);
});

runTest('Handles edge case where bot words = 0 without division-by-zero', () => {
  const messages = [{ role: 'user', content: 'Hello there' }];
  const vol = calculateVolumeMetrics(messages);
  assertEqual(vol.verbalVolumeRatio, 0.0);
  assertEqual(vol.studentMluW, 2.0);
});

// ---------------------------------------------------------------------
// 5. Complete Conversation Analysis Pipeline
// ---------------------------------------------------------------------
console.log('\n▶ Section 5: Full Conversation Pipeline');

runTest('Analyzes entire dialogue producing all required metrics', () => {
  const messages = [
    { role: 'assistant', content: 'Hola, cuéntame sobre el problema.' },
    {
      role: 'user',
      content: 'Creo que el decano rechazará la propuesta porque falta presupuesto.',
      telemetry: { t_bot: 1000, t_first_key: 3000, t_send: 6000, is_tab_blurred: false },
    },
  ];

  const res = analyzeConversation(messages);
  assertEqual(res.studentTurns, 1);
  assertEqual(res.botTurns, 1);
  assert(res.studentWords > 0);
  assert(res.mattr25 > 0);
  assert(res.avgReadingLatency > 0);
  assertEqual(res.epistemicConnectors.causalCount, 1); // porque
  assertEqual(res.epistemicConnectors.metacognitiveCount, 1); // creo que
});

// ---------------------------------------------------------------------
// 6. Publication Interoperability: Tidy Exports, Codebook & LaTeX
// ---------------------------------------------------------------------
console.log('\n▶ Section 6: Publication Interoperability Exports');

runTest('Generates valid Tidy Data CSV/JSON at turn level', () => {
  const sessions = [
    {
      id: 'sess-123',
      messages: [
        { role: 'assistant', content: 'Assistant message' },
        { role: 'user', content: 'User response with reasoning because of evidence.', telemetry: { t_bot: 100, t_first_key: 500, t_send: 1000 } },
      ],
    },
  ];

  const turns = generateTidyTurns(sessions);
  assert(turns.csv.includes('session_id,turn_index,speaker,timestamp'), 'CSV contains header');
  assert(turns.csv.includes('sess-123'), 'CSV contains session ID');
  assert(turns.csv.includes('user'), 'CSV contains speaker');
  assert(turns.data.length === 2, 'Produces 2 turn rows');
});

runTest('Generates valid Tidy Data CSV/JSON at session level', () => {
  const sessions = [
    {
      id: 'sess-1',
      participant_name: 'Estudiante 1',
      workshop_id: 'w-1',
      condition: 'B',
      messages: [
        { role: 'assistant', content: 'Prompt message' },
        { role: 'user', content: 'Student response' },
      ],
      survey_responses: { q1_autonomy: 4, q2_depth: 5 },
    },
  ];

  const sessExport = generateTidySessions(sessions);
  assert(sessExport.csv.includes('session_id,participant_name,campaign_id'), 'Session CSV header');
  assert(sessExport.csv.includes('survey_q1_autonomy'), 'Survey item columns');
  assert(sessExport.data.length === 1);
});

runTest('Generates valid Longitudinal Tidy Export linking pre/post sessions', () => {
  const sessions = [
    {
      id: 'pre-1',
      chain_user_id: 'user-alpha',
      chain_order: 1,
      messages: [{ role: 'user', content: 'Pre dialogue' }],
      survey_responses: { score: 2.0 },
    },
    {
      id: 'post-1',
      chain_user_id: 'user-alpha',
      chain_order: 2,
      messages: [{ role: 'user', content: 'Post dialogue with much more depth and elaboration' }],
      survey_responses: { score: 4.0 },
    },
  ];

  const longExport = generateTidyLongitudinal(sessions);
  assertEqual(longExport.data.length, 1);
  const row = longExport.data[0];
  assertEqual(row.chain_user_id, 'user-alpha');
  assertEqual(row.pre_score, 2.0);
  assertEqual(row.post_score, 4.0);
  assertApprox(row.hake_gain_g, 2.0 / 3.0, 1e-3); // (4 - 2)/(5 - 2) = 2/3
  assertEqual(row.gain_tier, 'medium');
});

runTest('Auto-generated Codebook documents variable definitions and units', () => {
  const cb = generateCodebook();
  assert(cb.schema.length > 20, 'Covers all required variables');
  assert(cb.markdown.includes('# PromptSketch Scientific Codebook'), 'Generates valid Markdown');
  assert(cb.schema.every(item => item.var && item.type && item.unit && item.formula), 'Every entry has metadata');
});

runTest('Generates compilable LaTeX booktabs table matching ICACIT/LAK publication styles', () => {
  const results = {
    continuous: [
      {
        name: 'Reading Latency (ms/w)',
        meanA: 182.4,
        meanB: 245.1,
        cohensD: 0.72,
        dCi: [0.18, 1.26],
        pValue: 0.012,
        adjustedP: 0.036,
      },
    ],
    ordinal: [
      {
        name: 'Metacognitive Reflection (%)',
        medianA: 3.0,
        medianB: 5.0,
        cliffsDelta: 0.58,
        deltaCi: [0.22, 0.81],
        pValue: 0.004,
        adjustedP: 0.016,
      },
    ],
  };

  const latex = generateBooktabsTable(results);
  assert(latex.includes('\\begin{table}[htbp]'), 'Includes table environment');
  assert(latex.includes('\\toprule'), 'Includes \\toprule');
  assert(latex.includes('\\midrule'), 'Includes \\midrule');
  assert(latex.includes('\\bottomrule'), 'Includes \\bottomrule');
  assert(latex.includes('\\end{table}'), 'Closes table environment');
  assert(latex.includes('Reading Latency (ms/w)'));
  assert(latex.includes('Metacognitive Reflection (\\%)'), 'Escaped % safely');
  assert(latex.includes('*'), 'Asterisk marks significant adjusted p-values');
});

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------
console.log('\n========================================================');
console.log(` CHAT ANALYTICS RESULTS: ${passed} passed, ${failed} failed`);
console.log('========================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
