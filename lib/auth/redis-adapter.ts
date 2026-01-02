// Redis Adapter for Auth.js (NextAuth v5)

import { createClient, RedisClientType } from 'redis';
import type { Adapter, AdapterUser, AdapterAccount, AdapterSession } from 'next-auth/adapters';
import { UserAccount, UserSettings, DEFAULT_USER_SETTINGS, AuthSession } from './types';

// Redis key prefixes
const USER_PREFIX = 'user:';
const USER_EMAIL_PREFIX = 'user:email:';
const USER_OAUTH_PREFIX = 'user:oauth:';
const SESSION_PREFIX = 'session:';

// Session TTL: 24 hours
const SESSION_TTL = 60 * 60 * 24;

// Fallback for local development without Redis
const localUsers = new Map<string, UserAccount>();
const localSessions = new Map<string, AuthSession>();
const localOAuthLinks = new Map<string, string>(); // oauth key -> userId
const localEmailIndex = new Map<string, string>(); // email -> userId
const isLocal = !process.env.REDIS_URL;

// Redis client (lazy init with connection pooling)
let redis: RedisClientType | null = null;
let redisConnecting: Promise<RedisClientType> | null = null;

async function getRedis(): Promise<RedisClientType> {
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

/**
 * Generate a UUID for user IDs
 */
function generateUserId(): string {
  return 'u_' + crypto.randomUUID().replace(/-/g, '');
}

/**
 * Generate a session token
 */
function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * Convert UserAccount to AdapterUser format
 */
function toAdapterUser(user: UserAccount): AdapterUser {
  return {
    id: user.id,
    email: user.email ?? '',
    emailVerified: null, // We don't verify emails
    name: user.name,
    image: user.image,
  };
}

/**
 * Create a new UserAccount from OAuth data
 */
function createUserAccount(
  id: string,
  email: string | null,
  name: string,
  image: string | null
): UserAccount {
  const now = Date.now();
  return {
    id,
    email,
    name: name || 'Spieler',
    image,
    createdAt: now,
    lastLoginAt: now,
    providers: {},
    legacyPlayerIds: [],
    settings: { ...DEFAULT_USER_SETTINGS },
  };
}

// ============================================
// User operations
// ============================================

export async function createUser(
  email: string | null,
  name: string,
  image: string | null
): Promise<UserAccount> {
  const id = generateUserId();
  const user = createUserAccount(id, email, name, image);

  if (isLocal) {
    localUsers.set(id, user);
    if (email) localEmailIndex.set(email.toLowerCase(), id);
  } else {
    const r = await getRedis();
    await r.set(`${USER_PREFIX}${id}`, JSON.stringify(user));
    if (email) {
      await r.set(`${USER_EMAIL_PREFIX}${email.toLowerCase()}`, id);
    }
  }

  return user;
}

export async function getUser(id: string): Promise<UserAccount | null> {
  if (isLocal) {
    return localUsers.get(id) ?? null;
  }
  const r = await getRedis();
  const data = await r.get(`${USER_PREFIX}${id}`);
  return data ? JSON.parse(data) : null;
}

export async function getUserByEmail(email: string): Promise<UserAccount | null> {
  const normalizedEmail = email.toLowerCase();

  if (isLocal) {
    const userId = localEmailIndex.get(normalizedEmail);
    return userId ? localUsers.get(userId) ?? null : null;
  }

  const r = await getRedis();
  const userId = await r.get(`${USER_EMAIL_PREFIX}${normalizedEmail}`);
  if (!userId) return null;

  const data = await r.get(`${USER_PREFIX}${userId}`);
  return data ? JSON.parse(data) : null;
}

export async function getUserByAccount(
  provider: string,
  providerAccountId: string
): Promise<UserAccount | null> {
  const oauthKey = `${provider}:${providerAccountId}`;

  if (isLocal) {
    const userId = localOAuthLinks.get(oauthKey);
    return userId ? localUsers.get(userId) ?? null : null;
  }

  const r = await getRedis();
  const userId = await r.get(`${USER_OAUTH_PREFIX}${oauthKey}`);
  if (!userId) return null;

  const data = await r.get(`${USER_PREFIX}${userId}`);
  return data ? JSON.parse(data) : null;
}

export async function updateUser(
  id: string,
  data: Partial<UserAccount>
): Promise<UserAccount | null> {
  const user = await getUser(id);
  if (!user) return null;

  const updatedUser: UserAccount = { ...user, ...data };

  if (isLocal) {
    localUsers.set(id, updatedUser);
  } else {
    const r = await getRedis();
    await r.set(`${USER_PREFIX}${id}`, JSON.stringify(updatedUser));
  }

  return updatedUser;
}

export async function updateUserSettings(
  id: string,
  settings: Partial<UserSettings>
): Promise<UserAccount | null> {
  const user = await getUser(id);
  if (!user) return null;

  user.settings = { ...user.settings, ...settings };

  if (isLocal) {
    localUsers.set(id, user);
  } else {
    const r = await getRedis();
    await r.set(`${USER_PREFIX}${id}`, JSON.stringify(user));
  }

  return user;
}

export async function deleteUser(id: string): Promise<void> {
  const user = await getUser(id);
  if (!user) return;

  if (isLocal) {
    localUsers.delete(id);
    if (user.email) localEmailIndex.delete(user.email.toLowerCase());
    // Remove OAuth links
    for (const [provider, providerAccountId] of Object.entries(user.providers)) {
      if (providerAccountId) {
        localOAuthLinks.delete(`${provider}:${providerAccountId}`);
      }
    }
  } else {
    const r = await getRedis();
    await r.del(`${USER_PREFIX}${id}`);
    if (user.email) {
      await r.del(`${USER_EMAIL_PREFIX}${user.email.toLowerCase()}`);
    }
    // Remove OAuth links
    for (const [provider, providerAccountId] of Object.entries(user.providers)) {
      if (providerAccountId) {
        await r.del(`${USER_OAUTH_PREFIX}${provider}:${providerAccountId}`);
      }
    }
  }
}

// ============================================
// OAuth Account operations
// ============================================

export async function linkAccount(
  userId: string,
  provider: string,
  providerAccountId: string
): Promise<void> {
  const user = await getUser(userId);
  if (!user) return;

  // Update user's providers
  user.providers = { ...user.providers, [provider]: providerAccountId };

  const oauthKey = `${provider}:${providerAccountId}`;

  if (isLocal) {
    localUsers.set(userId, user);
    localOAuthLinks.set(oauthKey, userId);
  } else {
    const r = await getRedis();
    await r.set(`${USER_PREFIX}${userId}`, JSON.stringify(user));
    await r.set(`${USER_OAUTH_PREFIX}${oauthKey}`, userId);
  }
}

export async function unlinkAccount(
  provider: string,
  providerAccountId: string
): Promise<void> {
  const user = await getUserByAccount(provider, providerAccountId);
  if (!user) return;

  // Remove from user's providers
  const { [provider]: _, ...remainingProviders } = user.providers;
  user.providers = remainingProviders;

  const oauthKey = `${provider}:${providerAccountId}`;

  if (isLocal) {
    localUsers.set(user.id, user);
    localOAuthLinks.delete(oauthKey);
  } else {
    const r = await getRedis();
    await r.set(`${USER_PREFIX}${user.id}`, JSON.stringify(user));
    await r.del(`${USER_OAUTH_PREFIX}${oauthKey}`);
  }
}

// ============================================
// Session operations
// ============================================

export async function createSession(
  userId: string,
  expires: Date
): Promise<AuthSession> {
  const session: AuthSession = {
    sessionToken: generateSessionToken(),
    userId,
    expires: expires.getTime(),
  };

  if (isLocal) {
    localSessions.set(session.sessionToken, session);
  } else {
    const r = await getRedis();
    await r.set(
      `${SESSION_PREFIX}${session.sessionToken}`,
      JSON.stringify(session),
      { EX: SESSION_TTL }
    );
  }

  return session;
}

export async function getSessionAndUser(
  sessionToken: string
): Promise<{ session: AuthSession; user: UserAccount } | null> {
  let session: AuthSession | null = null;

  if (isLocal) {
    session = localSessions.get(sessionToken) ?? null;
  } else {
    const r = await getRedis();
    const data = await r.get(`${SESSION_PREFIX}${sessionToken}`);
    session = data ? JSON.parse(data) : null;
  }

  if (!session) return null;

  // Check if session is expired
  if (session.expires < Date.now()) {
    await deleteSession(sessionToken);
    return null;
  }

  const user = await getUser(session.userId);
  if (!user) return null;

  return { session, user };
}

export async function updateSession(
  sessionToken: string,
  expires: Date
): Promise<AuthSession | null> {
  const result = await getSessionAndUser(sessionToken);
  if (!result) return null;

  const session: AuthSession = {
    ...result.session,
    expires: expires.getTime(),
  };

  if (isLocal) {
    localSessions.set(sessionToken, session);
  } else {
    const r = await getRedis();
    await r.set(
      `${SESSION_PREFIX}${sessionToken}`,
      JSON.stringify(session),
      { EX: SESSION_TTL }
    );
  }

  return session;
}

export async function deleteSession(sessionToken: string): Promise<void> {
  if (isLocal) {
    localSessions.delete(sessionToken);
  } else {
    const r = await getRedis();
    await r.del(`${SESSION_PREFIX}${sessionToken}`);
  }
}

// ============================================
// Auth.js Adapter implementation
// ============================================

export function RedisAdapter(): Adapter {
  return {
    async createUser(user) {
      const newUser = await createUser(user.email ?? null, user.name ?? 'Spieler', user.image ?? null);
      return toAdapterUser(newUser);
    },

    async getUser(id) {
      const user = await getUser(id);
      return user ? toAdapterUser(user) : null;
    },

    async getUserByEmail(email) {
      const user = await getUserByEmail(email);
      return user ? toAdapterUser(user) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const user = await getUserByAccount(provider, providerAccountId);
      return user ? toAdapterUser(user) : null;
    },

    async updateUser(user) {
      const updated = await updateUser(user.id, {
        name: user.name ?? undefined,
        email: user.email ?? undefined,
        image: user.image ?? undefined,
      });
      return updated ? toAdapterUser(updated) : null as unknown as AdapterUser;
    },

    async deleteUser(userId) {
      await deleteUser(userId);
    },

    async linkAccount(account) {
      await linkAccount(account.userId, account.provider, account.providerAccountId);
      return account as AdapterAccount;
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await unlinkAccount(provider, providerAccountId);
    },

    async createSession(session) {
      const newSession = await createSession(session.userId, session.expires);
      return {
        sessionToken: newSession.sessionToken,
        userId: newSession.userId,
        expires: new Date(newSession.expires),
      };
    },

    async getSessionAndUser(sessionToken) {
      const result = await getSessionAndUser(sessionToken);
      if (!result) return null;

      return {
        session: {
          sessionToken: result.session.sessionToken,
          userId: result.session.userId,
          expires: new Date(result.session.expires),
        },
        user: toAdapterUser(result.user),
      };
    },

    async updateSession(session) {
      if (!session.expires) return null;
      const updated = await updateSession(session.sessionToken, session.expires);
      if (!updated) return null;

      return {
        sessionToken: updated.sessionToken,
        userId: updated.userId,
        expires: new Date(updated.expires),
      };
    },

    async deleteSession(sessionToken) {
      await deleteSession(sessionToken);
    },

    // Verification tokens are not used (we use OAuth only)
    async createVerificationToken() {
      return null;
    },

    async useVerificationToken() {
      return null;
    },
  };
}
