/**
 * Feedback API Routes
 * POST - Neues Feedback erstellen
 * GET - Alle Feedbacks auflisten (mit Pagination)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import {
  createReport,
  getAllReports,
  getReportsByUser,
  getScreenshotMetadata,
  addToQueue,
} from '@/lib/feedback';
import type {
  FeedbackReport,
  FeedbackContext,
  FeedbackScreenshot,
  CreateFeedbackRequest,
} from '@/lib/feedback/types';

// POST /api/feedback - Neues Feedback erstellen
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateFeedbackRequest & {
      userId?: string;
      userName?: string;
      context?: FeedbackContext;
    };

    const { title, description, category, screenshotIds, userId, userName, context } = body;

    // Validierung
    if (!title || title.trim().length < 3) {
      return NextResponse.json(
        { error: 'Titel muss mindestens 3 Zeichen haben' },
        { status: 400 }
      );
    }

    if (!description || description.trim().length < 10) {
      return NextResponse.json(
        { error: 'Beschreibung muss mindestens 10 Zeichen haben' },
        { status: 400 }
      );
    }

    // User ermitteln (Auth-Session oder Guest)
    let finalUserId = userId;
    let finalUserName = userName;
    let userEmail: string | undefined;

    const session = await auth();
    if (session?.user) {
      finalUserId = session.user.id;
      finalUserName = session.user.name || userName;
      userEmail = session.user.email || undefined;
    }

    if (!finalUserId || !finalUserName) {
      return NextResponse.json(
        { error: 'User-ID und Name sind erforderlich' },
        { status: 400 }
      );
    }

    // Screenshots laden falls IDs übergeben wurden
    const screenshots: FeedbackScreenshot[] = [];
    if (screenshotIds && screenshotIds.length > 0) {
      for (const id of screenshotIds) {
        const screenshot = await getScreenshotMetadata(id);
        if (screenshot) {
          screenshots.push(screenshot);
        }
      }
    }

    // Context validieren/auffüllen
    const finalContext: FeedbackContext = context || {
      appVersion: 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      screenSize: 'unknown',
      currentUrl: request.headers.get('referer') || 'unknown',
      timestamp: new Date(),
    };

    // Report erstellen
    const report = await createReport({
      userId: finalUserId,
      userName: finalUserName,
      userEmail,
      title: title.trim(),
      description: description.trim(),
      screenshots,
      context: finalContext,
      category, // Optional, KI kann später überschreiben
    });

    console.log('[Feedback] Neuer Report erstellt:', report.id, 'von', finalUserName);

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: 'Feedback erfolgreich eingereicht. Danke für deine Mithilfe!',
    });
  } catch (error) {
    console.error('[Feedback] Fehler beim Erstellen:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern des Feedbacks' },
      { status: 500 }
    );
  }
}

// GET /api/feedback - Feedbacks auflisten
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const myReports = searchParams.get('my') === 'true';

    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    // Eigene Reports (für eingeloggte User)
    if (myReports) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Nicht eingeloggt' },
          { status: 401 }
        );
      }

      const reports = await getReportsByUser(session.user.id);
      return NextResponse.json({
        reports: reports.slice(offset, offset + limit),
        total: reports.length,
        hasMore: offset + limit < reports.length,
      });
    }

    // Spezifischer User (für Gäste)
    if (userId) {
      const reports = await getReportsByUser(userId);
      return NextResponse.json({
        reports: reports.slice(offset, offset + limit),
        total: reports.length,
        hasMore: offset + limit < reports.length,
      });
    }

    // Alle Reports (Admin-Funktion)
    const session = await auth();
    const adminEmails = (process.env.FEEDBACK_ADMIN_EMAILS || '').split(',').map((e) => e.trim());
    const isAdmin = session?.user?.email && adminEmails.includes(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      );
    }

    const { reports, total } = await getAllReports(limit, offset);

    return NextResponse.json({
      reports,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('[Feedback] Fehler beim Laden:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Feedbacks' },
      { status: 500 }
    );
  }
}
