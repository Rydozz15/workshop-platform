/**
 * Memory Database Lifecycle and Isolation Harness.
 * Ensures tests run in complete isolation with zero mutation of persistent data.
 */
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { testDbPath } from './env.js';

const PRIMARY_DATA_FILE = path.join(process.cwd(), 'data.json');

export function createInitialStore() {
  const now = new Date().toISOString();
  return {
    versions: [
      {
        id: 'ver-a-baseline',
        title: 'Condition A — Baseline Mentoring',
        case_content: `# Caso A: Mentoría Estándar\n\nEl estudiante requiere orientación sobre balance de carga académica y proyectos de investigación.\n\n## Objetivos\n- Escuchar inquietudes\n- Proveer recomendaciones directas`,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'ver-b-contestable',
        title: 'Condition B — Explore-before-Build Mentoring',
        case_content: `# Caso B: Indagación Crítica y Contestabilidad\n\nEl estudiante presenta un dilema sobre coautoría y sobrecarga en el laboratorio.\n\n## Pautas\n- No prescribir soluciones inmediatas\n- Indagar antes de estructurar`,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ],
    workshops: [
      {
        id: 'ws-single-test',
        name: 'Single Workshop Test Campaign',
        share_code: 'TEST01',
        selected_version_ids: ['ver-a-baseline', 'ver-b-contestable'],
        openrouter_model: 'meta-llama/llama-3.1-8b-instruct',
        ai_provider: 'openrouter',
        system_prompt: 'You are an academic mentor. Help the student reflect.',
        survey_config: [
          { id: 'q1', text: 'El asistente entendió mi contexto', type: 'likert' },
          { id: 'q2', text: 'Las recomendaciones fueron aplicables', type: 'likert' },
          { id: 'q_feedback', text: 'Comentarios adicionales', type: 'text' },
        ],
        is_active: true,
        created_at: now,
        chain_id: null,
        chain_order: 1,
        maintain_version: false,
      },
      {
        id: 'ws-chain-step1',
        name: 'Chained Campaign — Step 1 (Naive)',
        share_code: 'CHAIN1',
        selected_version_ids: ['ver-a-baseline'],
        openrouter_model: 'meta-llama/llama-3.1-8b-instruct',
        ai_provider: 'openrouter',
        system_prompt: '',
        survey_config: [
          { id: 'q_gain_pre', text: 'Nivel previo de comprensión', type: 'likert' },
        ],
        is_active: true,
        created_at: now,
        chain_id: 'chain-exp-01',
        chain_order: 1,
        maintain_version: true,
      },
      {
        id: 'ws-chain-step2',
        name: 'Chained Campaign — Step 2 (Scaffolded)',
        share_code: 'CHAIN2',
        selected_version_ids: ['ver-b-contestable'],
        openrouter_model: 'meta-llama/llama-3.1-8b-instruct',
        ai_provider: 'openrouter',
        system_prompt: 'Apply Explore-before-Build scaffolding.',
        survey_config: [
          { id: 'q_gain_post', text: 'Nivel posterior de comprensión', type: 'likert' },
        ],
        is_active: true,
        created_at: now,
        chain_id: 'chain-exp-01',
        chain_order: 2,
        maintain_version: true,
      },
    ],
    sessions: [],
    messages: [],
    settings: {
      default_ai_provider: 'groq',
      default_ai_model: 'llama-3.3-70b-versatile',
      providers: {
        groq: { apiKey: 'gsk_mock_test_key', model: 'llama-3.3-70b-versatile' },
        openrouter: { apiKey: 'sk-or-mock_test_key', model: 'meta-llama/llama-3.1-8b-instruct' },
        openai: { apiKey: 'sk-mock_openai_key', model: 'gpt-4o-mini' },
        anthropic: { apiKey: 'sk-ant-mock_key', model: 'claude-3-5-haiku-20241022' },
        ollama: { baseUrl: 'http://localhost:11434', model: 'llama3:8b' },
      },
    },
  };
}

// The suites only ever write to testDbPath (scratch/test-e2e.json, forced by env.js through DB_MEMORY_PATH).
// The real data.json is never written: it used to be backed up and overwritten here, which put a
// user's local campaigns at risk whenever the tests ran next to a running app.
export function setupTestDatabase() {
  // Write fresh test dataset to testDbPath
  const store = createInitialStore();
  fs.writeFileSync(testDbPath, JSON.stringify(store, null, 2), 'utf-8');

  return store;
}

export function teardownTestDatabase() {
  // Nothing to restore: the real data.json is never touched (see setupTestDatabase).
}

export function readTestStore() {
  if (fs.existsSync(testDbPath)) {
    return JSON.parse(fs.readFileSync(testDbPath, 'utf-8'));
  }
  if (fs.existsSync(PRIMARY_DATA_FILE)) {
    return JSON.parse(fs.readFileSync(PRIMARY_DATA_FILE, 'utf-8'));
  }
  return createInitialStore();
}

export function writeTestStore(store) {
  fs.writeFileSync(testDbPath, JSON.stringify(store, null, 2), 'utf-8');
}
