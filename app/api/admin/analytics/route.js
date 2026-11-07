import { NextResponse } from 'next/server';
import { getWorkshops, getSessions, getVersions, getMessages, getAllTelemetry } from '@/lib/db';
import { filterSessionsByCampaign } from '@/lib/campaigns';
import { getSyntheticCalibration, hasSyntheticWorkshops } from '@/lib/seeds/demo-synthetic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const workshopId = searchParams.get('workshopId') || null;
    const campaignId = searchParams.get('campaignId') || null;

    const [workshops, scopedSessions, versions, telemetry] = await Promise.all([
      getWorkshops(),
      getSessions(workshopId),
      getVersions(),
      getAllTelemetry ? getAllTelemetry() : Promise.resolve([]),
    ]);

    const rawSessions = campaignId ? filterSessionsByCampaign(scopedSessions, workshops, campaignId) : scopedSessions;

    // Attach messages to each session so statistical, psychometric, and chat-analytics
    // modules operate over real turn-level transcripts and latency metadata.
    const sessions = await Promise.all(
      rawSessions.map(async (s) => {
        const messages = await getMessages(s.id);
        return {
          ...s,
          messages,
        };
      })
    );

    return NextResponse.json({
      workshops,
      sessions,
      versions,
      telemetry,
      // Only the demo (synthetic) conversations have human vs. judge codes.
      irrCalibration: hasSyntheticWorkshops(workshops) ? getSyntheticCalibration() : null,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
