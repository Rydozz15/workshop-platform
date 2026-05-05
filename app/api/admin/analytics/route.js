import { NextResponse } from 'next/server';
import { getWorkshops, getSessions, getVersions } from '@/lib/db';

export async function GET() {
  try {
    const workshops = await getWorkshops();
    const sessions = await getSessions();
    const versions = await getVersions();

    return NextResponse.json({ workshops, sessions, versions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
