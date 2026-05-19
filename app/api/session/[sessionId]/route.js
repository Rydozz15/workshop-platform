/**
 * Session details and completion endpoint.
 * GET - Get session details
 * PUT - Update session (e.g., mark as completed)
 */
import { NextResponse } from 'next/server';
import { getSession, updateSession, getMessages, getVersion, getWorkshop, getSessionsByChainUserId } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { sessionId } = await params;
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const messages = await getMessages(sessionId);
    const version = await getVersion(session.version_id);
    const workshop = await getWorkshop(session.workshop_id);

    // For chained sessions (step > 1) with no messages yet, find the previous first message
    let previous_first_message = null;
    if (messages.length === 0 && workshop?.chain_id && workshop.chain_order > 1 && session.chain_user_id) {
      try {
        const previousSessions = await getSessionsByChainUserId(session.chain_user_id);
        const prevCompleted = previousSessions
          .filter(s => s.id !== session.id && s.status === 'completed')
          .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
        
        if (prevCompleted.length > 0) {
          const prevMessages = await getMessages(prevCompleted[0].id);
          const firstUserMsg = prevMessages.find(m => m.role === 'user');
          if (firstUserMsg) {
            previous_first_message = firstUserMsg.content;
          }
        }
      } catch (e) {
        console.error('Error fetching previous first message:', e);
      }
    }

    return NextResponse.json({
      ...session,
      messages,
      workshop_name: workshop ? workshop.name : '',
      system_prompt: workshop ? workshop.system_prompt : null,
      survey_config: workshop ? workshop.survey_config : [],
      version: version
        ? { id: version.id, title: version.title, case_content: version.case_content }
        : null,
      previous_first_message,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { sessionId } = await params;
    const body = await request.json();

    // If marking as completed, set completed_at
    if (body.status === 'completed') {
      body.completed_at = new Date().toISOString();
    }

    const session = await updateSession(sessionId, body);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // If completed, check for next workshop in chain
    let next_share_code = null;
    if (body.status === 'completed') {
      const workshop = await getWorkshop(session.workshop_id);
      if (workshop && workshop.chain_id) {
        const { getNextWorkshopInChain } = await import('@/lib/db');
        const nextWorkshop = await getNextWorkshopInChain(workshop.chain_id, (workshop.chain_order || 1) + 1);
        if (nextWorkshop) {
          next_share_code = nextWorkshop.share_code;
        }
      }
    }

    return NextResponse.json({ ...session, next_share_code });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { sessionId } = await params;
    const { deleteSession } = await import('@/lib/db');
    const success = await deleteSession(sessionId);
    if (!success) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
