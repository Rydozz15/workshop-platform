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

    // Support creating a single workshop or an array of workshops (chained)
    const workshopsData = Array.isArray(body) ? body : [body];
    
    if (workshopsData.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    const createdWorkshops = [];
    const chain_id = workshopsData.length > 1 ? crypto.randomUUID() : null;

    for (let i = 0; i < workshopsData.length; i++) {
      const data = workshopsData[i];
      const { name, selected_version_ids, openrouter_model, ai_provider, system_prompt, survey_config, maintain_version } = data;

      if (!name || !selected_version_ids || selected_version_ids.length === 0) {
        return NextResponse.json(
          { error: `Name and at least one version are required for workshop at index ${i}` },
          { status: 400 }
        );
      }

      const workshop = await createWorkshop({ 
        name, 
        selected_version_ids, 
        openrouter_model, 
        ai_provider, 
        system_prompt,
        survey_config: survey_config || [],
        chain_id,
        chain_order: i + 1,
        maintain_version: maintain_version || false
      });
      createdWorkshops.push(workshop);
    }

    return NextResponse.json(Array.isArray(body) ? createdWorkshops : createdWorkshops[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
