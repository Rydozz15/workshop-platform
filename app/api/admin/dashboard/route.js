/**
 * Dashboard metrics endpoint.
 * GET - Returns aggregated metrics for the admin dashboard.
 * Optional query param: workshopId to filter by specific workshop.
 */
import { NextResponse } from 'next/server';
import { getDashboardMetrics } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const workshopId = searchParams.get('workshopId');
    const metrics = getDashboardMetrics(workshopId || null);
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
