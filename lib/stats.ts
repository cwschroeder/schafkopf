/**
 * Stats & Leaderboard Functions
 * Statistiken und Ranglisten für Schafkopf
 *
 * Unterstützt PostgreSQL und Redis via Feature Flags
 */

import { getRedis } from './auth/redis-adapter';
import { UserStats, GameResult, LeaderboardEntry, DEFAULT_USER_STATS } from './auth/types';
import { resolveUserId, getUserById, recordGameResult } from './auth/users';
import { FEATURE_FLAGS } from './config/feature-flags';
import { eq, desc, sql } from 'drizzle-orm';
import { getDb, userStats as userStatsTable, gameResults as gameResultsTable, users } from './db';

// Redis Keys
const STATS_PREFIX = 'stats:user:';
const LEADERBOARD_PREFIX = 'leaderboard:';
const GAME_HISTORY_PREFIX = 'history:game:';

// TTL Werte
const WEEKLY_TTL = 30 * 24 * 60 * 60; // 30 Tage
const MONTHLY_TTL = 90 * 24 * 60 * 60; // 90 Tage
const GAME_HISTORY_TTL = 90 * 24 * 60 * 60; // 90 Tage

/**
 * Aktuelles Jahr-Woche Format (z.B. "2024-W52")
 */
function getCurrentYearWeek(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 604800000;
  const week = Math.ceil(diff / oneWeek);
  return `${now.getFullYear()}-W${week.toString().padStart(2, '0')}`;
}

/**
 * Aktuelles Jahr-Monat Format (z.B. "2024-12")
 */
function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

// ============================================
// PostgreSQL Stats Functions
// ============================================

async function getUserStatsPg(userId: string): Promise<UserStats | null> {
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

async function updateUserStatsPg(
  userId: string,
  updates: Partial<Omit<UserStats, 'userId'>>
): Promise<UserStats | null> {
  const db = getDb();

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

  return getUserStatsPg(userId);
}

async function getLeaderboardPg(
  period: 'alltime' | 'weekly' | 'monthly',
  limit: number = 50,
  offset: number = 0
): Promise<LeaderboardEntry[]> {
  const db = getDb();

  // Sortierfeld basierend auf Periode
  const orderByField = period === 'weekly'
    ? userStatsTable.weeklyGuthaben
    : period === 'monthly'
    ? userStatsTable.monthlyGuthaben
    : userStatsTable.guthaben;

  // Join mit users für Name und Image
  const rows = await db
    .select({
      userId: userStatsTable.userId,
      guthaben: period === 'weekly'
        ? userStatsTable.weeklyGuthaben
        : period === 'monthly'
        ? userStatsTable.monthlyGuthaben
        : userStatsTable.guthaben,
      siege: userStatsTable.siege,
      spieleGesamt: userStatsTable.spieleGesamt,
      name: users.name,
      image: users.image,
    })
    .from(userStatsTable)
    .innerJoin(users, eq(userStatsTable.userId, users.id))
    .orderBy(desc(orderByField))
    .limit(limit)
    .offset(offset);

  return rows.map((row, index) => ({
    rank: offset + index + 1,
    userId: row.userId,
    name: row.name,
    image: row.image || undefined,
    guthaben: row.guthaben,
    siege: row.siege,
    spieleGesamt: row.spieleGesamt,
    winRate: row.spieleGesamt > 0
      ? Math.round((row.siege / row.spieleGesamt) * 100)
      : 0,
  }));
}

async function getUserRankPg(
  userId: string,
  period: 'alltime' | 'weekly' | 'monthly' = 'alltime'
): Promise<number | null> {
  const db = getDb();

  const field = period === 'weekly'
    ? 'weekly_guthaben'
    : period === 'monthly'
    ? 'monthly_guthaben'
    : 'guthaben';

  const result = await db.execute(sql`
    SELECT rank FROM (
      SELECT user_id, ROW_NUMBER() OVER (ORDER BY ${sql.raw(field)} DESC) as rank
      FROM user_stats
    ) ranked
    WHERE user_id = ${userId}
  `);

  const rows = result.rows as { rank: string }[];
  return rows[0] ? parseInt(rows[0].rank, 10) : null;
}

async function saveGameToHistoryPg(result: GameResult): Promise<void> {
  const db = getDb();

  await db.insert(gameResultsTable).values({
    gameId: result.gameId,
    roomId: result.roomId,
    playedAt: result.timestamp,
    spielart: result.spielart,
    spielmacherId: result.spielmacher,
    partnerId: result.partner || null,
    spielerPartei: result.spielerPartei,
    gegnerPartei: result.gegnerPartei,
    punkte: result.punkte,
    gewonnen: result.gewonnen,
    schneider: result.schneider,
    schwarz: result.schwarz,
    laufende: result.laufende,
    guthabenAenderung: result.guthabenAenderung,
  }).onConflictDoNothing();
}

async function getUserGameHistoryPg(
  userId: string,
  limit: number = 10
): Promise<GameResult[]> {
  const db = getDb();

  // Spiele finden, an denen der User beteiligt war
  const rows = await db
    .select()
    .from(gameResultsTable)
    .where(
      sql`${userId} = ANY(${gameResultsTable.spielerPartei}) OR ${userId} = ANY(${gameResultsTable.gegnerPartei})`
    )
    .orderBy(desc(gameResultsTable.playedAt))
    .limit(limit);

  return rows.map((row) => ({
    gameId: row.gameId,
    roomId: row.roomId,
    timestamp: row.playedAt,
    spielart: row.spielart,
    spielmacher: row.spielmacherId,
    partner: row.partnerId || undefined,
    spielerPartei: row.spielerPartei,
    gegnerPartei: row.gegnerPartei,
    punkte: row.punkte,
    gewonnen: row.gewonnen,
    schneider: row.schneider,
    schwarz: row.schwarz,
    laufende: row.laufende,
    guthabenAenderung: row.guthabenAenderung,
  }));
}

// ============================================
// Redis Stats Functions (Legacy)
// ============================================

async function getUserStatsRedis(userId: string): Promise<UserStats | null> {
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

  const stats = JSON.parse(data);
  stats.lastUpdated = new Date(stats.lastUpdated);
  return stats;
}

async function updateLeaderboardsRedis(userId: string): Promise<void> {
  const r = await getRedis();
  const stats = await getUserStats(userId);

  if (!stats) return;

  const yearWeek = getCurrentYearWeek();
  const yearMonth = getCurrentYearMonth();

  // All-Time Leaderboard (nach Guthaben)
  await r.zAdd(`${LEADERBOARD_PREFIX}alltime`, {
    score: stats.guthaben,
    value: userId,
  });

  // Weekly Leaderboard
  const weeklyKey = `${LEADERBOARD_PREFIX}weekly:${yearWeek}`;
  await r.zAdd(weeklyKey, {
    score: stats.weeklyGuthaben,
    value: userId,
  });
  await r.expire(weeklyKey, WEEKLY_TTL);

  // Monthly Leaderboard
  const monthlyKey = `${LEADERBOARD_PREFIX}monthly:${yearMonth}`;
  await r.zAdd(monthlyKey, {
    score: stats.monthlyGuthaben,
    value: userId,
  });
  await r.expire(monthlyKey, MONTHLY_TTL);
}

async function getLeaderboardRedis(
  period: 'alltime' | 'weekly' | 'monthly',
  limit: number = 50,
  offset: number = 0
): Promise<LeaderboardEntry[]> {
  const r = await getRedis();

  let key: string;
  switch (period) {
    case 'weekly':
      key = `${LEADERBOARD_PREFIX}weekly:${getCurrentYearWeek()}`;
      break;
    case 'monthly':
      key = `${LEADERBOARD_PREFIX}monthly:${getCurrentYearMonth()}`;
      break;
    default:
      key = `${LEADERBOARD_PREFIX}alltime`;
  }

  // Top Scores laden (absteigend sortiert)
  const results = await r.zRangeWithScores(key, offset, offset + limit - 1, {
    REV: true,
  });

  // User-Daten enrichen
  const entries: LeaderboardEntry[] = [];

  for (let i = 0; i < results.length; i++) {
    const { value: userId, score: guthaben } = results[i];

    const [user, stats] = await Promise.all([
      getUserById(userId),
      getUserStats(userId),
    ]);

    if (user && stats) {
      entries.push({
        rank: offset + i + 1,
        userId,
        name: user.name,
        image: user.image,
        guthaben,
        siege: stats.siege,
        spieleGesamt: stats.spieleGesamt,
        winRate: stats.spieleGesamt > 0
          ? Math.round((stats.siege / stats.spieleGesamt) * 100)
          : 0,
      });
    }
  }

  return entries;
}

async function getUserRankRedis(
  userId: string,
  period: 'alltime' | 'weekly' | 'monthly' = 'alltime'
): Promise<number | null> {
  const r = await getRedis();

  let key: string;
  switch (period) {
    case 'weekly':
      key = `${LEADERBOARD_PREFIX}weekly:${getCurrentYearWeek()}`;
      break;
    case 'monthly':
      key = `${LEADERBOARD_PREFIX}monthly:${getCurrentYearMonth()}`;
      break;
    default:
      key = `${LEADERBOARD_PREFIX}alltime`;
  }

  const rank = await r.zRevRank(key, userId);
  return rank !== null ? rank + 1 : null;
}

async function saveGameToHistoryRedis(result: GameResult): Promise<void> {
  const r = await getRedis();
  const key = `${GAME_HISTORY_PREFIX}${result.gameId}`;

  await r.set(key, JSON.stringify(result));
  await r.expire(key, GAME_HISTORY_TTL);
}

// ============================================
// Public API (mit Feature Flag Switching)
// ============================================

/**
 * User Stats laden
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  if (FEATURE_FLAGS.USE_POSTGRES_STATS) {
    return getUserStatsPg(userId);
  }
  return getUserStatsRedis(userId);
}

/**
 * Spielergebnis aufzeichnen und Leaderboards aktualisieren
 */
export async function recordPlayerGameResult(
  playerId: string,
  spielart: string,
  gewonnen: boolean,
  guthabenAenderung: number
): Promise<void> {
  // Player ID zu User ID auflösen
  const userId = await resolveUserId(playerId);

  if (!userId) {
    // Kein verknüpfter Account - nur für Legacy-Stats (zukünftige Verknüpfung)
    console.log(`[Stats] Kein User für Player ${playerId} - überspringe Stats`);
    return;
  }

  // Stats aktualisieren
  await recordGameResult(userId, spielart, gewonnen, guthabenAenderung);

  // Leaderboards aktualisieren
  await updateLeaderboards(userId);
}

/**
 * Leaderboards mit aktuellen User-Stats aktualisieren
 */
export async function updateLeaderboards(userId: string): Promise<void> {
  if (FEATURE_FLAGS.USE_POSTGRES_LEADERBOARD) {
    // PostgreSQL: Stats sind bereits in der DB, kein separates Update nötig
    // Die Leaderboard-Queries lesen direkt aus user_stats
    return;
  }
  return updateLeaderboardsRedis(userId);
}

/**
 * Leaderboard laden
 */
export async function getLeaderboard(
  period: 'alltime' | 'weekly' | 'monthly',
  limit: number = 50,
  offset: number = 0
): Promise<LeaderboardEntry[]> {
  if (FEATURE_FLAGS.USE_POSTGRES_LEADERBOARD) {
    return getLeaderboardPg(period, limit, offset);
  }
  return getLeaderboardRedis(period, limit, offset);
}

/**
 * Rang eines Users im Leaderboard
 */
export async function getUserRank(
  userId: string,
  period: 'alltime' | 'weekly' | 'monthly' = 'alltime'
): Promise<number | null> {
  if (FEATURE_FLAGS.USE_POSTGRES_LEADERBOARD) {
    return getUserRankPg(userId, period);
  }
  return getUserRankRedis(userId, period);
}

/**
 * Spiel-Ergebnis in History speichern
 */
export async function saveGameToHistory(result: GameResult): Promise<void> {
  if (FEATURE_FLAGS.USE_POSTGRES_HISTORY) {
    return saveGameToHistoryPg(result);
  }

  // Dual-Write: Immer auch zu PostgreSQL schreiben
  if (FEATURE_FLAGS.DUAL_WRITE_ENABLED) {
    try {
      await saveGameToHistoryPg(result);
    } catch (err) {
      console.warn('[Stats] Dual-write to PostgreSQL failed:', err);
    }
  }

  return saveGameToHistoryRedis(result);
}

/**
 * Letzte Spiele eines Users laden
 */
export async function getUserGameHistory(
  userId: string,
  limit: number = 10
): Promise<GameResult[]> {
  if (FEATURE_FLAGS.USE_POSTGRES_HISTORY) {
    return getUserGameHistoryPg(userId, limit);
  }
  // Redis version not implemented (needs index)
  return [];
}

/**
 * Weekly/Monthly Stats zurücksetzen (für Cron-Job)
 */
export async function resetPeriodicStats(period: 'weekly' | 'monthly'): Promise<void> {
  if (FEATURE_FLAGS.USE_POSTGRES_STATS) {
    const db = getDb();

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    if (period === 'weekly') {
      await db.update(userStatsTable).set({
        weeklyGuthaben: 0,
        weeklyResetAt: today,
      });
    } else {
      await db.update(userStatsTable).set({
        monthlyGuthaben: 0,
        monthlyResetAt: today,
      });
    }

    console.log(`[Stats] Reset ${period} stats in PostgreSQL`);
    return;
  }

  // Redis version not implemented
  console.log(`[Stats] Reset ${period} stats - not yet implemented for Redis`);
}
