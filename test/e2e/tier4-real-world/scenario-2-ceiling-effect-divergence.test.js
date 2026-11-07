/**
 * Tier 4: Real-World Scenario 2 — Likert Ceiling Effect & Process Trace Divergence
 * Replicates the "Contextual Grounding Paradox" (Marconi et al., 2026):
 * Identical self-reported survey satisfaction (M=4.00 in both conditions)
 * contrasts with deep divergences in conversational learning analytics
 * (Reading Latency and Verbal Volume Ratio).
 */
import { TestSuite, assert, assertEqual, assertApproxEqual } from '../harness/test-utils.js';
import { runWelchTTest, runMannWhitneyU } from '../harness/spec-oracle.js';

export function createScenario2CeilingEffectSuite() {
  const suite = new TestSuite('Scenario 2: Likert Ceiling Effect Divergence (Tier 4)', 4);

  // Empirical data from N=9 mentoring field study
  // Perceived Applicability (Likert 1-5):
  const surveyApplicability_A = [4, 4, 5, 3, 4, 4, 5, 3, 4]; // M=4.00, SD=0.707
  const surveyApplicability_B = [5, 5, 4, 2, 5, 5, 4, 2, 4]; // M=4.00, SD=1.323

  // Conversational Process Traces:
  // Reading Latency (ms/word):
  const readingLatency_A = [175.2, 184.0, 192.1, 168.5, 188.4, 179.0, 185.3, 172.0, 197.1]; // M ≈ 182.4
  const readingLatency_B = [242.0, 255.4, 238.1, 249.0, 260.2, 235.0, 244.5, 230.1, 251.6]; // M ≈ 245.1

  // Verbal Volume Ratio (Rvol = student words / bot words):
  const verbalVolume_A = [0.15, 0.18, 0.22, 0.14, 0.20, 0.16, 0.19, 0.17, 0.21]; // M ≈ 0.18
  const verbalVolume_B = [0.41, 0.45, 0.38, 0.42, 0.46, 0.39, 0.44, 0.37, 0.46]; // M ≈ 0.42

  // Test 1: Self-report Likert ratings show identical means (M=4.00 vs M=4.00)
  suite.test('Self-report Likert applicability exhibits exact ceiling equality (M_A = 4.00, M_B = 4.00)', () => {
    const meanA = surveyApplicability_A.reduce((a, b) => a + b, 0) / 9;
    const meanB = surveyApplicability_B.reduce((a, b) => a + b, 0) / 9;
    assertApproxEqual(meanA, 4.00, 1e-4);
    assertApproxEqual(meanB, 4.00, 1e-4);

    const mwRes = runMannWhitneyU(surveyApplicability_A, surveyApplicability_B);
    assertEqual(mwRes.canCompute, true);
    assert(Math.abs(mwRes.cliffsDelta) < 0.147, 'Cliff delta magnitude is negligible (<0.147 per Romano 2006)');
    assertEqual(mwRes.romanoMagnitude, 'negligible');
    assert(mwRes.pValue > 0.05, 'p-value must show no significant difference (ceiling effect)');
  });

  // Test 2: Normalized reading latency diverges significantly despite identical survey scores
  suite.test('Normalized reading latency (ms/word) surges in Condition B demonstrating deeper processing', () => {
    const tRes = runWelchTTest(readingLatency_A, readingLatency_B);
    assertEqual(tRes.canCompute, true);
    assert(tRes.meanB > tRes.meanA, 'Condition B participants read slower (more thoughtfully)');
    assert(tRes.pValue < 0.001, 'Reading latency difference must be statistically significant');
    assert(tRes.cohensD < -2.0, 'Effect size on reading latency must be huge');
  });

  // Test 3: Verbal volume ratio (Rvol) more than doubles under Explore-before-Build
  suite.test('Verbal Volume Ratio more than doubles (Rvol = 0.18 -> 0.42) reflecting active learner agency', () => {
    const tRes = runWelchTTest(verbalVolume_A, verbalVolume_B);
    assertEqual(tRes.canCompute, true);
    assert(tRes.meanB > tRes.meanA * 2.0, 'Condition B verbal volume must be > 2x Condition A');
    assert(tRes.pValue < 0.001, 'Verbal volume difference must be statistically significant');
  });

  return suite;
}
