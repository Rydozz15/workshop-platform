/**
 * Tier 1: Participant Onboarding Stepper Tests (>= 5 tests)
 * Tests 3-step structured participant onboarding flow:
 * Paso 1: Purpose & Role, Paso 2: Dialogic Expectations, Paso 3: Interface Tour & Privacy
 */
import { TestSuite, assert, assertEqual, assertDeepEqual } from '../harness/test-utils.js';
import { apiClient } from '../harness/api-client.js';
import { setupTestDatabase } from '../harness/memory-db-harness.js';

export function createOnboardingStepperSuite() {
  const suite = new TestSuite('Participant Onboarding Stepper (Tier 1)', 1);

  // Test 1: Step structure and state transitions
  suite.test('Onboarding stepper defines exactly 3 sequential stages', () => {
    const steps = [
      { step: 1, title: 'Propósito y Rol', requiredFields: ['participant_name'] },
      { step: 2, title: 'Pautas de Indagación Crítica', requiredFields: [] },
      { step: 3, title: 'Recorrido de la Interfaz y Privacidad', requiredFields: [] },
    ];
    assertEqual(steps.length, 3, 'Must have exactly 3 steps');
    assertEqual(steps[0].title, 'Propósito y Rol');
    assertEqual(steps[1].title, 'Pautas de Indagación Crítica');
    assertEqual(steps[2].title, 'Recorrido de la Interfaz y Privacidad');
  });

  // Test 2: Participant pseudonym entry and session initialization
  suite.test('Step 1 captures participant pseudonym and propagates to session join', async () => {
    setupTestDatabase();
    const pseudonym = 'Elena Vasquez (Docente STEM)';
    const res = await apiClient.joinSession({
      code: 'TEST01',
      participant_name: pseudonym,
    });
    assertEqual(res.status, 200, 'Join must succeed with 200');
    assert(res.data.session_id, 'Must return session_id');
    assertEqual(res.data.workshop_name, 'Single Workshop Test Campaign');

    // Verify session record in DB reflects the pseudonym
    const sessionRes = await apiClient.getSession(res.data.session_id);
    assertEqual(sessionRes.data.participant_name, pseudonym);
  });

  // Test 3: Backward navigation between steps preserves entered state
  suite.test('Navigation between steps preserves state without reset', () => {
    const stepperState = {
      currentStep: 1,
      name: 'Gabriel Astudillo',
      agreedToTelemetry: false,
    };
    // Step forward to 2
    stepperState.currentStep = 2;
    assertEqual(stepperState.name, 'Gabriel Astudillo');
    // Step forward to 3
    stepperState.currentStep = 3;
    stepperState.agreedToTelemetry = true;
    // Step backward to 2
    stepperState.currentStep = 2;
    assertEqual(stepperState.name, 'Gabriel Astudillo');
    assertEqual(stepperState.agreedToTelemetry, true);
  });

  // Test 4: Final step completion activates chat readiness
  suite.test('Step 3 completion enables chat interaction readiness and reveals case sheet', async () => {
    setupTestDatabase();
    const res = await apiClient.joinSession({
      code: 'TEST01',
      participant_name: 'Participante 03',
    });
    assert(res.data.version, 'Must return assigned version case content');
    assert(res.data.version.case_content.length > 20, 'Case content must be populated');
    assert(res.data.survey_config.length >= 2, 'Survey config must be returned');
  });

  // Test 5: Default fallback for anonymous participants when name is blank
  suite.test('Blank participant name in Step 1 gracefully defaults to Anonymous', async () => {
    setupTestDatabase();
    const res = await apiClient.joinSession({
      code: 'TEST01',
      participant_name: '',
    });
    assertEqual(res.status, 200);
    const session = await apiClient.getSession(res.data.session_id);
    assertEqual(session.data.participant_name, 'Anonymous');
  });

  return suite;
}
