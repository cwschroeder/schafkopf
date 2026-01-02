// User CRUD operations for Schafkopf accounts

import { createClient, RedisClientType } from 'redis';
import {
  UserAccount,
  UserSettings,
  UserStats,
  DEFAULT_USER_SETTINGS,
  DEFAULT_USER_STATS,
} from './types';
import {
  getUser,
  getUserByEmail,
  getUserByAccount,
  updateUser,
  updateUserSettings as updateSettings,
} from './redis-adapter';

// Redis key prefixes
const USER_PREFIX = 'user:';
const USER_LEGACY_PREFIX = 'user:legacy:';
const STATS_PREFIX = 'stats:user:';

// Fallback for local development without Redis
const localLegacyIndex = new Map<string, string>(); // legacyId -> userId
const localStats = new Map<string, UserStats>();
const isLocal = !process.env.REDIS_URL;

// Redis client (reuse from rooms if possible, or create new)
let redis: RedisClientType | null = null;
let redisConnecting: Promise<RedisClientType> | null = null;

async function getRedis(): Promise<RedisClientType> {
  if (redis?.isOpen) return redis;

  if (redisConnecting) return redisConnecting;

  redisConnecting = (async () => {
    redis = createClient({ url: process.env.REDIS_URL });
    redis.on('error', (err) => console.error('Redis Users Error:', err));
    await redis.connect();
    return redis;
  })();

  return redisConnecting;
}

// ============================================
// User retrieval functions
// ============================================

/**
 * Get a user by their ID
 */
export async function getUserById(id: string): Promise<UserAccount | null> {
  return getUser(id);
}

/**
 * Get a user by their email
 */
export { getUserByEmail };

/**
 * Get a user by their OAuth provider account
 */
export { getUserByAccount };

/**
 * Get a user by a legacy player ID (p_xxx format)
 */
export async function getUserByLegacyId(legacyId: string): Promise<UserAccount | null> {
  if (isLocal) {
    const userId = localLegacyIndex.get(legacyId);
    return userId ? getUser(userId) : null;
  }

  const r = await getRedis();
  const userId = await r.get(`${USER_LEGACY_PREFIX}${legacyId}`);
  if (!userId) return null;

  return getUser(userId);
}

/**
 * Resolve a player ID to a user ID
 * Handles both direct user IDs (u_xxx) and legacy player IDs (p_xxx)
 */
export async function resolveUserId(playerId: string): Promise<string | null> {
  // If it's already a user ID format
  if (playerId.startsWith('u_')) {
    const user = await getUser(playerId);
    return user ? playerId : null;
  }

  // Check if it's a linked legacy ID
  const user = await getUserByLegacyId(playerId);
  return user ? user.id : null;
}

// ============================================
// User update functions
// ============================================

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<UserAccount | null> {
  return updateSettings(userId, settings);
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<UserAccount | null> {
  return updateUser(userId, { lastLoginAt: Date.now() });
}

/**
 * Update user profile (name, image)
 */
export async function updateUserProfile(
  userId: string,
  data: { name?: string; image?: string }
): Promise<UserAccount | null> {
  return updateUser(userId, data);
}

// ============================================
// Legacy player ID linking
// ============================================

/**
 * Link a legacy player ID (p_xxx) to a user account
 * This allows migrating game history from anonymous play to a registered account
 */
export async function linkLegacyPlayerId(
  userId: string,
  legacyId: string
): Promise<{ success: boolean; error?: string }> {
  // Validate legacy ID format
  if (!legacyId.startsWith('p_')) {
    return { success: false, error: 'Invalid legacy player ID format' };
  }

  // Check if already linked to another account
  const existingUser = await getUserByLegacyId(legacyId);
  if (existingUser) {
    if (existingUser.id === userId) {
      return { success: true }; // Already linked to this user
    }
    return { success: false, error: 'Legacy ID already linked to another account' };
  }

  // Get the user
  const user = await getUser(userId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Add legacy ID to user's list
  if (!user.legacyPlayerIds.includes(legacyId)) {
    user.legacyPlayerIds.push(legacyId);
  }

  if (isLocal) {
    localLegacyIndex.set(legacyId, userId);
    // Update user in local storage (handled by redis-adapter)
  } else {
    const r = await getRedis();
    // Create the legacy ID -> userId mapping
    await r.set(`${USER_LEGACY_PREFIX}${legacyId}`, userId);
  }

  // Update user with new legacy ID list
  await updateUser(userId, { legacyPlayerIds: user.legacyPlayerIds });

  return { success: true };
}

/**
 * Get all legacy player IDs linked to a user
 */
export async function getUserLegacyIds(userId: string): Promise<string[]> {
  const user = await getUser(userId);
  return user?.legacyPlayerIds ?? [];
}

// ============================================
// User stats functions
// ============================================

/**
 * Get user statistics
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  if (isLocal) {
    return localStats.get(userId) ?? null;
  }

  const r = await getRedis();
  const data = await r.get(`${STATS_PREFIX}${userId}`);
  return data ? JSON.parse(data) : null;
}

/**
 * Get or create user statistics
 */
export async function getOrCreateUserStats(userId: string): Promise<UserStats> {
  const existing = await getUserStats(userId);
  if (existing) return existing;

  const stats: UserStats = {
    ...DEFAULT_USER_STATS,
    userId,
    lastUpdated: Date.now(),
  };

  if (isLocal) {
    localStats.set(userId, stats);
  } else {
    const r = await getRedis();
    await r.set(`${STATS_PREFIX}${userId}`, JSON.stringify(stats));
  }

  return stats;
}

/**
 * Save user statistics
 */
export async function saveUserStats(stats: UserStats): Promise<void> {
  stats.lastUpdated = Date.now();

  if (isLocal) {
    localStats.set(stats.userId, stats);
  } else {
    const r = await getRedis();
    await r.set(`${STATS_PREFIX}${stats.userId}`, JSON.stringify(stats));
  }
}

/**
 * Reset weekly stats (called by cron or on first access of new week)
 */
export async function resetWeeklyStats(userId: string): Promise<void> {
  const stats = await getUserStats(userId);
  if (!stats) return;

  stats.weeklyGuthaben = 0;
  await saveUserStats(stats);
}

/**
 * Reset monthly stats (called by cron or on first access of new month)
 */
export async function resetMonthlyStats(userId: string): Promise<void> {
  const stats = await getUserStats(userId);
  if (!stats) return;

  stats.monthlyGuthaben = 0;
  await saveUserStats(stats);
}

// ============================================
// Utility functions
// ============================================

/**
 * Check if a user exists
 */
export async function userExists(userId: string): Promise<boolean> {
  const user = await getUser(userId);
  return user !== null;
}

/**
 * Get user's display name (for use in games)
 */
export async function getUserDisplayName(userId: string): Promise<string> {
  const user = await getUser(userId);
  return user?.name ?? 'Unbekannt';
}

/**
 * Get multiple users by ID (for leaderboard display)
 */
export async function getUsersByIds(userIds: string[]): Promise<Map<string, UserAccount>> {
  const users = new Map<string, UserAccount>();

  for (const id of userIds) {
    const user = await getUser(id);
    if (user) {
      users.set(id, user);
    }
  }

  return users;
}
