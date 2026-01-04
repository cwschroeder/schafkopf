/**
 * PostgreSQL Adapter für User-Daten
 * Wird vom Hybrid-Adapter verwendet, wenn USE_POSTGRES_USERS=true
 */

import { eq, and } from 'drizzle-orm';
import { getDb, users, oauthAccounts, legacyPlayerLinks } from '../db';
import type { UserAccount, UserSettings, OAuthProvider } from './types';
import { DEFAULT_USER_SETTINGS } from './types';

// User-ID Generator (gleiche Logik wie Redis-Adapter)
export function generateUserId(): string {
  return 'u_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
}

/**
 * User in PostgreSQL erstellen
 */
export async function createUserPg(userData: {
  email: string;
  name?: string;
  image?: string;
}): Promise<UserAccount> {
  const db = getDb();
  const id = generateUserId();

  const [user] = await db
    .insert(users)
    .values({
      id,
      email: userData.email,
      name: userData.name || 'Spieler',
      image: userData.image || null,
      settings: { ...DEFAULT_USER_SETTINGS },
    })
    .returning();

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image || undefined,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    providers: {},
    legacyPlayerIds: [],
    settings: user.settings as UserSettings,
  };
}

/**
 * User by ID laden
 */
export async function getUserByIdPg(id: string): Promise<UserAccount | null> {
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) return null;

  // OAuth Accounts laden
  const oauthList = await db
    .select()
    .from(oauthAccounts)
    .where(eq(oauthAccounts.userId, id));

  // Legacy Links laden
  const legacyLinks = await db
    .select()
    .from(legacyPlayerLinks)
    .where(eq(legacyPlayerLinks.userId, id));

  // Providers zusammenbauen
  const providers: UserAccount['providers'] = {};
  for (const oauth of oauthList) {
    if (oauth.provider === 'google' || oauth.provider === 'github') {
      providers[oauth.provider] = {
        id: oauth.providerAccountId,
        connectedAt: oauth.connectedAt,
      };
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image || undefined,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    providers,
    legacyPlayerIds: legacyLinks.map((l) => l.legacyPlayerId),
    settings: user.settings as UserSettings,
  };
}

/**
 * User by Email laden
 */
export async function getUserByEmailPg(email: string): Promise<UserAccount | null> {
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return null;

  return getUserByIdPg(user.id);
}

/**
 * User by OAuth Account laden
 */
export async function getUserByOAuthPg(
  provider: string,
  providerAccountId: string
): Promise<UserAccount | null> {
  const db = getDb();

  const [oauth] = await db
    .select()
    .from(oauthAccounts)
    .where(
      and(
        eq(oauthAccounts.provider, provider),
        eq(oauthAccounts.providerAccountId, providerAccountId)
      )
    );

  if (!oauth) return null;

  return getUserByIdPg(oauth.userId);
}

/**
 * User aktualisieren
 */
export async function updateUserPg(
  id: string,
  data: Partial<{ name: string; email: string; image: string }>
): Promise<UserAccount | null> {
  const db = getDb();

  const updateData: Record<string, unknown> = {
    lastLoginAt: new Date(),
  };

  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.image !== undefined) updateData.image = data.image;

  await db.update(users).set(updateData).where(eq(users.id, id));

  return getUserByIdPg(id);
}

/**
 * User löschen
 */
export async function deleteUserPg(id: string): Promise<void> {
  const db = getDb();
  // CASCADE löscht automatisch oauth_accounts und legacy_player_links
  await db.delete(users).where(eq(users.id, id));
}

/**
 * OAuth Account verknüpfen
 */
export async function linkOAuthAccountPg(
  userId: string,
  provider: string,
  providerAccountId: string
): Promise<void> {
  const db = getDb();

  await db
    .insert(oauthAccounts)
    .values({
      userId,
      provider,
      providerAccountId,
    })
    .onConflictDoNothing();
}

/**
 * OAuth Account entfernen
 */
export async function unlinkOAuthAccountPg(
  provider: string,
  providerAccountId: string
): Promise<void> {
  const db = getDb();

  await db
    .delete(oauthAccounts)
    .where(
      and(
        eq(oauthAccounts.provider, provider),
        eq(oauthAccounts.providerAccountId, providerAccountId)
      )
    );
}

/**
 * Legacy Player ID verknüpfen
 */
export async function linkLegacyPlayerIdPg(
  userId: string,
  legacyPlayerId: string
): Promise<boolean> {
  const db = getDb();

  try {
    await db
      .insert(legacyPlayerLinks)
      .values({
        legacyPlayerId,
        userId,
      })
      .onConflictDoNothing();
    return true;
  } catch {
    return false;
  }
}

/**
 * User ID von Legacy Player ID holen
 */
export async function getUserIdFromLegacyIdPg(
  legacyPlayerId: string
): Promise<string | null> {
  const db = getDb();

  const [link] = await db
    .select()
    .from(legacyPlayerLinks)
    .where(eq(legacyPlayerLinks.legacyPlayerId, legacyPlayerId));

  return link?.userId || null;
}

/**
 * User Settings aktualisieren
 */
export async function updateUserSettingsPg(
  userId: string,
  settings: Partial<UserSettings>
): Promise<UserAccount | null> {
  const db = getDb();

  // Aktuelle Settings laden
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return null;

  const currentSettings = user.settings as UserSettings;
  const newSettings = { ...currentSettings, ...settings };

  await db.update(users).set({ settings: newSettings }).where(eq(users.id, userId));

  return getUserByIdPg(userId);
}

/**
 * Alle User IDs laden (für Migration/Admin)
 */
export async function getAllUserIdsPg(): Promise<string[]> {
  const db = getDb();
  const result = await db.select({ id: users.id }).from(users);
  return result.map((r) => r.id);
}
