/**
 * Campaign persistence on top of lib/db.js (works with the memory and Supabase providers).
 * saveCampaign() takes the whole campaign as the editor sees it (steps with their conditions) and
 * makes the database match it: creates what is new, updates what changed, removes what was dropped.
 */
import { randomUUID } from 'node:crypto';
import {
  getVersions,
  getVersion,
  createVersion,
  updateVersion,
  deleteVersion,
  getWorkshops,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
} from './db.js';
import { stepsOfCampaign, groupCampaigns } from './campaigns.js';

export class CampaignValidationError extends Error {}

/** Memory provider functions are sync, Supabase's are async: normalize and swallow errors. */
const attempt = async (fn) => {
  try {
    return await fn();
  } catch {
    return null;
  }
};

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/** Throws CampaignValidationError with a user-readable message when the payload is not saveable. */
export function validateCampaignPayload(payload) {
  if (!payload || typeof payload !== 'object') throw new CampaignValidationError('Faltan los datos de la campaña.');
  if (!text(payload.name)) throw new CampaignValidationError('La campaña necesita un nombre.');
  const steps = Array.isArray(payload.steps) ? payload.steps : [];
  if (steps.length === 0) throw new CampaignValidationError('La campaña necesita al menos un paso.');
  steps.forEach((step, i) => {
    const label = text(step.name) || `Paso ${i + 1}`;
    if (!text(step.name)) throw new CampaignValidationError(`El paso ${i + 1} necesita un nombre.`);
    const conditions = Array.isArray(step.conditions) ? step.conditions : [];
    if (conditions.length === 0) throw new CampaignValidationError(`"${label}" necesita al menos una condición.`);
    conditions.forEach((c, j) => {
      if (!text(c.title)) throw new CampaignValidationError(`La condición ${j + 1} de "${label}" necesita un nombre.`);
      if (!text(c.case_content)) throw new CampaignValidationError(`La condición "${c.title}" de "${label}" necesita el caso o escenario que verá el participante.`);
    });
  });
  if (payload.consent_required && payload.consent_url && !/^https?:\/\//i.test(text(payload.consent_url))) {
    throw new CampaignValidationError('El enlace del consentimiento debe empezar con http:// o https://.');
  }
}

/** A campaign with every step's conditions expanded (versions resolved). */
export async function getCampaignDetail(campaignId) {
  const workshops = await getWorkshops();
  const steps = stepsOfCampaign(workshops, campaignId);
  if (steps.length === 0) return null;
  const versions = await getVersions();
  const byId = new Map(versions.map((v) => [v.id, v]));
  const [campaign] = groupCampaigns(steps);
  return {
    ...campaign,
    steps: steps.map((s) => ({
      ...s,
      conditions: (s.selected_version_ids || []).map((id) => byId.get(id)).filter(Boolean),
    })),
  };
}

async function saveConditions(conditions) {
  const ids = [];
  for (const c of conditions) {
    const fields = {
      title: text(c.title),
      case_content: c.case_content,
      system_prompt: text(c.system_prompt) || null,
    };
    if (c.id && (await attempt(() => getVersion(c.id)))) {
      await updateVersion(c.id, fields);
      ids.push(c.id);
    } else {
      const created = await createVersion(fields);
      ids.push(created.id);
    }
  }
  return ids;
}

/**
 * Create (campaignId null) or update a campaign. Returns the saved campaign detail.
 */
export async function saveCampaign(campaignId, payload) {
  validateCampaignPayload(payload);

  const existing = campaignId ? stepsOfCampaign(await getWorkshops(), campaignId) : [];
  if (campaignId && existing.length === 0) return null;

  // Steps always get a chain_id so the campaign keeps a stable identity when steps are added later.
  const chainId = existing[0]?.chain_id || (campaignId && !campaignId.startsWith('solo:') ? campaignId : randomUUID());

  const meta = {
    campaign_name: text(payload.name),
    campaign_description: text(payload.description) || null,
    consent_required: Boolean(payload.consent_required),
    consent_url: text(payload.consent_url) || null,
    // Counterbalanced step order per participant; it only makes sense with 2 or more steps.
    randomize_order: Boolean(payload.randomize_order) && payload.steps.length > 1,
  };

  const keptIds = new Set();
  const previousVersionIds = new Set(existing.flatMap((s) => s.selected_version_ids || []));

  for (let i = 0; i < payload.steps.length; i++) {
    const step = payload.steps[i];
    const versionIds = await saveConditions(step.conditions);
    const fields = {
      name: text(step.name),
      selected_version_ids: versionIds,
      onboarding_instructions: text(step.onboarding_instructions) || null,
      system_prompt: text(step.system_prompt) || null,
      ai_provider: step.ai_provider || undefined,
      openrouter_model: step.openrouter_model || undefined,
      survey_config: Array.isArray(step.survey_config) ? step.survey_config : [],
      maintain_version: Boolean(step.maintain_version),
      chain_id: chainId,
      chain_order: i + 1,
      ...meta,
    };
    const current = step.id ? existing.find((w) => w.id === step.id) : null;
    if (current) {
      const clean = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
      await updateWorkshop(current.id, clean);
      keptIds.add(current.id);
    } else {
      const created = await createWorkshop(fields);
      keptIds.add(created.id);
    }
  }

  for (const old of existing) {
    if (!keptIds.has(old.id)) await deleteWorkshop(old.id);
  }

  // Drop conditions that no step uses anymore (they were created by this editor).
  const stillUsed = new Set(
    (await getWorkshops()).flatMap((w) => w.selected_version_ids || [])
  );
  for (const vid of previousVersionIds) {
    if (!stillUsed.has(vid)) await attempt(() => deleteVersion(vid));
  }

  return getCampaignDetail(chainId);
}

/**
 * Closes or reopens a campaign without touching its data: every step gets the same `is_active`.
 * A closed campaign accepts no new participants (see api/session/join); results and exports stay.
 */
export async function setCampaignActive(campaignId, isActive) {
  const steps = stepsOfCampaign(await getWorkshops(), campaignId);
  if (steps.length === 0) return false;
  for (const s of steps) await updateWorkshop(s.id, { is_active: Boolean(isActive) });
  return true;
}

export async function deleteCampaign(campaignId) {
  const steps = stepsOfCampaign(await getWorkshops(), campaignId);
  if (steps.length === 0) return false;
  const versionIds = new Set(steps.flatMap((s) => s.selected_version_ids || []));
  for (const s of steps) await deleteWorkshop(s.id);
  const stillUsed = new Set((await getWorkshops()).flatMap((w) => w.selected_version_ids || []));
  for (const vid of versionIds) {
    if (!stillUsed.has(vid)) await attempt(() => deleteVersion(vid));
  }
  return true;
}
