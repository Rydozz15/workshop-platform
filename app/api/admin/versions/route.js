/**
 * Versions collection endpoint.
 * GET - List all versions
 * POST - Create a new version
 */
import { NextResponse } from 'next/server';
import { getVersions, createVersion } from '@/lib/db';

export async function GET() {
  try {
    const versions = await getVersions();
    return NextResponse.json(versions);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, case_content } = body;

    if (!title || !case_content) {
      return NextResponse.json({ error: 'Title and case content are required' }, { status: 400 });
    }

    const version = await createVersion({ title, case_content });
    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
