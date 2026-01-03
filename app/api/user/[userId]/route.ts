/**
 * Public User Profile API
 * GET: Öffentliches Profil eines Users laden
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPublicProfile } from '@/lib/auth/users';
import { getUserRank } from '@/lib/stats';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID fehlt' },
        { status: 400 }
      );
    }

    const [profile, rankAlltime] = await Promise.all([
      getPublicProfile(userId),
      getUserRank(userId, 'alltime'),
    ]);

    if (!profile) {
      return NextResponse.json(
        { error: 'User nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile,
      rank: rankAlltime,
    });
  } catch (error) {
    console.error('[Public Profile GET] Error:', error);
    return NextResponse.json(
      { error: 'Interner Fehler' },
      { status: 500 }
    );
  }
}
