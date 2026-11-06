import { NextResponse } from 'next/server';
import { getWorkshops, getSessions, getVersions, getMessages, getAllTelemetry } from '@/lib/db';
import { filterSessionsByCampaign } from '@/lib/campaigns';
import { isddeBenchmarkData } from '@/lib/seeds/isdde-benchmark';

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
      irrCalibration: isddeBenchmarkData.irrCalibration,
      messageCodes: isddeBenchmarkData.messageCodes,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
