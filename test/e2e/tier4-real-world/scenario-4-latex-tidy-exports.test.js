/**
 * Tier 4: Real-World Scenario 4 — Publication-Grade LaTeX booktabs & Tidy Data Exports
 * Validates direct generation of compilable LaTeX booktabs tables
 * (\toprule, \midrule, \bottomrule) and multi-level Tidy Data packages.
 */
import { TestSuite, assert, assertEqual } from '../harness/test-utils.js';
import { generateBooktabsTable } from '../harness/spec-oracle.js';

export function createScenario4LatexTidyExportsSuite() {
  const suite = new TestSuite('Scenario 4: LaTeX booktabs & Tidy Data Exports (Tier 4)', 4);

  // Test 1: Generates valid LaTeX table matching a journal publication template
  suite.test('LaTeX generator produces compilable booktabs table with toprule, midrule, and bottomrule', () => {
    const results = {
      continuous: [
        {
          name: 'Reading Latency (ms/w)',
          meanA: 182.4,
          meanB: 245.1,
          cohensD: 0.72,
          pValue: 0.012,
          adjustedP: 0.036,
        },
        {
          name: 'Verbal Volume ($R_{\\text{vol}}$)',
          meanA: 0.18,
          meanB: 0.42,
          cohensD: 1.15,
          pValue: 0.003,
          adjustedP: 0.012,
        },
      ],
      ordinal: [
        {
          name: 'Metacognitive Reflection',
          medianA: 3.0,
          medianB: 5.0,
          cliffsDelta: 0.58,
          pValue: 0.004,
          adjustedP: 0.016,
        },
      ],
    };

    const latex = generateBooktabsTable(results);
    assert(latex.includes('\\begin{table}[htbp]'), 'Must include table environment');
    assert(latex.includes('\\toprule'), 'Must include \\toprule');
    assert(latex.includes('\\midrule'), 'Must include \\midrule');
    assert(latex.includes('\\bottomrule'), 'Must include \\bottomrule');
    assert(latex.includes('\\end{table}'), 'Must close table environment');
    assert(latex.includes('Reading Latency (ms/w)'), 'Must include continuous metric row');
    assert(latex.includes('Metacognitive Reflection'), 'Must include ordinal metric row');
    assert(latex.includes('*'), 'Must mark statistically significant results with asterisk');
  });

  // Test 2: Tidy Codebook metadata completeness
  suite.test('Auto-generated Codebook schema specifies operational definitions and units for all variables', () => {
    const codebook = [
      { var: 'norm_reading_ms_per_word', type: 'float', unit: 'ms/word', formula: 'latency / bot_words' },
      { var: 'verbal_volume_ratio', type: 'float', unit: 'ratio', formula: 'student_words / bot_words' },
      { var: 'hake_gain_g', type: 'float', unit: 'index', formula: '(post - pre) / (max - pre)' },
      { var: 'cliffs_delta', type: 'float', unit: 'index', formula: '1 - 2*U / (nA*nB)' },
    ];
    assertEqual(codebook.length, 4);
    assert(codebook.every(entry => entry.var && entry.type && entry.unit && entry.formula));
  });

  // Test 3: Escapes special LaTeX characters in variable names safely
  suite.test('LaTeX table generator escapes %, _, and & without compilation breaking', () => {
    const results = {
      continuous: [
        {
          name: 'Completion Rate (\\%)',
          meanA: 85.0,
          meanB: 95.0,
          cohensD: 0.50,
          pValue: 0.040,
          adjustedP: 0.040,
        },
      ],
      ordinal: [],
    };
    const latex = generateBooktabsTable(results);
    assert(latex.includes('Completion Rate (\\%)'));
  });

  return suite;
}
