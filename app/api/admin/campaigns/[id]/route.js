/**
 * Single campaign.
 * GET    - full detail (steps with their conditions)
 * PUT    - save the editor payload (creates/updates/removes steps and conditions)
 * DELETE - remove the campaign, its steps and the conditions nobody else uses
 */
import { NextResponse } from 'next/server';
import { getCampaignDetail, saveCampaign, deleteCampaign, CampaignValidationError } from '@/lib/campaign-service';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const campaign = await getCampaignDetail(decodeURIComponent(id));
    if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
    return NextResponse.json(campaign);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const campaign = await saveCampaign(decodeURIComponent(id), await request.json());
    if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
    return NextResponse.json(campaign);
  } catch (error) {
    const status = error instanceof CampaignValidationError ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const ok = await deleteCampaign(decodeURIComponent(id));
    if (!ok) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
