/**
 * Export endpoint — returns all sessions with full message transcripts.
 * GET /api/admin/export?workshopId=xxx
 * Optional query param: workshopId to filter by specific campaign.
 */
import { NextResponse } from 'next/server';
import { getSessions, getMessages, getWorkshops, getVersions } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const workshopId = searchParams.get('workshopId');

    // Fetch all reference data
    const [allSessions, workshops, versions] = await Promise.all([
      getSessions(workshopId || undefined),
      getWorkshops(),
      getVersions(),
    ]);

    // Build lookup maps
    const workshopMap = {};
    workshops.forEach(w => { workshopMap[w.id] = w; });
    const versionMap = {};
    versions.forEach(v => { versionMap[v.id] = v; });

    // Fetch messages for every session in parallel
    const sessionsWithMessages = await Promise.all(
      allSessions.map(async (session) => {
        const messages = await getMessages(session.id);
        const workshop = workshopMap[session.workshop_id];
        const version = versionMap[session.version_id];

        return {
          session_id: session.id,
          participant_name: session.participant_name,
          campaign_name: workshop ? workshop.name : 'Unknown',
          campaign_id: session.workshop_id,
          version_title: version ? version.title : 'Unknown',
          version_id: session.version_id,
          ai_provider: workshop ? workshop.ai_provider : 'unknown',
          ai_model: workshop ? workshop.openrouter_model : 'unknown',
          status: session.status,
          interaction_count: session.interaction_count,
          started_at: session.started_at,
          completed_at: session.completed_at,
          messages: messages.map((m, i) => ({
            message_order: i + 1,
            role: m.role,
            content: m.content,
            created_at: m.created_at,
          })),
        };
      })
    );

    return NextResponse.json(sessionsWithMessages);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
