/**
 * In-memory database implementation with JSON file persistence.
 * This is the development/dummy database that can be swapped for Supabase in production.
 */

import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');

// In-memory store
let store = {
  versions: [],
  workshops: [],
  sessions: [],
  messages: [],
  settings: {
    default_ai_provider: 'openrouter',
    default_ai_model: 'meta-llama/llama-3.1-8b-instruct',
  },
};

// Load from file on startup
function loadFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      store = JSON.parse(raw);
      return;
    }
  } catch (e) {
    console.warn('Could not load data file, starting fresh:', e.message);
  }
  // Seed with example data
  seedData();
}

function saveToFile() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save data file:', e.message);
  }
}

function seedData() {
  const now = new Date().toISOString();
  store.versions = [
    {
      id: randomUUID(),
      title: 'Version A — Baseline Scenario',
      case_content: `# Baseline Scenario\n\nYou are a **customer service representative** at a major telecommunications company. A customer has called in complaining about unexpected charges on their monthly bill.\n\n## Your Task\n\n- Listen to the customer's concerns\n- Try to understand the root cause of the charges\n- Propose a reasonable resolution\n- Maintain a professional and empathetic tone throughout\n\n## Key Details\n\n- The customer has been with the company for 5 years\n- The extra charges amount to $47.50\n- The charges appear to be from a premium service add-on\n- The customer claims they never authorized the add-on\n\n## Success Criteria\n\nYour interaction will be evaluated on:\n1. Empathy and active listening\n2. Problem-solving approach\n3. Resolution quality\n4. Overall communication effectiveness`,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: randomUUID(),
      title: 'Version B — Escalation Scenario',
      case_content: `# Escalation Scenario\n\nYou are a **technical support engineer** at a cloud computing company. A client's production environment has been experiencing intermittent outages for the past 48 hours.\n\n## Your Task\n\n- Gather diagnostic information from the client\n- Walk them through basic troubleshooting steps\n- Determine if the issue needs to be escalated\n- Communicate technical information clearly to a non-technical stakeholder\n\n## Key Details\n\n- The client runs an e-commerce platform\n- They are losing approximately $10,000/hour during outages\n- The outages last 5-15 minutes each and occur randomly\n- Initial logs suggest a memory leak in the application layer\n\n## Success Criteria\n\nYour interaction will be evaluated on:\n1. Systematic troubleshooting approach\n2. Clear technical communication\n3. Urgency management\n4. Escalation decision-making`,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: randomUUID(),
      title: 'Version C — Negotiation Scenario',
      case_content: `# Negotiation Scenario\n\nYou are a **project manager** at a software development firm. Your client wants to add significant new features to an ongoing project without extending the deadline or increasing the budget.\n\n## Your Task\n\n- Understand the client's new requirements\n- Explain the impact on scope, timeline, and budget\n- Negotiate a realistic compromise\n- Document the agreed-upon changes\n\n## Key Details\n\n- Original project: 6-month timeline, $150,000 budget\n- Currently at month 4 (67% complete)\n- New features would add approximately 2 months of work\n- Client's product launch date is fixed and cannot move\n\n## Success Criteria\n\nYour interaction will be evaluated on:\n1. Negotiation strategy\n2. Stakeholder management\n3. Realistic expectation setting\n4. Win-win solution finding`,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ];
  saveToFile();
}

// Initialize on first import
let initialized = false;
function ensureInit() {
  if (!initialized) {
    loadFromFile();
    initialized = true;
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

export function createVersion({ title, case_content }) {
  ensureInit();
  const now = new Date().toISOString();
  const version = {
    id: randomUUID(),
    title,
    case_content,
    is_active: true,
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
// WORKSHOPS
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

export function createWorkshop({ name, selected_version_ids, openrouter_model, ai_provider, system_prompt, survey_config, chain_id, chain_order, maintain_version }) {
  ensureInit();
  let share_code;
  do {
    share_code = generateShareCode();
  } while (store.workshops.some((w) => w.share_code === share_code));

  const workshop = {
    id: randomUUID(),
    name,
    share_code,
    selected_version_ids: selected_version_ids || [],
    openrouter_model: openrouter_model || process.env.DEFAULT_MODEL || 'meta-llama/llama-3.1-8b-instruct',
    ai_provider: ai_provider || 'openrouter',
    system_prompt: system_prompt || null,
    survey_config: survey_config || [],
    chain_id: chain_id || null,
    chain_order: chain_order || 1,
    maintain_version: maintain_version || false,
    is_active: true,
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
  return store.sessions.filter((s) => s.chain_user_id === chainUserId);
}

export function getLastSessionVersion(chainUserId) {
  ensureInit();
  const userSessions = store.sessions
    .filter((s) => s.chain_user_id === chainUserId)
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
  
  return userSessions.length > 0 ? userSessions[0].version_id : null;
}

export function createSession({ workshop_id, version_id, participant_name, chain_user_id }) {
  ensureInit();
  const session = {
    id: randomUUID(),
    workshop_id,
    version_id,
    participant_name: participant_name || 'Anonymous',
    chain_user_id: chain_user_id || null,
    status: 'active',
    interaction_count: 0,
    started_at: new Date().toISOString(),
    completed_at: null,
    survey_answers: null,
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
  
  // Remove associated messages
  store.messages = store.messages.filter((m) => m.session_id !== id);
  
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

export function createMessage({ session_id, role, content }) {
  ensureInit();
  const message = {
    id: randomUUID(),
    session_id,
    role,
    content,
    created_at: new Date().toISOString(),
  };
  store.messages.push(message);
  saveToFile();
  return message;
}

// ============================================================
// SETTINGS
// ============================================================

export function getSettings() {
  ensureInit();
  return { ...(store.settings || { default_ai_provider: 'openrouter', default_ai_model: 'meta-llama/llama-3.1-8b-instruct' }) };
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
  const totalInteractions = sessions.reduce((sum, s) => sum + s.interaction_count, 0);
  const avgInteractions = totalSessions > 0 ? Math.round(totalInteractions / totalSessions * 10) / 10 : 0;

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
