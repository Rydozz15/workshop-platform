/**
 * In-memory database implementation with JSON file persistence.
 * Supports configurable DB_MEMORY_PATH for isolated automated testing.
 */

import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

// Helper to resolve the data file path dynamically
export function getDataFilePath() {
  if (process.env.DB_MEMORY_PATH) {
    return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.DB_MEMORY_PATH);
  }
  return path.join(/*turbopackIgnore: true*/ process.cwd(), 'data.json');
}

function ensureDirExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// In-memory store
let store = {
  versions: [],
  workshops: [],
  sessions: [],
  messages: [],
  telemetry: [],
  settings: {
    default_ai_provider: 'openrouter',
    default_ai_model: 'meta-llama/llama-3.1-8b-instruct',
  },
};

let currentLoadedPath = null;
let initialized = false;

// Load from file on startup or when path changes
export function loadFromFile(force = false) {
  const dataFile = getDataFilePath();
  if (!force && initialized && currentLoadedPath === dataFile) {
    return;
  }

  try {
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, 'utf-8');
      store = JSON.parse(raw);
      if (!store.telemetry) store.telemetry = [];
      if (!store.versions) store.versions = [];
      if (!store.workshops) store.workshops = [];
      if (!store.sessions) store.sessions = [];
      if (!store.messages) store.messages = [];
      if (!store.settings) {
        store.settings = {
          default_ai_provider: 'openrouter',
          default_ai_model: 'meta-llama/llama-3.1-8b-instruct',
        };
      }
      currentLoadedPath = dataFile;
      initialized = true;
      return;
    }
  } catch (e) {
    console.warn(`Could not load data file at ${dataFile}, starting fresh:`, e.message);
  }

  // File does not exist: Seed with initial data
  seedData();
  currentLoadedPath = dataFile;
  initialized = true;
}

export function saveToFile() {
  const dataFile = getDataFilePath();
  try {
    ensureDirExists(dataFile);
    const tmpFile = `${dataFile}.${randomUUID()}.tmp`;
    const serialized = JSON.stringify(store, null, 2);
    fs.writeFileSync(tmpFile, serialized, 'utf-8');
    try {
      fs.renameSync(tmpFile, dataFile);
    } catch {
      // Fallback if atomic rename across filesystems is unsupported
      fs.writeFileSync(dataFile, serialized, 'utf-8');
      try {
        fs.unlinkSync(tmpFile);
      } catch {
        // ignore
      }
    }
    currentLoadedPath = dataFile;
  } catch (e) {
    console.warn(`Could not save data file at ${dataFile}:`, e.message);
  }
}

export function resetStore(customStore = null) {
  if (customStore) {
    store = JSON.parse(JSON.stringify(customStore));
  } else {
    store = {
      versions: [],
      workshops: [],
      sessions: [],
      messages: [],
      telemetry: [],
      settings: {
        default_ai_provider: 'openrouter',
        default_ai_model: 'meta-llama/llama-3.1-8b-instruct',
      },
    };
  }
  initialized = true;
  saveToFile();
}

export function seedData() {
  const now = new Date().toISOString();
  store.versions = [
    {
      id: '9e0af08a-5a94-4f69-b53a-bf9157d1eaca',
      title: 'CASE 1 — The Invisible Load',
      case_content: `# Caso 1: La Carga Invisible (The Invisible Load)\n\nEres una académica recién contratada (profesora asistente tenure-track) en una facultad universitaria. Te encuentras sobrecargada con labores desproporcionadas y no compensadas de servicio institucional, comités de bienestar estudiantil y mentoría informal hacia estudiantes que acuden a ti en busca de apoyo emocional.\n\n## Tu Situación\n- Llevas 10 meses sin poder avanzar significativamente en tu producción académica y proyectos de investigación.\n- En 11 meses tienes tu comité de evaluación para permanencia (tenure) o promoción.\n- Has notado que tus colegas hombres con el mismo cargo no asumen estas funciones y dedican su tiempo de forma casi exclusiva a investigación y docencia regular.\n- Al plantearlo informalmente a la jefatura, te respondieron que te asignan estas tareas porque eres "responsable", "cercana" y "tienes empatía".\n\n## Tu Objetivo\nBuscar orientación sobre cómo balancear o redistribuir esta carga de servicio y cuidado sin perjudicar tu carrera ni tu relación con el departamento.`,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'ac929ef6-29be-4bd3-8df1-db939579e69a',
      title: 'CASE 2 — The Authority Double Standard',
      case_content: `# Caso 2: El Doble Estándar de Autoridad (The Authority Double Standard)\n\nEres una académica que participó recientemente en un consejo de facultad donde se debatía una decisión presupuestaria que considerabas injusta, relativa a la asignación de recursos y becas para estudiantes de postgrado.\n\n## Tu Situación\n- En dicha reunión, defendiste con firmeza tu postura y cuestionaste el criterio de asignación presupuestaria.\n- Dos colegas presentaron quejas informales describiéndote como "conflictiva", "difícil de tratar" y "agresiva".\n- En la misma reunión, un colega varón alzó la voz de forma vehemente para defender su propio punto de vista y posteriormente fue elogiado por su "compromiso con la institución".\n- La próxima semana tienes una evaluación departamental y temes que este sesgo afecte tu estabilidad o reputación profesional.\n\n## Tu Objetivo\nBuscar orientación sobre cómo abordar esta situación de doble estándar y clarificar lo ocurrido sin exponerte a represalias ni validar la etiqueta de "conflictiva".`,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ];

  store.workshops = [
    {
      id: '4e7d33e9-626d-497b-9c19-ed9c0398ffe3',
      name: 'ISDDE Naive (Baseline)',
      share_code: 'isdde1',
      selected_version_ids: [
        '9e0af08a-5a94-4f69-b53a-bf9157d1eaca',
        'ac929ef6-29be-4bd3-8df1-db939579e69a',
      ],
      openrouter_model: 'deepseek/deepseek-v4-flash',
      ai_provider: 'openrouter',
      system_prompt: '',
      survey_config: [
        { id: 'applicable', text: 'The advice given was applicable to my institutional reality.', type: 'likert' },
        { id: 'comfortable', text: 'I felt comfortable sharing more details about my situation with this assistant.', type: 'likert' },
        { id: 'understood', text: 'The assistant understood my specific situation before responding.', type: 'likert' },
      ],
      chain_id: 'chain-isdde-01',
      chain_order: 1,
      maintain_version: true,
      is_active: true,
      created_at: now,
    },
    {
      id: '4dac12c5-6028-4d4b-bf85-eea3a188ab00',
      name: 'ISDDE Prompted (Part 2)',
      share_code: 'isdde2',
      selected_version_ids: [
        '9e0af08a-5a94-4f69-b53a-bf9157d1eaca',
        'ac929ef6-29be-4bd3-8df1-db939579e69a',
      ],
      openrouter_model: 'deepseek/deepseek-v4-flash',
      ai_provider: 'openrouter',
      system_prompt: `You are a support and feedback assistant for female academics in Chile. Your goal is to help female academics navigate the challenges they face in their work—whether academic, administrative, or pedagogical.

You have a deep understanding of the issue: you know that academic structures often render women's work and their socio-emotional burden invisible. Use this knowledge solely as internal context to ensure that you never minimize, discredit, or blame the user for her experience.

RULE FOR MODE SELECTION (CRITICAL)
For every turn, evaluate the user's input and select ONE of the following modes to format your response.
Default to EXPLORE MODE unless the transition criteria for BUILD MODE are explicitly met.

EXPLORE MODE (Use when the problem is new, vague, or insufficiently described):
- Briefly and empathetically validate her emotions, ensuring she does not feel judged.
- Under no circumstances assume or invent details about her department, colleagues, or university that she has not explicitly mentioned.
- Do not offer direct or categorical solutions. Ask exactly 1 targeted question — the most important one given what she has shared so far.

BUILD MODE (Switch to this mode only when BOTH conditions are met):
- Condition A: The user has responded to your previous questions.
- Condition B: Her response adds meaningful context — new actors, specific dynamics, concrete facts, or what she has already tried. A vague or evasive reply does NOT qualify. If Condition B is not met, stay in EXPLORE MODE with a single follow-up question.

UNIVERSAL CONSTRAINTS
- Keep every response to a maximum of 2 or 3 short paragraphs so the user can read and respond quickly. The goal is an agile conversation.
- Always respond in the language the user is writing in, maintaining a supportive, professional, and respectful tone.
- Never state or assume structural dynamics based solely on what the bot knows internally.
- Avoid phrases of false epistemic certainty.`,
      survey_config: [
        { id: 'applicable', text: 'The advice given was applicable to my institutional reality.', type: 'likert' },
        { id: 'comfortable', text: 'I felt comfortable sharing more details about my situation with this assistant.', type: 'likert' },
        { id: 'understood', text: 'The assistant understood my specific situation before responding.', type: 'likert' },
      ],
      chain_id: 'chain-isdde-01',
      chain_order: 2,
      maintain_version: true,
      is_active: true,
      created_at: now,
    },
  ];

  store.sessions = [];
  store.messages = [];
  store.telemetry = [];
  store.settings = {
    default_ai_provider: 'groq',
    default_ai_model: 'llama-3.3-70b-versatile',
  };

  saveToFile();
}

function ensureInit() {
  const dataFile = getDataFilePath();
  if (!initialized || currentLoadedPath !== dataFile) {
    loadFromFile(true);
  }
}

// ============================================================
// VERSIONS
// ============================================================

export function getVersions() {
  ensureInit();
  return [...store.versions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function getVersion(id) {
  ensureInit();
  return store.versions.find((v) => v.id === id) || null;
}

export function createVersion({ id, title, case_content, system_prompt = null, is_active = true }) {
  ensureInit();
  const now = new Date().toISOString();
  const version = {
    id: id || randomUUID(),
    title,
    case_content,
    system_prompt: system_prompt || null,
    is_active: is_active !== false,
    created_at: now,
    updated_at: now,
  };
  store.versions.push(version);
  saveToFile();
  return version;
}

export function updateVersion(id, updates) {
  ensureInit();
  const idx = store.versions.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  store.versions[idx] = {
    ...store.versions[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  saveToFile();
  return store.versions[idx];
}

export function deleteVersion(id) {
  ensureInit();
  const idx = store.versions.findIndex((v) => v.id === id);
  if (idx === -1) return false;
  store.versions.splice(idx, 1);
  saveToFile();
  return true;
}

// ============================================================
// WORKSHOPS / CAMPAIGNS
// ============================================================

export function getWorkshops() {
  ensureInit();
  return [...store.workshops].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function getWorkshop(id) {
  ensureInit();
  return store.workshops.find((w) => w.id === id) || null;
}

export function getWorkshopByCode(code) {
  ensureInit();
  return store.workshops.find((w) => w.share_code === code) || null;
}

export function getNextWorkshopInChain(chainId, order) {
  ensureInit();
  return store.workshops.find((w) => w.chain_id === chainId && w.chain_order === order) || null;
}

function generateShareCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createWorkshop({
  id,
  name,
  share_code,
  selected_version_ids,
  openrouter_model,
  ai_provider,
  system_prompt,
  survey_config,
  chain_id,
  chain_order,
  maintain_version,
  onboarding_instructions,
  analysis_type,
  hypothesis,
  campaign_name,
  campaign_description,
  consent_required,
  consent_url,
  is_active = true,
}) {
  ensureInit();
  let code = share_code;
  if (!code) {
    do {
      code = generateShareCode();
    } while (store.workshops.some((w) => w.share_code === code));
  }

  const workshop = {
    id: id || randomUUID(),
    name,
    share_code: code,
    selected_version_ids: selected_version_ids || [],
    openrouter_model: openrouter_model || process.env.DEFAULT_MODEL || 'meta-llama/llama-3.1-8b-instruct',
    ai_provider: ai_provider || 'openrouter',
    system_prompt: system_prompt || null,
    survey_config: survey_config || [],
    chain_id: chain_id || null,
    chain_order: chain_order || 1,
    maintain_version: maintain_version || false,
    onboarding_instructions: onboarding_instructions || null,
    analysis_type: analysis_type || 'preregistrado',
    hypothesis: hypothesis || null,
    campaign_name: campaign_name || null,
    campaign_description: campaign_description || null,
    consent_required: Boolean(consent_required),
    consent_url: consent_url || null,
    is_active: is_active !== false,
    created_at: new Date().toISOString(),
  };
  store.workshops.push(workshop);
  saveToFile();
  return workshop;
}

export function updateWorkshop(id, updates) {
  ensureInit();
  const idx = store.workshops.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  store.workshops[idx] = { ...store.workshops[idx], ...updates };
  saveToFile();
  return store.workshops[idx];
}

export function deleteWorkshop(id) {
  ensureInit();
  const idx = store.workshops.findIndex((w) => w.id === id);
  if (idx === -1) return false;
  store.workshops.splice(idx, 1);
  saveToFile();
  return true;
}

// ============================================================
// SESSIONS
// ============================================================

export function getSessions(workshopId = null) {
  ensureInit();
  let sessions = [...store.sessions];
  if (workshopId) {
    sessions = sessions.filter((s) => s.workshop_id === workshopId);
  }
  return sessions.sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
}

export function getSession(id) {
  ensureInit();
  return store.sessions.find((s) => s.id === id) || null;
}

export async function getSessionsByChainUserId(chainUserId) {
  ensureInit();
  return store.sessions
    .filter((s) => s.chain_user_id === chainUserId)
    .sort((a, b) => new Date(a.started_at) - new Date(b.started_at))
    .map((s) => {
      const workshop = getWorkshop(s.workshop_id);
      const version = getVersion(s.version_id);
      const messages = getMessages(s.id);
      return {
        ...s,
        messages,
        workshops: workshop
          ? { name: workshop.name, chain_order: workshop.chain_order, survey_config: workshop.survey_config }
          : null,
        versions: version ? { title: version.title } : null,
      };
    });
}

export function getLastSessionVersion(chainUserId) {
  ensureInit();
  const userSessions = store.sessions
    .filter((s) => s.chain_user_id === chainUserId)
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));

  return userSessions.length > 0 ? userSessions[0].version_id : null;
}

export function createSession({
  id,
  workshop_id,
  version_id,
  participant_name,
  chain_user_id,
  onboarding_answers,
  client_metrics,
  status = 'active',
  interaction_count = 0,
  started_at,
  completed_at = null,
  survey_answers = null,
}) {
  ensureInit();
  const session = {
    id: id || randomUUID(),
    workshop_id,
    version_id,
    participant_name: participant_name || 'Anonymous',
    chain_user_id: chain_user_id || null,
    onboarding_answers: onboarding_answers || null,
    client_metrics: client_metrics || null,
    status: status || 'active',
    interaction_count: interaction_count || 0,
    started_at: started_at || new Date().toISOString(),
    completed_at: completed_at || null,
    survey_answers: survey_answers || null,
  };
  store.sessions.push(session);
  saveToFile();
  return session;
}

export function updateSession(id, updates) {
  ensureInit();
  const idx = store.sessions.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  store.sessions[idx] = { ...store.sessions[idx], ...updates };
  saveToFile();
  return store.sessions[idx];
}

export function incrementInteractionCount(sessionId) {
  ensureInit();
  const idx = store.sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) return null;
  store.sessions[idx].interaction_count += 1;
  saveToFile();
  return store.sessions[idx];
}

export function deleteSession(id) {
  ensureInit();
  const idx = store.sessions.findIndex((s) => s.id === id);
  if (idx === -1) return false;

  // Remove associated messages and telemetry
  store.messages = store.messages.filter((m) => m.session_id !== id);
  if (store.telemetry) {
    store.telemetry = store.telemetry.filter((t) => t.session_id !== id);
  }

  // Remove session
  store.sessions.splice(idx, 1);
  saveToFile();
  return true;
}

// ============================================================
// MESSAGES
// ============================================================

export function getMessages(sessionId) {
  ensureInit();
  return store.messages
    .filter((m) => m.session_id === sessionId)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

export function createMessage({ id, session_id, role, content, metadata = null, telemetry = null, created_at = null }) {
  ensureInit();
  const message = {
    id: id || randomUUID(),
    session_id,
    role,
    content,
    metadata,
    telemetry,
    created_at: created_at || new Date().toISOString(),
  };
  store.messages.push(message);
  saveToFile();
  return message;
}

// ============================================================
// TELEMETRY
// ============================================================

export function addTelemetry(sessionId, data) {
  ensureInit();
  if (!store.telemetry) store.telemetry = [];
  const entry = {
    id: randomUUID(),
    session_id: sessionId,
    ...data,
    created_at: new Date().toISOString(),
  };
  store.telemetry.push(entry);
  saveToFile();
  return entry;
}

export function getTelemetry(sessionId) {
  ensureInit();
  if (!store.telemetry) return [];
  return store.telemetry
    .filter((t) => t.session_id === sessionId)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

export function getAllTelemetry() {
  ensureInit();
  if (!store.telemetry) return [];
  return [...store.telemetry].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

// ============================================================
// SETTINGS
// ============================================================

export function getSettings() {
  ensureInit();
  return {
    ...(store.settings || {
      default_ai_provider: 'groq',
      default_ai_model: 'llama-3.3-70b-versatile',
    }),
  };
}

export function updateSetting(key, value) {
  ensureInit();
  if (!store.settings) store.settings = {};
  store.settings[key] = value;
  saveToFile();
  return { key, value };
}

// ============================================================
// DASHBOARD METRICS
// ============================================================

export function getDashboardMetrics(workshopId = null) {
  ensureInit();
  let sessions = store.sessions;
  if (workshopId) {
    sessions = sessions.filter((s) => s.workshop_id === workshopId);
  }

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === 'completed').length;
  const activeSessions = sessions.filter((s) => s.status === 'active').length;
  const totalInteractions = sessions.reduce((sum, s) => sum + (s.interaction_count || 0), 0);
  const avgInteractions = totalSessions > 0 ? Math.round((totalInteractions / totalSessions) * 10) / 10 : 0;

  // Version distribution
  const versionCounts = {};
  sessions.forEach((s) => {
    const version = store.versions.find((v) => v.id === s.version_id);
    const label = version ? version.title : 'Unknown';
    versionCounts[label] = (versionCounts[label] || 0) + 1;
  });

  // Recent sessions with version info
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
    .slice(0, 20)
    .map((s) => {
      const version = store.versions.find((v) => v.id === s.version_id);
      return {
        ...s,
        version_title: version ? version.title : 'Unknown',
      };
    });

  return {
    totalSessions,
    completedSessions,
    activeSessions,
    totalInteractions,
    avgInteractions,
    versionDistribution: versionCounts,
    recentSessions,
  };
}
