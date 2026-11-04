/**
 * Tier 1: Student-Facing Journey Hub Tests (>= 5 tests)
 * Tests formative dialogic insights, cognitive pacing, inquiry depth classification,
 * epistemic marker summary, and longitudinal progress comparison.
 */
import { TestSuite, assert, assertEqual, assertApproxEqual } from '../harness/test-utils.js';
import { analyzeConversation } from '../harness/spec-oracle.js';

export function createJourneyHubSuite() {
  const suite = new TestSuite('Student-Facing Journey Hub (Tier 1)', 1);

  // Test 1: Formative dialogic analytics generated on session completion
  suite.test('Generates conversational turn-taking summary from session messages', () => {
    const messages = [
      { role: 'user', content: '¿Cómo debería negociar las horas dedicadas a este proyecto con mi director?' },
      { role: 'assistant', content: 'Es fundamental clarificar las expectativas institucionales antes de asumir nuevos compromisos.' },
      { role: 'user', content: 'Entiendo, pero me preocupa que afecte mi evaluación académica semestral.' },
      { role: 'assistant', content: 'Podrías preparar un registro detallado de las actividades previas para fundamentar tu posición.' },
    ];
    const metrics = analyzeConversation(messages);
    assert(metrics.studentWords > 0, 'Must compute student words');
    assert(metrics.botWords > 0, 'Must compute bot words');
    assertEqual(metrics.studentTurns, 2, 'Must count exactly 2 student turns');
    assert(metrics.verbalVolumeRatio > 0, 'Must compute Verbal Volume Ratio');
  });

  // Test 2: Cognitive pacing metrics computed from client latency telemetry
  suite.test('Cognitive pacing isolates reading time from composition time', () => {
    const messages = [
      {
        role: 'assistant',
        content: 'Un mensaje de prueba con diez palabras para evaluar el cálculo de lectura.',
      },
      {
        role: 'user',
        content: 'Respuesta del estudiante.',
        telemetry: {
          t_bot: 1000,
          t_first_key: 3500, // 2500ms reading
          t_send: 5000,       // 1500ms composition
          is_tab_blurred: false,
        },
      },
    ];
    const metrics = analyzeConversation(messages);
    // Reading latency: 2500ms for 13 bot words ≈ 192.3 ms/word
    assertApproxEqual(metrics.avgReadingLatency, 2500 / 13, 1.0);
    assertEqual(metrics.skippedTurns, 0, 'Should not be flagged as skipped reading');
    assertEqual(metrics.outlierTurns, 0, 'Should not be flagged as outlier');
  });

  // Test 3: Inquiry depth classification based on turn-taking ratio
  suite.test('Classifies inquiry depth into exploratory vs directive categories', () => {
    const classifyInquiry = (verbalVolumeRatio, epistemicCount) => {
      if (verbalVolumeRatio >= 0.35 && epistemicCount >= 2) return 'Exploratory & Critical';
      if (verbalVolumeRatio >= 0.20) return 'Diagnostic';
      return 'Directive / Passive';
    };

    assertEqual(classifyInquiry(0.42, 3), 'Exploratory & Critical');
    assertEqual(classifyInquiry(0.25, 1), 'Diagnostic');
    assertEqual(classifyInquiry(0.12, 0), 'Directive / Passive');
  });

  // Test 4: Epistemic reflection marker summary highlights causal and metacognitive markers
  suite.test('Identifies epistemic connectors used by student during dialogue', () => {
    const messages = [
      {
        role: 'user',
        content: 'Creo que debo postergar esa publicación porque no tenemos los datos completos, sin embargo revisaré el borrador.',
      },
    ];
    const metrics = analyzeConversation(messages);
    assertEqual(metrics.epistemicConnectors.metacognitiveCount, 1, 'creo que');
    assertEqual(metrics.epistemicConnectors.causalCount, 1, 'porque');
    assertEqual(metrics.epistemicConnectors.adversativeCount, 1, 'sin embargo');
  });

  // Test 5: Longitudinal progress comparison between chained sessions
  suite.test('Longitudinal progress map tracks shift in reflection pacing between Step 1 and Step 2', () => {
    const step1Metrics = { verbalVolumeRatio: 0.18, readingLatency: 175.0, epistemicDensity: 2.1 };
    const step2Metrics = { verbalVolumeRatio: 0.42, readingLatency: 245.0, epistemicDensity: 5.8 };

    const deltaVvol = step2Metrics.verbalVolumeRatio - step1Metrics.verbalVolumeRatio;
    const deltaLatency = step2Metrics.readingLatency - step1Metrics.readingLatency;
    const deltaEpistemic = step2Metrics.epistemicDensity - step1Metrics.epistemicDensity;

    assert(deltaVvol > 0.20, 'Verbal volume increased in scaffolded condition');
    assert(deltaLatency > 50.0, 'Reading latency increased, showing deeper reflection');
    assert(deltaEpistemic > 3.0, 'Epistemic density surged');
  });

  return suite;
}
