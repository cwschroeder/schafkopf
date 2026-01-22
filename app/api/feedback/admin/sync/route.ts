/**
 * GitHub Sync API
 * POST - Synchronisiert Issue-Status von GitHub zurück zu Redis
 *
 * Prüft ob Issues geschlossen wurden und aktualisiert Reports entsprechend
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReport, updateReport, getAllReports, addPendingNotification } from '@/lib/feedback';
import { getIssueStatus } from '@/lib/feedback/github';
import type { FeedbackReport, PendingNotification } from '@/lib/feedback/types';

// POST /api/feedback/admin/sync - Status von GitHub synchronisieren
export async function POST(request: NextRequest) {
  try {
    // Auth-Check
    const isAdmin = request.headers.get('x-admin') === 'true';
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (!isAdmin && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // Alle exportierten Reports laden
    const { reports } = await getAllReports();
    const exportedReports = reports.filter(
      (r) => r.githubIssueNumber && r.status === 'exported'
    );

    if (exportedReports.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Keine exportierten Reports zum Synchronisieren',
        synced: 0,
      });
    }

    const results: {
      id: string;
      issueNumber: number;
      status: 'unchanged' | 'resolved' | 'error';
      error?: string;
    }[] = [];

    // App-Version aus package.json oder API holen
    let currentVersion = 'unknown';
    try {
      const versionRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/version`
      );
      if (versionRes.ok) {
        const data = await versionRes.json();
        currentVersion = data.version;
      }
    } catch {
      // Version konnte nicht ermittelt werden
    }

    for (const report of exportedReports) {
      try {
        const issueStatus = await getIssueStatus(report.githubIssueNumber!);

        if (issueStatus.state === 'closed') {
          // Issue wurde geschlossen - Report als resolved markieren
          const resolvedVersion = issueStatus.milestone || currentVersion;

          await updateReport(report.id, {
            status: 'resolved',
            resolvedAt: new Date(),
            resolvedInVersion: resolvedVersion,
            resolutionNotes: `Issue #${report.githubIssueNumber} wurde geschlossen`,
          });

          // Notification für User erstellen
          const notification: PendingNotification = {
            reportId: report.id,
            reportTitle: report.title,
            resolvedInVersion: resolvedVersion,
            resolvedAt: new Date(),
            message: `Dein Feedback "${report.title}" wurde bearbeitet und ist in Version ${resolvedVersion} enthalten!`,
          };

          await addPendingNotification(report.userId, notification);

          results.push({
            id: report.id,
            issueNumber: report.githubIssueNumber!,
            status: 'resolved',
          });

          console.log(`[Sync] Report ${report.id} als resolved markiert (Issue #${report.githubIssueNumber})`);
        } else {
          results.push({
            id: report.id,
            issueNumber: report.githubIssueNumber!,
            status: 'unchanged',
          });
        }
      } catch (error) {
        console.error(`[Sync] Fehler bei Report ${report.id}:`, error);
        results.push({
          id: report.id,
          issueNumber: report.githubIssueNumber!,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        });
      }
    }

    const resolvedCount = results.filter((r) => r.status === 'resolved').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      checked: results.length,
      resolved: resolvedCount,
      errors: errorCount,
      results,
    });
  } catch (error) {
    console.error('[Sync] API Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Synchronisierung' },
      { status: 500 }
    );
  }
}

// GET /api/feedback/admin/sync - Sync-Status abrufen
export async function GET(request: NextRequest) {
  try {
    // Admin-Check
    const isAdmin = request.headers.get('x-admin') === 'true';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const { reports } = await getAllReports();

    const stats = {
      total: reports.length,
      pending: reports.filter((r) => r.status === 'pending').length,
      processed: reports.filter((r) => r.status === 'processed').length,
      exported: reports.filter((r) => r.status === 'exported').length,
      resolved: reports.filter((r) => r.status === 'resolved').length,
      notified: reports.filter((r) => r.status === 'notified').length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[Sync] Status Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Status' },
      { status: 500 }
    );
  }
}
