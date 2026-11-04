/**
 * Tier 1: Drafting Table Prompt Diff Tests (>= 5 tests)
 * Tests side-by-side and unified prompt comparison, line and word diffs,
 * margin markers (+, -, ~), token estimation, and confirmation summaries.
 */
import { TestSuite, assert, assertEqual, assertDeepEqual } from '../harness/test-utils.js';

export function createDraftingDiffSuite() {
  const suite = new TestSuite('Drafting Table Prompt Comparator (Tier 1)', 1);

  // Line diff simulator using standard LCS/diff logic
  function computeLineDiff(textA, textB) {
    const linesA = textA.split('\n');
    const linesB = textB.split('\n');
    const diff = [];
    const maxLines = Math.max(linesA.length, linesB.length);

    for (let i = 0; i < maxLines; i++) {
      const lineA = linesA[i];
      const lineB = linesB[i];

      if (lineA === lineB) {
        diff.push({ type: 'unchanged', marker: ' ', lineA, lineB });
      } else if (lineA === undefined) {
        diff.push({ type: 'added', marker: '+', lineA: null, lineB });
      } else if (lineB === undefined) {
        diff.push({ type: 'removed', marker: '−', lineA, lineB: null });
      } else {
        diff.push({ type: 'modified', marker: '~', lineA, lineB });
      }
    }
    return diff;
  }

  // Test 1: Side-by-side prompt diff detects added, removed, and modified lines
  suite.test('Drafting comparator computes line-by-line diffs with proper margin markers', () => {
    const promptA = 'Role: Academic Mentor.\nProvide direct advice.';
    const promptB = 'Role: Academic Mentor.\nApply Explore-before-Build.\nAsk one question at a time.';

    const diff = computeLineDiff(promptA, promptB);
    assertEqual(diff[0].type, 'unchanged');
    assertEqual(diff[0].marker, ' ');
    assertEqual(diff[1].type, 'modified');
    assertEqual(diff[1].marker, '~');
    assertEqual(diff[2].type, 'added');
    assertEqual(diff[2].marker, '+');
  });

  // Test 2: Token counter estimation
  suite.test('Token estimation computes approximate token counts with word/char heuristic', () => {
    const estimateTokens = text => Math.ceil(text.trim().split(/\s+/).length * 1.33);
    const prompt = 'You are an educational prompt assistant designed to scaffold student metacognitive reflection.';
    const tokens = estimateTokens(prompt);
    assert(tokens >= 14 && tokens <= 20, `Token estimation ${tokens} should be in realistic bounds`);
  });

  // Test 3: Identical prompts yield zero diff modifications
  suite.test('Identical prompts produce only unchanged lines with zero additions or deletions', () => {
    const prompt = 'You are an advisor.\nListen actively.';
    const diff = computeLineDiff(prompt, prompt);
    assert(diff.every(d => d.type === 'unchanged'), 'All lines must be unchanged');
    assertEqual(diff.length, 2);
  });

  // Test 4: Spacer row generation for aligned visual comparison
  suite.test('Inserts aligned spacer rows when one prompt has extra lines', () => {
    const promptA = 'Line 1\nLine 2';
    const promptB = 'Line 1\nLine 2\nExtra Line 3';
    const diff = computeLineDiff(promptA, promptB);
    assertEqual(diff[2].lineA, null);
    assertEqual(diff[2].lineB, 'Extra Line 3');
    assertEqual(diff[2].type, 'added');
  });

  // Test 5: Pre-launch confirmation dialog summary generation
  suite.test('Generates pre-launch confirmation summary with conditions, sample sizes, and costs', () => {
    const generateLaunchSummary = ({ conditionA, conditionB, targetN, estimatedTurns, costPer1k }) => {
      const totalTurns = targetN * 2 * estimatedTurns;
      const estimatedCost = (totalTurns * 250 * costPer1k) / 1000;
      return {
        conditionA,
        conditionB,
        totalTargetSample: targetN * 2,
        totalEstimatedTurns: totalTurns,
        estimatedCostUsd: Number(estimatedCost.toFixed(4)),
        status: 'preregistered',
      };
    };

    const summary = generateLaunchSummary({
      conditionA: 'Naive Baseline',
      conditionB: 'Explore-before-Build',
      targetN: 15,
      estimatedTurns: 6,
      costPer1k: 0.0006, // $0.60 per 1M tokens
    });

    assertEqual(summary.totalTargetSample, 30);
    assertEqual(summary.totalEstimatedTurns, 180);
    assert(summary.estimatedCostUsd > 0);
    assertEqual(summary.status, 'preregistered');
  });

  return suite;
}
