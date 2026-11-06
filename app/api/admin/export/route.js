/**
 * Export endpoint — supports legacy full JSON session transcript export AND
 * publication-grade Tidy Data (CSV/JSON) + Scientific Codebook exports.
 *
 * GET /api/admin/export?workshopId=xxx&format=csv|tidy-json|codebook&level=session|turn|longitudinal|wide
 */
import { NextResponse } from 'next/server';
import { getSessions, getMessages, getWorkshops, getVersions } from '@/lib/db';
import { generateTidyExport } from '@/lib/tidy-export';
import { generateCodebook } from '@/lib/codebook';
import { filterSessionsByCampaign } from '@/lib/campaigns';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const workshopId = searchParams.get('workshopId');
    const campaignId = searchParams.get('campaignId'); // all steps of a campaign
    const format = searchParams.get('format'); // null | 'csv' | 'tidy-json' | 'codebook'
    const level = searchParams.get('level') || 'session'; // 'session' | 'turn' | 'longitudinal' | 'wide'

    if (format === 'codebook') {
      const cb = generateCodebook();
      return new Response(cb.markdown, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': 'attachment; filename="promptsketch_codebook.md"',
        },
      });
    }

    // Fetch all reference data
    const [rawSessions, workshops, versions] = await Promise.all([
      getSessions(workshopId || undefined),
      getWorkshops(),
      getVersions(),
    ]);
    const allSessions = campaignId ? filterSessionsByCampaign(rawSessions, workshops, campaignId) : rawSessions;

    const workshopMap = {};
    workshops.forEach((w) => {
      workshopMap[w.id] = w;
    });
    const versionMap = {};
    versions.forEach((v) => {
      versionMap[v.id] = v;
    });

    const sessionsWithMessages = await Promise.all(
      allSessions.map(async (session) => {
        const messages = await getMessages(session.id);
        const workshop = workshopMap[session.workshop_id];
        const version = versionMap[session.version_id];

        return {
          ...session,
          session_id: session.id,
          participant_name: session.participant_name,
          campaign_name: workshop ? workshop.name : 'Unknown',
          campaign_id: session.workshop_id,
          chain_id: workshop ? workshop.chain_id : null,
          chain_order: workshop ? workshop.chain_order : null,
          chain_position: session.chain_position || null,
          step_sequence: session.step_sequence || null,
          chain_user_id: session.chain_user_id,
          version_title: version ? version.title : 'Unknown',
          version_id: session.version_id,
          ai_provider: workshop ? workshop.ai_provider : 'unknown',
          ai_model: workshop ? workshop.openrouter_model : 'unknown',
          system_prompt: workshop ? workshop.system_prompt : null,
          status: session.status,
          interaction_count: session.interaction_count,
          started_at: session.started_at,
          completed_at: session.completed_at,
          duration_seconds:
            session.duration_seconds ||
            (session.completed_at && session.started_at
              ? Math.round((new Date(session.completed_at) - new Date(session.started_at)) / 1000)
              : null),
          survey_config: workshop ? workshop.survey_config : [],
          survey_answers: session.survey_answers,
          messages: messages.map((m, i) => ({
            id: m.id,
            message_order: i + 1,
            role: m.role,
            content: m.content,
            telemetry: m.telemetry || null,
            metadata: m.metadata || null,
            created_at: m.created_at,
          })),
        };
      })
    );

    if (format === 'csv' || format === 'tidy-json') {
      const tidy = generateTidyExport({
        sessions: sessionsWithMessages,
        workshops,
        versions,
        level,
      });

      if (format === 'csv') {
        return new Response(tidy.csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="tidy_${level}s.csv"`,
          },
        });
      }

      return new Response(tidy.json, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="tidy_${level}s.json"`,
        },
      });
    }

    return NextResponse.json(sessionsWithMessages);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
