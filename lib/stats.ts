/**
 * Stats & Leaderboard Functions
 * Statistiken und Ranglisten für Schafkopf (PostgreSQL)
 */

import { UserStats, GameResult, LeaderboardEntry, DEFAULT_USER_STATS } from './auth/types';
import { resolveUserId, getUserById, recordGameResult } from './auth/users';
import { eq, desc, sql } from 'drizzle-orm';
import { getDb, userStats as userStatsTable, gameResults as gameResultsTable, users } from './db';

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
// Public API
// ============================================

/**
 * User Stats laden
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  return getUserStatsPg(userId);
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

  // PostgreSQL: Stats sind bereits in der DB, kein separates Leaderboard-Update nötig
  // Die Leaderboard-Queries lesen direkt aus user_stats
}

/**
 * Leaderboards mit aktuellen User-Stats aktualisieren
 * (Bei PostgreSQL nicht nötig - Leaderboard liest direkt aus user_stats)
 */
export async function updateLeaderboards(userId: string): Promise<void> {
  // PostgreSQL: Stats sind bereits in der DB, kein separates Update nötig
  // Die Leaderboard-Queries lesen direkt aus user_stats
}

/**
 * Leaderboard laden
 */
export async function getLeaderboard(
  period: 'alltime' | 'weekly' | 'monthly',
  limit: number = 50,
  offset: number = 0
): Promise<LeaderboardEntry[]> {
  return getLeaderboardPg(period, limit, offset);
}

/**
 * Rang eines Users im Leaderboard
 */
export async function getUserRank(
  userId: string,
  period: 'alltime' | 'weekly' | 'monthly' = 'alltime'
): Promise<number | null> {
  return getUserRankPg(userId, period);
}

/**
 * Spiel-Ergebnis in History speichern
 */
export async function saveGameToHistory(result: GameResult): Promise<void> {
  return saveGameToHistoryPg(result);
}

/**
 * Letzte Spiele eines Users laden
 */
export async function getUserGameHistory(
  userId: string,
  limit: number = 10
): Promise<GameResult[]> {
  return getUserGameHistoryPg(userId, limit);
}

/**
 * Weekly/Monthly Stats zurücksetzen (für Cron-Job)
 */
export async function resetPeriodicStats(period: 'weekly' | 'monthly'): Promise<void> {
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
}
