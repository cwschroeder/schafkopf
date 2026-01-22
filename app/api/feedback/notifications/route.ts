/**
 * Feedback Notifications API Routes
 * GET - Pending Notifications für User abrufen
 * POST - Notifications als gelesen markieren
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import {
  getPendingNotifications,
  markNotificationsAsRead,
  hasUserPendingNotifications,
} from '@/lib/feedback';

// GET /api/feedback/notifications - Pending Notifications abrufen
export async function GET(request: NextRequest) {
  try {
    // User ermitteln (Auth-Session oder Guest via Header)
    const session = await auth();
    let userId = session?.user?.id;

    // Für Gäste: User-ID aus Header
    if (!userId) {
      userId = request.headers.get('x-user-id') || undefined;
    }

    if (!userId) {
      return NextResponse.json(
        { notifications: [], count: 0 },
        { status: 200 }
      );
    }

    // Prüfen ob überhaupt Notifications vorhanden
    const hasNotifications = await hasUserPendingNotifications(userId);
    if (!hasNotifications) {
      return NextResponse.json({
        notifications: [],
        count: 0,
      });
    }

    const notifications = await getPendingNotifications(userId);

    return NextResponse.json({
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error('[Feedback] Fehler beim Laden der Notifications:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Benachrichtigungen' },
      { status: 500 }
    );
  }
}

// POST /api/feedback/notifications - Notifications als gelesen markieren
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportIds } = body;

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return NextResponse.json(
        { error: 'reportIds erforderlich' },
        { status: 400 }
      );
    }

    // User ermitteln
    const session = await auth();
    let userId = session?.user?.id;

    if (!userId) {
      userId = request.headers.get('x-user-id') || undefined;
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    await markNotificationsAsRead(userId, reportIds);

    return NextResponse.json({
      success: true,
      markedAsRead: reportIds.length,
    });
  } catch (error) {
    console.error('[Feedback] Fehler beim Markieren der Notifications:', error);
    return NextResponse.json(
      { error: 'Fehler beim Markieren als gelesen' },
      { status: 500 }
    );
  }
}
