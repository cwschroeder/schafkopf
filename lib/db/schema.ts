/**
 * Drizzle ORM Schema für Schafkopf
 * PostgreSQL Schema-Definitionen
 */

import {
  pgTable,
  varchar,
  text,
  timestamp,
  jsonb,
  serial,
  integer,
  boolean,
  real,
  date,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// =============================================================================
// USERS & AUTH
// =============================================================================

/**
 * User Accounts
 * Haupttabelle für alle registrierten Benutzer
 */
export const users = pgTable('users', {
  id: varchar('id', { length: 32 }).primaryKey(), // Format: u_xxxxxxxxxxxxx
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }).defaultNow().notNull(),
  // Settings als JSONB für Flexibilität
  settings: jsonb('settings').$type<{
    voicePreference: 'male' | 'female';
    darkMode: boolean;
    cardDesign: 'bavarian' | 'french';
    audioVolume: number;
    soundEffectsEnabled: boolean;
    speechEnabled: boolean;
  }>().default({
    voicePreference: 'male',
    darkMode: false,
    cardDesign: 'bavarian',
    audioVolume: 80,
    soundEffectsEnabled: true,
    speechEnabled: true,
  }).notNull(),
}, (table) => [
  index('idx_users_email').on(table.email),
  index('idx_users_last_login').on(table.lastLoginAt),
]);

/**
 * OAuth Account Links
 * Verknüpfung zu OAuth Providern (Google, GitHub)
 */
export const oauthAccounts = pgTable('oauth_accounts', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 32 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 20 }).notNull(), // 'google', 'github'
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_oauth_user').on(table.userId),
  uniqueIndex('idx_oauth_provider').on(table.provider, table.providerAccountId),
]);

/**
 * Legacy Player ID Links
 * Mapping von alten p_xxx Player IDs zu User IDs
 */
export const legacyPlayerLinks = pgTable('legacy_player_links', {
  legacyPlayerId: varchar('legacy_player_id', { length: 32 }).primaryKey(), // Format: p_xxxxxxxxxxxxx
  userId: varchar('user_id', { length: 32 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  linkedAt: timestamp('linked_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_legacy_user').on(table.userId),
]);

// =============================================================================
// STATISTICS & LEADERBOARDS
// =============================================================================

/**
 * User Statistics
 * Spielstatistiken und Guthaben
 */
export const userStats = pgTable('user_stats', {
  userId: varchar('user_id', { length: 32 })
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  guthaben: integer('guthaben').default(0).notNull(),
  spieleGesamt: integer('spiele_gesamt').default(0).notNull(),
  siege: integer('siege').default(0).notNull(),
  niederlagen: integer('niederlagen').default(0).notNull(),
  // Ansagen-Counter als JSONB (flexibel für neue Spielarten)
  ansagenCount: jsonb('ansagen_count').$type<Record<string, number>>().default({}).notNull(),
  ansagenWins: jsonb('ansagen_wins').$type<Record<string, number>>().default({}).notNull(),
  // Periodische Statistiken
  weeklyGuthaben: integer('weekly_guthaben').default(0).notNull(),
  monthlyGuthaben: integer('monthly_guthaben').default(0).notNull(),
  weeklyResetAt: date('weekly_reset_at').defaultNow().notNull(),
  monthlyResetAt: date('monthly_reset_at').defaultNow().notNull(),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  // Leaderboard-Indices für schnelle Sortierung
  index('idx_stats_guthaben').on(table.guthaben),
  index('idx_stats_weekly').on(table.weeklyGuthaben),
  index('idx_stats_monthly').on(table.monthlyGuthaben),
  index('idx_stats_siege').on(table.siege),
]);

// =============================================================================
// GAME HISTORY
// =============================================================================

/**
 * Game Results
 * Historie aller gespielten Spiele
 */
export const gameResults = pgTable('game_results', {
  id: serial('id').primaryKey(),
  gameId: varchar('game_id', { length: 32 }).notNull(),
  roomId: varchar('room_id', { length: 32 }).notNull(),
  playedAt: timestamp('played_at', { withTimezone: true }).defaultNow().notNull(),
  spielart: varchar('spielart', { length: 50 }).notNull(),
  spielmacherId: varchar('spielmacher_id', { length: 32 }).notNull(),
  partnerId: varchar('partner_id', { length: 32 }),
  // Arrays für Spieler-IDs
  spielerPartei: text('spieler_partei').array().notNull(),
  gegnerPartei: text('gegner_partei').array().notNull(),
  punkte: integer('punkte').notNull(),
  gewonnen: boolean('gewonnen').notNull(),
  schneider: boolean('schneider').default(false).notNull(),
  schwarz: boolean('schwarz').default(false).notNull(),
  laufende: integer('laufende').default(0).notNull(),
  guthabenAenderung: integer('guthaben_aenderung').notNull(),
}, (table) => [
  index('idx_games_spielmacher').on(table.spielmacherId),
  index('idx_games_played_at').on(table.playedAt),
  index('idx_games_room').on(table.roomId),
]);

// =============================================================================
// FEEDBACK SYSTEM
// =============================================================================

/**
 * Feedback Reports
 * Bug Reports und Feature Requests
 */
export const feedbackReports = pgTable('feedback_reports', {
  id: varchar('id', { length: 32 }).primaryKey(), // Format: fb_xxxxxxxxxxxxx
  userId: varchar('user_id', { length: 32 }).notNull(),
  userName: varchar('user_name', { length: 100 }).notNull(),
  userEmail: varchar('user_email', { length: 255 }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  // KI-verarbeitete Felder
  category: varchar('category', { length: 20 }), // 'bug', 'feature', 'question', 'other'
  priority: varchar('priority', { length: 20 }), // 'critical', 'high', 'medium', 'low'
  severity: varchar('severity', { length: 20 }), // 'blocker', 'major', 'minor', 'trivial'
  aiSummary: text('ai_summary'),
  duplicateOf: varchar('duplicate_of', { length: 32 }),
  duplicateConfidence: real('duplicate_confidence'),
  suggestedLabels: text('suggested_labels').array(),
  // Kontext als JSONB
  context: jsonb('context').$type<{
    url?: string;
    userAgent?: string;
    viewport?: { width: number; height: number };
    timestamp?: string;
    gameState?: unknown;
    roomId?: string;
    [key: string]: unknown;
  }>().notNull(),
  // GitHub Integration
  githubIssueNumber: integer('github_issue_number'),
  githubIssueUrl: text('github_issue_url'),
  githubExportedAt: timestamp('github_exported_at', { withTimezone: true }),
  // Status
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  resolvedInVersion: varchar('resolved_in_version', { length: 20 }),
  resolutionNotes: text('resolution_notes'),
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  exportedAt: timestamp('exported_at', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  notifiedAt: timestamp('notified_at', { withTimezone: true }),
}, (table) => [
  index('idx_feedback_user').on(table.userId),
  index('idx_feedback_status').on(table.status),
  index('idx_feedback_created').on(table.createdAt),
]);

/**
 * Feedback Screenshots
 * Screenshot-Metadaten für Feedback Reports
 */
export const feedbackScreenshots = pgTable('feedback_screenshots', {
  id: varchar('id', { length: 32 }).primaryKey(), // Format: ss_xxxxxxxxxxxxx
  reportId: varchar('report_id', { length: 32 })
    .notNull()
    .references(() => feedbackReports.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 50 }).notNull(),
  size: integer('size').notNull(),
  annotations: text('annotations'), // tldraw JSON
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_screenshots_report').on(table.reportId),
]);

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// User types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type OAuthAccount = InferSelectModel<typeof oauthAccounts>;
export type NewOAuthAccount = InferInsertModel<typeof oauthAccounts>;

export type LegacyPlayerLink = InferSelectModel<typeof legacyPlayerLinks>;
export type NewLegacyPlayerLink = InferInsertModel<typeof legacyPlayerLinks>;

// Stats types
export type UserStat = InferSelectModel<typeof userStats>;
export type NewUserStat = InferInsertModel<typeof userStats>;

// Game types
export type GameResult = InferSelectModel<typeof gameResults>;
export type NewGameResult = InferInsertModel<typeof gameResults>;

// Feedback types
export type FeedbackReport = InferSelectModel<typeof feedbackReports>;
export type NewFeedbackReport = InferInsertModel<typeof feedbackReports>;

export type FeedbackScreenshot = InferSelectModel<typeof feedbackScreenshots>;
export type NewFeedbackScreenshot = InferInsertModel<typeof feedbackScreenshots>;
