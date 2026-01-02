// Auth Types for Schafkopf User Accounts

import type { Spielart } from '../schafkopf/types';

/**
 * User settings that are persisted with the account
 */
export interface UserSettings {
  voicePreference: 'male' | 'female';
  darkMode: boolean;
  cardDesign: 'bavarian' | 'french';
  audioVolume: number; // 0-100
  soundEffectsEnabled: boolean;
  speechEnabled: boolean;
}

/**
 * Default settings for new users
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  voicePreference: 'male',
  darkMode: false,
  cardDesign: 'bavarian',
  audioVolume: 80,
  soundEffectsEnabled: true,
  speechEnabled: true,
};

/**
 * OAuth provider information linked to a user account
 */
export interface UserProviders {
  google?: string; // Google OAuth ID
  github?: string; // GitHub OAuth ID
}

/**
 * Main user account stored in Redis
 * Key: user:{id}
 */
export interface UserAccount {
  id: string; // UUID
  email: string | null;
  name: string;
  image: string | null;
  createdAt: number; // Unix timestamp
  lastLoginAt: number; // Unix timestamp
  providers: UserProviders;
  legacyPlayerIds: string[]; // Old p_xxx IDs linked to this account
  settings: UserSettings;
}

/**
 * User statistics for leaderboard
 * Key: stats:user:{userId}
 */
export interface UserStats {
  userId: string;
  guthaben: number; // Total balance in cents
  spieleGesamt: number; // Total games played
  siege: number; // Wins
  niederlagen: number; // Losses
  ansagenCount: Partial<Record<Spielart, number>>; // Games played per game type
  ansagenWins: Partial<Record<Spielart, number>>; // Wins per game type
  weeklyGuthaben: number; // Earnings this week
  monthlyGuthaben: number; // Earnings this month
  lastUpdated: number; // Unix timestamp
}

/**
 * Default stats for new users
 */
export const DEFAULT_USER_STATS: Omit<UserStats, 'userId'> = {
  guthaben: 0,
  spieleGesamt: 0,
  siege: 0,
  niederlagen: 0,
  ansagenCount: {},
  ansagenWins: {},
  weeklyGuthaben: 0,
  monthlyGuthaben: 0,
  lastUpdated: Date.now(),
};

/**
 * Session stored in Redis
 * Key: session:{sessionToken}
 * TTL: 24 hours
 */
export interface AuthSession {
  sessionToken: string;
  userId: string;
  expires: number; // Unix timestamp
}

/**
 * OAuth account link stored in Redis
 * Key: user:oauth:{provider}:{providerAccountId}
 */
export interface OAuthAccountLink {
  userId: string;
  provider: string;
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * Game result for history tracking
 * Key: history:game:{gameId}
 * TTL: 90 days
 */
export interface GameResult {
  id: string;
  roomId: string;
  timestamp: number;
  spielart: Spielart;
  spielmacherId: string;
  partnerId: string | null;
  gewinner: 'spielmacher' | 'gegner';
  augenSpielmacher: number;
  augenGegner: number;
  schneider: boolean;
  schwarz: boolean;
  tout: boolean;
  gesamtWert: number;
  players: GameResultPlayer[];
}

/**
 * Player entry in a game result
 */
export interface GameResultPlayer {
  odplayerId: string; // Original player ID used in game
  oduserId?: string; // User account ID if linked
  name: string;
  isBot: boolean;
  betrag: number; // Amount won/lost in cents
}

/**
 * Leaderboard entry returned from API
 */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  guthaben: number;
  spieleGesamt: number;
  siege: number;
  winRate: number; // 0-100
}

/**
 * Leaderboard period types
 */
export type LeaderboardPeriod = 'alltime' | 'weekly' | 'monthly';
