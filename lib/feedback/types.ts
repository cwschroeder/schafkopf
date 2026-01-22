/**
 * Feedback System Types für Schafkopf
 * Definiert alle Bug-Report, Feature-Request und Notification Interfaces
 */

// Status eines Feedback-Reports
export type FeedbackStatus =
  | 'pending' // Eingereicht, wartet auf KI-Verarbeitung
  | 'processed' // KI hat kategorisiert und Duplikate geprüft
  | 'exported' // Zu GitHub exportiert
  | 'in_progress' // GitHub Issue in Bearbeitung
  | 'resolved' // Gelöst, wartet auf Benachrichtigung
  | 'notified' // User wurde benachrichtigt
  | 'closed'; // Vollständig abgeschlossen

// Kategorie (von KI oder User bestimmt)
export type FeedbackCategory = 'bug' | 'feature' | 'question' | 'other';

// Priorität
export type FeedbackPriority = 'critical' | 'high' | 'medium' | 'low';

// Schweregrad für Bugs
export type BugSeverity = 'blocker' | 'major' | 'minor' | 'trivial';

// Screenshot mit optionalen tldraw Annotationen
export interface FeedbackScreenshot {
  id: string; // Unique ID (ss_xxx)
  filename: string; // Gespeicherter Dateiname (fb-abc123.png)
  mimeType: string; // image/png, image/jpeg
  size: number; // Dateigröße in Bytes
  annotations?: string; // tldraw JSON String für Annotationen
  createdAt: Date;
}

// Auto-gesammelter Kontext aus der App
export interface FeedbackContext {
  appVersion: string; // Aus package.json/API
  buildTime?: string; // Build-Zeitstempel
  userAgent: string; // Browser/Device Info
  screenSize: string; // z.B. "1920x1080"
  currentUrl: string; // Seite wo Feedback eingereicht wurde
  gameId?: string; // Falls User im Spiel ist
  roomId?: string; // Falls User in einem Raum ist
  gamePhase?: string; // Aktuelle Spielphase (warten, spielen, etc.)
  consoleErrors?: string[]; // Letzte N Console-Fehler
  timestamp: Date;
}

// Haupt-Feedback-Report
export interface FeedbackReport {
  id: string; // Unique Report ID (fb_xxx)
  userId: string; // u_xxx (registriert) oder p_xxx (Gast)
  userName: string; // Anzeigename zum Zeitpunkt der Einreichung
  userEmail?: string; // Optional für Kontakt

  // User-eingegebener Inhalt
  title: string; // Kurze Beschreibung
  description: string; // Detaillierte Beschreibung
  screenshots: FeedbackScreenshot[];

  // Auto-gesammelt
  context: FeedbackContext;

  // KI-verarbeitete Felder (nach Background-Verarbeitung)
  category?: FeedbackCategory;
  priority?: FeedbackPriority;
  severity?: BugSeverity; // Nur für Bugs
  aiSummary?: string; // KI-generierte Zusammenfassung
  duplicateOf?: string; // ID des potentiellen Duplikats
  duplicateConfidence?: number; // 0-1 Konfidenz-Score
  suggestedLabels?: string[]; // KI-vorgeschlagene GitHub Labels

  // GitHub Integration
  githubIssueNumber?: number;
  githubIssueUrl?: string;
  githubExportedAt?: Date;

  // Status-Tracking
  status: FeedbackStatus;
  resolvedInVersion?: string; // Version in der gefixt wurde
  resolutionNotes?: string; // Notizen zur Lösung

  // Zeitstempel
  createdAt: Date;
  processedAt?: Date;
  exportedAt?: Date;
  resolvedAt?: Date;
  notifiedAt?: Date;
}

// User Feedback-Historie (für Notification-Tracking)
export interface UserFeedbackHistory {
  userId: string;
  reportIds: string[]; // Alle Report-IDs des Users
  pendingNotifications: PendingNotification[];
  lastCheckedAt: Date;
}

// Benachrichtigung über gelöstes Issue
export interface PendingNotification {
  reportId: string;
  reportTitle: string;
  resolvedInVersion: string;
  resolvedAt: Date;
  message: string; // Anzeigetext für Toast
}

// KI-Verarbeitungsergebnis (Analyse)
export interface AIProcessingResult {
  category: FeedbackCategory;
  priority: FeedbackPriority;
  severity?: BugSeverity;
  summary: string;
  suggestedLabels: string[];
}

// Duplikat-Check Ergebnis
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateOf?: string;
  similarity?: number;
  reason?: string;
}

// GitHub Sync Status
export interface GitHubSyncState {
  lastSyncAt: Date;
  issuesUpdated: number;
  errors: string[];
}

// API Request/Response Types
export interface CreateFeedbackRequest {
  title: string;
  description: string;
  category?: FeedbackCategory; // Optional, KI kann überschreiben
  screenshotIds?: string[]; // IDs von vorab hochgeladenen Screenshots
}

export interface CreateFeedbackResponse {
  success: boolean;
  reportId?: string;
  error?: string;
}

export interface FeedbackListResponse {
  reports: FeedbackReport[];
  total: number;
  hasMore: boolean;
}

export interface UploadScreenshotResponse {
  success: boolean;
  screenshotId?: string;
  filename?: string;
  error?: string;
}

// Redis Key Prefixes
export const FEEDBACK_KEYS = {
  REPORT: 'feedback:', // feedback:{id} - FeedbackReport JSON
  QUEUE: 'feedback:queue', // List von IDs zur KI-Verarbeitung
  LIST: 'feedback:list', // Set aller Report-IDs
  USER: 'feedback:user:', // feedback:user:{userId} - UserFeedbackHistory
  NOTIFY: 'feedback:notify', // Set von UserIDs mit Pending Notifications
  SCREENSHOTS: 'feedback:ss:', // feedback:ss:{id} - Screenshot-Metadaten
} as const;

// TTL Werte in Sekunden
export const FEEDBACK_TTL = {
  REPORT: 90 * 24 * 60 * 60, // 90 Tage
  USER_HISTORY: 90 * 24 * 60 * 60, // 90 Tage
  SCREENSHOT: 90 * 24 * 60 * 60, // 90 Tage
} as const;

// ID Generator Prefixes
export const ID_PREFIXES = {
  REPORT: 'fb_',
  SCREENSHOT: 'ss_',
} as const;
