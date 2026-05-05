/**
 * Session details and completion endpoint.
 * GET - Get session details
 * PUT - Update session (e.g., mark as completed)
 */
import { NextResponse } from 'next/server';
import { getSession, updateSession, getMessages, getVersion, getWorkshop } from '@/lib/db';

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

    return NextResponse.json({
      ...session,
      messages,
      workshop_name: workshop ? workshop.name : '',
      system_prompt: workshop ? workshop.system_prompt : null,
      version: version
        ? { id: version.id, title: version.title, case_content: version.case_content }
        : null,
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
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
