/**
 * User Stats API
 * GET: Statistiken für eingeloggten User laden
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getUserStats, getUserRank } from '@/lib/stats';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht eingeloggt' },
        { status: 401 }
      );
    }

    const [stats, rankAlltime, rankWeekly, rankMonthly] = await Promise.all([
      getUserStats(session.user.id),
      getUserRank(session.user.id, 'alltime'),
      getUserRank(session.user.id, 'weekly'),
      getUserRank(session.user.id, 'monthly'),
    ]);

    if (!stats) {
      return NextResponse.json(
        { error: 'Stats nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      stats,
      ranks: {
        alltime: rankAlltime,
        weekly: rankWeekly,
        monthly: rankMonthly,
      },
    });
  } catch (error) {
    console.error('[User Stats GET] Error:', error);
    return NextResponse.json(
      { error: 'Interner Fehler' },
      { status: 500 }
    );
  }
}
