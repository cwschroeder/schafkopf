/**
 * Redis Adapter für Auth.js
 * Implementiert das Auth.js Adapter Interface für Redis-Speicherung
 */

import { createClient, RedisClientType } from 'redis';
import type { Adapter, AdapterUser, AdapterAccount, AdapterSession } from 'next-auth/adapters';
import { UserAccount, UserSettings, DEFAULT_USER_SETTINGS } from './types';

// Redis Key Prefixes
const USER_PREFIX = 'user:';
const USER_EMAIL_PREFIX = 'user:email:';
const USER_OAUTH_PREFIX = 'user:oauth:';
const USER_LEGACY_PREFIX = 'user:legacy:';
const SESSION_PREFIX = 'session:';

// Session TTL: 24 Stunden
const SESSION_TTL = 60 * 60 * 24;

// Redis-Client (Lazy Init)
let redis: RedisClientType | null = null;
let redisConnecting: Promise<RedisClientType> | null = null;

export async function getRedis(): Promise<RedisClientType> {
  if (redis?.isOpen) return redis;

  if (redisConnecting) return redisConnecting;

  redisConnecting = (async () => {
    redis = createClient({ url: process.env.REDIS_URL });
    redis.on('error', (err) => console.error('Redis Auth Error:', err));
    await redis.connect();
    return redis;
  })();

  return redisConnecting;
}

// User-ID Generator
export function generateUserId(): string {
  return 'u_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
}

/**
 * Auth.js Redis Adapter
 */
export function RedisAdapter(): Adapter {
  return {
    async createUser(user): Promise<AdapterUser> {
      const r = await getRedis();
      const id = generateUserId();
      
      const userAccount: UserAccount = {
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

      // User speichern
      await r.set(`${USER_PREFIX}${id}`, JSON.stringify(userAccount));
      // Email-Mapping speichern
      await r.set(`${USER_EMAIL_PREFIX}${user.email}`, id);

      return {
        id,
        email: user.email!,
        emailVerified: user.emailVerified || null,
        name: user.name || null,
        image: user.image || null,
      };
    },

    async getUser(id): Promise<AdapterUser | null> {
      const r = await getRedis();
      const data = await r.get(`${USER_PREFIX}${id}`);
      if (!data) return null;

      const user: UserAccount = JSON.parse(data);
      return {
        id: user.id,
        email: user.email,
        emailVerified: null,
        name: user.name,
        image: user.image || null,
      };
    },

    async getUserByEmail(email): Promise<AdapterUser | null> {
      const r = await getRedis();
      const userId = await r.get(`${USER_EMAIL_PREFIX}${email}`);
      if (!userId) return null;
      
      return this.getUser!(userId);
    },

    async getUserByAccount({ providerAccountId, provider }): Promise<AdapterUser | null> {
      const r = await getRedis();
      const userId = await r.get(`${USER_OAUTH_PREFIX}${provider}:${providerAccountId}`);
      if (!userId) return null;
      
      return this.getUser!(userId);
    },

    async updateUser(user): Promise<AdapterUser> {
      const r = await getRedis();
      const data = await r.get(`${USER_PREFIX}${user.id}`);
      if (!data) throw new Error('User not found');

      const existing: UserAccount = JSON.parse(data);
      const updated: UserAccount = {
        ...existing,
        name: user.name || existing.name,
        email: user.email || existing.email,
        image: user.image || existing.image,
        lastLoginAt: new Date(),
      };

      await r.set(`${USER_PREFIX}${user.id}`, JSON.stringify(updated));

      return {
        id: updated.id,
        email: updated.email,
        emailVerified: null,
        name: updated.name,
        image: updated.image || null,
      };
    },

    async deleteUser(userId): Promise<void> {
      const r = await getRedis();
      const data = await r.get(`${USER_PREFIX}${userId}`);
      if (!data) return;

      const user: UserAccount = JSON.parse(data);

      // Cleanup: Email-Mapping löschen
      await r.del(`${USER_EMAIL_PREFIX}${user.email}`);

      // Cleanup: OAuth-Mappings löschen
      if (user.providers.google) {
        await r.del(`${USER_OAUTH_PREFIX}google:${user.providers.google.id}`);
      }
      if (user.providers.github) {
        await r.del(`${USER_OAUTH_PREFIX}github:${user.providers.github.id}`);
      }

      // Cleanup: Legacy-Mappings löschen
      for (const legacyId of user.legacyPlayerIds) {
        await r.del(`${USER_LEGACY_PREFIX}${legacyId}`);
      }

      // User löschen
      await r.del(`${USER_PREFIX}${userId}`);
    },

    async linkAccount(account): Promise<AdapterAccount | undefined> {
      const r = await getRedis();
      const data = await r.get(`${USER_PREFIX}${account.userId}`);
      if (!data) return;

      const user: UserAccount = JSON.parse(data);

      // Provider in User-Objekt speichern
      if (account.provider === 'google' || account.provider === 'github') {
        user.providers[account.provider] = {
          id: account.providerAccountId,
          connectedAt: new Date(),
        };
      }

      await r.set(`${USER_PREFIX}${account.userId}`, JSON.stringify(user));

      // OAuth-Mapping speichern
      await r.set(
        `${USER_OAUTH_PREFIX}${account.provider}:${account.providerAccountId}`,
        account.userId
      );

      return {
        userId: account.userId,
        type: account.type as "oauth" | "oidc" | "email" | "webauthn",
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        access_token: account.access_token,
        token_type: account.token_type,
        scope: account.scope,
        expires_at: account.expires_at,
        id_token: account.id_token,
      };
    },

    async unlinkAccount({ providerAccountId, provider }): Promise<void> {
      const r = await getRedis();
      const userId = await r.get(`${USER_OAUTH_PREFIX}${provider}:${providerAccountId}`);
      if (!userId) return;

      const data = await r.get(`${USER_PREFIX}${userId}`);
      if (!data) return;

      const user: UserAccount = JSON.parse(data);

      // Provider aus User-Objekt entfernen
      if (provider === 'google' || provider === 'github') {
        delete user.providers[provider];
      }

      await r.set(`${USER_PREFIX}${userId}`, JSON.stringify(user));

      // OAuth-Mapping löschen
      await r.del(`${USER_OAUTH_PREFIX}${provider}:${providerAccountId}`);
    },

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

    async getSessionAndUser(sessionToken): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      const r = await getRedis();
      const sessionData = await r.get(`${SESSION_PREFIX}${sessionToken}`);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);
      
      // Prüfen ob Session abgelaufen
      if (new Date(session.expires) < new Date()) {
        await r.del(`${SESSION_PREFIX}${sessionToken}`);
        return null;
      }

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

      await r.set(
        `${SESSION_PREFIX}${session.sessionToken}`,
        JSON.stringify(updated),
        { EX: SESSION_TTL }
      );

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

// Hilfsfunktion: Legacy Player ID verknüpfen
export async function linkLegacyPlayerId(userId: string, legacyPlayerId: string): Promise<boolean> {
  const r = await getRedis();
  
  // Prüfen ob bereits verknüpft
  const existingUserId = await r.get(`${USER_LEGACY_PREFIX}${legacyPlayerId}`);
  if (existingUserId) {
    return existingUserId === userId;
  }

  // User laden
  const data = await r.get(`${USER_PREFIX}${userId}`);
  if (!data) return false;

  const user: UserAccount = JSON.parse(data);

  // Legacy ID hinzufügen
  if (!user.legacyPlayerIds.includes(legacyPlayerId)) {
    user.legacyPlayerIds.push(legacyPlayerId);
    await r.set(`${USER_PREFIX}${userId}`, JSON.stringify(user));
  }

  // Mapping speichern
  await r.set(`${USER_LEGACY_PREFIX}${legacyPlayerId}`, userId);

  return true;
}

// Hilfsfunktion: User ID von Legacy Player ID holen
export async function getUserIdFromLegacyId(legacyPlayerId: string): Promise<string | null> {
  const r = await getRedis();
  return await r.get(`${USER_LEGACY_PREFIX}${legacyPlayerId}`);
}

// Hilfsfunktion: Vollständigen UserAccount laden
export async function getFullUserAccount(userId: string): Promise<UserAccount | null> {
  const r = await getRedis();
  const data = await r.get(`${USER_PREFIX}${userId}`);
  if (!data) return null;
  return JSON.parse(data);
}

// Hilfsfunktion: User Settings updaten
export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserAccount | null> {
  const r = await getRedis();
  const data = await r.get(`${USER_PREFIX}${userId}`);
  if (!data) return null;

  const user: UserAccount = JSON.parse(data);
  user.settings = { ...user.settings, ...settings };
  
  await r.set(`${USER_PREFIX}${userId}`, JSON.stringify(user));
  return user;
}
