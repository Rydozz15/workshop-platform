#!/usr/bin/env node
/**
 * PromptSketch Independent Opaque-Box E2E Test Runner
 *
 * Runs Tiers 1-4 comprehensive requirement-driven test suite:
 * - Tier 1: Feature Coverage (>= 5 tests per feature across 11 features)
 * - Tier 2: Boundary & Corner Cases (>= 5 tests per category across 8 categories)
 * - Tier 3: Cross-Feature Interactions (5 pairwise integration scenarios)
 * - Tier 4: Real-World Application Scenarios (5 realistic N=9 mentoring scenarios)
 *
 * Usage:
 *   node test/e2e/runner.js
 *   node test/e2e/runner.js --tier=1
 *   node test/e2e/runner.js --tier=2
 *   node test/e2e/runner.js --tier=3
 *   node test/e2e/runner.js --tier=4
 */

import { register } from 'node:module';
register('./harness/resolve-hook.js', import.meta.url);

import './harness/env.js';
import { colors } from './harness/test-utils.js';
import { setupTestDatabase, teardownTestDatabase } from './harness/memory-db-harness.js';

// Parse CLI flags
const args = process.argv.slice(2);
let selectedTier = null;
for (const arg of args) {
  if (arg.startsWith('--tier=')) {
    selectedTier = parseInt(arg.slice(7), 10);
  }
}

async function loadAllSuites() {
  const [
    // Tier 1
    { createOnboardingStepperSuite },
    { createCaseSheetSuite },
    { createChatStreamingSuite },
    { createSurveySubmissionSuite },
    { createJourneyHubSuite },
    { createAdminWorkbenchSuite },
    { createDraftingDiffSuite },
    { createAssumptionAnalyticsSuite },
    { createGlossarySuite },
    { createMultiProviderSettingsSuite },

    // Tier 2
    { createEmptyInputsSuite },
    { createSmallSampleSuite },
    { createZeroVarianceSuite },
    { createTiedRanksSuite },
    { createMissingQuestionsSuite },
    { createLongTextSuite },
    { createRapidTypingSuite },
    { createNetworkFailuresSuite },

    // Tier 3
    { createChainedSessionsHakeSuite },
    { createChatTelemetryExportSuite },
    { createDraftingLaunchTelemetrySuite },
    { createSurveyPsychometricsPipelineSuite },
    { createIRRJudgeCalibrationSuite },
    { createRandomizedStepOrderSuite },

    // Tier 4
    { createScenario1ContestableVsBaselineSuite },
    { createScenario2CeilingEffectSuite },
    { createScenario3EpistemicConnectorsSuite },
    { createScenario4LatexTidyExportsSuite },
    { createScenario5IRRPrevalenceParadoxSuite },
  ] = await Promise.all([
    // Tier 1
    import('./tier1-feature-coverage/onboarding-stepper.test.js'),
    import('./tier1-feature-coverage/case-sheet.test.js'),
    import('./tier1-feature-coverage/chat-streaming.test.js'),
    import('./tier1-feature-coverage/survey-submission.test.js'),
    import('./tier1-feature-coverage/journey-hub.test.js'),
    import('./tier1-feature-coverage/admin-workbench.test.js'),
    import('./tier1-feature-coverage/drafting-diff.test.js'),
    import('./tier1-feature-coverage/assumption-analytics.test.js'),
    import('./tier1-feature-coverage/glossary.test.js'),
    import('./tier1-feature-coverage/multi-provider-settings.test.js'),

    // Tier 2
    import('./tier2-boundary-corner/empty-inputs.test.js'),
    import('./tier2-boundary-corner/small-sample-n0-n1.test.js'),
    import('./tier2-boundary-corner/zero-variance.test.js'),
    import('./tier2-boundary-corner/tied-ranks.test.js'),
    import('./tier2-boundary-corner/missing-questions.test.js'),
    import('./tier2-boundary-corner/long-text-tokens.test.js'),
    import('./tier2-boundary-corner/rapid-typing-telemetry.test.js'),
    import('./tier2-boundary-corner/network-provider-failures.test.js'),

    // Tier 3
    import('./tier3-interactions/chained-sessions-hake.test.js'),
    import('./tier3-interactions/chat-telemetry-export.test.js'),
    import('./tier3-interactions/drafting-launch-telemetry.test.js'),
    import('./tier3-interactions/survey-psychometrics-pipeline.test.js'),
    import('./tier3-interactions/irr-judge-calibration.test.js'),
    import('./tier3-interactions/randomized-step-order.test.js'),

    // Tier 4
    import('./tier4-real-world/scenario-1-contestable-vs-baseline.test.js'),
    import('./tier4-real-world/scenario-2-ceiling-effect-divergence.test.js'),
    import('./tier4-real-world/scenario-3-epistemic-connectors.test.js'),
    import('./tier4-real-world/scenario-4-latex-tidy-exports.test.js'),
    import('./tier4-real-world/scenario-5-irr-prevalence-paradox.test.js'),
  ]);

  return [
    createOnboardingStepperSuite(),
    createCaseSheetSuite(),
    createChatStreamingSuite(),
    createSurveySubmissionSuite(),
    createJourneyHubSuite(),
    createAdminWorkbenchSuite(),
    createDraftingDiffSuite(),
    createAssumptionAnalyticsSuite(),
    createGlossarySuite(),
    createMultiProviderSettingsSuite(),

    createEmptyInputsSuite(),
    createSmallSampleSuite(),
    createZeroVarianceSuite(),
    createTiedRanksSuite(),
    createMissingQuestionsSuite(),
    createLongTextSuite(),
    createRapidTypingSuite(),
    createNetworkFailuresSuite(),

    createChainedSessionsHakeSuite(),
    createChatTelemetryExportSuite(),
    createDraftingLaunchTelemetrySuite(),
    createSurveyPsychometricsPipelineSuite(),
    createIRRJudgeCalibrationSuite(),
    createRandomizedStepOrderSuite(),

    createScenario1ContestableVsBaselineSuite(),
    createScenario2CeilingEffectSuite(),
    createScenario3EpistemicConnectorsSuite(),
    createScenario4LatexTidyExportsSuite(),
    createScenario5IRRPrevalenceParadoxSuite(),
  ];
}

async function main() {
  const startTime = performance.now();
  console.log(`\n${colors.bold}${colors.blue}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}   PromptSketch Opaque-Box E2E Test Suite (Tiers 1-4)           ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}   Target: LAK27 Interactive Demo Track / Memory Persistence    ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}================================================================${colors.reset}`);
  console.log(`${colors.dim}DB_PROVIDER = ${process.env.DB_PROVIDER}${colors.reset}`);
  console.log(`${colors.dim}DB_MEMORY_PATH = ${process.env.DB_MEMORY_PATH}${colors.reset}`);
  if (selectedTier) {
    console.log(`${colors.yellow}Running filtered tests for Tier ${selectedTier} only.${colors.reset}`);
  }

  const allSuites = await loadAllSuites();
  const suitesToRun = selectedTier
    ? allSuites.filter(s => s.tier === selectedTier)
    : allSuites;

  setupTestDatabase();

  const tierSummary = {
    1: { total: 0, passed: 0, failed: 0 },
    2: { total: 0, passed: 0, failed: 0 },
    3: { total: 0, passed: 0, failed: 0 },
    4: { total: 0, passed: 0, failed: 0 },
  };

  let globalTotal = 0;
  let globalPassed = 0;
  let globalFailed = 0;

  try {
    for (const suite of suitesToRun) {
      const summary = await suite.run();
      globalTotal += summary.total;
      globalPassed += summary.passed;
      globalFailed += summary.failed;

      tierSummary[summary.tier].total += summary.total;
      tierSummary[summary.tier].passed += summary.passed;
      tierSummary[summary.tier].failed += summary.failed;
    }
  } finally {
    teardownTestDatabase();
  }

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

  console.log(`\n${colors.bold}${colors.blue}================================================================${colors.reset}`);
  console.log(`${colors.bold}                    E2E TEST RUN SUMMARY                        ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}================================================================${colors.reset}`);
  console.log(`Tier 1 (Feature Coverage):       ${tierSummary[1].passed} / ${tierSummary[1].total} passed`);
  console.log(`Tier 2 (Boundary & Corner):      ${tierSummary[2].passed} / ${tierSummary[2].total} passed`);
  console.log(`Tier 3 (Cross-Feature Inter.):   ${tierSummary[3].passed} / ${tierSummary[3].total} passed`);
  console.log(`Tier 4 (Real-World Scenarios):   ${tierSummary[4].passed} / ${tierSummary[4].total} passed`);
  console.log(`${colors.bold}${colors.blue}----------------------------------------------------------------${colors.reset}`);
  console.log(`TOTAL TESTS:                     ${globalTotal}`);
  console.log(`PASSED:                          ${colors.green}${globalPassed}${colors.reset}`);
  console.log(`FAILED:                          ${globalFailed > 0 ? colors.red : colors.green}${globalFailed}${colors.reset}`);
  console.log(`ELAPSED TIME:                    ${elapsed}s`);
  console.log(`${colors.bold}${colors.blue}================================================================${colors.reset}\n`);

  if (globalFailed > 0) {
    console.error(`${colors.bold}${colors.red}❌ FAILED: ${globalFailed} test(s) failed.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.bold}${colors.green}✓ SUCCESS: All ${globalPassed} E2E tests passed cleanly.${colors.reset}\n`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
