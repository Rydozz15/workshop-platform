/**
 * Session join endpoint.
 * POST - Join a workshop by share code, get assigned a random version.
 */
import { NextResponse } from 'next/server';
import { getWorkshops, getWorkshopByCode, getVersion, createSession, getSessions, getLastSessionVersion, getSessionsByChainUserId, getMessages } from '@/lib/db';
import { stepsOfCampaign } from '@/lib/campaigns';
import { chooseSequence, isValidSequence, positionIn, sequencesPerParticipant } from '@/lib/step-order';

/**
 * Campaigns with randomize_order give each participant their own order of steps, decided when they
 * start and kept on their sessions. Returns the step they must be in now, the whole sequence and
 * the position, or null when the campaign follows the fixed order.
 */
async function resolveStepOrder(workshop, chainUserId) {
  if (!workshop.chain_id || !workshop.randomize_order) return null;
  const steps = stepsOfCampaign(await getWorkshops(), workshop.chain_id);
  if (steps.length < 2) return null;
  const stepIds = steps.map((s) => s.id);
  const isEntry = steps[0].id === workshop.id; // the campaign code is the first step's code

  // The order this participant already has (they did an earlier step of this campaign)?
  const prior = chainUserId
    ? (await getSessionsByChainUserId(chainUserId))
        .filter((s) => stepIds.includes(s.workshop_id) && isValidSequence(s.step_sequence, stepIds))
        .sort((a, b) => new Date(a.started_at) - new Date(b.started_at))
    : [];
  if (prior.length > 0) {
    const sequence = prior[0].step_sequence;
    let stepId = workshop.id;
    if (isEntry) {
      // Came back through the campaign code: continue with the first step they have not finished.
      const done = new Set(prior.filter((s) => s.status === 'completed').map((s) => s.workshop_id));
      stepId = sequence.find((id) => !done.has(id)) || sequence[0];
    }
    return { step: steps.find((s) => s.id === stepId), sequence, position: positionIn(sequence, stepId) };
  }

  if (!isEntry) {
    // Arrived at a later step's code with no order yet: keep the fixed order for this person.
    return { step: workshop, sequence: stepIds, position: positionIn(stepIds, workshop.id) };
  }

  const everyone = (await Promise.all(stepIds.map((id) => getSessions(id)))).flat();
  const sequence = chooseSequence(stepIds, sequencesPerParticipant(everyone));
  return { step: steps.find((s) => s.id === sequence[0]), sequence, position: 1 };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) {
      return NextResponse.json({ error: 'Workshop code is required' }, { status: 400 });
    }
    const workshop = await getWorkshopByCode(code);
    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: workshop.id,
      name: workshop.name,
      share_code: workshop.share_code,
      is_active: workshop.is_active,
      onboarding_instructions: workshop.onboarding_instructions || null,
      analysis_type: workshop.analysis_type || 'preregistrado',
      chain_id: workshop.chain_id || null,
      chain_order: workshop.chain_order || 1,
      ...(await campaignInfo(workshop)),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** What the participant needs to know about the whole campaign (never admin-only data). */
async function campaignInfo(workshop) {
  const steps = workshop.chain_id
    ? (await getWorkshops()).filter((w) => w.chain_id === workshop.chain_id)
    : [workshop];
  const first = [...steps].sort((a, b) => (a.chain_order || 1) - (b.chain_order || 1))[0] || workshop;
  return {
    campaign_name: first.campaign_name || first.name,
    step_count: steps.length,
    consent_required: Boolean(first.consent_required),
    consent_url: first.consent_url || null,
  };
}

export async function POST(request) {
  try {
    const { code, participant_name, chain_user_id, onboarding_answers } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Workshop code is required' }, { status: 400 });
    }

    // Find the workshop by share code
    const codeWorkshop = await getWorkshopByCode(code);
    if (!codeWorkshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
    }

    // With a randomized order the participant may start in a different step than the code's.
    const order = await resolveStepOrder(codeWorkshop, chain_user_id);
    const workshop = order ? order.step : codeWorkshop;

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
      onboarding_answers: onboarding_answers || null,
      ...(order ? { chain_position: order.position, step_sequence: order.sequence } : {}),
    });

    // For chained sessions (step > 1), find the first user message from the previous session
    let previousFirstMessage = null;
    if (workshop.chain_id && (order ? order.position : workshop.chain_order) > 1 && chain_user_id) {
      try {
        const previousSessions = await getSessionsByChainUserId(chain_user_id);
        // Find completed sessions that are NOT the one we just created, sorted by most recent
        const prevCompleted = previousSessions
          .filter(s => s.id !== session.id && s.status === 'completed')
          .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
        
        if (prevCompleted.length > 0) {
          const prevMessages = prevCompleted[0].messages || await getMessages(prevCompleted[0].id);
          const firstUserMsg = prevMessages.find(m => m.role === 'user');
          if (firstUserMsg) {
            previousFirstMessage = firstUserMsg.content;
          }
        }
      } catch (e) {
        console.error('Error fetching previous first message:', e);
        // Non-critical, continue without suggestion
      }
    }

    return NextResponse.json({
      session_id: session.id,
      version: {
        id: version.id,
        title: version.title,
        case_content: version.case_content,
      },
      workshop_name: workshop.name,
      onboarding_instructions: workshop.onboarding_instructions || null,
      analysis_type: workshop.analysis_type || 'preregistrado',
      chain_id: workshop.chain_id || null,
      chain_order: order ? order.position : workshop.chain_order || 1,
      share_code: workshop.share_code,
      survey_config: workshop.survey_config || [],
      previous_first_message: previousFirstMessage,
    });
  } catch (error) {
    console.error('Join error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
