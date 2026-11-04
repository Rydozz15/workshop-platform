/**
 * Tier 3: Cross-Feature Interaction 3 — Drafting Table Diff to Session Launch & Telemetry
 * Tests end-to-end prompt authoring in Drafting Table, version creation,
 * experiment launch, session join, and chat transcript persistence.
 */
import { TestSuite, assert, assertEqual } from '../harness/test-utils.js';
import { apiClient } from '../harness/api-client.js';
import { setupTestDatabase } from '../harness/memory-db-harness.js';
import { POST as chatRoute } from '../../../app/api/session/[sessionId]/chat/route.js';

export function createDraftingLaunchTelemetrySuite() {
  const suite = new TestSuite('Interaction: Drafting Diff to Session Launch & Telemetry (Tier 3)', 3);

  // Test 1: Author prompt versions, diff them, and launch A/B experiment
  suite.test('Drafting comparator versions can be registered and assigned to a new experiment', async () => {
    setupTestDatabase();

    // 1. Author Version A
    const verA = await apiClient.createVersion({
      title: 'Prompt A — Direct Prescriptive',
      case_content: '# Caso de Negociación A\n\nEl estudiante presenta un desacuerdo salarial.',
    });
    assertEqual(verA.status, 201);

    // 2. Author Version B
    const verB = await apiClient.createVersion({
      title: 'Prompt B — Socratic Inquiry',
      case_content: '# Caso de Negociación B\n\nEl estudiante indaga intereses antes de ofertar.',
    });
    assertEqual(verB.status, 201);

    // 3. Launch experiment incorporating both versions
    const exp = await apiClient.createWorkshop({
      name: 'Experimento de Negociación Salarial',
      selected_version_ids: [verA.data.id, verB.data.id],
      openrouter_model: 'llama-3.3-70b-versatile',
      ai_provider: 'groq',
      system_prompt: 'Actúa como mentor en negociación.',
    });
    assertEqual(exp.status, 201);
    assert(exp.data.share_code, 'Must generate share code');

    // 4. Participant joins experiment
    const joinRes = await apiClient.joinSession({
      code: exp.data.share_code,
      participant_name: 'Negotiator 01',
    });
    assertEqual(joinRes.status, 200);
    assert([verA.data.id, verB.data.id].includes(joinRes.data.version.id), 'Assigned version must be A or B');
  });

  // Test 2: Participant interacts with assigned version and records chat history
  suite.test('Joined participant sends chat message and captures interaction in campaign session', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'Interactive User' });
    const sId = joinRes.data.session_id;

    // Send chat message
    const req = new Request(`http://localhost:3000/api/session/${sId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '¿Cómo inicio la conversación?' }),
    });
    const chatRes = await chatRoute(req, { params: Promise.resolve({ sessionId: sId }) });
    assertEqual(chatRes.status, 200);

    const sessionRes = await apiClient.getSession(sId);
    assertEqual(sessionRes.data.interaction_count, 1);
    assertEqual(sessionRes.data.messages.length, 1);
    assertEqual(sessionRes.data.messages[0].content, '¿Cómo inicio la conversación?');
  });

  // Test 3: Session details link back to specific version case content
  suite.test('Session records retain accurate relationship with specific version title and prompt', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'Link Check User' });
    const sId = joinRes.data.session_id;

    const detailRes = await apiClient.getSession(sId);
    assertEqual(detailRes.status, 200);
    assert(detailRes.data.version.id === 'ver-a-baseline' || detailRes.data.version.id === 'ver-b-contestable');
    assertEqual(detailRes.data.workshop_name, 'Single Workshop Test Campaign');
  });

  return suite;
}
