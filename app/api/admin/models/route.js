/** GET /api/admin/models?provider=openrouter -> { models, source } for the settings model picker. */
import { NextResponse } from 'next/server';
import { getModels, PROVIDERS } from '@/lib/model-catalog';

export async function GET(request) {
  const provider = (new URL(request.url).searchParams.get('provider') || 'openrouter').toLowerCase();
  if (!PROVIDERS.includes(provider)) return NextResponse.json({ error: 'Proveedor no válido' }, { status: 400 });
  return NextResponse.json(await getModels(provider));
}
