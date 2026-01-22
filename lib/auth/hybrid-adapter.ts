/**
 * Auth.js Adapter für PostgreSQL
 *
 * Verwendet PostgreSQL für alle User-Daten.
 * Sessions werden via JWT gespeichert (kein DB-Storage nötig).
 */

import type { Adapter, AdapterUser, AdapterAccount } from 'next-auth/adapters';

// PostgreSQL-Funktionen
import * as pgAdapter from './postgres-adapter';

/**
 * PostgreSQL Auth.js Adapter
 */
export function HybridAdapter(): Adapter {
  return {
    async createUser(user): Promise<AdapterUser> {
      const pgUser = await pgAdapter.createUserPg({
        email: user.email!,
        name: user.name || undefined,
        image: user.image || undefined,
      });

      return toAdapterUser(pgUser);
    },

    async getUser(id): Promise<AdapterUser | null> {
      const user = await pgAdapter.getUserByIdPg(id);
      if (user) return toAdapterUser(user);
      return null;
    },

    async getUserByEmail(email): Promise<AdapterUser | null> {
      const user = await pgAdapter.getUserByEmailPg(email);
      if (user) return toAdapterUser(user);
      return null;
    },

    async getUserByAccount({ providerAccountId, provider }): Promise<AdapterUser | null> {
      const user = await pgAdapter.getUserByOAuthPg(provider, providerAccountId);
      if (user) return toAdapterUser(user);
      return null;
    },

    async updateUser(user): Promise<AdapterUser> {
      const updated = await pgAdapter.updateUserPg(user.id!, {
        name: user.name || undefined,
        email: user.email || undefined,
        image: user.image || undefined,
      });

      if (updated) {
        return toAdapterUser(updated);
      }

      throw new Error('User not found');
    },

    async deleteUser(userId): Promise<void> {
      await pgAdapter.deleteUserPg(userId);
    },

    async linkAccount(account): Promise<AdapterAccount | undefined> {
      await pgAdapter.linkOAuthAccountPg(
        account.userId,
        account.provider,
        account.providerAccountId
      );

      return toAdapterAccount(account);
    },

    async unlinkAccount({ providerAccountId, provider }): Promise<void> {
      await pgAdapter.unlinkOAuthAccountPg(provider, providerAccountId);
    },

    // Sessions werden via JWT gespeichert - diese Methoden sind Pflicht für das Interface,
    // werden aber bei strategy: 'jwt' nicht verwendet
    async createSession() {
      throw new Error('Sessions are handled via JWT');
    },

    async getSessionAndUser() {
      throw new Error('Sessions are handled via JWT');
    },

    async updateSession() {
      throw new Error('Sessions are handled via JWT');
    },

    async deleteSession() {
      throw new Error('Sessions are handled via JWT');
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
// Exported Helper Functions (für lib/auth/users.ts)
// =============================================================================

/**
 * Vollständigen UserAccount laden (für API)
 */
export async function getFullUserAccount(userId: string) {
  return pgAdapter.getUserByIdPg(userId);
}

/**
 * User Settings aktualisieren
 */
export async function updateUserSettings(
  userId: string,
  settings: Partial<Record<string, unknown>>
) {
  return pgAdapter.updateUserSettingsPg(userId, settings as Parameters<typeof pgAdapter.updateUserSettingsPg>[1]);
}

/**
 * Legacy Player ID verknüpfen
 */
export async function linkLegacyPlayerId(userId: string, legacyPlayerId: string) {
  return pgAdapter.linkLegacyPlayerIdPg(userId, legacyPlayerId);
}

/**
 * User ID von Legacy Player ID holen
 */
export async function getUserIdFromLegacyId(legacyPlayerId: string) {
  return pgAdapter.getUserIdFromLegacyIdPg(legacyPlayerId);
}
