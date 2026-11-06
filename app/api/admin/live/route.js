/**
 * Live monitor data for one campaign.
 * GET /api/admin/live?campaignId=...   (defaults to the most recent campaign)
 */
import { NextResponse } from 'next/server';
import { getWorkshops, getSessions, getVersions, getSettings } from '@/lib/db';
import { groupCampaigns } from '@/lib/campaigns';
import { computeLiveStatus } from '@/lib/live-monitor';
import { getProviderConfig } from '@/lib/ai-engine';

export async function GET(request) {
  try {
    const campaignId = new URL(request.url).searchParams.get('campaignId');
    const [workshops, sessions, versions] = await Promise.all([getWorkshops(), getSessions(), getVersions()]);
    const campaigns = groupCampaigns(workshops, sessions);
    const options = campaigns.map((c) => ({ id: c.id, name: c.name, share_code: c.share_code }));
    const campaign = campaigns.find((c) => c.id === campaignId) || campaigns[0];
    if (!campaign) return NextResponse.json({ campaigns: options, selected: null, status: null });

    let settings = {};
    try {
      settings = await getSettings();
    } catch {
      settings = {};
    }
    const first = campaign.steps[0] || {};
    const provider = (first.ai_provider || settings.default_ai_provider || 'openrouter').toLowerCase();
    const cfg = getProviderConfig({
      provider,
      apiKey: settings[`api_key_${provider}`],
      model: first.openrouter_model || settings.default_ai_model,
      baseUrl: settings.ollama_base_url,
    });

    const stepIds = new Set(campaign.steps.map((s) => s.id));
    const status = computeLiveStatus({
      campaign,
      versions,
      sessions: sessions.filter((s) => stepIds.has(s.workshop_id)),
      aiIsSimulated: Boolean(cfg.isMock),
    });
    return NextResponse.json({
      campaigns: options,
      selected: { id: campaign.id, name: campaign.name, share_code: campaign.share_code },
      status,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
