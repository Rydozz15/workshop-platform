/**
 * Campaign model (derived view).
 *
 * A campaign is the whole experience a participant goes through: an ordered list of steps
 * (stored as "workshops" sharing the same chain_id, ordered by chain_order). A workshop that has no
 * chain_id is a one-step campaign. No separate table is needed, so existing data keeps working and
 * the Supabase schema does not have to change.
 *
 * Campaign-level fields (campaign_name, campaign_description, consent_*) are stored on every step
 * and read from the first one. The campaign share code is the first step's share_code, so a campaign
 * has exactly one QR/link.
 */

export const SOLO_PREFIX = 'solo:';

export function campaignIdOf(workshop) {
  return workshop.chain_id || `${SOLO_PREFIX}${workshop.id}`;
}

function byOrder(a, b) {
  return (a.chain_order || 1) - (b.chain_order || 1);
}

/** Workshops that belong to a campaign, ordered by step. */
export function stepsOfCampaign(workshops, campaignId) {
  if (typeof campaignId === 'string' && campaignId.startsWith(SOLO_PREFIX)) {
    const id = campaignId.slice(SOLO_PREFIX.length);
    return workshops.filter((w) => w.id === id && !w.chain_id);
  }
  return workshops.filter((w) => w.chain_id === campaignId).sort(byOrder);
}

/**
 * Group workshops (and optionally sessions) into campaigns, newest first.
 * participants counts distinct people who started step 1 (chain_user_id when present).
 */
export function groupCampaigns(workshops = [], sessions = []) {
  const groups = new Map();
  for (const w of workshops) {
    const id = campaignIdOf(w);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(w);
  }

  const sessionsByWorkshop = new Map();
  for (const s of sessions) {
    if (!sessionsByWorkshop.has(s.workshop_id)) sessionsByWorkshop.set(s.workshop_id, []);
    sessionsByWorkshop.get(s.workshop_id).push(s);
  }

  const campaigns = [];
  for (const [id, group] of groups) {
    const steps = [...group].sort(byOrder);
    const first = steps[0];
    const stepSessions = steps.flatMap((s) => sessionsByWorkshop.get(s.id) || []);
    const firstStepSessions = sessionsByWorkshop.get(first.id) || [];
    const conditionIds = [...new Set(steps.flatMap((s) => s.selected_version_ids || []))];
    campaigns.push({
      id,
      name: first.campaign_name || first.name,
      description: first.campaign_description || '',
      consent_required: Boolean(first.consent_required),
      consent_url: first.consent_url || '',
      share_code: first.share_code,
      steps,
      step_count: steps.length,
      condition_ids: conditionIds,
      participants: new Set(firstStepSessions.map((s) => s.chain_user_id || s.id)).size,
      sessions_total: stepSessions.length,
      sessions_completed: stepSessions.filter((s) => s.status === 'completed').length,
      is_active: steps.some((s) => s.is_active !== false),
      created_at: first.created_at,
    });
  }
  return campaigns.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}
