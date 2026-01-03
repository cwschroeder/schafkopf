/**
 * Link Legacy Player ID API
 * POST: Verknüpft eine alte p_xxx Player ID mit dem eingeloggten Account
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { linkLegacyPlayerId, getUserByLegacyId } from '@/lib/auth/users';
import { updateLeaderboards } from '@/lib/stats';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht eingeloggt' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { legacyPlayerId } = body;

    if (!legacyPlayerId || typeof legacyPlayerId !== 'string') {
      return NextResponse.json(
        { error: 'legacyPlayerId fehlt' },
        { status: 400 }
      );
    }

    // Prüfen ob die Legacy ID das richtige Format hat
    if (!legacyPlayerId.startsWith('p_')) {
      return NextResponse.json(
        { error: 'Ungültiges Player ID Format' },
        { status: 400 }
      );
    }

    // Prüfen ob diese Legacy ID bereits verknüpft ist
    const existingUser = await getUserByLegacyId(legacyPlayerId);
    if (existingUser) {
      if (existingUser.id === session.user.id) {
        return NextResponse.json({
          message: 'Diese Player ID ist bereits mit deinem Account verknüpft',
          alreadyLinked: true,
        });
      } else {
        return NextResponse.json(
          { error: 'Diese Player ID ist bereits mit einem anderen Account verknüpft' },
          { status: 409 }
        );
      }
    }

    // Legacy ID verknüpfen
    const success = await linkLegacyPlayerId(session.user.id, legacyPlayerId);

    if (!success) {
      return NextResponse.json(
        { error: 'Verknüpfung fehlgeschlagen' },
        { status: 500 }
      );
    }

    // Leaderboards aktualisieren mit neuen Stats
    await updateLeaderboards(session.user.id);

    return NextResponse.json({
      message: 'Player ID erfolgreich verknüpft',
      linkedId: legacyPlayerId,
    });
  } catch (error) {
    console.error('[Link Legacy] Error:', error);
    return NextResponse.json(
      { error: 'Interner Fehler' },
      { status: 500 }
    );
  }
}
