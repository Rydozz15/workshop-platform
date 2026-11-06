import { NextResponse } from 'next/server';
import { getSession, updateSession, getWorkshop } from '@/lib/db';
import { nextShareCodeFor } from '@/lib/chain-nav';
import { validateAnswers } from '@/lib/survey-schema';

export async function POST(request, { params }) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { survey_answers, chain_user_id } = body;

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const currentWorkshop = await getWorkshop(session.workshop_id);

    // Reject answers that break the question's own rules (unknown option, too many selections,
    // text too long...). Required questions are enforced by the participant page, as before.
    if (survey_answers && typeof survey_answers === 'object' && currentWorkshop) {
      const { ok, errors } = validateAnswers(currentWorkshop.survey_config, survey_answers, { enforceRequired: false });
      if (!ok) {
        return NextResponse.json({ error: Object.values(errors)[0], errors }, { status: 400 });
      }
    }

    // Update the session
    await updateSession(sessionId, {
      survey_answers: survey_answers || null,
      chain_user_id: chain_user_id || session.chain_user_id || null,
    });

    // Check if there is a next step in the chain
    const next_share_code = await nextShareCodeFor(session, currentWorkshop);

    return NextResponse.json({ success: true, next_share_code });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
