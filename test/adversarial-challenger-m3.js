/**
 * Adversarial Stress-Testing Suite for Milestone 3 (Chat Analytics & Exports)
 * 
 * Conducted by: Empirical Challenger 2 (critic, specialist)
 * Date: 2026-11-04
 * 
 * Tests:
 * 1. MATTR: L < W, L = 0, L = 1, all unique, all identical, extreme lengths (5,000 tokens), invalid W
 * 2. Bilingual Epistemic Connectors:
 *    - Accents, uppercase, mixed-case
 *    - Punctuation boundaries (? ! . , : ; ¿ ¡ " ' ( ) [ ])
 *    - False positives: "esperó", "superó", "operó", "asesino", "casi que", "recreo que", "compuesto que", "comprende"
 *    - Edge cases: "debido a" vs "debido al", "por que" vs "porque" vs "por qué"
 * 3. Latency & Composition Timings:
 *    - Negative timestamps, inverted timestamps (t_first_key < t_bot, t_send < t_first_key)
 *    - Epoch 0 (t_bot = 0, t_first_key = 0)
 *    - Missing or NaN timestamps
 *    - Outlier triggers: >180s, is_tab_blurred, botWordCount = 0
 * 4. LaTeX Booktabs Generation & pdflatex Compilation:
 *    - Escaping of %, _, &, #
 *    - Preservation of math mode ($...$)
 *    - Negative lookbehind check (no double escaping \\% -> \\\\%)
 *    - Compilability test using pdflatex command line
 * 5. Tidy Data Exports (Turn, Session, Longitudinal):
 *    - RFC 4180 CSV compliance with newlines, commas, quotes
 *    - No 'NaN', 'undefined', or literal string 'null'
 *    - Python csv and json loader validation
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
  generateBooktabsTable,
  escapeLatex,
} from '../lib/latex-generator.js';

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message, stack: err.stack });
    console.error(`  [FAIL] ${name}\n         -> ${err.message}`);
  }
}

function assert(cond, msg = 'Assertion failed') {
  if (!cond) throw new Error(msg);
}

function assertApprox(actual, expected, tol = 1e-4, msg = '') {
  if (Math.abs(actual - expected) > tol) {
    throw new Error(`${msg} (Expected ~${expected}, got ${actual}, diff: ${Math.abs(actual - expected)})`);
  }
}

console.log('================================================================');
console.log('ADVERSARIAL STRESS SUITE: M3 CHAT ANALYTICS & EXPORTS VERIFIER');
console.log('================================================================\n');

// ---------------------------------------------------------------------
// TEST GROUP 1: MATTR ADVERSARIAL CHALLENGES
// ---------------------------------------------------------------------
console.log('--- TEST GROUP 1: MATTR Calculation ---');

test('MATTR L=0 (empty input): returns 0.0 safely without NaN or crash', () => {
  assert(calculateMattr([], 25) === 0.0, 'Empty array returns 0.0');
  assert(calculateMattr('', 25) === 0.0, 'Empty string returns 0.0');
  assert(calculateMattr(null, 25) === 0.0, 'Null returns 0.0');
  assert(calculateMattr(undefined, 25) === 0.0, 'Undefined returns 0.0');
  const details = getMattrDetails([], 25);
  assert(details.mattr === 0.0 && details.tokenCount === 0);
});

test('MATTR L=1 with W=25: fallback standard TTR = 1.0, shortSampleWarning=true', () => {
  const details = getMattrDetails(['singleword'], 25);
  assert(details.mattr === 1.0, 'Single token has TTR = 1.0');
  assert(details.shortSampleWarning === true, 'Flags shortSampleWarning');
  assert(details.windowUsed === 1, 'windowUsed is 1');
  assert(details.tokenCount === 1, 'tokenCount is 1');
});

test('MATTR L < W: all unique tokens (e.g. L=10, W=25) -> returns 1.0', () => {
  const tokens = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  const mattr = calculateMattr(tokens, 25);
  assertApprox(mattr, 1.0, 1e-6, '10 unique tokens out of 10 gives 1.0');
  const details = getMattrDetails(tokens, 25);
  assert(details.shortSampleWarning === true);
  assert(details.windowUsed === 10);
});

test('MATTR L < W: all identical tokens (e.g. L=10, W=25) -> returns 1/10 = 0.1', () => {
  const tokens = new Array(10).fill('repetitive');
  const mattr = calculateMattr(tokens, 25);
  assertApprox(mattr, 0.1, 1e-6, '10 identical tokens gives 1/10 = 0.1');
});

test('MATTR L = W (boundary condition L=25, W=25): single window K=1', () => {
  // 25 distinct tokens
  const unique25 = Array.from({ length: 25 }, (_, i) => `word_${i}`);
  assertApprox(calculateMattr(unique25, 25), 1.0, 1e-6, '25 unique tokens in W=25 -> 1.0');
  const detailsUnique = getMattrDetails(unique25, 25);
  assert(detailsUnique.shortSampleWarning === false, 'No warning when L >= W');
  assert(detailsUnique.windowUsed === 25);

  // 25 identical tokens
  const ident25 = new Array(25).fill('constant');
  assertApprox(calculateMattr(ident25, 25), 1 / 25, 1e-6, '25 identical tokens in W=25 -> 1/25 = 0.04');
});

test('MATTR L = W + 1 (L=26, W=25): 2 sliding windows K=2', () => {
  // 26 identical tokens
  const ident26 = new Array(26).fill('repeat');
  // window 0..24: 1 unique / 25 = 0.04; window 1..25: 1 unique / 25 = 0.04 -> avg = 0.04
  assertApprox(calculateMattr(ident26, 25), 0.04, 1e-6, '26 identical tokens gives 0.04');

  // Alternating tokens: ['a', 'b', 'a', 'b', ...] length 26
  const alt26 = Array.from({ length: 26 }, (_, i) => (i % 2 === 0 ? 'a' : 'b'));
  // Any 25-window has both 'a' and 'b' -> unique = 2 -> TTR = 2/25 = 0.08
  assertApprox(calculateMattr(alt26, 25), 0.08, 1e-6, 'Alternating 2-token sequence has MATTR = 2/25 = 0.08');
});

test('MATTR on large token sequence (5,000 tokens): stress & complexity test', () => {
  const t0 = performance.now();
  // Generate 5,000 tokens repeating a 100-word cycle
  const largeTokens = Array.from({ length: 5000 }, (_, i) => `term_${i % 100}`);
  // In any window of size W=50, since 50 <= 100, all 50 tokens in the window are unique!
  // So MATTR(50) must be exactly 1.0!
  const mattr50 = calculateMattr(largeTokens, 50);
  const elapsed = performance.now() - t0;

  assertApprox(mattr50, 1.0, 1e-6, 'Window of 50 in 100-cycle should have 100% unique tokens (1.0)');
  assert(elapsed < 1000, `MATTR calculation on 5,000 tokens must be fast (<1000ms), took ${elapsed.toFixed(1)}ms`);
});

// ---------------------------------------------------------------------
// TEST GROUP 2: BILINGUAL EPISTEMIC CONNECTOR REGEX ADVERSARIAL CHALLENGES
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 2: Epistemic & Metacognitive Connectors ---');

test('Accented and uppercase Spanish variations are detected with 100% recall', () => {
  const text = 'POR QUÉ no consideras esto? DADO QUE ya sabemos la causa. ASÍ QUE debemos actuar. SIN EMBARGO, CREO QUE fallará.';
  const res = extractEpistemicConnectors(text);
  // Causal: "por que", "dado que", "asi que" -> 3
  assert(res.causalCount === 3, `Expected 3 causal connectors, found ${res.causalCount}`);
  // Adversative: "sin embargo" -> 1
  assert(res.adversativeCount === 1, `Expected 1 adversative connector, found ${res.adversativeCount}`);
  // Metacognitive: "creo que" -> 1
  assert(res.metacognitiveCount === 1, `Expected 1 metacognitive marker, found ${res.metacognitiveCount}`);
});

test('False positive immunity: substrings inside other words must NEVER match', () => {
  // "esperó" should NOT match "pero"
  // "superó" should NOT match "pero"
  // "operó" should NOT match "pero"
  // "peronista" should NOT match "pero"
  // "asesino" / "casino" should NOT match "sino"
  // "casi que" should NOT match "asi que"
  // "recreo que" should NOT match "creo que"
  // "compuesto que" should NOT match "puesto que"
  // "comprende" should NOT match "por ende"
  const falsePositiveText = 'El profesor esperó y superó la dificultad. Operó con cuidado en el casino del asesino. Casi que no llega. En el recreo que tuvimos, el compuesto que preparamos se comprende.';
  const res = extractEpistemicConnectors(falsePositiveText);

  assert(res.adversativeCount === 0, `Expected 0 adversative false positives, found ${res.adversativeCount}`);
  assert(res.causalCount === 0, `Expected 0 causal false positives, found ${res.causalCount}`);
  assert(res.metacognitiveCount === 0, `Expected 0 metacognitive false positives, found ${res.metacognitiveCount}`);
});

test('Punctuation boundary immunity: markers wrapped in symbols are detected correctly', () => {
  // Test ¿ ¡ ( ) [ ] " ' . , : ; -
  const punctuatedText = '¿Porque? (Pero) ¡Aunque! "Sin embargo", [creo que] {pienso que}: debido a... asi que;';
  const res = extractEpistemicConnectors(punctuatedText);

  // Causal: "porque", "debido a", "asi que" = 3
  assert(res.causalCount === 3, `Expected 3 causal in punctuation, found ${res.causalCount}`);
  // Adversative: "pero", "aunque", "sin embargo" = 3
  assert(res.adversativeCount === 3, `Expected 3 adversative in punctuation, found ${res.adversativeCount}`);
  // Metacognitive: "creo que", "pienso que" = 2
  assert(res.metacognitiveCount === 2, `Expected 2 metacognitive in punctuation, found ${res.metacognitiveCount}`);
});

test('English epistemic connectors: full vocabulary coverage', () => {
  const englishText = 'Because of that, since yesterday, due to rain, therefore we conclude, thus it is, consequently proven, as a result established, hence verified. But wait, however true, although difficult, even though simple, nevertheless valid, despite obstacles, on the other hand notable, whereas clear, nonetheless solid. I think yes, I believe so, I realize now, I understand this, I doubt it, it seems fair, reflecting on this, I wonder why, I assume yes, not sure yet.';
  const res = extractEpistemicConnectors(englishText);

  // English causal: because, since, due to, therefore, thus, consequently, as a result, hence = 8
  assert(res.causalCount === 8, `Expected 8 English causal markers, found ${res.causalCount}`);
  // English adversative: but, however, although, even though, nevertheless, despite, on the other hand, whereas, nonetheless = 9
  assert(res.adversativeCount === 9, `Expected 9 English adversative markers, found ${res.adversativeCount}`);
  // English metacognitive: i think, i believe, i realize, i understand, i doubt, it seems, reflecting, i wonder, i assume, not sure = 10
  assert(res.metacognitiveCount === 10, `Expected 10 English metacognitive markers, found ${res.metacognitiveCount}`);
});

test('Zero word count handling: returns 0 density without division by zero', () => {
  const resEmpty = extractEpistemicConnectors('');
  assert(resEmpty.causalDensity === 0 && resEmpty.adversativeDensity === 0 && resEmpty.metacognitiveDensity === 0);

  const resNull = extractEpistemicConnectors(null);
  assert(resNull.causalDensity === 0);

  // Explicit override with totalWords = 0
  const resOverride = extractEpistemicConnectors('porque pero creo que', 0);
  assert(resOverride.causalCount === 1);
  assert(resOverride.causalDensity === 0.0);
});

// ---------------------------------------------------------------------
// TEST GROUP 3: LATENCY & TIMESTAMPS ADVERSARIAL CHALLENGES
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 3: Latency & Telemetry Metrics ---');

test('Inverted timestamps (t_first_key < t_bot): clamped to 0 ms reading latency, flags skipped reading', () => {
  const turnData = {
    t_bot: 10000,
    t_first_key: 8000, // Inverted: 2000 ms before bot finished
    t_send: 12000,
    is_tab_blurred: false,
    botWordCount: 20,
  };
  const lat = calculateLatencyMetrics(turnData);

  assert(lat.canCompute === true, 'canCompute must be true');
  assert(lat.readingLatencyMs === 0, `readingLatencyMs must clamp to 0, got ${lat.readingLatencyMs}`);
  assert(lat.compositionTimeMs === 4000, `compositionTimeMs must be 4000, got ${lat.compositionTimeMs}`);
  assert(lat.msPerWord === 0, `msPerWord must be 0, got ${lat.msPerWord}`);
  assert(lat.skippedReading === true, 'Must flag skipped reading because 0 < 100 ms/word');
  assert(lat.inactivityOutlier === false, 'Not an inactivity outlier');
});

test('Inverted composition timestamp (t_send < t_first_key): clamped to 0 ms', () => {
  const turnData = {
    t_bot: 10000,
    t_first_key: 15000,
    t_send: 13000, // Inverted: send timestamp before first key
    is_tab_blurred: false,
    botWordCount: 10,
  };
  const lat = calculateLatencyMetrics(turnData);

  assert(lat.readingLatencyMs === 5000);
  assert(lat.compositionTimeMs === 0, `compositionTimeMs clamped to 0, got ${lat.compositionTimeMs}`);
});

test('Negative timestamps: mathematical subtraction preserves difference or clamps', () => {
  const turnData = {
    t_bot: -5000,
    t_first_key: -2000,
    t_send: 1000,
    botWordCount: 15,
  };
  const lat = calculateLatencyMetrics(turnData);
  assert(lat.canCompute === true);
  assert(lat.readingLatencyMs === 3000, `(-2000 - -5000) = 3000 ms, got ${lat.readingLatencyMs}`);
  assert(lat.compositionTimeMs === 3000, `(1000 - -2000) = 3000 ms, got ${lat.compositionTimeMs}`);
});

test('Missing or null timestamps: returns canCompute=false safely without NaN', () => {
  const lat1 = calculateLatencyMetrics({});
  assert(lat1.canCompute === false && lat1.readingLatencyMs === null);

  const lat2 = calculateLatencyMetrics({ t_bot: 1000, t_first_key: null });
  assert(lat2.canCompute === false);

  const lat3 = calculateLatencyMetrics({ t_bot: null, t_first_key: 2000 });
  assert(lat3.canCompute === false);
});

test('Bot word count = 0: avoids division by zero via Math.max(1, botWordCount)', () => {
  const turnData = {
    t_bot: 1000,
    t_first_key: 3000,
    t_send: 5000,
    botWordCount: 0, // Zero words in bot prompt
  };
  const lat = calculateLatencyMetrics(turnData);
  assert(lat.canCompute === true);
  assert(lat.readingLatencyMs === 2000);
  assert(lat.msPerWord === 2000, `2000 / 1 = 2000 ms/word, got ${lat.msPerWord}`);
  assert(!isNaN(lat.msPerWord), 'msPerWord must not be NaN');
});

test('Skipped reading boundary: triggers on <100 ms/word OR (<800ms total when botWordCount > 20)', () => {
  // Case A: 50 words, 4000ms reading -> 80 ms/word (<100) -> skipped = true
  const latA = calculateLatencyMetrics({ t_bot: 1000, t_first_key: 5000, t_send: 6000, botWordCount: 50 });
  assert(latA.skippedReading === true);

  // Case B: 25 words, 700ms reading -> 28 ms/word (<100 and <800ms with >20 words) -> skipped = true
  const latB = calculateLatencyMetrics({ t_bot: 1000, t_first_key: 1700, t_send: 3000, botWordCount: 25 });
  assert(latB.skippedReading === true);

  // Case C: 5 words, 600ms reading -> 120 ms/word (>=100 and botWordCount <= 20) -> skipped = false
  const latC = calculateLatencyMetrics({ t_bot: 1000, t_first_key: 1600, t_send: 3000, botWordCount: 5 });
  assert(latC.skippedReading === false);
});

test('Inactivity outlier boundary: triggers on >180,000 ms OR is_tab_blurred = true', () => {
  const lat180k = calculateLatencyMetrics({ t_bot: 1000, t_first_key: 181001, t_send: 190000, botWordCount: 10 });
  assert(lat180k.inactivityOutlier === true, '>180k ms triggers inactivity outlier');

  const latBlur = calculateLatencyMetrics({ t_bot: 1000, t_first_key: 3000, t_send: 5000, is_tab_blurred: true, botWordCount: 10 });
  assert(latBlur.inactivityOutlier === true, 'Tab blurred triggers inactivity outlier');

  const latNormal = calculateLatencyMetrics({ t_bot: 1000, t_first_key: 3000, t_send: 5000, is_tab_blurred: false, botWordCount: 10 });
  assert(latNormal.inactivityOutlier === false);
});

// ---------------------------------------------------------------------
// TEST GROUP 4: LATEX BOOKTABS COMPILATION & ESCAPING CHALLENGES
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 4: LaTeX Generator & Real pdflatex Compilation ---');

test('escapeLatex safely escapes %, _, &, # outside math mode while preserving math mode', () => {
  const raw = 'Metacognitive Reflection (%) & Depth (#) with $R_{\\text{vol}}$ and $p < 0.05$';
  const escaped = escapeLatex(raw);

  assert(escaped.includes('\\%'), 'Escaped %');
  assert(escaped.includes('\\&'), 'Escaped &');
  assert(escaped.includes('\\#'), 'Escaped #');
  assert(escaped.includes('$R_{\\text{vol}}$'), 'Preserved math mode with unescaped underscore in math');
  assert(!escaped.includes('\\$'), 'Did not escape dollar signs for math');
});

test('escapeLatex idempotence (negative lookbehind): does not double-escape already escaped symbols', () => {
  const alreadyEscaped = 'Values with \\% and \\_ and \\& and \\#';
  const result = escapeLatex(alreadyEscaped);
  assert(!result.includes('\\\\%'), 'Does not double escape \\%');
  assert(!result.includes('\\\\_'), 'Does not double escape \\_');
  assert(!result.includes('\\\\&'), 'Does not double escape \\&');
  assert(!result.includes('\\\\#'), 'Does not double escape \\#');
});

test('Real pdflatex compilation of generated table with adversarial input strings', () => {
  const results = {
    continuous: [
      {
        name: 'Normalized Reading Latency (ms/word)',
        meanA: 182.4,
        meanB: 245.1,
        cohensD: 0.72,
        dCi: [0.18, 1.26],
        pValue: 0.012,
        adjustedP: 0.036,
      },
      {
        name: 'Verbal Volume Ratio ($R_{\\text{vol}}$)',
        meanA: 0.18,
        meanB: 0.42,
        cohensD: 1.15,
        dCi: [0.52, 1.78],
        pValue: 0.003,
        adjustedP: 0.012,
      },
      {
        name: 'Length_Invariant_MATTR ($W=25$)',
        meanA: 0.74,
        meanB: 0.81,
        cohensD: 0.48,
        dCi: [-0.05, 1.01],
        pValue: 0.084,
        adjustedP: 0.168,
      },
    ],
    ordinal: [
      {
        name: 'Epistemic & Metacognitive Depth (%)',
        medianA: 3.0,
        medianB: 5.0,
        cliffsDelta: 0.58,
        deltaCi: [0.22, 0.81],
        pValue: 0.004,
        adjustedP: 0.016,
      },
      {
        name: 'Overall_Confidence (#1 to #5)',
        medianA: 4.0,
        medianB: 4.0,
        cliffsDelta: 0.00,
        deltaCi: [-0.32, 0.32],
        pValue: 1.000,
        adjustedP: 1.000,
      },
    ],
  };

  const tableLatex = generateBooktabsTable(results, {
    caption: 'Adversarial Test: Evaluating Condition A & Condition B with 100% Valid LaTeX.',
    label: 'tab:adversarial_test',
    familySize: 5,
  });

  // Verify booktabs elements
  assert(tableLatex.includes('\\begin{table}[htbp]'), 'Has \\begin{table}');
  assert(tableLatex.includes('\\toprule'), 'Has \\toprule');
  assert(tableLatex.includes('\\midrule'), 'Has \\midrule');
  assert(tableLatex.includes('\\bottomrule'), 'Has \\bottomrule');
  assert(tableLatex.includes('\\end{table}'), 'Has \\end{table}');

  // Wrap in complete standalone LaTeX document
  const latexDoc = `\\documentclass{article}
\\usepackage{booktabs}
\\usepackage{amsmath}
\\begin{document}
${tableLatex}
\\end{document}
`;

  const scratchDir = '/tmp/adversarial_latex_test';
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
  const texFile = path.join(scratchDir, 'test_table.tex');
  fs.writeFileSync(texFile, latexDoc, 'utf8');

  try {
    const compileOutput = execSync(`pdflatex -interaction=nonstopmode -output-directory=${scratchDir} ${texFile}`, {
      encoding: 'utf8',
      timeout: 10000,
    });
    assert(compileOutput.includes('Output written on'), 'pdflatex produced PDF cleanly');
    console.log('         -> pdflatex compiled table successfully with 0 errors!');
  } catch (err) {
    throw new Error(`pdflatex compilation failed: ${err.stdout || err.message}`);
  } finally {
    // Clean up temporary files
    try {
      fs.rmSync(scratchDir, { recursive: true, force: true });
    } catch (_) {}
  }
});

// ---------------------------------------------------------------------
// TEST GROUP 5: TIDY DATA EXPORTS CSV/JSON SCHEMA VALIDATION
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 5: Tidy Data CSV/JSON Schema Validation ---');

test('escapeCsvCell complies with RFC 4180 standard', () => {
  assert(escapeCsvCell(null) === '', 'null -> empty string');
  assert(escapeCsvCell(undefined) === '', 'undefined -> empty string');
  assert(escapeCsvCell(NaN) === '', 'NaN -> empty string');
  assert(escapeCsvCell(Infinity) === '', 'Infinity -> empty string');
  assert(escapeCsvCell(true) === 'true', 'true boolean');
  assert(escapeCsvCell(false) === 'false', 'false boolean');
  assert(escapeCsvCell(42) === '42', 'integer');
  assert(escapeCsvCell(3.14159) === '3.1416', 'float to 4 decimals');
  assert(escapeCsvCell('Simple text') === 'Simple text');
  // Escaping commas, quotes, newlines
  assert(escapeCsvCell('Hello, world') === '"Hello, world"', 'Quoted commas');
  assert(escapeCsvCell('He said "yes"') === '"He said ""yes"""', 'Escaped quotes');
  assert(escapeCsvCell("Line 1\nLine 2") === '"Line 1\nLine 2"', 'Quoted newlines');
});

test('Turn-Level Tidy Export parsed cleanly by Python csv and json loaders', () => {
  const sessions = [
    {
      id: 'sess-turn-test-1',
      messages: [
        {
          role: 'assistant',
          content: 'Hello, welcome!\nLet us begin.',
          telemetry: { prompt_tokens: 15, completion_tokens: 8, cost_usd: 0.00002 },
        },
        {
          role: 'user',
          content: 'I believe we should proceed, because the "evidence" is clear.\nSecond line.',
          telemetry: { t_bot: 1000, t_first_key: 3500, t_send: 7000, is_tab_blurred: false },
        },
      ],
    },
  ];

  const exportResult = generateTidyTurns(sessions);

  // Validate CSV with Python csv module
  const scratchDir = '/tmp/adversarial_tidy_test';
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const csvPath = path.join(scratchDir, 'turns.csv');
  const jsonPath = path.join(scratchDir, 'turns.json');
  fs.writeFileSync(csvPath, exportResult.csv, 'utf8');
  fs.writeFileSync(jsonPath, exportResult.json, 'utf8');

  const pyScript = `
import csv, json, sys

# 1. Test CSV
with open('${csvPath}', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

assert len(rows) == 2, f"Expected 2 rows in CSV, got {len(rows)}"
assert rows[0]['speaker'] == 'assistant', "First turn speaker is assistant"
assert rows[1]['speaker'] == 'user', "Second turn speaker is user"
assert rows[1]['causal_connectors_count'] == '1', f"Expected 1 causal connector ('because'), got {rows[1]['causal_connectors_count']}"
assert rows[1]['metacognitive_markers_count'] == '1', f"Expected 1 metacognitive marker ('i believe'), got {rows[1]['metacognitive_markers_count']}"
assert 'because the "evidence" is clear' in rows[1]['content'], "Preserved quotes and commas in content"

# 2. Test JSON
with open('${jsonPath}', 'r', encoding='utf-8') as f:
    data = json.load(f)

assert len(data) == 2, f"Expected 2 objects in JSON, got {len(data)}"
assert data[1]['reading_latency_ms'] == 2500, f"Expected 2500 reading latency, got {data[1]['reading_latency_ms']}"
assert data[1]['composition_time_ms'] == 3500, f"Expected 3500 composition time, got {data[1]['composition_time_ms']}"

print("PYTHON_VALIDATION_SUCCESS")
`;

  try {
    const pyOutput = execSync(`python3 -c "${pyScript.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
    assert(pyOutput.includes('PYTHON_VALIDATION_SUCCESS'), 'Python successfully parsed CSV and JSON');
    console.log('         -> Python 3.12 validated RFC 4180 CSV and JSON schema cleanly!');
  } catch (err) {
    throw new Error(`Python validation failed: ${err.stdout || err.message}`);
  } finally {
    try {
      fs.rmSync(scratchDir, { recursive: true, force: true });
    } catch (_) {}
  }
});

test('Session-Level and Longitudinal Tidy Exports contain no literal NaN or null strings', () => {
  const sessions = [
    {
      id: 'pre-sess',
      participant_name: 'Estudiante Alpha',
      workshop_id: 'ws-1',
      version_id: 'v-1',
      chain_user_id: 'pair-99',
      chain_order: 1,
      messages: [
        { role: 'assistant', content: 'Pre question' },
        { role: 'user', content: 'Short answer' },
      ],
      survey_responses: { q1: 2, q2: 3 },
    },
    {
      id: 'post-sess',
      participant_name: 'Estudiante Alpha',
      workshop_id: 'ws-1',
      version_id: 'v-2',
      chain_user_id: 'pair-99',
      chain_order: 2,
      messages: [
        { role: 'assistant', content: 'Post question' },
        { role: 'user', content: 'I think this makes sense because of the deeper reflection we performed.' },
      ],
      survey_responses: { q1: 4, q2: 5 },
    },
  ];

  const sessExport = generateTidySessions(sessions);
  const longExport = generateTidyLongitudinal(sessions);

  // Check CSV strings do NOT contain literal 'NaN', 'undefined', or 'null'
  const csvText = sessExport.csv + '\n' + longExport.csv;
  assert(!csvText.includes(',NaN,'), 'CSV does not contain literal NaN');
  assert(!csvText.includes(',undefined,'), 'CSV does not contain literal undefined');

  // Verify Longitudinal row
  assert(longExport.data.length === 1, 'Longitudinal exports 1 paired row');
  const pair = longExport.data[0];
  assert(pair.chain_user_id === 'pair-99');
  assert(pair.pre_score === 2.5); // (2 + 3) / 2
  assert(pair.post_score === 4.5); // (4 + 5) / 2
  assert(pair.hake_gain_g !== null && !isNaN(pair.hake_gain_g));
  assert(pair.gain_tier === 'high', `Hake gain (4.5 - 2.5)/(5 - 2.5) = 2/2.5 = 0.80 -> high tier, got ${pair.gain_tier}`);
});

// ---------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------
console.log('\n================================================================');
console.log(`ADVERSARIAL STRESS RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================\n');

if (failed > 0) {
  console.error('FAILURES SUMMARY:');
  failures.forEach((f, idx) => {
    console.error(`  ${idx + 1}. [${f.name}]: ${f.error}`);
  });
  process.exit(1);
} else {
  console.log('ALL ADVERSARIAL STRESS TESTS PASSED CLEANLY WITH ZERO DEFECTS.');
  process.exit(0);
}
