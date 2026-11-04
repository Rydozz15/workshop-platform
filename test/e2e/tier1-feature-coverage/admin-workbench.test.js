/**
 * Tier 1: Admin Workbench Tests (>= 5 tests)
 * Tests campaign gallery management, workshop creation,
 * version authoring, and session transcript export.
 */
import { TestSuite, assert, assertEqual } from '../harness/test-utils.js';
import { apiClient } from '../harness/api-client.js';
import { setupTestDatabase } from '../harness/memory-db-harness.js';

export function createAdminWorkbenchSuite() {
  const suite = new TestSuite('Admin Workbench & Campaign Management (Tier 1)', 1);

  // Test 1: Listing workshops via /api/admin/workshops
  suite.test('GET /api/admin/workshops returns array of existing campaigns', async () => {
    setupTestDatabase();
    const res = await apiClient.listWorkshops();
    assertEqual(res.status, 200);
    assert(Array.isArray(res.data), 'Response must be an array');
    assert(res.data.length >= 3, 'Must contain initialized test workshops');
  });

  // Test 2: Creating a new workshop with versions and survey configuration
  suite.test('POST /api/admin/workshops creates a single workshop with survey config', async () => {
    setupTestDatabase();
    const payload = {
      name: 'Nueva Campaña LAK27',
      selected_version_ids: ['ver-a-baseline', 'ver-b-contestable'],
      openrouter_model: 'llama-3.3-70b-versatile',
      ai_provider: 'groq',
      system_prompt: 'Eres un tutor socrático.',
      survey_config: [
        { id: 'q_autonomia', text: 'Sentí autonomía en el diálogo', type: 'likert' },
      ],
    };
    const res = await apiClient.createWorkshop(payload);
    assertEqual(res.status, 201);
    assertEqual(res.data.name, 'Nueva Campaña LAK27');
    assert(res.data.share_code, 'Must generate share_code');
  });

  // Test 3: Creating chained multi-step workshops with sequential chain_order
  suite.test('POST /api/admin/workshops supports batch creation of chained campaigns', async () => {
    setupTestDatabase();
    const chainedPayload = [
      {
        name: 'ISDDE Secuencia — Paso 1',
        selected_version_ids: ['ver-a-baseline'],
        openrouter_model: 'llama-3.3-70b-versatile',
        ai_provider: 'groq',
        system_prompt: '',
      },
      {
        name: 'ISDDE Secuencia — Paso 2',
        selected_version_ids: ['ver-b-contestable'],
        openrouter_model: 'llama-3.3-70b-versatile',
        ai_provider: 'groq',
        system_prompt: 'Explore-before-Build',
      },
    ];
    const res = await apiClient.createWorkshop(chainedPayload);
    assertEqual(res.status, 201);
    assert(Array.isArray(res.data), 'Must return array of created workshops');
    assertEqual(res.data.length, 2);
    assertEqual(res.data[0].chain_order, 1);
    assertEqual(res.data[1].chain_order, 2);
    assertEqual(res.data[0].chain_id, res.data[1].chain_id, 'Both workshops must share the same chain_id');
  });

  // Test 4: Creating a prompt version via /api/admin/versions
  suite.test('POST /api/admin/versions creates prompt case version', async () => {
    setupTestDatabase();
    const payload = {
      title: 'Versión C — Caso de Negociación',
      case_content: '# Caso C\n\nEl estudiante debe negociar la asignación de recursos computacionales.',
    };
    const res = await apiClient.createVersion(payload);
    assertEqual(res.status, 201);
    assertEqual(res.data.title, 'Versión C — Caso de Negociación');
    assert(res.data.id, 'Must generate version ID');
  });

  // Test 5: Exporting complete session transcripts via /api/admin/export
  suite.test('GET /api/admin/export returns aggregated session transcripts and survey responses', async () => {
    setupTestDatabase();
    // Create a session and message
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'Export Tester' });
    const sId = joinRes.data.session_id;
    await apiClient.submitSurvey(sId, { survey_answers: { q1: 5, q2: 4 } });
    await apiClient.updateSession(sId, { status: 'completed' });

    const exportRes = await apiClient.exportSessions();
    assertEqual(exportRes.status, 200);
    assert(Array.isArray(exportRes.data), 'Export must return array');
    const exportedSession = exportRes.data.find(s => s.session_id === sId);
    assert(exportedSession, 'Exported dataset must contain created session');
    assertEqual(exportedSession.participant_name, 'Export Tester');
    assertEqual(exportedSession.survey_answers.q1, 5);
  });

  return suite;
}
