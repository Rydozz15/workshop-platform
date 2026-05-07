/**
 * Session join endpoint.
 * POST - Join a workshop by share code, get assigned a random version.
 */
import { NextResponse } from 'next/server';
import { getWorkshopByCode, getVersion, createSession, getSessions, getLastSessionVersion } from '@/lib/db';

export async function POST(request) {
  try {
    const { code, participant_name, chain_user_id } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Workshop code is required' }, { status: 400 });
    }

    // Find the workshop by share code
    const workshop = await getWorkshopByCode(code);
    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
    }

    if (!workshop.is_active) {
      return NextResponse.json({ error: 'This workshop is no longer active' }, { status: 403 });
    }

    if (!workshop.selected_version_ids || workshop.selected_version_ids.length === 0) {
      return NextResponse.json({ error: 'No versions available for this workshop' }, { status: 400 });
    }

    // Version assignment logic
    let assignedVersionId = null;

    // If maintain_version is enabled, try to find the version from a previous session in the chain
    if (workshop.maintain_version && chain_user_id) {
      const lastVersionId = await getLastSessionVersion(chain_user_id);
      
      // Verify this version is actually available for the current workshop
      if (lastVersionId && workshop.selected_version_ids.includes(lastVersionId)) {
        assignedVersionId = lastVersionId;
      }
    }

    // If no version assigned yet (not maintained or not found/invalid), use balanced random assignment
    if (!assignedVersionId) {
      // Count how many sessions each version already has
      const workshopSessions = await getSessions(workshop.id);
      const versionCounts = {};
      workshop.selected_version_ids.forEach((vid) => {
        versionCounts[vid] = 0;
      });
      workshopSessions.forEach((s) => {
        if (versionCounts[s.version_id] !== undefined) {
          versionCounts[s.version_id]++;
        }
      });

      // Pick the version with the fewest sessions (balanced assignment)
      const minCount = Math.min(...Object.values(versionCounts));
      const leastUsedVersions = Object.entries(versionCounts)
        .filter(([, count]) => count === minCount)
        .map(([vid]) => vid);

      assignedVersionId = leastUsedVersions[Math.floor(Math.random() * leastUsedVersions.length)];
    }

    const version = await getVersion(assignedVersionId);

    if (!version) {
      return NextResponse.json({ error: 'Assigned version not found' }, { status: 500 });
    }

    // Create the session
    const session = await createSession({
      workshop_id: workshop.id,
      version_id: assignedVersionId,
      participant_name: participant_name || 'Anonymous',
      chain_user_id: chain_user_id || null,
    });

    return NextResponse.json({
      session_id: session.id,
      version: {
        id: version.id,
        title: version.title,
        case_content: version.case_content,
      },
      workshop_name: workshop.name,
      survey_config: workshop.survey_config || [],
    });
  } catch (error) {
    console.error('Join error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
