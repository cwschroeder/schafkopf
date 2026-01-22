/**
 * Feedback Processing API
 * POST - Verarbeitet Reports aus der Queue (KI-Kategorisierung)
 *
 * Wird typischerweise von einem Cron-Job oder manuell aufgerufen
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getNextFromQueue,
  getReport,
  updateReport,
  getAllReports,
  getQueueLength,
} from '@/lib/feedback';
import { processReport } from '@/lib/feedback/ai-processing';
import type { FeedbackReport } from '@/lib/feedback/types';

// Maximale Anzahl an Reports pro Aufruf
const MAX_BATCH_SIZE = 5;

// POST /api/feedback/process - Queue verarbeiten
export async function POST(request: NextRequest) {
  try {
    // Optional: Cron-Secret prüfen für automatische Aufrufe
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Wenn CRON_SECRET gesetzt ist, muss es übereinstimmen
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Admin-Check als Alternative
      const isAdmin = request.headers.get('x-admin') === 'true';
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Nicht autorisiert' },
          { status: 401 }
        );
      }
    }

    // Queue-Länge prüfen
    const queueLength = await getQueueLength();
    if (queueLength === 0) {
      return NextResponse.json({
        success: true,
        message: 'Queue ist leer',
        processed: 0,
      });
    }

    // Bestehende Reports für Duplikat-Check laden
    const { reports: existingReports } = await getAllReports();

    // Reports aus Queue verarbeiten
    const processed: { id: string; status: 'success' | 'error'; error?: string }[] = [];
    let count = 0;

    while (count < MAX_BATCH_SIZE) {
      const reportId = await getNextFromQueue();
      if (!reportId) break;

      try {
        const report = await getReport(reportId);
        if (!report) {
          processed.push({ id: reportId, status: 'error', error: 'Report nicht gefunden' });
          count++;
          continue;
        }

        // Bereits verarbeitet?
        if (report.status !== 'pending') {
          processed.push({ id: reportId, status: 'success' });
          count++;
          continue;
        }

        console.log(`[Feedback] Verarbeite Report: ${reportId}`);

        // KI-Verarbeitung
        const { analysis, duplicateCheck } = await processReport(
          report,
          existingReports.filter((r) => r.id !== reportId)
        );

        // Report aktualisieren
        const updates: Partial<FeedbackReport> = {
          status: 'processed',
          category: analysis.category,
          priority: analysis.priority,
          aiSummary: analysis.summary,
          processedAt: new Date(),
        };

        if (duplicateCheck.isDuplicate && duplicateCheck.duplicateOf) {
          updates.duplicateOf = duplicateCheck.duplicateOf;
        }

        await updateReport(reportId, updates);

        processed.push({ id: reportId, status: 'success' });
        console.log(`[Feedback] Report verarbeitet: ${reportId}`, {
          category: analysis.category,
          priority: analysis.priority,
          isDuplicate: duplicateCheck.isDuplicate,
        });
      } catch (err) {
        console.error(`[Feedback] Verarbeitungsfehler für ${reportId}:`, err);
        processed.push({
          id: reportId,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unbekannter Fehler',
        });
      }

      count++;
    }

    const successCount = processed.filter((p) => p.status === 'success').length;
    const errorCount = processed.filter((p) => p.status === 'error').length;

    return NextResponse.json({
      success: true,
      processed: processed.length,
      successCount,
      errorCount,
      remaining: queueLength - processed.length,
      details: processed,
    });
  } catch (error) {
    console.error('[Feedback] Process API Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Verarbeitung' },
      { status: 500 }
    );
  }
}

// GET /api/feedback/process - Queue-Status abrufen
export async function GET() {
  try {
    const queueLength = await getQueueLength();

    return NextResponse.json({
      queueLength,
      maxBatchSize: MAX_BATCH_SIZE,
    });
  } catch (error) {
    console.error('[Feedback] Process Status Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Status' },
      { status: 500 }
    );
  }
}
