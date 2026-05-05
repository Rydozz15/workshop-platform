import { NextResponse } from 'next/server';
import { getSession, updateSession, getWorkshop, getNextWorkshopInChain } from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const { sessionId } = params;
    const body = await request.json();
    const { survey_answers, chain_user_id } = body;

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update the session
    const updated = await updateSession(sessionId, {
      survey_answers: survey_answers || null,
      chain_user_id: chain_user_id || session.chain_user_id || null,
    });

    // Check if there is a next step in the chain
    let next_share_code = null;
    const currentWorkshop = await getWorkshop(session.workshop_id);

    if (currentWorkshop && currentWorkshop.chain_id) {
      const nextOrder = (currentWorkshop.chain_order || 1) + 1;
      const nextWorkshop = await getNextWorkshopInChain(currentWorkshop.chain_id, nextOrder);
      if (nextWorkshop) {
        next_share_code = nextWorkshop.share_code;
      }
    }

    return NextResponse.json({ success: true, next_share_code });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
