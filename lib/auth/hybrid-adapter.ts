/**
 * Hybrid Auth.js Adapter
 *
 * Kombiniert PostgreSQL und Redis:
 * - PostgreSQL: User-Daten (wenn USE_POSTGRES_USERS=true)
 * - Redis: Sessions (immer, 24h TTL)
 *
 * Unterstützt:
 * - Feature Flags für schrittweise Migration
 * - Dual-Write für Zero-Downtime
 * - Fallback zu Redis bei PostgreSQL-Fehlern
 */

import type { Adapter, AdapterUser, AdapterAccount, AdapterSession } from 'next-auth/adapters';
import { FEATURE_FLAGS } from '../config/feature-flags';
import { DEFAULT_USER_SETTINGS } from './types';

// Redis-Funktionen (immer verfügbar für Sessions)
import {
  getRedis,
  generateUserId as generateUserIdRedis,
  getFullUserAccount as getFullUserAccountRedis,
  updateUserSettings as updateUserSettingsRedis,
  linkLegacyPlayerId as linkLegacyPlayerIdRedis,
  getUserIdFromLegacyId as getUserIdFromLegacyIdRedis,
} from './redis-adapter';

// PostgreSQL-Funktionen (nur wenn aktiviert)
import * as pgAdapter from './postgres-adapter';

// Session-Konstanten (immer Redis)
const SESSION_PREFIX = 'session:';
const SESSION_TTL = 60 * 60 * 24; // 24 Stunden

/**
 * Hybrid Auth.js Adapter
 */
export function HybridAdapter(): Adapter {
  return {
    async createUser(user): Promise<AdapterUser> {
      const usePostgres = FEATURE_FLAGS.USE_POSTGRES_USERS;
      const dualWrite = FEATURE_FLAGS.DUAL_WRITE_ENABLED;

      if (usePostgres) {
        try {
          // PostgreSQL primary
          const pgUser = await pgAdapter.createUserPg({
            email: user.email!,
            name: user.name || undefined,
            image: user.image || undefined,
          });

          // Dual-Write zu Redis
          if (dualWrite) {
            try {
              await createUserInRedis(pgUser.id, user);
            } catch (err) {
              console.warn('[HybridAdapter] Dual-write to Redis failed:', err);
            }
          }

          return toAdapterUser(pgUser);
        } catch (err) {
          console.error('[HybridAdapter] PostgreSQL createUser failed:', err);
          // Fallback zu Redis
          return createUserInRedis(generateUserIdRedis(), user);
        }
      }

      // Redis only
      return createUserInRedis(generateUserIdRedis(), user);
    },

    async getUser(id): Promise<AdapterUser | null> {
      const usePostgres = FEATURE_FLAGS.USE_POSTGRES_USERS;

      if (usePostgres) {
        try {
          const user = await pgAdapter.getUserByIdPg(id);
          if (user) return toAdapterUser(user);

          // On-the-fly Migration: Redis → PostgreSQL
          const redisUser = await getFullUserAccountRedis(id);
          if (redisUser) {
            console.log(`[HybridAdapter] Migrating user ${id} from Redis to PostgreSQL`);
            await migrateUserToPostgres(redisUser);
            return toAdapterUser(redisUser);
          }

          return null;
        } catch (err) {
          console.error('[HybridAdapter] PostgreSQL getUser failed:', err);
          // Fallback zu Redis
        }
      }

      // Redis fallback
      const redisUser = await getFullUserAccountRedis(id);
      return redisUser ? toAdapterUser(redisUser) : null;
    },

    async getUserByEmail(email): Promise<AdapterUser | null> {
      const usePostgres = FEATURE_FLAGS.USE_POSTGRES_USERS;

      if (usePostgres) {
        try {
          const user = await pgAdapter.getUserByEmailPg(email);
          if (user) return toAdapterUser(user);
        } catch (err) {
          console.error('[HybridAdapter] PostgreSQL getUserByEmail failed:', err);
        }
      }

      // Redis fallback
      const r = await getRedis();
      const userId = await r.get(`user:email:${email}`);
      if (!userId) return null;

      const redisUser = await getFullUserAccountRedis(userId);
      return redisUser ? toAdapterUser(redisUser) : null;
    },

    async getUserByAccount({ providerAccountId, provider }): Promise<AdapterUser | null> {
      const usePostgres = FEATURE_FLAGS.USE_POSTGRES_USERS;

      if (usePostgres) {
        try {
          const user = await pgAdapter.getUserByOAuthPg(provider, providerAccountId);
          if (user) return toAdapterUser(user);
        } catch (err) {
          console.error('[HybridAdapter] PostgreSQL getUserByAccount failed:', err);
        }
      }

      // Redis fallback
      const r = await getRedis();
      const userId = await r.get(`user:oauth:${provider}:${providerAccountId}`);
      if (!userId) return null;

      const redisUser = await getFullUserAccountRedis(userId);
      return redisUser ? toAdapterUser(redisUser) : null;
    },

    async updateUser(user): Promise<AdapterUser> {
      const usePostgres = FEATURE_FLAGS.USE_POSTGRES_USERS;
      const dualWrite = FEATURE_FLAGS.DUAL_WRITE_ENABLED;

      if (usePostgres) {
        try {
          const updated = await pgAdapter.updateUserPg(user.id!, {
            name: user.name || undefined,
            email: user.email || undefined,
            image: user.image || undefined,
          });

          if (updated) {
            // Dual-Write zu Redis
            if (dualWrite) {
              try {
                await updateUserInRedis(user.id!, user);
              } catch (err) {
                console.warn('[HybridAdapter] Dual-write updateUser to Redis failed:', err);
              }
            }
            return toAdapterUser(updated);
          }
        } catch (err) {
          console.error('[HybridAdapter] PostgreSQL updateUser failed:', err);
        }
      }

      // Redis fallback
      return updateUserInRedis(user.id!, user);
    },

    async deleteUser(userId): Promise<void> {
      const usePostgres = FEATURE_FLAGS.USE_POSTGRES_USERS;
      const dualWrite = FEATURE_FLAGS.DUAL_WRITE_ENABLED;

      if (usePostgres) {
        try {
          await pgAdapter.deleteUserPg(userId);
        } catch (err) {
          console.error('[HybridAdapter] PostgreSQL deleteUser failed:', err);
        }
      }

      // Immer auch in Redis löschen (Cleanup)
      if (!usePostgres || dualWrite) {
        await deleteUserInRedis(userId);
      }
    },

    async linkAccount(account): Promise<AdapterAccount | undefined> {
      const usePostgres = FEATURE_FLAGS.USE_POSTGRES_USERS;
      const dualWrite = FEATURE_FLAGS.DUAL_WRITE_ENABLED;

      if (usePostgres) {
        try {
          await pgAdapter.linkOAuthAccountPg(
            account.userId,
            account.provider,
            account.providerAccountId
          );

          // Dual-Write zu Redis
          if (dualWrite) {
            await linkAccountInRedis(account);
          }

          return toAdapterAccount(account);
        } catch (err) {
          console.error('[HybridAdapter] PostgreSQL linkAccount failed:', err);
        }
      }

      // Redis fallback
      return linkAccountInRedis(account);
    },

    async unlinkAccount({ providerAccountId, provider }): Promise<void> {
      const usePostgres = FEATURE_FLAGS.USE_POSTGRES_USERS;
      const dualWrite = FEATURE_FLAGS.DUAL_WRITE_ENABLED;

      if (usePostgres) {
        try {
          await pgAdapter.unlinkOAuthAccountPg(provider, providerAccountId);
        } catch (err) {
          console.error('[HybridAdapter] PostgreSQL unlinkAccount failed:', err);
        }
      }

      // Immer auch in Redis (Cleanup)
      if (!usePostgres || dualWrite) {
        await unlinkAccountInRedis(provider, providerAccountId);
      }
    },

    // Sessions bleiben IMMER in Redis (flüchtig, 24h TTL)
    async createSession(session): Promise<AdapterSession> {
      const r = await getRedis();

      const sessionData = {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      };

      await r.set(
        `${SESSION_PREFIX}${session.sessionToken}`,
        JSON.stringify(sessionData),
        { EX: SESSION_TTL }
      );

      return sessionData;
    },

    async getSessionAndUser(
      sessionToken
    ): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      const r = await getRedis();
      const sessionData = await r.get(`${SESSION_PREFIX}${sessionToken}`);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);

      // Session abgelaufen?
      if (new Date(session.expires) < new Date()) {
        await r.del(`${SESSION_PREFIX}${sessionToken}`);
        return null;
      }

      // User laden (über getUser mit Fallback-Logik)
      const user = await this.getUser!(session.userId);
      if (!user) return null;

      return {
        session: {
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: new Date(session.expires),
        },
        user,
      };
    },

    async updateSession(session): Promise<AdapterSession | null | undefined> {
      const r = await getRedis();
      const existing = await r.get(`${SESSION_PREFIX}${session.sessionToken}`);
      if (!existing) return null;

      const updated = {
        ...JSON.parse(existing),
        ...session,
        expires: session.expires,
      };

      await r.set(`${SESSION_PREFIX}${session.sessionToken}`, JSON.stringify(updated), {
        EX: SESSION_TTL,
      });

      return {
        sessionToken: updated.sessionToken,
        userId: updated.userId,
        expires: new Date(updated.expires),
      };
    },

    async deleteSession(sessionToken): Promise<void> {
      const r = await getRedis();
      await r.del(`${SESSION_PREFIX}${sessionToken}`);
    },
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function toAdapterUser(user: {
  id: string;
  email: string;
  name: string;
  image?: string;
}): AdapterUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: null,
    name: user.name,
    image: user.image || null,
  };
}

function toAdapterAccount(account: {
  userId: string;
  provider: string;
  providerAccountId: string;
  type?: string;
  access_token?: string;
  token_type?: string;
  scope?: string;
  expires_at?: number;
  id_token?: string;
}): AdapterAccount {
  return {
    userId: account.userId,
    type: (account.type as 'oauth' | 'oidc' | 'email' | 'webauthn') || 'oauth',
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    access_token: account.access_token,
    token_type: account.token_type as Lowercase<string> | undefined,
    scope: account.scope,
    expires_at: account.expires_at,
    id_token: account.id_token,
  };
}

// =============================================================================
// Redis Helper Functions (für Fallback und Dual-Write)
// =============================================================================

async function createUserInRedis(
  id: string,
  user: { email?: string | null; name?: string | null; image?: string | null }
): Promise<AdapterUser> {
  const r = await getRedis();

  const userAccount = {
    id,
    email: user.email!,
    name: user.name || 'Spieler',
    image: user.image || undefined,
    createdAt: new Date(),
    lastLoginAt: new Date(),
    providers: {},
    legacyPlayerIds: [],
    settings: { ...DEFAULT_USER_SETTINGS },
  };

  await r.set(`user:${id}`, JSON.stringify(userAccount));
  await r.set(`user:email:${user.email}`, id);

  return toAdapterUser(userAccount);
}

async function updateUserInRedis(
  id: string,
  user: { name?: string | null; email?: string | null; image?: string | null }
): Promise<AdapterUser> {
  const r = await getRedis();
  const data = await r.get(`user:${id}`);

  if (!data) {
    throw new Error('User not found in Redis');
  }

  const existing = JSON.parse(data);
  const updated = {
    ...existing,
    name: user.name || existing.name,
    email: user.email || existing.email,
    image: user.image || existing.image,
    lastLoginAt: new Date(),
  };

  await r.set(`user:${id}`, JSON.stringify(updated));

  return toAdapterUser(updated);
}

async function deleteUserInRedis(userId: string): Promise<void> {
  const r = await getRedis();
  const data = await r.get(`user:${userId}`);
  if (!data) return;

  const user = JSON.parse(data);

  // Cleanup mappings
  await r.del(`user:email:${user.email}`);

  if (user.providers?.google) {
    await r.del(`user:oauth:google:${user.providers.google.id}`);
  }
  if (user.providers?.github) {
    await r.del(`user:oauth:github:${user.providers.github.id}`);
  }

  for (const legacyId of user.legacyPlayerIds || []) {
    await r.del(`user:legacy:${legacyId}`);
  }

  await r.del(`user:${userId}`);
}

async function linkAccountInRedis(account: {
  userId: string;
  provider: string;
  providerAccountId: string;
  type?: string;
  access_token?: string;
  token_type?: string;
  scope?: string;
  expires_at?: number;
  id_token?: string;
}): Promise<AdapterAccount> {
  const r = await getRedis();
  const data = await r.get(`user:${account.userId}`);
  if (!data) throw new Error('User not found');

  const user = JSON.parse(data);

  if (account.provider === 'google' || account.provider === 'github') {
    user.providers[account.provider] = {
      id: account.providerAccountId,
      connectedAt: new Date(),
    };
  }

  await r.set(`user:${account.userId}`, JSON.stringify(user));
  await r.set(`user:oauth:${account.provider}:${account.providerAccountId}`, account.userId);

  return toAdapterAccount(account);
}

async function unlinkAccountInRedis(
  provider: string,
  providerAccountId: string
): Promise<void> {
  const r = await getRedis();
  const userId = await r.get(`user:oauth:${provider}:${providerAccountId}`);
  if (!userId) return;

  const data = await r.get(`user:${userId}`);
  if (!data) return;

  const user = JSON.parse(data);

  if (provider === 'google' || provider === 'github') {
    delete user.providers[provider];
  }

  await r.set(`user:${userId}`, JSON.stringify(user));
  await r.del(`user:oauth:${provider}:${providerAccountId}`);
}

// =============================================================================
// Migration Helper
// =============================================================================

async function migrateUserToPostgres(redisUser: {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: Date;
  lastLoginAt: Date;
  providers: {
    google?: { id: string; connectedAt: Date };
    github?: { id: string; connectedAt: Date };
  };
  legacyPlayerIds: string[];
  settings: unknown;
}): Promise<void> {
  const db = await import('../db').then((m) => m.getDb());
  const { users, oauthAccounts, legacyPlayerLinks } = await import('../db/schema');

  try {
    // User einfügen
    await db
      .insert(users)
      .values({
        id: redisUser.id,
        email: redisUser.email,
        name: redisUser.name,
        image: redisUser.image || null,
        createdAt: redisUser.createdAt,
        lastLoginAt: redisUser.lastLoginAt,
        settings: redisUser.settings as {
          voicePreference: 'male' | 'female';
          darkMode: boolean;
          cardDesign: 'bavarian' | 'french';
          audioVolume: number;
          soundEffectsEnabled: boolean;
          speechEnabled: boolean;
        },
      })
      .onConflictDoNothing();

    // OAuth Accounts
    if (redisUser.providers.google) {
      await db
        .insert(oauthAccounts)
        .values({
          userId: redisUser.id,
          provider: 'google',
          providerAccountId: redisUser.providers.google.id,
          connectedAt: redisUser.providers.google.connectedAt,
        })
        .onConflictDoNothing();
    }

    if (redisUser.providers.github) {
      await db
        .insert(oauthAccounts)
        .values({
          userId: redisUser.id,
          provider: 'github',
          providerAccountId: redisUser.providers.github.id,
          connectedAt: redisUser.providers.github.connectedAt,
        })
        .onConflictDoNothing();
    }

    // Legacy Player Links
    for (const legacyId of redisUser.legacyPlayerIds) {
      await db
        .insert(legacyPlayerLinks)
        .values({
          legacyPlayerId: legacyId,
          userId: redisUser.id,
        })
        .onConflictDoNothing();
    }

    console.log(`[HybridAdapter] Successfully migrated user ${redisUser.id} to PostgreSQL`);
  } catch (err) {
    console.error(`[HybridAdapter] Failed to migrate user ${redisUser.id}:`, err);
    throw err;
  }
}

// =============================================================================
// Exported Helper Functions (für lib/auth/users.ts)
// =============================================================================

/**
 * Vollständigen UserAccount laden (für API)
 */
export async function getFullUserAccount(userId: string) {
  const usePostgres = FEATURE_FLAGS.USE_POSTGRES_USERS;

  if (usePostgres) {
    try {
      const user = await pgAdapter.getUserByIdPg(userId);
      if (user) return user;
    } catch (err) {
      console.error('[HybridAdapter] getFullUserAccount PostgreSQL failed:', err);
    }
  }

  return getFullUserAccountRedis(userId);
}

/**
 * User Settings aktualisieren
 */
export async function updateUserSettings(
  userId: string,
  settings: Partial<Record<string, unknown>>
) {
  const usePostgres = FEATURE_FLAGS.USE_POSTGRES_USERS;
  const dualWrite = FEATURE_FLAGS.DUAL_WRITE_ENABLED;

  if (usePostgres) {
    try {
      const result = await pgAdapter.updateUserSettingsPg(userId, settings as any);

      if (dualWrite) {
        try {
          await updateUserSettingsRedis(userId, settings as any);
        } catch (err) {
          console.warn('[HybridAdapter] Dual-write settings to Redis failed:', err);
        }
      }

      return result;
    } catch (err) {
      console.error('[HybridAdapter] updateUserSettings PostgreSQL failed:', err);
    }
  }

  return updateUserSettingsRedis(userId, settings as any);
}

/**
 * Legacy Player ID verknüpfen
 */
export async function linkLegacyPlayerId(userId: string, legacyPlayerId: string) {
  const usePostgres = FEATURE_FLAGS.USE_POSTGRES_USERS;
  const dualWrite = FEATURE_FLAGS.DUAL_WRITE_ENABLED;

  if (usePostgres) {
    try {
      const result = await pgAdapter.linkLegacyPlayerIdPg(userId, legacyPlayerId);

      if (dualWrite) {
        await linkLegacyPlayerIdRedis(userId, legacyPlayerId);
      }

      return result;
    } catch (err) {
      console.error('[HybridAdapter] linkLegacyPlayerId PostgreSQL failed:', err);
    }
  }

  return linkLegacyPlayerIdRedis(userId, legacyPlayerId);
}

/**
 * User ID von Legacy Player ID holen
 */
export async function getUserIdFromLegacyId(legacyPlayerId: string) {
  const usePostgres = FEATURE_FLAGS.USE_POSTGRES_USERS;

  if (usePostgres) {
    try {
      const userId = await pgAdapter.getUserIdFromLegacyIdPg(legacyPlayerId);
      if (userId) return userId;
    } catch (err) {
      console.error('[HybridAdapter] getUserIdFromLegacyId PostgreSQL failed:', err);
    }
  }

  return getUserIdFromLegacyIdRedis(legacyPlayerId);
}
