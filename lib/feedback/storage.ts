/**
 * Feedback Storage mit PostgreSQL/Drizzle
 * CRUD-Operationen für Feedback-Reports und Screenshots
 */

import { eq, desc, inArray, sql, and } from 'drizzle-orm';
import { getDb, feedbackReports, feedbackScreenshots } from '@/lib/db';
import type { NewFeedbackReport, NewFeedbackScreenshot } from '@/lib/db/schema';
import {
  FeedbackReport,
  FeedbackScreenshot,
  UserFeedbackHistory,
  PendingNotification,
  ID_PREFIXES,
  FeedbackContext,
} from './types';

// Fallback für lokale Entwicklung ohne DATABASE_URL
const localReports = new Map<string, FeedbackReport>();
const localScreenshots = new Map<string, FeedbackScreenshot>();
const isLocal = !process.env.DATABASE_URL;

// ID Generatoren
export function generateReportId(): string {
  return ID_PREFIXES.REPORT + Math.random().toString(36).substring(2, 14);
}

export function generateScreenshotId(): string {
  return ID_PREFIXES.SCREENSHOT + Math.random().toString(36).substring(2, 14);
}

// ============================================
// Helper: DB-Row zu FeedbackReport konvertieren
// ============================================

function dbRowToReport(
  row: typeof feedbackReports.$inferSelect,
  screenshots: FeedbackScreenshot[] = []
): FeedbackReport {
  return {
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    userEmail: row.userEmail ?? undefined,
    title: row.title,
    description: row.description,
    screenshots,
    context: row.context as unknown as FeedbackContext,
    category: row.category as FeedbackReport['category'],
    priority: row.priority as FeedbackReport['priority'],
    severity: row.severity as FeedbackReport['severity'],
    aiSummary: row.aiSummary ?? undefined,
    duplicateOf: row.duplicateOf ?? undefined,
    duplicateConfidence: row.duplicateConfidence ?? undefined,
    suggestedLabels: row.suggestedLabels ?? undefined,
    githubIssueNumber: row.githubIssueNumber ?? undefined,
    githubIssueUrl: row.githubIssueUrl ?? undefined,
    githubExportedAt: row.githubExportedAt ?? undefined,
    status: row.status as FeedbackReport['status'],
    resolvedInVersion: row.resolvedInVersion ?? undefined,
    resolutionNotes: row.resolutionNotes ?? undefined,
    createdAt: row.createdAt,
    processedAt: row.processedAt ?? undefined,
    exportedAt: row.exportedAt ?? undefined,
    resolvedAt: row.resolvedAt ?? undefined,
    notifiedAt: row.notifiedAt ?? undefined,
  };
}

function dbRowToScreenshot(row: typeof feedbackScreenshots.$inferSelect): FeedbackScreenshot {
  return {
    id: row.id,
    filename: row.filename,
    mimeType: row.mimeType,
    size: row.size,
    annotations: row.annotations ?? undefined,
    createdAt: row.createdAt,
  };
}

// ============================================
// Feedback Report CRUD
// ============================================

export async function createReport(
  report: Omit<FeedbackReport, 'id' | 'createdAt' | 'status'>
): Promise<FeedbackReport> {
  const fullReport: FeedbackReport = {
    ...report,
    id: generateReportId(),
    status: 'pending',
    createdAt: new Date(),
  };

  if (isLocal) {
    localReports.set(fullReport.id, fullReport);
    return fullReport;
  }

  const db = getDb();

  // Report in DB speichern
  const dbReport: NewFeedbackReport = {
    id: fullReport.id,
    userId: fullReport.userId,
    userName: fullReport.userName,
    userEmail: fullReport.userEmail ?? null,
    title: fullReport.title,
    description: fullReport.description,
    context: fullReport.context as unknown as NewFeedbackReport['context'],
    category: fullReport.category ?? null,
    priority: fullReport.priority ?? null,
    severity: fullReport.severity ?? null,
    aiSummary: fullReport.aiSummary ?? null,
    duplicateOf: fullReport.duplicateOf ?? null,
    duplicateConfidence: fullReport.duplicateConfidence ?? null,
    suggestedLabels: fullReport.suggestedLabels ?? null,
    status: fullReport.status,
    createdAt: fullReport.createdAt,
  };

  await db.insert(feedbackReports).values(dbReport);

  // Screenshots mit Report verknüpfen (falls vorhanden)
  if (fullReport.screenshots && fullReport.screenshots.length > 0) {
    for (const screenshot of fullReport.screenshots) {
      await db
        .update(feedbackScreenshots)
        .set({ reportId: fullReport.id })
        .where(eq(feedbackScreenshots.id, screenshot.id));
    }
  }

  return fullReport;
}

export async function getReport(reportId: string): Promise<FeedbackReport | null> {
  if (isLocal) {
    return localReports.get(reportId) || null;
  }

  const db = getDb();

  const [row] = await db
    .select()
    .from(feedbackReports)
    .where(eq(feedbackReports.id, reportId))
    .limit(1);

  if (!row) return null;

  // Screenshots laden
  const screenshotRows = await db
    .select()
    .from(feedbackScreenshots)
    .where(eq(feedbackScreenshots.reportId, reportId));

  const screenshots = screenshotRows.map(dbRowToScreenshot);

  return dbRowToReport(row, screenshots);
}

export async function updateReport(
  reportId: string,
  updates: Partial<FeedbackReport>
): Promise<FeedbackReport | null> {
  const report = await getReport(reportId);
  if (!report) return null;

  if (isLocal) {
    const updatedReport = { ...report, ...updates };
    localReports.set(reportId, updatedReport);
    return updatedReport;
  }

  const db = getDb();

  // Nur erlaubte Felder updaten
  const dbUpdates: Partial<typeof feedbackReports.$inferInsert> = {};

  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.severity !== undefined) dbUpdates.severity = updates.severity;
  if (updates.aiSummary !== undefined) dbUpdates.aiSummary = updates.aiSummary;
  if (updates.duplicateOf !== undefined) dbUpdates.duplicateOf = updates.duplicateOf;
  if (updates.duplicateConfidence !== undefined) dbUpdates.duplicateConfidence = updates.duplicateConfidence;
  if (updates.suggestedLabels !== undefined) dbUpdates.suggestedLabels = updates.suggestedLabels;
  if (updates.githubIssueNumber !== undefined) dbUpdates.githubIssueNumber = updates.githubIssueNumber;
  if (updates.githubIssueUrl !== undefined) dbUpdates.githubIssueUrl = updates.githubIssueUrl;
  if (updates.githubExportedAt !== undefined) dbUpdates.githubExportedAt = updates.githubExportedAt;
  if (updates.resolvedInVersion !== undefined) dbUpdates.resolvedInVersion = updates.resolvedInVersion;
  if (updates.resolutionNotes !== undefined) dbUpdates.resolutionNotes = updates.resolutionNotes;
  if (updates.processedAt !== undefined) dbUpdates.processedAt = updates.processedAt;
  if (updates.exportedAt !== undefined) dbUpdates.exportedAt = updates.exportedAt;
  if (updates.resolvedAt !== undefined) dbUpdates.resolvedAt = updates.resolvedAt;
  if (updates.notifiedAt !== undefined) dbUpdates.notifiedAt = updates.notifiedAt;

  if (Object.keys(dbUpdates).length > 0) {
    await db
      .update(feedbackReports)
      .set(dbUpdates)
      .where(eq(feedbackReports.id, reportId));
  }

  return getReport(reportId);
}

export async function deleteReport(reportId: string): Promise<boolean> {
  const report = await getReport(reportId);
  if (!report) return false;

  if (isLocal) {
    localReports.delete(reportId);
    return true;
  }

  const db = getDb();

  // Screenshots werden automatisch durch ON DELETE CASCADE gelöscht
  await db.delete(feedbackReports).where(eq(feedbackReports.id, reportId));

  return true;
}

export async function getAllReports(
  limit: number = 50,
  offset: number = 0
): Promise<{ reports: FeedbackReport[]; total: number }> {
  if (isLocal) {
    const all = Array.from(localReports.values());
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return {
      reports: all.slice(offset, offset + limit),
      total: all.length,
    };
  }

  const db = getDb();

  // Total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedbackReports);
  const total = Number(countResult?.count ?? 0);

  // Reports laden
  const rows = await db
    .select()
    .from(feedbackReports)
    .orderBy(desc(feedbackReports.createdAt))
    .limit(limit)
    .offset(offset);

  if (rows.length === 0) {
    return { reports: [], total };
  }

  // Screenshots für alle Reports laden
  const reportIds = rows.map((r) => r.id);
  const screenshotRows = await db
    .select()
    .from(feedbackScreenshots)
    .where(inArray(feedbackScreenshots.reportId, reportIds));

  // Screenshots nach reportId gruppieren
  const screenshotsByReport = new Map<string, FeedbackScreenshot[]>();
  for (const ss of screenshotRows) {
    const list = screenshotsByReport.get(ss.reportId) || [];
    list.push(dbRowToScreenshot(ss));
    screenshotsByReport.set(ss.reportId, list);
  }

  const reports = rows.map((row) =>
    dbRowToReport(row, screenshotsByReport.get(row.id) || [])
  );

  return { reports, total };
}

export async function getReportsByUser(userId: string): Promise<FeedbackReport[]> {
  if (isLocal) {
    return Array.from(localReports.values())
      .filter((r) => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const db = getDb();

  const rows = await db
    .select()
    .from(feedbackReports)
    .where(eq(feedbackReports.userId, userId))
    .orderBy(desc(feedbackReports.createdAt));

  if (rows.length === 0) {
    return [];
  }

  // Screenshots laden
  const reportIds = rows.map((r) => r.id);
  const screenshotRows = await db
    .select()
    .from(feedbackScreenshots)
    .where(inArray(feedbackScreenshots.reportId, reportIds));

  const screenshotsByReport = new Map<string, FeedbackScreenshot[]>();
  for (const ss of screenshotRows) {
    const list = screenshotsByReport.get(ss.reportId) || [];
    list.push(dbRowToScreenshot(ss));
    screenshotsByReport.set(ss.reportId, list);
  }

  return rows.map((row) => dbRowToReport(row, screenshotsByReport.get(row.id) || []));
}

// ============================================
// Processing Queue (simplified for PostgreSQL)
// ============================================

export async function getNextFromQueue(): Promise<string | null> {
  if (isLocal) {
    const pending = Array.from(localReports.values()).find((r) => r.status === 'pending');
    return pending?.id || null;
  }

  const db = getDb();

  const [row] = await db
    .select({ id: feedbackReports.id })
    .from(feedbackReports)
    .where(eq(feedbackReports.status, 'pending'))
    .orderBy(feedbackReports.createdAt)
    .limit(1);

  return row?.id || null;
}

export async function getQueueLength(): Promise<number> {
  if (isLocal) {
    return Array.from(localReports.values()).filter((r) => r.status === 'pending').length;
  }

  const db = getDb();

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedbackReports)
    .where(eq(feedbackReports.status, 'pending'));

  return Number(result?.count ?? 0);
}

export async function addToQueue(reportId: string): Promise<void> {
  // In PostgreSQL: einfach status auf 'pending' setzen
  await updateReport(reportId, { status: 'pending' });
}

// ============================================
// User Feedback History (derived from reports)
// ============================================

export async function getUserFeedbackHistory(
  userId: string
): Promise<UserFeedbackHistory | null> {
  const reports = await getReportsByUser(userId);

  if (reports.length === 0) {
    return null;
  }

  // Pending notifications: resolved reports not yet notified
  const pendingNotifications: PendingNotification[] = reports
    .filter((r) => r.status === 'resolved' && !r.notifiedAt)
    .map((r) => ({
      reportId: r.id,
      reportTitle: r.title,
      resolvedInVersion: r.resolvedInVersion || 'unknown',
      resolvedAt: r.resolvedAt || new Date(),
      message: `Dein Feedback "${r.title}" wurde bearbeitet!`,
    }));

  return {
    userId,
    reportIds: reports.map((r) => r.id),
    pendingNotifications,
    lastCheckedAt: new Date(),
  };
}

// ============================================
// Notifications
// ============================================

export async function addPendingNotification(
  userId: string,
  notification: PendingNotification
): Promise<void> {
  // In PostgreSQL: Der Report wird auf 'resolved' gesetzt
  // Die Notification wird aus dem Status abgeleitet
  const report = await getReport(notification.reportId);
  if (report) {
    await updateReport(notification.reportId, {
      status: 'resolved',
      resolvedAt: notification.resolvedAt,
      resolvedInVersion: notification.resolvedInVersion,
      resolutionNotes: notification.message,
    });
  }
}

export async function getPendingNotifications(
  userId: string
): Promise<PendingNotification[]> {
  const history = await getUserFeedbackHistory(userId);
  return history?.pendingNotifications || [];
}

export async function markNotificationsAsRead(
  userId: string,
  reportIds: string[]
): Promise<void> {
  if (isLocal) {
    for (const id of reportIds) {
      const report = localReports.get(id);
      if (report && report.status === 'resolved') {
        report.status = 'notified';
        report.notifiedAt = new Date();
      }
    }
    return;
  }

  const db = getDb();

  await db
    .update(feedbackReports)
    .set({
      status: 'notified',
      notifiedAt: new Date(),
    })
    .where(
      and(
        inArray(feedbackReports.id, reportIds),
        eq(feedbackReports.status, 'resolved')
      )
    );
}

export async function hasUserPendingNotifications(userId: string): Promise<boolean> {
  if (isLocal) {
    return Array.from(localReports.values()).some(
      (r) => r.userId === userId && r.status === 'resolved' && !r.notifiedAt
    );
  }

  const db = getDb();

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedbackReports)
    .where(
      and(
        eq(feedbackReports.userId, userId),
        eq(feedbackReports.status, 'resolved')
      )
    );

  return Number(result?.count ?? 0) > 0;
}

// ============================================
// Screenshots
// ============================================

export async function saveScreenshotMetadata(
  screenshot: FeedbackScreenshot & { reportId?: string }
): Promise<void> {
  if (isLocal) {
    localScreenshots.set(screenshot.id, screenshot);
    return;
  }

  const db = getDb();

  const dbScreenshot: NewFeedbackScreenshot = {
    id: screenshot.id,
    reportId: screenshot.reportId || 'pending', // Temporär, wird später aktualisiert
    filename: screenshot.filename,
    mimeType: screenshot.mimeType,
    size: screenshot.size,
    annotations: screenshot.annotations ?? null,
    createdAt: screenshot.createdAt,
  };

  await db.insert(feedbackScreenshots).values(dbScreenshot);
}

export async function getScreenshotMetadata(
  screenshotId: string
): Promise<FeedbackScreenshot | null> {
  if (isLocal) {
    return localScreenshots.get(screenshotId) || null;
  }

  const db = getDb();

  const [row] = await db
    .select()
    .from(feedbackScreenshots)
    .where(eq(feedbackScreenshots.id, screenshotId))
    .limit(1);

  if (!row) return null;

  return dbRowToScreenshot(row);
}

// ============================================
// Helper Functions
// ============================================

// Report für Duplikat-Check holen (nur relevante Felder für Performance)
export async function getReportsForDuplicateCheck(
  limit: number = 100
): Promise<Pick<FeedbackReport, 'id' | 'title' | 'description' | 'category'>[]> {
  if (isLocal) {
    return Array.from(localReports.values())
      .filter((r) => r.status !== 'closed')
      .slice(0, limit)
      .map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
      }));
  }

  const db = getDb();

  const rows = await db
    .select({
      id: feedbackReports.id,
      title: feedbackReports.title,
      description: feedbackReports.description,
      category: feedbackReports.category,
    })
    .from(feedbackReports)
    .where(sql`${feedbackReports.status} != 'closed'`)
    .orderBy(desc(feedbackReports.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category as FeedbackReport['category'],
  }));
}
