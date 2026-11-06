/**
 * Opaque-Box API Client Harness for PromptSketch E2E Tests.
 * Executes requests against Next.js App Router route handlers.
 */
import { POST as joinRoute } from '../../../app/api/session/join/route.js';
import {
  GET as getSessionRoute,
  PUT as putSessionRoute,
} from '../../../app/api/session/[sessionId]/route.js';
import { DELETE as deleteSessionRoute } from '../../../app/api/admin/sessions/[id]/route.js';
import { POST as surveyRoute } from '../../../app/api/session/[sessionId]/survey/route.js';
import { GET as getWorkshopsRoute, POST as postWorkshopsRoute } from '../../../app/api/admin/workshops/route.js';
import { GET as getVersionsRoute, POST as postVersionsRoute } from '../../../app/api/admin/versions/route.js';
import { GET as getSettingsRoute, PUT as putSettingsRoute } from '../../../app/api/admin/settings/route.js';
import { GET as getExportRoute } from '../../../app/api/admin/export/route.js';

// Helper to wrap Next.js JSON request
function makeJsonRequest(url, method, body = null) {
  const init = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return new Request(url, init);
}

export const apiClient = {
  // 1. Session Join
  async joinSession({ code, participant_name, chain_user_id }) {
    const req = makeJsonRequest('http://localhost:3000/api/session/join', 'POST', {
      code,
      participant_name,
      chain_user_id,
    });
    const res = await joinRoute(req);
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  },

  // 2. Get Session Details
  async getSession(sessionId) {
    const req = makeJsonRequest(`http://localhost:3000/api/session/${sessionId}`, 'GET');
    const res = await getSessionRoute(req, { params: Promise.resolve({ sessionId }) });
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  },

  // 3. Update / Complete Session
  async updateSession(sessionId, updates) {
    const req = makeJsonRequest(`http://localhost:3000/api/session/${sessionId}`, 'PUT', updates);
    const res = await putSessionRoute(req, { params: Promise.resolve({ sessionId }) });
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  },

  // 4. Delete Session
  async deleteSession(sessionId) {
    const req = makeJsonRequest(`http://localhost:3000/api/admin/sessions/${sessionId}`, 'DELETE');
    const res = await deleteSessionRoute(req, { params: Promise.resolve({ id: sessionId }) });
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  },

  // 5. Submit Survey
  async submitSurvey(sessionId, { survey_answers, chain_user_id }) {
    const req = makeJsonRequest(`http://localhost:3000/api/session/${sessionId}/survey`, 'POST', {
      survey_answers,
      chain_user_id,
    });
    const res = await surveyRoute(req, { params: Promise.resolve({ sessionId }) });
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  },

  // 6. Admin Workshops
  async listWorkshops() {
    const res = await getWorkshopsRoute();
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  },

  async createWorkshop(payload) {
    const req = makeJsonRequest('http://localhost:3000/api/admin/workshops', 'POST', payload);
    const res = await postWorkshopsRoute(req);
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  },

  // 7. Admin Versions
  async listVersions() {
    const res = await getVersionsRoute();
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  },

  async createVersion(payload) {
    const req = makeJsonRequest('http://localhost:3000/api/admin/versions', 'POST', payload);
    const res = await postVersionsRoute(req);
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  },

  // 8. Admin Settings
  async getSettings() {
    const res = await getSettingsRoute();
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  },

  async updateSettings(updates) {
    const req = makeJsonRequest('http://localhost:3000/api/admin/settings', 'PUT', updates);
    const res = await putSettingsRoute(req);
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  },

  // 9. Admin Export
  async exportSessions(workshopId = null) {
    const url = workshopId
      ? `http://localhost:3000/api/admin/export?workshopId=${workshopId}`
      : 'http://localhost:3000/api/admin/export';
    const req = makeJsonRequest(url, 'GET');
    const res = await getExportRoute(req);
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  },
};
