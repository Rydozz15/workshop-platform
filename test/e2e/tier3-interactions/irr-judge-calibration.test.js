/**
 * Tier 3: Cross-Feature Interaction 5 — Inter-Rater Reliability (IRR) Judge Calibration
 * Tests paired categorical ratings (Human vs Human or Human vs LLM-as-a-Judge),
 * confusion matrix generation, Cohen's kappa, and Gwet's AC1 prevalence sensitivity.
 */
import { TestSuite, assert, assertEqual, assertApproxEqual } from '../harness/test-utils.js';
import { calculateIRR } from '../harness/spec-oracle.js';

export function createIRRJudgeCalibrationSuite() {
  const suite = new TestSuite('Interaction: IRR Judge Calibration (Tier 3)', 3);

  // Test 1: Uniform marginal distributions yield agreement between Cohen kappa and Gwet AC1
  suite.test('Balanced categorical coding produces concordant Cohen kappa and Gwet AC1', () => {
    // 20 cases coded into 3 categories: ['Explore', 'Guide', 'Prescribe']
    const rater1 = ['Explore', 'Explore', 'Guide', 'Guide', 'Prescribe', 'Prescribe', 'Explore', 'Guide', 'Prescribe', 'Explore'];
    const rater2 = ['Explore', 'Explore', 'Guide', 'Guide', 'Prescribe', 'Prescribe', 'Explore', 'Guide', 'Prescribe', 'Explore'];

    const irr = calculateIRR(rater1, rater2);
    assertEqual(irr.canCompute, true);
    assertEqual(irr.observedAgreement, 1.0);
    assertApproxEqual(irr.cohenKappa, 1.0, 1e-4);
    assertApproxEqual(irr.gwetsAC1, 1.0, 1e-4);
    assertEqual(irr.prevalenceWarning, false);
  });

  // Test 2: Extreme single-class prevalence triggers the Prevalence Paradox warning
  suite.test('Severe prevalence skew (>80% single class) triggers prevalence paradox warning', () => {
    // 20 cases where 18 are "Generic Solution" and both raters agree on 17 of them (Po = 85%)
    const rater1 = [
      'Generic', 'Generic', 'Generic', 'Generic', 'Generic',
      'Generic', 'Generic', 'Generic', 'Generic', 'Generic',
      'Generic', 'Generic', 'Generic', 'Generic', 'Generic',
      'Generic', 'Generic', 'Generic', 'Enriched', 'Enriched',
    ];
    const rater2 = [
      'Generic', 'Generic', 'Generic', 'Generic', 'Generic',
      'Generic', 'Generic', 'Generic', 'Generic', 'Generic',
      'Generic', 'Generic', 'Generic', 'Generic', 'Generic',
      'Generic', 'Generic', 'Enriched', 'Enriched', 'Generic',
    ];

    const irr = calculateIRR(rater1, rater2);
    assertEqual(irr.canCompute, true);
    assert(irr.observedAgreement >= 0.85, 'Observed agreement must be high (85%)');
    // Cohen's kappa is artificially suppressed by high chance agreement
    assert(irr.cohenKappa < 0.60, `Cohen kappa ${irr.cohenKappa} should be suppressed`);
    // Gwet's AC1 remains resiliently high
    assert(irr.gwetsAC1 >= 0.80, `Gwet AC1 ${irr.gwetsAC1} should remain high`);
    assertEqual(irr.prevalenceWarning, true, 'Prevalence warning must be triggered');
  });

  // Test 3: Confusion matrix dimensions match category set
  suite.test('Confusion matrix accurately counts paired inter-rater assignments', () => {
    const rater1 = ['A', 'A', 'B', 'B'];
    const rater2 = ['A', 'B', 'B', 'A'];
    const irr = calculateIRR(rater1, rater2, ['A', 'B']);
    assertEqual(irr.confusionMatrix.length, 2);
    assertEqual(irr.confusionMatrix[0].length, 2);
    assertEqual(irr.observedAgreement, 0.5); // 2 agreements out of 4
  });

  return suite;
}
