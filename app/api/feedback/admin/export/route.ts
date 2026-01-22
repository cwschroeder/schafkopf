/**
 * Feedback Export API
 * POST - Exportiert Reports zu GitHub Issues
 *
 * Nur für Admins zugänglich
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReport, updateReport, getAllReports } from '@/lib/feedback';
import { createGitHubIssue, initializeLabels } from '@/lib/feedback/github';
import type { FeedbackReport } from '@/lib/feedback/types';

// POST /api/feedback/admin/export - Reports zu GitHub exportieren
export async function POST(request: NextRequest) {
  try {
    // Admin-Check
    const isAdmin = request.headers.get('x-admin') === 'true';
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (!isAdmin && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { reportIds, all = false, initLabels = false } = body;

    // Optional: Labels initialisieren
    if (initLabels) {
      try {
        await initializeLabels();
        console.log('[GitHub] Labels initialisiert');
      } catch (error) {
        console.warn('[GitHub] Label-Initialisierung fehlgeschlagen:', error);
      }
    }

    // Reports zum Exportieren ermitteln
    let reportsToExport: FeedbackReport[] = [];

    if (all) {
      // Alle verarbeiteten, aber noch nicht exportierten Reports
      const { reports } = await getAllReports();
      reportsToExport = reports.filter(
        (r) => r.status === 'processed' && !r.githubIssueNumber
      );
    } else if (reportIds && Array.isArray(reportIds)) {
      // Spezifische Report-IDs
      for (const id of reportIds) {
        const report = await getReport(id);
        if (report && !report.githubIssueNumber) {
          reportsToExport.push(report);
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Entweder "reportIds" Array oder "all: true" erforderlich' },
        { status: 400 }
      );
    }

    if (reportsToExport.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Keine Reports zum Exportieren gefunden',
        exported: 0,
      });
    }

    // Reports exportieren
    const results: { id: string; status: 'success' | 'error'; issueNumber?: number; error?: string }[] = [];

    for (const report of reportsToExport) {
      try {
        console.log(`[GitHub] Exportiere Report: ${report.id}`);

        const { issueNumber, issueUrl } = await createGitHubIssue(report);

        // Report aktualisieren
        await updateReport(report.id, {
          status: 'exported',
          githubIssueNumber: issueNumber,
          githubIssueUrl: issueUrl,
          exportedAt: new Date(),
          githubExportedAt: new Date(),
        });

        results.push({
          id: report.id,
          status: 'success',
          issueNumber,
        });

        console.log(`[GitHub] Report exportiert: ${report.id} -> Issue #${issueNumber}`);
      } catch (error) {
        console.error(`[GitHub] Export fehlgeschlagen für ${report.id}:`, error);
        results.push({
          id: report.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        });
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      exported: successCount,
      errors: errorCount,
      results,
    });
  } catch (error) {
    console.error('[GitHub] Export API Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Export' },
      { status: 500 }
    );
  }
}

// GET /api/feedback/admin/export - Export-Status abrufen
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

    const pending = reports.filter((r) => r.status === 'processed' && !r.githubIssueNumber);
    const exported = reports.filter((r) => r.githubIssueNumber);

    return NextResponse.json({
      pendingCount: pending.length,
      exportedCount: exported.length,
      pendingReportIds: pending.map((r) => r.id),
    });
  } catch (error) {
    console.error('[GitHub] Export Status Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Status' },
      { status: 500 }
    );
  }
}
