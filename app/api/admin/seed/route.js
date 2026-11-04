import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { seedBenchmarkData, getBenchmarkSummary } from '@/lib/seeds/isdde-benchmark';

export async function GET() {
  try {
    const summary = getBenchmarkSummary();
    return NextResponse.json({
      provider: process.env.DB_PROVIDER || 'memory',
      summary,
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

    // Safety invariant: never write benchmark test data into remote Supabase unless explicitly authorized
    if (process.env.DB_PROVIDER === 'supabase' && !body.confirmRemoteWrite) {
      return NextResponse.json(
        {
          error:
            'Protección de infraestructura activa: la carga de semillas de demostración está bloqueada cuando DB_PROVIDER=supabase para proteger la base de datos en producción. Ejecute en modo local (DB_PROVIDER=memory o ./run.sh).',
        },
        { status: 403 }
      );
    }

    const seeded = await seedBenchmarkData(db);
    const summary = getBenchmarkSummary();

    return NextResponse.json({
      success: true,
      seeded,
      summary,
    });
  } catch (error) {
    console.error('Seed benchmark error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
