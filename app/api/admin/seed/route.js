import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { seedSyntheticData, removeSyntheticData, isSyntheticLoaded, getSyntheticSummary } from '@/lib/seeds/demo-synthetic';

export async function GET() {
  try {
    return NextResponse.json({
      provider: process.env.DB_PROVIDER || 'memory',
      loaded: await isSyntheticLoaded(db),
      summary: getSyntheticSummary(),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // Safety invariant: never write demo data into remote Supabase unless explicitly authorized
    if (process.env.DB_PROVIDER === 'supabase' && !body.confirmRemoteWrite) {
      return NextResponse.json(
        {
          error:
            'Protección de infraestructura activa: la carga de semillas de demostración está bloqueada cuando DB_PROVIDER=supabase para proteger la base de datos en producción. Ejecute en modo local (DB_PROVIDER=memory o ./run.sh).',
        },
        { status: 403 }
      );
    }

    const seeded = await seedSyntheticData(db);

    return NextResponse.json({
      success: true,
      seeded,
      summary: getSyntheticSummary(),
    });
  } catch (error) {
    console.error('Demo seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Leaves demo mode: removes only the synthetic sample data. */
export async function DELETE(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    if (process.env.DB_PROVIDER === 'supabase' && !body.confirmRemoteWrite) {
      return NextResponse.json(
        { error: 'Por seguridad, el modo demo no modifica una base de datos remota. Usa el modo local (DB_PROVIDER=memory).' },
        { status: 403 }
      );
    }
    const removed = await removeSyntheticData(db);
    return NextResponse.json({ success: true, removed });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
