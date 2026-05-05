import { NextResponse } from 'next/server';
import { getSessionsByChainUserId, getSession, getMessages } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cuid = searchParams.get('cuid');
    const sessionId = searchParams.get('sessionId');

    if (!cuid && !sessionId) {
      return NextResponse.json({ error: 'Missing cuid or sessionId' }, { status: 400 });
    }

    let history = [];

    if (cuid) {
      // Fetch all sessions in the chain
      history = await getSessionsByChainUserId(cuid);
    } else if (sessionId) {
      // Fallback for standalone sessions that don't have a cuid saved
      const session = await getSession(sessionId);
      if (session) {
        const messages = await getMessages(sessionId);
        history = [{ ...session, messages }];
      }
    }

    return NextResponse.json(history);
  } catch (error) {
    console.error('Failed to fetch session history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
