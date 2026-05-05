/**
 * Workshops collection endpoint.
 * GET - List all workshops
 * POST - Create a new workshop
 */
import { NextResponse } from 'next/server';
import { getWorkshops, createWorkshop } from '@/lib/db';

export async function GET() {
  try {
    const workshops = await getWorkshops();
    return NextResponse.json(workshops);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, selected_version_ids, openrouter_model, ai_provider, system_prompt } = body;

    if (!name || !selected_version_ids || selected_version_ids.length === 0) {
      return NextResponse.json(
        { error: 'Name and at least one version are required' },
        { status: 400 }
      );
    }

    const workshop = await createWorkshop({ name, selected_version_ids, openrouter_model, ai_provider, system_prompt });
    return NextResponse.json(workshop, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
