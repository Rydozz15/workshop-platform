/**
 * Delete one session and its messages. Admin only: lives under /api/admin so proxy.js requires a session cookie.
 * (The participant-facing /api/session/[sessionId] route no longer allows DELETE.)
 */
import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/db';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const success = await deleteSession(id);
    if (!success) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
