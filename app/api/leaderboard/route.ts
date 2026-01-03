/**
 * Leaderboard API
 * GET: Leaderboard für einen Zeitraum laden
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/stats';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') as 'alltime' | 'weekly' | 'monthly' || 'alltime';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // Validiere period
    if (!['alltime', 'weekly', 'monthly'].includes(period)) {
      return NextResponse.json(
        { error: 'Ungültiger Zeitraum' },
        { status: 400 }
      );
    }

    const entries = await getLeaderboard(period, limit, offset);

    return NextResponse.json({
      period,
      entries,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Leaderboard GET] Error:', error);
    return NextResponse.json(
      { error: 'Interner Fehler' },
      { status: 500 }
    );
  }
}
