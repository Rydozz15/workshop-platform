/**
 * Tier 4: Real-World Scenario 5 — IRR Judge Calibration under Prevalence Skew
 * Models Human-vs-Human and Human-vs-LLM-as-a-Judge categorical coding
 * on authentic dialogue turns, demonstrating how Gwet's AC1 resolves
 * the Feinstein & Cicchetti (1990) Prevalence Paradox when Cohen's kappa collapses.
 */
import { TestSuite, assert, assertEqual, assertApproxEqual } from '../harness/test-utils.js';
import { calculateIRR } from '../harness/spec-oracle.js';

export function createScenario5IRRPrevalenceParadoxSuite() {
  const suite = new TestSuite('Scenario 5: IRR Judge Calibration & Prevalence Paradox (Tier 4)', 4);

  // 18 authentic paired dialogue codings from the mentoring study:
  // Codes: "Epistemic Inquiry", "Pragmatic Inquiry", "Generic Solution", "Enriched Solution"
  // Note: "Generic Solution" dominates the baseline condition (15 out of 18 cases = 83.3% prevalence)
  const humanCoder = [
    'Generic Solution', 'Generic Solution', 'Generic Solution', 'Generic Solution', 'Generic Solution',
    'Generic Solution', 'Generic Solution', 'Generic Solution', 'Generic Solution', 'Generic Solution',
    'Generic Solution', 'Generic Solution', 'Generic Solution', 'Generic Solution', 'Generic Solution',
    'Epistemic Inquiry', 'Epistemic Inquiry', 'Enriched Solution',
  ];

  const llmJudge = [
    'Generic Solution', 'Generic Solution', 'Generic Solution', 'Generic Solution', 'Generic Solution',
    'Generic Solution', 'Generic Solution', 'Generic Solution', 'Generic Solution', 'Generic Solution',
    'Generic Solution', 'Generic Solution', 'Generic Solution', 'Generic Solution', 'Epistemic Inquiry', // 1 disagreement
    'Epistemic Inquiry', 'Epistemic Inquiry', 'Enriched Solution',
  ];

  // Test 1: High observed agreement (17 out of 18 agreements = 94.4%)
  suite.test('Observed agreement between Human coder and LLM Judge achieves 94.4% (17/18)', () => {
    const irr = calculateIRR(humanCoder, llmJudge);
    assertEqual(irr.canCompute, true);
    assertApproxEqual(irr.observedAgreement, 17.0 / 18.0, 1e-3);
    assert(irr.observedAgreement > 0.90, 'Observed agreement must exceed 90%');
  });

  // Test 2: Cohen's kappa is artificially deflated by high chance agreement (Prevalence Paradox)
  suite.test('Cohen kappa is artificially depressed due to chance-agreement inflation', () => {
    const irr = calculateIRR(humanCoder, llmJudge);
    assertEqual(irr.canCompute, true);
    // Despite 94.4% agreement, kappa is depressed to ~0.78 or lower
    assert(irr.cohenKappa < irr.observedAgreement, 'Kappa must be lower than observed agreement');
  });

  // Test 3: Gwet's AC1 remains resiliently high (> 0.90) reflecting true inter-rater consistency
  suite.test('Gwets AC1 remains robust (>0.90) providing an unbiased reliability estimate', () => {
    const irr = calculateIRR(humanCoder, llmJudge);
    assertEqual(irr.canCompute, true);
    assert(irr.gwetsAC1 > irr.cohenKappa, 'Gwet AC1 must be higher than depressed Cohen kappa');
    assert(irr.gwetsAC1 >= 0.90, 'Gwet AC1 must reflect the near-perfect 94.4% agreement');
  });

  // Test 4: Prevalence paradox alert triggered when single category >= 80%
  suite.test('Triggers prevalence paradox diagnostic flag on heavy category skew', () => {
    const irr = calculateIRR(humanCoder, llmJudge);
    assertEqual(irr.canCompute, true);
    assertEqual(irr.prevalenceWarning, true, 'Prevalence paradox warning must be active');
  });

  return suite;
}
