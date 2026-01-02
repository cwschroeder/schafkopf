/**
 * Auth Types für Schafkopf
 * Definiert alle User-, Session- und Stats-bezogenen Interfaces
 */

// OAuth Provider Info
export interface OAuthProvider {
  id: string; // Provider-spezifische User-ID
  email?: string;
  connectedAt: Date;
}

// User Account (gespeichert in Redis)
export interface UserAccount {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: Date;
  lastLoginAt: Date;
  providers: {
    google?: OAuthProvider;
    github?: OAuthProvider;
  };
  legacyPlayerIds: string[]; // Alte p_xxx IDs die verknüpft wurden
  settings: UserSettings;
}

// User Einstellungen
export interface UserSettings {
  voicePreference: 'male' | 'female';
  darkMode: boolean;
  cardDesign: 'bavarian' | 'french'; // Für zukünftige Erweiterung
  audioVolume: number; // 0-100
  soundEffectsEnabled: boolean;
  speechEnabled: boolean;
}

// Default Settings für neue User
export const DEFAULT_USER_SETTINGS: UserSettings = {
  voicePreference: 'male',
  darkMode: false,
  cardDesign: 'bavarian',
  audioVolume: 80,
  soundEffectsEnabled: true,
  speechEnabled: true,
};

// User Statistiken
export interface UserStats {
  userId: string;
  guthaben: number; // Aktuelles Guthaben
  spieleGesamt: number;
  siege: number;
  niederlagen: number;
  ansagenCount: Record<string, number>; // z.B. { sauspiel: 10, wenz: 5 }
  ansagenWins: Record<string, number>; // z.B. { sauspiel: 8, wenz: 3 }
  // Für Leaderboard-Zeiträume
  weeklyGuthaben: number;
  monthlyGuthaben: number;
  lastUpdated: Date;
}

// Default Stats für neue User
export const DEFAULT_USER_STATS: Omit<UserStats, 'userId'> = {
  guthaben: 0,
  spieleGesamt: 0,
  siege: 0,
  niederlagen: 0,
  ansagenCount: {},
  ansagenWins: {},
  weeklyGuthaben: 0,
  monthlyGuthaben: 0,
  lastUpdated: new Date(),
};

// Session (Auth.js Session Token)
export interface Session {
  sessionToken: string;
  userId: string;
  expires: Date;
}

// Leaderboard Entry
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  image?: string;
  guthaben: number;
  siege: number;
  spieleGesamt: number;
  winRate: number; // Berechnet: siege / spieleGesamt * 100
}

// Game Result für History
export interface GameResult {
  gameId: string;
  roomId: string;
  timestamp: Date;
  spielart: string;
  spielmacher: string; // User ID oder Player ID
  partner?: string; // Bei Sauspiel
  spielerPartei: string[]; // User/Player IDs
  gegnerPartei: string[]; // User/Player IDs
  punkte: number; // Punkte der Spielerpartei
  gewonnen: boolean; // Spielerpartei gewonnen?
  schneider: boolean;
  schwarz: boolean;
  laufende: number;
  guthabenAenderung: number; // +/- Guthaben pro Spieler
}

// Öffentliches Profil (ohne Email)
export interface PublicProfile {
  id: string;
  name: string;
  image?: string;
  stats: {
    guthaben: number;
    spieleGesamt: number;
    siege: number;
    winRate: number;
    lieblingsAnsage?: string;
  };
  memberSince: Date;
}

// Auth.js Account Type (für OAuth linking)
export interface AuthAccount {
  userId: string;
  type: 'oauth';
  provider: 'google' | 'github';
  providerAccountId: string;
  access_token?: string;
  token_type?: string;
  scope?: string;
  expires_at?: number;
  id_token?: string;
}
