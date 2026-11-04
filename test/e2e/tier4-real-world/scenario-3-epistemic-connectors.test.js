/**
 * Tier 4: Real-World Scenario 3 — Bilingual Epistemic & Metacognitive Connector Density
 * Tests normalized regex scanning across authentic Chilean colloquial & formal Spanish,
 * as well as English research interactions, verifying accent folding and word boundaries.
 */
import { TestSuite, assert, assertEqual, assertApproxEqual } from '../harness/test-utils.js';
import { analyzeConversation } from '../harness/spec-oracle.js';

export function createScenario3EpistemicConnectorsSuite() {
  const suite = new TestSuite('Scenario 3: Bilingual Epistemic Connector Density (Tier 4)', 4);

  // Test 1: Spanish dialogue with diacritics and capitalizations ("POR QUÉ", "creó que")
  suite.test('Spanish accent-folding correctly detects capitalized and accented epistemic markers', () => {
    const spanishMessages = [
      {
        role: 'user',
        content: 'POR QUÉ debería aceptar más alumnos si DADO QUE estoy sobrecargada no tengo tiempo? SIN EMBARGO, CREO QUE el decano insistirá.',
      },
    ];
    const metrics = analyzeConversation(spanishMessages);
    // Markers present:
    // Causal: "por que", "dado que" = 2
    // Adversative: "sin embargo" = 1
    // Metacognitive: "creo que" = 1
    assert(metrics.epistemicConnectors.causalCount >= 2, 'Must detect "por que" and "dado que"');
    assertEqual(metrics.epistemicConnectors.adversativeCount, 1, 'Must detect "sin embargo"');
    assertEqual(metrics.epistemicConnectors.metacognitiveCount, 1, 'Must detect "creo que"');
  });

  // Test 2: English research interaction epistemic markers
  suite.test('English research interaction captures causal, adversative, and metacognitive markers', () => {
    const englishMessages = [
      {
        role: 'user',
        content: 'I believe this publication strategy is flawed because our sample size is limited. However, we could run a pilot study.',
      },
    ];
    const metrics = analyzeConversation(englishMessages);
    // Markers present:
    // Causal: "because" = 1
    // Adversative: "however" = 1
    // Metacognitive: "i believe" = 1
    assertEqual(metrics.epistemicConnectors.causalCount, 1);
    assertEqual(metrics.epistemicConnectors.adversativeCount, 1);
    assertEqual(metrics.epistemicConnectors.metacognitiveCount, 1);
  });

  // Test 3: Density per 100 student words calculation
  suite.test('Computes exact connector density scaled per 100 student words', () => {
    // 50 student words with 2 causal connectors -> density = (2 / 50) * 100 = 4.0
    const words = new Array(47).fill('palabra');
    words.splice(10, 0, 'porque');
    words.splice(25, 0, 'ya que');
    const messages = [{ role: 'user', content: words.join(' ') }];

    const metrics = analyzeConversation(messages);
    assertEqual(metrics.studentWords, 50);
    assertEqual(metrics.epistemicConnectors.causalCount, 2);
    assertApproxEqual(metrics.epistemicConnectors.causalDensity, 4.0, 1e-4);
  });

  return suite;
}
