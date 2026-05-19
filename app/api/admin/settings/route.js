import { NextResponse } from 'next/server';
import { getSettings, updateSetting } from '@/lib/db';

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const updates = await request.json();
    
    const allowedKeys = ['default_ai_provider', 'default_ai_model'];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedKeys.includes(key) && typeof value === 'string' && value.trim()) {
        await updateSetting(key, value.trim());
      }
    }

    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
