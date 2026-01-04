/**
 * User Management Functions
 * High-level CRUD Operationen für UserAccounts
 */

import {
  getFullUserAccount,
  updateUserSettings as updateSettings,
  linkLegacyPlayerId as linkLegacy,
  getUserIdFromLegacyId,
} from './hybrid-adapter';
import { getRedis } from './redis-adapter';
import { FEATURE_FLAGS } from '../config/feature-flags';
import { eq } from 'drizzle-orm';
import { getDb, userStats as userStatsTable } from '../db';
import {
  UserAccount,
  UserSettings,
  UserStats,
  PublicProfile,
  DEFAULT_USER_STATS,
} from './types';

const USER_PREFIX = 'user:';
const STATS_PREFIX = 'stats:user:';

/**
 * User anhand ID laden
 */
export async function getUserById(userId: string): Promise<UserAccount | null> {
  return getFullUserAccount(userId);
}

/**
 * User anhand Legacy Player ID laden
 */
export async function getUserByLegacyId(legacyPlayerId: string): Promise<UserAccount | null> {
  const userId = await getUserIdFromLegacyId(legacyPlayerId);
  if (!userId) return null;
  return getFullUserAccount(userId);
}

/**
 * User Settings aktualisieren
 */
export async function updateUserSettings(
  userId: string, 
  settings: Partial<UserSettings>
): Promise<UserAccount | null> {
  return updateSettings(userId, settings);
}

/**
 * Legacy Player ID mit Account verknüpfen
 */
export async function linkLegacyPlayerId(
  userId: string, 
  legacyPlayerId: string
): Promise<boolean> {
  return linkLegacy(userId, legacyPlayerId);
}

/**
 * User Stats laden
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  if (FEATURE_FLAGS.USE_POSTGRES_STATS) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(userStatsTable)
      .where(eq(userStatsTable.userId, userId));

    if (!row) {
      // Neue Stats erstellen
      const stats: UserStats = {
        ...DEFAULT_USER_STATS,
        userId,
        lastUpdated: new Date(),
      };

      await db.insert(userStatsTable).values({
        userId,
        guthaben: 0,
        spieleGesamt: 0,
        siege: 0,
        niederlagen: 0,
        ansagenCount: {},
        ansagenWins: {},
        weeklyGuthaben: 0,
        monthlyGuthaben: 0,
        lastUpdated: new Date(),
      });

      return stats;
    }

    return {
      userId: row.userId,
      guthaben: row.guthaben,
      spieleGesamt: row.spieleGesamt,
      siege: row.siege,
      niederlagen: row.niederlagen,
      ansagenCount: row.ansagenCount as Record<string, number>,
      ansagenWins: row.ansagenWins as Record<string, number>,
      weeklyGuthaben: row.weeklyGuthaben,
      monthlyGuthaben: row.monthlyGuthaben,
      lastUpdated: row.lastUpdated,
    };
  }

  // Redis fallback
  const r = await getRedis();
  const data = await r.get(`${STATS_PREFIX}${userId}`);
  if (!data) {
    // Neue Stats erstellen
    const stats: UserStats = {
      ...DEFAULT_USER_STATS,
      userId,
      lastUpdated: new Date(),
    };
    await r.set(`${STATS_PREFIX}${userId}`, JSON.stringify(stats));
    return stats;
  }
  return JSON.parse(data);
}

/**
 * User Stats aktualisieren
 */
export async function updateUserStats(
  userId: string,
  updates: Partial<Omit<UserStats, 'userId'>>
): Promise<UserStats | null> {
  if (FEATURE_FLAGS.USE_POSTGRES_STATS) {
    const db = getDb();

    // Sicherstellen dass Stats existieren
    const existing = await getUserStats(userId);
    if (!existing) return null;

    const dbUpdates: Record<string, unknown> = {
      lastUpdated: new Date(),
    };

    if (updates.guthaben !== undefined) dbUpdates.guthaben = updates.guthaben;
    if (updates.spieleGesamt !== undefined) dbUpdates.spieleGesamt = updates.spieleGesamt;
    if (updates.siege !== undefined) dbUpdates.siege = updates.siege;
    if (updates.niederlagen !== undefined) dbUpdates.niederlagen = updates.niederlagen;
    if (updates.ansagenCount !== undefined) dbUpdates.ansagenCount = updates.ansagenCount;
    if (updates.ansagenWins !== undefined) dbUpdates.ansagenWins = updates.ansagenWins;
    if (updates.weeklyGuthaben !== undefined) dbUpdates.weeklyGuthaben = updates.weeklyGuthaben;
    if (updates.monthlyGuthaben !== undefined) dbUpdates.monthlyGuthaben = updates.monthlyGuthaben;

    await db
      .update(userStatsTable)
      .set(dbUpdates)
      .where(eq(userStatsTable.userId, userId));

    return getUserStats(userId);
  }

  // Redis fallback
  const r = await getRedis();
  const data = await r.get(`${STATS_PREFIX}${userId}`);

  let stats: UserStats;
  if (!data) {
    stats = {
      ...DEFAULT_USER_STATS,
      userId,
      lastUpdated: new Date(),
    };
  } else {
    stats = JSON.parse(data);
  }

  // Updates anwenden
  const updated: UserStats = {
    ...stats,
    ...updates,
    lastUpdated: new Date(),
  };

  await r.set(`${STATS_PREFIX}${userId}`, JSON.stringify(updated));
  return updated;
}

/**
 * Öffentliches Profil laden (ohne sensible Daten)
 */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const [user, stats] = await Promise.all([
    getUserById(userId),
    getUserStats(userId),
  ]);

  if (!user) return null;

  // Lieblingsansage berechnen
  let lieblingsAnsage: string | undefined;
  if (stats && Object.keys(stats.ansagenCount).length > 0) {
    lieblingsAnsage = Object.entries(stats.ansagenCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
  }

  const winRate = stats && stats.spieleGesamt > 0
    ? Math.round((stats.siege / stats.spieleGesamt) * 100)
    : 0;

  return {
    id: user.id,
    name: user.name,
    image: user.image,
    stats: {
      guthaben: stats?.guthaben || 0,
      spieleGesamt: stats?.spieleGesamt || 0,
      siege: stats?.siege || 0,
      winRate,
      lieblingsAnsage,
    },
    memberSince: user.createdAt,
  };
}

/**
 * User ID auflösen (User ID oder Legacy Player ID -> User ID)
 */
export async function resolveUserId(playerId: string): Promise<string | null> {
  // Wenn es bereits eine User ID ist (u_xxx)
  if (playerId.startsWith('u_')) {
    return playerId;
  }

  // Legacy Player ID prüfen (p_xxx)
  if (playerId.startsWith('p_')) {
    return getUserIdFromLegacyId(playerId);
  }

  // Bot IDs ignorieren
  if (playerId.startsWith('bot_')) {
    return null;
  }

  return null;
}

/**
 * Prüfen ob User existiert
 */
export async function userExists(userId: string): Promise<boolean> {
  const r = await getRedis();
  const exists = await r.exists(`${USER_PREFIX}${userId}`);
  return exists === 1;
}

/**
 * Guthaben eines Users ändern
 */
export async function adjustUserGuthaben(
  userId: string, 
  amount: number,
  includeWeekly: boolean = true,
  includeMonthly: boolean = true
): Promise<UserStats | null> {
  const stats = await getUserStats(userId);
  if (!stats) return null;

  const updates: Partial<UserStats> = {
    guthaben: stats.guthaben + amount,
  };

  if (includeWeekly) {
    updates.weeklyGuthaben = stats.weeklyGuthaben + amount;
  }
  if (includeMonthly) {
    updates.monthlyGuthaben = stats.monthlyGuthaben + amount;
  }

  return updateUserStats(userId, updates);
}

/**
 * Spiel-Ergebnis für User aufzeichnen
 */
export async function recordGameResult(
  userId: string,
  spielart: string,
  gewonnen: boolean,
  guthabenAenderung: number
): Promise<UserStats | null> {
  const stats = await getUserStats(userId);
  if (!stats) return null;

  // Ansage-Counter updaten
  const ansagenCount = { ...stats.ansagenCount };
  ansagenCount[spielart] = (ansagenCount[spielart] || 0) + 1;

  const ansagenWins = { ...stats.ansagenWins };
  if (gewonnen) {
    ansagenWins[spielart] = (ansagenWins[spielart] || 0) + 1;
  }

  return updateUserStats(userId, {
    guthaben: stats.guthaben + guthabenAenderung,
    weeklyGuthaben: stats.weeklyGuthaben + guthabenAenderung,
    monthlyGuthaben: stats.monthlyGuthaben + guthabenAenderung,
    spieleGesamt: stats.spieleGesamt + 1,
    siege: gewonnen ? stats.siege + 1 : stats.siege,
    niederlagen: gewonnen ? stats.niederlagen : stats.niederlagen + 1,
    ansagenCount,
    ansagenWins,
  });
}
