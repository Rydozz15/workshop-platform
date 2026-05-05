/**
 * Single version endpoint.
 * GET - Get version details
 * PUT - Update a version
 * DELETE - Delete a version
 */
import { NextResponse } from 'next/server';
import { getVersion, updateVersion, deleteVersion } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const version = getVersion(id);
    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }
    return NextResponse.json(version);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const version = updateVersion(id, body);
    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }
    return NextResponse.json(version);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const success = deleteVersion(id);
    if (!success) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
