/**
 * Tier 2: Boundary & Corner Cases — Rapid Typing & Telemetry Edge Cases (>= 5 tests)
 * Tests client latency telemetry bounds: sub-millisecond typing,
 * skipped reading flags (<100 ms/word), extended inactivity (>180s), and zero-word turns.
 */
import { TestSuite, assert, assertEqual } from '../harness/test-utils.js';
import { analyzeConversation } from '../harness/spec-oracle.js';

export function createRapidTypingSuite() {
  const suite = new TestSuite('Boundary: Rapid Typing & Telemetry Limits (Tier 2)', 2);

  // Test 1: Sub-millisecond keystroke interval (t_first_key === t_bot)
  suite.test('Instantaneous typing interval (0 ms latency) handled without division-by-zero or NaN', () => {
    const messages = [
      { role: 'assistant', content: 'Diez palabras para el bot que entregan una respuesta estructurada.' },
      {
        role: 'user',
        content: 'Respuesta inmediata.',
        telemetry: {
          t_bot: 1000,
          t_first_key: 1000, // 0 ms
          t_send: 1500,
          is_tab_blurred: false,
        },
      },
    ];
    const metrics = analyzeConversation(messages);
    assertEqual(metrics.skippedTurns, 1, '0 ms reading latency must flag skipped reading');
    assertEqual(metrics.avgReadingLatency, 0);
  });

  // Test 2: Skipped reading detected when reading time < 100 ms/word on bot reply
  suite.test('Reading time < 100 ms/word on substantial bot reply flags skipped reading', () => {
    const messages = [
      { role: 'assistant', content: 'Una respuesta con exactamente diez palabras de texto del bot asistente.' },
      {
        role: 'user',
        content: 'Sí.',
        telemetry: {
          t_bot: 1000,
          t_first_key: 1400, // 400ms for 10 words = 40 ms/word < 100
          t_send: 2000,
          is_tab_blurred: false,
        },
      },
    ];
    const metrics = analyzeConversation(messages);
    assertEqual(metrics.skippedTurns, 1, 'Should trigger skipped reading flag');
  });

  // Test 3: Extended inactivity (> 180,000 ms) flags inactivity outlier
  suite.test('Extended reading delay (> 180,000 ms) flags inactivity outlier and trims from mean', () => {
    const messages = [
      { role: 'assistant', content: 'Mensaje del bot con diez palabras para probar el temporizador de inactividad.' },
      {
        role: 'user',
        content: 'Volví después de un descanso.',
        telemetry: {
          t_bot: 1000,
          t_first_key: 250000, // 249,000 ms > 180,000 ms (outlier)
          t_send: 260000,
          is_tab_blurred: false,
        },
      },
    ];
    const metrics = analyzeConversation(messages);
    assertEqual(metrics.outlierTurns, 1, 'Should flag inactivity outlier');
    assertEqual(metrics.avgReadingLatency, 0, 'Outlier turn must be excluded from trimmed mean');
  });

  // Test 4: Tab blur event triggers inactivity outlier
  suite.test('Browser tab backgrounding (is_tab_blurred = true) flags turn as outlier', () => {
    const messages = [
      { role: 'assistant', content: 'Mensaje del bot con diez palabras de texto para evaluar cambio de pestaña.' },
      {
        role: 'user',
        content: 'Cambié de pestaña un momento.',
        telemetry: {
          t_bot: 1000,
          t_first_key: 5000,
          t_send: 6000,
          is_tab_blurred: true, // Tab was backgrounded
        },
      },
    ];
    const metrics = analyzeConversation(messages);
    assertEqual(metrics.outlierTurns, 1, 'Tab blur must flag inactivity outlier');
  });

  // Test 5: Verbal volume ratio when bot words = 0 handled without division-by-zero
  suite.test('Verbal volume ratio when assistant words = 0 returns 0.0 safely', () => {
    const messages = [
      { role: 'user', content: 'Mensaje único del estudiante sin respuesta del bot aún.' },
    ];
    const metrics = analyzeConversation(messages);
    assertEqual(metrics.botWords, 0);
    assertEqual(metrics.verbalVolumeRatio, 0.0);
    assertEqual(metrics.studentTurns, 1);
  });

  return suite;
}
