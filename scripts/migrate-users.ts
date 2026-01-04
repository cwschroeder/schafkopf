#!/usr/bin/env npx tsx
/**
 * User Migration Script: Redis → PostgreSQL
 *
 * Migriert alle User-Daten von Redis nach PostgreSQL:
 * - User Accounts
 * - OAuth Account Links
 * - Legacy Player ID Mappings
 *
 * Usage:
 *   npx tsx scripts/migrate-users.ts [--dry-run]
 *
 * Flags:
 *   --dry-run  Nur Analyse, keine Schreiboperationen
 */

import { createClient, RedisClientType } from 'redis';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { users, oauthAccounts, legacyPlayerLinks } from '../lib/db/schema';

// Konfiguration
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const DATABASE_URL = process.env.DATABASE_URL;

const DRY_RUN = process.argv.includes('--dry-run');

interface RedisUserAccount {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: string;
  lastLoginAt: string;
  providers: {
    google?: { id: string; connectedAt: string };
    github?: { id: string; connectedAt: string };
  };
  legacyPlayerIds: string[];
  settings: Record<string, unknown>;
}

async function main() {
  console.log('='.repeat(60));
  console.log('User Migration: Redis → PostgreSQL');
  console.log('='.repeat(60));

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - Keine Änderungen werden geschrieben\n');
  }

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }

  // Redis verbinden
  console.log('\n📡 Connecting to Redis...');
  const redis = createClient({ url: REDIS_URL });
  redis.on('error', (err) => console.error('Redis Error:', err));
  await redis.connect();
  console.log('✅ Redis connected');

  // PostgreSQL verbinden
  console.log('\n📡 Connecting to PostgreSQL...');
  const pool = new Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool);
  console.log('✅ PostgreSQL connected');

  try {
    // 1. Alle User-Keys laden
    console.log('\n🔍 Scanning for user keys...');
    const userKeys = await redis.keys('user:u_*');
    console.log(`   Found ${userKeys.length} users`);

    // 2. Email-Mappings zählen
    const emailKeys = await redis.keys('user:email:*');
    console.log(`   Found ${emailKeys.length} email mappings`);

    // 3. OAuth-Mappings zählen
    const oauthKeys = await redis.keys('user:oauth:*');
    console.log(`   Found ${oauthKeys.length} OAuth mappings`);

    // 4. Legacy-Mappings zählen
    const legacyKeys = await redis.keys('user:legacy:*');
    console.log(`   Found ${legacyKeys.length} legacy player mappings`);

    // Statistiken
    let migrated = 0;
    let skipped = 0;
    let failed = 0;
    let oauthMigrated = 0;
    let legacyMigrated = 0;

    console.log('\n📦 Migrating users...\n');

    for (const key of userKeys) {
      const userId = key.replace('user:', '');

      try {
        const data = await redis.get(key);
        if (!data) {
          console.log(`   ⚠️  ${userId}: Empty data, skipping`);
          skipped++;
          continue;
        }

        const user: RedisUserAccount = JSON.parse(data);

        // Validierung
        if (!user.email || !user.name) {
          console.log(`   ⚠️  ${userId}: Missing email or name, skipping`);
          skipped++;
          continue;
        }

        if (!DRY_RUN) {
          // User in PostgreSQL einfügen
          await db
            .insert(users)
            .values({
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image || null,
              createdAt: new Date(user.createdAt),
              lastLoginAt: new Date(user.lastLoginAt),
              settings: user.settings as {
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
          if (user.providers?.google) {
            await db
              .insert(oauthAccounts)
              .values({
                userId: user.id,
                provider: 'google',
                providerAccountId: user.providers.google.id,
                connectedAt: new Date(user.providers.google.connectedAt),
              })
              .onConflictDoNothing();
            oauthMigrated++;
          }

          if (user.providers?.github) {
            await db
              .insert(oauthAccounts)
              .values({
                userId: user.id,
                provider: 'github',
                providerAccountId: user.providers.github.id,
                connectedAt: new Date(user.providers.github.connectedAt),
              })
              .onConflictDoNothing();
            oauthMigrated++;
          }

          // Legacy Player Links
          for (const legacyId of user.legacyPlayerIds || []) {
            await db
              .insert(legacyPlayerLinks)
              .values({
                legacyPlayerId: legacyId,
                userId: user.id,
              })
              .onConflictDoNothing();
            legacyMigrated++;
          }
        }

        migrated++;

        // Fortschritt anzeigen
        if (migrated % 100 === 0) {
          console.log(`   📊 Progress: ${migrated}/${userKeys.length} users`);
        }
      } catch (err) {
        console.error(`   ❌ ${userId}: ${err}`);
        failed++;
      }
    }

    // Zusammenfassung
    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary');
    console.log('='.repeat(60));
    console.log(`\n📊 Results:`);
    console.log(`   ✅ Migrated:     ${migrated} users`);
    console.log(`   ⚠️  Skipped:      ${skipped} users`);
    console.log(`   ❌ Failed:       ${failed} users`);
    console.log(`   🔗 OAuth links:  ${oauthMigrated}`);
    console.log(`   🏷️  Legacy links: ${legacyMigrated}`);

    if (DRY_RUN) {
      console.log('\n⚠️  This was a dry run. No changes were made.');
      console.log('   Run without --dry-run to perform the actual migration.');
    } else {
      console.log('\n✅ Migration complete!');
      console.log('\nNext steps:');
      console.log('   1. Set USE_POSTGRES_USERS=true in environment');
      console.log('   2. Restart the application');
      console.log('   3. Monitor logs for any issues');
      console.log('   4. After verification, optionally clean up Redis user keys');
    }
  } finally {
    // Verbindungen schließen
    await redis.quit();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
