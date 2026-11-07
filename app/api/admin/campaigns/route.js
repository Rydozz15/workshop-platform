/**
 * Campaigns collection.
 * GET  - campaigns with step/condition/participant counts
 * POST - create a campaign from the editor payload (steps with their conditions)
 */
import { NextResponse } from 'next/server';
import { getWorkshops, getSessions } from '@/lib/db';
import { groupCampaigns } from '@/lib/campaigns';
import { saveCampaign, CampaignValidationError } from '@/lib/campaign-service';

export async function GET() {
  try {
    const [workshops, sessions] = await Promise.all([getWorkshops(), getSessions()]);
    return NextResponse.json(groupCampaigns(workshops, sessions));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const campaign = await saveCampaign(null, await request.json());
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    const status = error instanceof CampaignValidationError ? 400 : 500;
    return NextResponse.json({ error: error.message, ...(error instanceof CampaignValidationError ? { error_key: error.key, error_params: error.params } : {}) }, { status });
  }
}
