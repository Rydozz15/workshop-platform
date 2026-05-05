/**
 * Single workshop endpoint.
 * GET - Get workshop details
 * PUT - Update a workshop
 * DELETE - Delete a workshop
 */
import { NextResponse } from 'next/server';
import { getWorkshop, updateWorkshop, deleteWorkshop } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const workshop = await getWorkshop(id);
    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
    }
    return NextResponse.json(workshop);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const workshop = await updateWorkshop(id, body);
    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
    }
    return NextResponse.json(workshop);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const success = await deleteWorkshop(id);
    if (!success) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
