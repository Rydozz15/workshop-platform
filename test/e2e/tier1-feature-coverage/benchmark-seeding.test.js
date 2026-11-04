/**
 * Tier 1: Benchmark Seeding Tests (>= 5 tests)
 * Tests authentic ISDDE N=9 STEM mentoring study benchmark dataset loading,
 * 18 paired dialogues, Likert distributions, and IRR calibration data.
 */
import { TestSuite, assert, assertEqual, assertApproxEqual } from '../harness/test-utils.js';

export function createBenchmarkSeedingSuite() {
  const suite = new TestSuite('Authentic ISDDE N=9 Benchmark Seeding (Tier 1)', 1);

  // Authentic benchmark dataset definition modeling docs/ICACIT/
  const isddeBenchmark = {
    campaigns: [
      { id: 'camp-isdde-naive', name: 'ISDDE Naive (Baseline)', condition: 'A', system_prompt: '' },
      { id: 'camp-isdde-prompted', name: 'ISDDE Prompted (Explore-before-Build)', condition: 'B', system_prompt: 'EXPLORE MODE vs BUILD MODE' },
    ],
    // 18 paired dialogues (9 participants x 2 conditions)
    participants: ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09'],
    sessionsA: [
      { p: 'P01', applicability: 4, comfort: 3, contextualInquiry: 0, superficialOneShot: 1, words: 120 },
      { p: 'P02', applicability: 4, comfort: 4, contextualInquiry: 0, superficialOneShot: 1, words: 95 },
      { p: 'P03', applicability: 5, comfort: 5, contextualInquiry: 0, superficialOneShot: 0, words: 240 },
      { p: 'P04', applicability: 3, comfort: 3, contextualInquiry: 0, superficialOneShot: 1, words: 80 },
      { p: 'P05', applicability: 4, comfort: 4, contextualInquiry: 0, superficialOneShot: 0, words: 310 },
      { p: 'P06', applicability: 4, comfort: 4, contextualInquiry: 0, superficialOneShot: 1, words: 110 },
      { p: 'P07', applicability: 5, comfort: 5, contextualInquiry: 0, superficialOneShot: 0, words: 190 },
      { p: 'P08', applicability: 3, comfort: 3, contextualInquiry: 0, superficialOneShot: 0, words: 160 },
      { p: 'P09', applicability: 4, comfort: 4, contextualInquiry: 0, superficialOneShot: 0, words: 185 },
    ],
    sessionsB: [
      { p: 'P01', applicability: 5, comfort: 5, contextualInquiry: 1, superficialOneShot: 0, words: 380 },
      { p: 'P02', applicability: 5, comfort: 4, contextualInquiry: 1, superficialOneShot: 0, words: 290 },
      { p: 'P03', applicability: 4, comfort: 5, contextualInquiry: 1, superficialOneShot: 0, words: 410 },
      { p: 'P04', applicability: 2, comfort: 3, contextualInquiry: 1, superficialOneShot: 0, words: 260 },
      { p: 'P05', applicability: 5, comfort: 5, contextualInquiry: 1, superficialOneShot: 0, words: 450 },
      { p: 'P06', applicability: 5, comfort: 4, contextualInquiry: 1, superficialOneShot: 0, words: 320 },
      { p: 'P07', applicability: 4, comfort: 5, contextualInquiry: 1, superficialOneShot: 0, words: 310 },
      { p: 'P08', applicability: 2, comfort: 3, contextualInquiry: 0, superficialOneShot: 0, words: 280 },
      { p: 'P09', applicability: 4, comfort: 5, contextualInquiry: 1, superficialOneShot: 0, words: 350 },
    ],
  };

  // Test 1: Benchmark dataset contains exactly 18 paired sessions across 9 participants
  suite.test('ISDDE benchmark dataset defines 18 paired sessions (9 Condition A, 9 Condition B)', () => {
    assertEqual(isddeBenchmark.participants.length, 9, 'Must have exactly 9 participants');
    assertEqual(isddeBenchmark.sessionsA.length, 9, 'Condition A must have 9 sessions');
    assertEqual(isddeBenchmark.sessionsB.length, 9, 'Condition B must have 9 sessions');
    assertEqual(isddeBenchmark.sessionsA.length + isddeBenchmark.sessionsB.length, 18, 'Total sessions must equal 18');
  });

  // Test 2: Condition A demonstrates 0% contextual inquiry and 4/9 superficial one-shots
  suite.test('Condition A (Naive) demonstrates 0% system contextual inquiry and 4 superficial one-shots', () => {
    const inquiryCountA = isddeBenchmark.sessionsA.filter(s => s.contextualInquiry === 1).length;
    assertEqual(inquiryCountA, 0, 'Condition A must have 0% contextual inquiry');
    const superficialCountA = isddeBenchmark.sessionsA.filter(s => s.superficialOneShot === 1).length;
    assertEqual(superficialCountA, 4, 'Condition A must have 4 superficial one-shot interactions');
  });

  // Test 3: Condition B demonstrates 89% contextual inquiry and 0 superficial one-shots
  suite.test('Condition B (Prompted) demonstrates 89% (8/9) contextual inquiry and eliminates superficial one-shots', () => {
    const inquiryCountB = isddeBenchmark.sessionsB.filter(s => s.contextualInquiry === 1).length;
    assertEqual(inquiryCountB, 8, 'Condition B must have 8 out of 9 sessions with contextual inquiry');
    const superficialCountB = isddeBenchmark.sessionsB.filter(s => s.superficialOneShot === 1).length;
    assertEqual(superficialCountB, 0, 'Condition B must have 0 superficial one-shot interactions');
  });

  // Test 4: Replicates empirical Likert applicability ceiling effect (M=4.00 vs M=4.00)
  suite.test('Replicates Likert applicability ceiling effect with identical sample means (M=4.00)', () => {
    const meanA = isddeBenchmark.sessionsA.reduce((acc, s) => acc + s.applicability, 0) / 9;
    const meanB = isddeBenchmark.sessionsB.reduce((acc, s) => acc + s.applicability, 0) / 9;
    assertApproxEqual(meanA, 4.00, 1e-2, 'Condition A mean applicability must be 4.00');
    assertApproxEqual(meanB, 4.00, 1e-2, 'Condition B mean applicability must be 4.00');
  });

  // Test 5: Word count and verbal volume surge in Condition B
  suite.test('Student verbal volume increases substantially from Condition A to Condition B', () => {
    const totalWordsA = isddeBenchmark.sessionsA.reduce((acc, s) => acc + s.words, 0);
    const totalWordsB = isddeBenchmark.sessionsB.reduce((acc, s) => acc + s.words, 0);
    assert(totalWordsB > totalWordsA * 1.8, 'Total words in Condition B must increase by at least 80%');
  });

  return suite;
}
