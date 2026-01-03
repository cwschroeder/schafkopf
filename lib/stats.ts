/**
 * Stats & Leaderboard Functions
 * Statistiken und Ranglisten für Schafkopf
 */

import { getRedis } from './auth/redis-adapter';
import { UserStats, GameResult, LeaderboardEntry, DEFAULT_USER_STATS } from './auth/types';
import { resolveUserId, getUserById, recordGameResult } from './auth/users';

// Redis Keys
const STATS_PREFIX = 'stats:user:';
const LEADERBOARD_PREFIX = 'leaderboard:';
const GAME_HISTORY_PREFIX = 'history:game:';
const LEGACY_USER_PREFIX = 'user:legacy:';

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

/**
 * User Stats laden
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
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

/**
 * Leaderboard laden
 */
export async function getLeaderboard(
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

/**
 * Rang eines Users im Leaderboard
 */
export async function getUserRank(
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

/**
 * Spiel-Ergebnis in History speichern
 */
export async function saveGameToHistory(result: GameResult): Promise<void> {
  const r = await getRedis();
  const key = `${GAME_HISTORY_PREFIX}${result.gameId}`;

  await r.set(key, JSON.stringify(result));
  await r.expire(key, GAME_HISTORY_TTL);
}

/**
 * Letzte Spiele eines Users laden
 */
export async function getUserGameHistory(
  userId: string,
  limit: number = 10
): Promise<GameResult[]> {
  // TODO: Implementiere User-Game-Index für effizientes Laden
  // Momentan nicht implementiert - braucht zusätzlichen Index
  return [];
}

/**
 * Weekly/Monthly Stats zurücksetzen (für Cron-Job)
 */
export async function resetPeriodicStats(period: 'weekly' | 'monthly'): Promise<void> {
  const r = await getRedis();

  // Alle User-Stats durchgehen und zurücksetzen
  // TODO: Effizientere Implementierung mit Redis SCAN
  console.log(`[Stats] Reset ${period} stats - not yet implemented`);
}
