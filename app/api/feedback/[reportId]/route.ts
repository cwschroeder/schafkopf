/**
 * Single Feedback Report API Routes
 * GET - Einzelnen Report abrufen
 * PATCH - Report aktualisieren
 * DELETE - Report löschen
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getReport, updateReport, deleteReport } from '@/lib/feedback';
import type { FeedbackStatus, FeedbackCategory, FeedbackPriority, BugSeverity } from '@/lib/feedback/types';

interface RouteParams {
  params: Promise<{ reportId: string }>;
}

// GET /api/feedback/[reportId] - Einzelnen Report abrufen
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { reportId } = await params;
    const report = await getReport(reportId);

    if (!report) {
      return NextResponse.json(
        { error: 'Report nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfen ob User berechtigt ist diesen Report zu sehen
    const session = await auth();
    const isOwner = session?.user?.id === report.userId;
    const adminEmails = (process.env.FEEDBACK_ADMIN_EMAILS || '').split(',').map((e) => e.trim());
    const isAdmin = session?.user?.email && adminEmails.includes(session.user.email);

    // Gäste können ihre eigenen Reports mit userId-Header abrufen
    const headerUserId = request.headers.get('x-user-id');
    const isGuestOwner = headerUserId === report.userId;

    if (!isOwner && !isAdmin && !isGuestOwner) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      );
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('[Feedback] Fehler beim Laden des Reports:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden des Reports' },
      { status: 500 }
    );
  }
}

// PATCH /api/feedback/[reportId] - Report aktualisieren
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { reportId } = await params;
    const body = await request.json();

    const report = await getReport(reportId);
    if (!report) {
      return NextResponse.json(
        { error: 'Report nicht gefunden' },
        { status: 404 }
      );
    }

    // Nur Admins können Reports aktualisieren
    const session = await auth();
    const adminEmails = (process.env.FEEDBACK_ADMIN_EMAILS || '').split(',').map((e) => e.trim());
    const isAdmin = session?.user?.email && adminEmails.includes(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Nur Admins können Reports aktualisieren' },
        { status: 403 }
      );
    }

    // Erlaubte Update-Felder
    const updates: Partial<typeof report> = {};

    if (body.status) {
      const validStatuses: FeedbackStatus[] = [
        'pending', 'processed', 'exported', 'in_progress', 'resolved', 'notified', 'closed'
      ];
      if (validStatuses.includes(body.status)) {
        updates.status = body.status;

        // Timestamps setzen
        if (body.status === 'processed') updates.processedAt = new Date();
        if (body.status === 'exported') updates.exportedAt = new Date();
        if (body.status === 'resolved') updates.resolvedAt = new Date();
        if (body.status === 'notified') updates.notifiedAt = new Date();
      }
    }

    if (body.category) {
      const validCategories: FeedbackCategory[] = ['bug', 'feature', 'question', 'other'];
      if (validCategories.includes(body.category)) {
        updates.category = body.category;
      }
    }

    if (body.priority) {
      const validPriorities: FeedbackPriority[] = ['critical', 'high', 'medium', 'low'];
      if (validPriorities.includes(body.priority)) {
        updates.priority = body.priority;
      }
    }

    if (body.severity) {
      const validSeverities: BugSeverity[] = ['blocker', 'major', 'minor', 'trivial'];
      if (validSeverities.includes(body.severity)) {
        updates.severity = body.severity;
      }
    }

    if (typeof body.resolvedInVersion === 'string') {
      updates.resolvedInVersion = body.resolvedInVersion;
    }

    if (typeof body.resolutionNotes === 'string') {
      updates.resolutionNotes = body.resolutionNotes;
    }

    if (typeof body.githubIssueNumber === 'number') {
      updates.githubIssueNumber = body.githubIssueNumber;
    }

    if (typeof body.githubIssueUrl === 'string') {
      updates.githubIssueUrl = body.githubIssueUrl;
    }

    // AI-Felder (werden von AI-Processing gesetzt)
    if (typeof body.aiSummary === 'string') {
      updates.aiSummary = body.aiSummary;
    }

    if (typeof body.duplicateOf === 'string') {
      updates.duplicateOf = body.duplicateOf;
    }

    if (typeof body.duplicateConfidence === 'number') {
      updates.duplicateConfidence = body.duplicateConfidence;
    }

    if (Array.isArray(body.suggestedLabels)) {
      updates.suggestedLabels = body.suggestedLabels;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Keine gültigen Updates' },
        { status: 400 }
      );
    }

    const updatedReport = await updateReport(reportId, updates);

    console.log('[Feedback] Report aktualisiert:', reportId, updates);

    return NextResponse.json({
      success: true,
      report: updatedReport,
    });
  } catch (error) {
    console.error('[Feedback] Fehler beim Aktualisieren:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Reports' },
      { status: 500 }
    );
  }
}

// DELETE /api/feedback/[reportId] - Report löschen
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { reportId } = await params;
    const report = await getReport(reportId);

    if (!report) {
      return NextResponse.json(
        { error: 'Report nicht gefunden' },
        { status: 404 }
      );
    }

    // Nur Admins können Reports löschen
    const session = await auth();
    const adminEmails = (process.env.FEEDBACK_ADMIN_EMAILS || '').split(',').map((e) => e.trim());
    const isAdmin = session?.user?.email && adminEmails.includes(session.user.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Nur Admins können Reports löschen' },
        { status: 403 }
      );
    }

    await deleteReport(reportId);

    console.log('[Feedback] Report gelöscht:', reportId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Feedback] Fehler beim Löschen:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Reports' },
      { status: 500 }
    );
  }
}
