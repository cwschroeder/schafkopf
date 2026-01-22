# Migrationsplan: Redis-only zu PostgreSQL + Redis Hybrid

## Executive Summary

Dieser Plan beschreibt die schrittweise Migration der Schafkopf-Anwendung von einer reinen Redis-Architektur zu einem PostgreSQL + Redis Hybrid-System. PostgreSQL uebernimmt persistente Daten (User Accounts, Stats, Game History), waehrend Redis fuer fluechtige Daten (Sessions, Active Games, Real-time Caches) zustaendig bleibt.

---

## Teil 1: ORM-Empfehlung

### Empfehlung: Drizzle ORM

**Begruendung:**

| Kriterium | Drizzle | Prisma |
|-----------|---------|--------|
| TypeScript-First | Native TS, kein Codegen | Codegen erforderlich |
| Bundle Size | ~35KB | ~15MB (engine binary) |
| Performance | SQL-nah, minimal overhead | ORM-Layer overhead |
| Edge Compatibility | Ja (wichtig fuer Vercel/Next.js) | Eingeschraenkt |
| Migrations | SQL-Dateien, volle Kontrolle | Prisma Migrate (opinionated) |
| Learning Curve | SQL-Kenntnisse noetig | Einfacher fuer ORM-Einsteiger |

**Drizzle ist ideal fuer dieses Projekt weil:**
1. Die bestehenden Redis-Operationen sind bereits SQL-artig strukturiert
2. Minimaler Runtime-Overhead (wichtig fuer Multiplayer-Performance)
3. Bessere Edge-Kompatibilitaet mit Next.js App Router
4. Volle SQL-Kontrolle fuer komplexe Leaderboard-Queries

---

## Teil 2: PostgreSQL Schema Design

### 2.1 users (User Accounts)

```sql
CREATE TABLE users (
    id VARCHAR(32) PRIMARY KEY,  -- Format: u_xxxxxxxxxxxxx
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Settings (JSONB fuer Flexibilitaet)
    settings JSONB DEFAULT '{
        "voicePreference": "male",
        "darkMode": false,
        "cardDesign": "bavarian",
        "audioVolume": 80,
        "soundEffectsEnabled": true,
        "speechEnabled": true
    }'::jsonb
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_login ON users(last_login_at);
```

### 2.2 oauth_accounts (OAuth Provider Links)

```sql
CREATE TABLE oauth_accounts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL,  -- 'google', 'github'
    provider_account_id VARCHAR(255) NOT NULL,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_oauth_user ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_provider ON oauth_accounts(provider, provider_account_id);
```

### 2.3 legacy_player_links (Legacy Player ID Mapping)

```sql
CREATE TABLE legacy_player_links (
    legacy_player_id VARCHAR(32) PRIMARY KEY,  -- Format: p_xxxxxxxxxxxxx
    user_id VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_legacy_user ON legacy_player_links(user_id);
```

### 2.4 user_stats (Statistiken)

```sql
CREATE TABLE user_stats (
    user_id VARCHAR(32) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    guthaben INTEGER DEFAULT 0,
    spiele_gesamt INTEGER DEFAULT 0,
    siege INTEGER DEFAULT 0,
    niederlagen INTEGER DEFAULT 0,
    
    -- Ansagen-Counter als JSONB (flexibel fuer neue Spielarten)
    ansagen_count JSONB DEFAULT '{}'::jsonb,
    ansagen_wins JSONB DEFAULT '{}'::jsonb,
    
    -- Periodische Statistiken
    weekly_guthaben INTEGER DEFAULT 0,
    monthly_guthaben INTEGER DEFAULT 0,
    weekly_reset_at DATE DEFAULT CURRENT_DATE,
    monthly_reset_at DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE),
    
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard-Indices (wichtig fuer Performance!)
CREATE INDEX idx_stats_guthaben ON user_stats(guthaben DESC);
CREATE INDEX idx_stats_weekly ON user_stats(weekly_guthaben DESC) 
    WHERE weekly_guthaben != 0;
CREATE INDEX idx_stats_monthly ON user_stats(monthly_guthaben DESC) 
    WHERE monthly_guthaben != 0;
CREATE INDEX idx_stats_siege ON user_stats(siege DESC);
```

### 2.5 game_results (Spielergebnisse)

```sql
CREATE TABLE game_results (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(32) NOT NULL,
    room_id VARCHAR(32) NOT NULL,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    spielart VARCHAR(50) NOT NULL,
    spielmacher_id VARCHAR(32) NOT NULL,
    partner_id VARCHAR(32),
    
    -- Arrays fuer Spieler-IDs
    spieler_partei VARCHAR(32)[] NOT NULL,
    gegner_partei VARCHAR(32)[] NOT NULL,
    
    punkte INTEGER NOT NULL,
    gewonnen BOOLEAN NOT NULL,
    schneider BOOLEAN DEFAULT FALSE,
    schwarz BOOLEAN DEFAULT FALSE,
    laufende INTEGER DEFAULT 0,
    guthaben_aenderung INTEGER NOT NULL
);

CREATE INDEX idx_games_spielmacher ON game_results(spielmacher_id);
CREATE INDEX idx_games_played_at ON game_results(played_at DESC);
CREATE INDEX idx_games_room ON game_results(room_id);

-- Partitionierung fuer grosse Datenmengen (optional, spaeter)
-- Koennte nach Monat partitioniert werden
```

### 2.6 feedback_reports (Feedback System)

```sql
CREATE TABLE feedback_reports (
    id VARCHAR(32) PRIMARY KEY,  -- Format: fb_xxxxxxxxxxxxx
    user_id VARCHAR(32) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(255),
    
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- KI-verarbeitete Felder
    category VARCHAR(20),  -- 'bug', 'feature', 'question', 'other'
    priority VARCHAR(20),  -- 'critical', 'high', 'medium', 'low'
    severity VARCHAR(20),  -- 'blocker', 'major', 'minor', 'trivial'
    ai_summary TEXT,
    duplicate_of VARCHAR(32),
    duplicate_confidence REAL,
    suggested_labels TEXT[],
    
    -- Kontext als JSONB
    context JSONB NOT NULL,
    
    -- GitHub Integration
    github_issue_number INTEGER,
    github_issue_url TEXT,
    github_exported_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    resolved_in_version VARCHAR(20),
    resolution_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    exported_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    notified_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_feedback_user ON feedback_reports(user_id);
CREATE INDEX idx_feedback_status ON feedback_reports(status);
CREATE INDEX idx_feedback_created ON feedback_reports(created_at DESC);
```

### 2.7 feedback_screenshots

```sql
CREATE TABLE feedback_screenshots (
    id VARCHAR(32) PRIMARY KEY,  -- Format: ss_xxxxxxxxxxxxx
    report_id VARCHAR(32) NOT NULL REFERENCES feedback_reports(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    size INTEGER NOT NULL,
    annotations TEXT,  -- tldraw JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_screenshots_report ON feedback_screenshots(report_id);
```

---

## Teil 3: Migrationsreihenfolge

### Empfohlene Reihenfolge mit Begruendung:

```
Phase 1: User Accounts & Auth (Woche 1-2)
    ↓
Phase 2: User Statistics (Woche 3)
    ↓
Phase 3: Leaderboards (Woche 4)
    ↓
Phase 4: Game History (Woche 5)
    ↓
Phase 5: Feedback System (Woche 6)
    ↓
Phase 6: Cleanup & Redis-Bereinigung (Woche 7)
```

**Begruendung der Reihenfolge:**

1. **User Accounts zuerst**: Alle anderen Tabellen haben Foreign Keys auf `users`. Auth.js Adapter muss zuerst migriert werden.

2. **Statistics vor Leaderboards**: Leaderboards bauen auf Stats auf. Stats muessen korrekt sein, bevor Leaderboards funktionieren.

3. **Leaderboards nach Stats**: Koennen dann die neuen PostgreSQL-Indices nutzen (viel effizienter als Redis ZRANGE).

4. **Game History spaeter**: Weniger kritisch, historische Daten. Koennen parallel weiterlaufen.

5. **Feedback System zuletzt**: Komplett unabhaengig vom Spielsystem, niedrigere Prioritaet.

---

## Teil 4: Implementierungsdetails pro Phase

### Phase 1: User Accounts & Auth Migration

#### 4.1.1 Drizzle Setup

**Neue Dateien:**
```
lib/db/
├── index.ts          # Drizzle Client
├── schema.ts         # Schema-Definitionen
└── migrate.ts        # Migration Runner
```

**`lib/db/schema.ts`:**
```typescript
import { pgTable, varchar, text, timestamp, jsonb, serial, integer, boolean, real, date } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 32 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }).defaultNow(),
  settings: jsonb('settings').default({
    voicePreference: 'male',
    darkMode: false,
    cardDesign: 'bavarian',
    audioVolume: 80,
    soundEffectsEnabled: true,
    speechEnabled: true,
  }),
});

export const oauthAccounts = pgTable('oauth_accounts', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 32 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 20 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow(),
});

export const legacyPlayerLinks = pgTable('legacy_player_links', {
  legacyPlayerId: varchar('legacy_player_id', { length: 32 }).primaryKey(),
  userId: varchar('user_id', { length: 32 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  linkedAt: timestamp('linked_at', { withTimezone: true }).defaultNow(),
});

export const userStats = pgTable('user_stats', {
  userId: varchar('user_id', { length: 32 }).primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  guthaben: integer('guthaben').default(0),
  spieleGesamt: integer('spiele_gesamt').default(0),
  siege: integer('siege').default(0),
  niederlagen: integer('niederlagen').default(0),
  ansagenCount: jsonb('ansagen_count').default({}),
  ansagenWins: jsonb('ansagen_wins').default({}),
  weeklyGuthaben: integer('weekly_guthaben').default(0),
  monthlyGuthaben: integer('monthly_guthaben').default(0),
  weeklyResetAt: date('weekly_reset_at').defaultNow(),
  monthlyResetAt: date('monthly_reset_at').defaultNow(),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
});

export const gameResults = pgTable('game_results', {
  id: serial('id').primaryKey(),
  gameId: varchar('game_id', { length: 32 }).notNull(),
  roomId: varchar('room_id', { length: 32 }).notNull(),
  playedAt: timestamp('played_at', { withTimezone: true }).defaultNow(),
  spielart: varchar('spielart', { length: 50 }).notNull(),
  spielmacherId: varchar('spielmacher_id', { length: 32 }).notNull(),
  partnerId: varchar('partner_id', { length: 32 }),
  spielerPartei: text('spieler_partei').array().notNull(),
  gegnerPartei: text('gegner_partei').array().notNull(),
  punkte: integer('punkte').notNull(),
  gewonnen: boolean('gewonnen').notNull(),
  schneider: boolean('schneider').default(false),
  schwarz: boolean('schwarz').default(false),
  laufende: integer('laufende').default(0),
  guthabenAenderung: integer('guthaben_aenderung').notNull(),
});

export const feedbackReports = pgTable('feedback_reports', {
  id: varchar('id', { length: 32 }).primaryKey(),
  userId: varchar('user_id', { length: 32 }).notNull(),
  userName: varchar('user_name', { length: 100 }).notNull(),
  userEmail: varchar('user_email', { length: 255 }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 20 }),
  priority: varchar('priority', { length: 20 }),
  severity: varchar('severity', { length: 20 }),
  aiSummary: text('ai_summary'),
  duplicateOf: varchar('duplicate_of', { length: 32 }),
  duplicateConfidence: real('duplicate_confidence'),
  suggestedLabels: text('suggested_labels').array(),
  context: jsonb('context').notNull(),
  githubIssueNumber: integer('github_issue_number'),
  githubIssueUrl: text('github_issue_url'),
  githubExportedAt: timestamp('github_exported_at', { withTimezone: true }),
  status: varchar('status', { length: 20 }).default('pending'),
  resolvedInVersion: varchar('resolved_in_version', { length: 20 }),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  exportedAt: timestamp('exported_at', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  notifiedAt: timestamp('notified_at', { withTimezone: true }),
});

export const feedbackScreenshots = pgTable('feedback_screenshots', {
  id: varchar('id', { length: 32 }).primaryKey(),
  reportId: varchar('report_id', { length: 32 }).notNull().references(() => feedbackReports.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 50 }).notNull(),
  size: integer('size').notNull(),
  annotations: text('annotations'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

#### 4.1.2 Dual-Write Adapter Pattern

**Strategie fuer Zero-Downtime:**

```typescript
// lib/auth/postgres-adapter.ts
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '../db';
import { getRedis } from './redis-adapter';

export function HybridAdapter(): Adapter {
  const pgAdapter = DrizzleAdapter(db);
  
  return {
    async createUser(user) {
      // 1. In PostgreSQL schreiben
      const pgUser = await pgAdapter.createUser(user);
      
      // 2. In Redis schreiben (fuer Fallback)
      const r = await getRedis();
      await r.set(`user:${pgUser.id}`, JSON.stringify({...}), { EX: 86400 });
      
      return pgUser;
    },
    
    async getUser(id) {
      // PostgreSQL als Primary
      const pgUser = await pgAdapter.getUser(id);
      if (pgUser) return pgUser;
      
      // Redis als Fallback (waehrend Migration)
      const r = await getRedis();
      const redisData = await r.get(`user:${id}`);
      if (redisData) {
        // Migrate to PostgreSQL on-the-fly
        const user = JSON.parse(redisData);
        await pgAdapter.createUser(user);
        return user;
      }
      
      return null;
    },
    
    // ... weitere Methoden mit Dual-Write
  };
}
```

#### 4.1.3 Datenmigrations-Skript

**`scripts/migrate-users.ts`:**
```typescript
import { getRedis } from '../lib/auth/redis-adapter';
import { db } from '../lib/db';
import { users, oauthAccounts, legacyPlayerLinks } from '../lib/db/schema';

async function migrateUsers() {
  const redis = await getRedis();
  
  // Alle User-Keys holen
  const userKeys = await redis.keys('user:u_*');
  console.log(`Found ${userKeys.length} users to migrate`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const key of userKeys) {
    try {
      const data = await redis.get(key);
      if (!data) continue;
      
      const user = JSON.parse(data);
      
      // In PostgreSQL einfuegen
      await db.transaction(async (tx) => {
        // User
        await tx.insert(users).values({
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          createdAt: new Date(user.createdAt),
          lastLoginAt: new Date(user.lastLoginAt),
          settings: user.settings,
        }).onConflictDoNothing();
        
        // OAuth Accounts
        if (user.providers?.google) {
          await tx.insert(oauthAccounts).values({
            userId: user.id,
            provider: 'google',
            providerAccountId: user.providers.google.id,
            connectedAt: new Date(user.providers.google.connectedAt),
          }).onConflictDoNothing();
        }
        
        if (user.providers?.github) {
          await tx.insert(oauthAccounts).values({
            userId: user.id,
            provider: 'github',
            providerAccountId: user.providers.github.id,
            connectedAt: new Date(user.providers.github.connectedAt),
          }).onConflictDoNothing();
        }
        
        // Legacy Player Links
        for (const legacyId of user.legacyPlayerIds || []) {
          await tx.insert(legacyPlayerLinks).values({
            legacyPlayerId: legacyId,
            userId: user.id,
          }).onConflictDoNothing();
        }
      });
      
      migrated++;
      if (migrated % 100 === 0) {
        console.log(`Migrated ${migrated}/${userKeys.length} users`);
      }
    } catch (error) {
      console.error(`Failed to migrate ${key}:`, error);
      failed++;
    }
  }
  
  console.log(`Migration complete: ${migrated} succeeded, ${failed} failed`);
}

migrateUsers().catch(console.error);
```

### Phase 2: User Statistics Migration

#### 4.2.1 Stats Service Layer

**`lib/stats/postgres-stats.ts`:**
```typescript
import { db } from '../db';
import { userStats } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export async function getUserStats(userId: string) {
  const [stats] = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId));
  
  if (!stats) {
    // Neue Stats erstellen
    const [newStats] = await db
      .insert(userStats)
      .values({ userId })
      .returning();
    return newStats;
  }
  
  return stats;
}

export async function recordGameResult(
  userId: string,
  spielart: string,
  gewonnen: boolean,
  guthabenAenderung: number
) {
  // Atomic update mit JSONB-Operationen
  await db.execute(sql`
    INSERT INTO user_stats (user_id, guthaben, spiele_gesamt, siege, niederlagen, 
                            weekly_guthaben, monthly_guthaben, ansagen_count, ansagen_wins)
    VALUES (${userId}, ${guthabenAenderung}, 1, ${gewonnen ? 1 : 0}, ${gewonnen ? 0 : 1},
            ${guthabenAenderung}, ${guthabenAenderung},
            jsonb_build_object(${spielart}, 1),
            ${gewonnen ? sql`jsonb_build_object(${spielart}, 1)` : sql`'{}'::jsonb`})
    ON CONFLICT (user_id) DO UPDATE SET
      guthaben = user_stats.guthaben + ${guthabenAenderung},
      spiele_gesamt = user_stats.spiele_gesamt + 1,
      siege = user_stats.siege + ${gewonnen ? 1 : 0},
      niederlagen = user_stats.niederlagen + ${gewonnen ? 0 : 1},
      weekly_guthaben = user_stats.weekly_guthaben + ${guthabenAenderung},
      monthly_guthaben = user_stats.monthly_guthaben + ${guthabenAenderung},
      ansagen_count = user_stats.ansagen_count || jsonb_build_object(${spielart}, 
        COALESCE((user_stats.ansagen_count->${spielart})::int, 0) + 1),
      ansagen_wins = CASE WHEN ${gewonnen} THEN
        user_stats.ansagen_wins || jsonb_build_object(${spielart}, 
          COALESCE((user_stats.ansagen_wins->${spielart})::int, 0) + 1)
        ELSE user_stats.ansagen_wins END,
      last_updated = NOW()
  `);
}
```

### Phase 3: Leaderboards Migration

#### 4.3.1 Effiziente Leaderboard-Queries

**`lib/stats/postgres-leaderboard.ts`:**
```typescript
import { db } from '../db';
import { userStats, users } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function getLeaderboard(
  period: 'alltime' | 'weekly' | 'monthly',
  limit: number = 50,
  offset: number = 0
) {
  const scoreColumn = {
    alltime: userStats.guthaben,
    weekly: userStats.weeklyGuthaben,
    monthly: userStats.monthlyGuthaben,
  }[period];
  
  const results = await db
    .select({
      rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${scoreColumn} DESC)`,
      userId: users.id,
      name: users.name,
      image: users.image,
      guthaben: scoreColumn,
      siege: userStats.siege,
      spieleGesamt: userStats.spieleGesamt,
      winRate: sql<number>`CASE WHEN ${userStats.spieleGesamt} > 0 
        THEN ROUND(${userStats.siege}::numeric / ${userStats.spieleGesamt} * 100) 
        ELSE 0 END`,
    })
    .from(userStats)
    .innerJoin(users, eq(users.id, userStats.userId))
    .orderBy(desc(scoreColumn))
    .limit(limit)
    .offset(offset);
  
  return results;
}

export async function getUserRank(
  userId: string,
  period: 'alltime' | 'weekly' | 'monthly'
): Promise<number | null> {
  const scoreColumn = {
    alltime: 'guthaben',
    weekly: 'weekly_guthaben',
    monthly: 'monthly_guthaben',
  }[period];
  
  const result = await db.execute(sql`
    SELECT rank FROM (
      SELECT user_id, ROW_NUMBER() OVER (ORDER BY ${sql.identifier(scoreColumn)} DESC) as rank
      FROM user_stats
    ) ranked
    WHERE user_id = ${userId}
  `);
  
  return result.rows[0]?.rank || null;
}

// Periodischen Reset via Cron Job
export async function resetWeeklyStats() {
  await db.execute(sql`
    UPDATE user_stats 
    SET weekly_guthaben = 0, weekly_reset_at = CURRENT_DATE
    WHERE weekly_reset_at < CURRENT_DATE - INTERVAL '7 days'
  `);
}

export async function resetMonthlyStats() {
  await db.execute(sql`
    UPDATE user_stats 
    SET monthly_guthaben = 0, monthly_reset_at = DATE_TRUNC('month', CURRENT_DATE)
    WHERE monthly_reset_at < DATE_TRUNC('month', CURRENT_DATE)
  `);
}
```

### Phase 4: Game History Migration

**`scripts/migrate-game-history.ts`:**
```typescript
async function migrateGameHistory() {
  const redis = await getRedis();
  
  // Alle Game History Keys
  const historyKeys = await redis.keys('history:game:*');
  console.log(`Found ${historyKeys.length} games to migrate`);
  
  // Batch-Insert fuer Performance
  const batch: typeof gameResults.$inferInsert[] = [];
  
  for (const key of historyKeys) {
    const data = await redis.get(key);
    if (!data) continue;
    
    const game = JSON.parse(data);
    
    batch.push({
      gameId: game.gameId,
      roomId: game.roomId,
      playedAt: new Date(game.timestamp),
      spielart: game.spielart,
      spielmacherId: game.spielmacher,
      partnerId: game.partner,
      spielerPartei: game.spielerPartei,
      gegnerPartei: game.gegnerPartei,
      punkte: game.punkte,
      gewonnen: game.gewonnen,
      schneider: game.schneider,
      schwarz: game.schwarz,
      laufende: game.laufende,
      guthabenAenderung: game.guthabenAenderung,
    });
    
    // Insert in batches of 100
    if (batch.length >= 100) {
      await db.insert(gameResults).values(batch).onConflictDoNothing();
      batch.length = 0;
    }
  }
  
  // Remaining batch
  if (batch.length > 0) {
    await db.insert(gameResults).values(batch).onConflictDoNothing();
  }
}
```

---

## Teil 5: Rollback-Strategie

### 5.1 Feature Flags

```typescript
// lib/config/feature-flags.ts
export const FEATURE_FLAGS = {
  USE_POSTGRES_USERS: process.env.USE_POSTGRES_USERS === 'true',
  USE_POSTGRES_STATS: process.env.USE_POSTGRES_STATS === 'true',
  USE_POSTGRES_LEADERBOARD: process.env.USE_POSTGRES_LEADERBOARD === 'true',
  USE_POSTGRES_HISTORY: process.env.USE_POSTGRES_HISTORY === 'true',
  USE_POSTGRES_FEEDBACK: process.env.USE_POSTGRES_FEEDBACK === 'true',
};
```

### 5.2 Wrapper mit Fallback

```typescript
// lib/stats/index.ts
import { FEATURE_FLAGS } from '../config/feature-flags';
import * as redisStats from './redis-stats';
import * as postgresStats from './postgres-stats';

export async function getUserStats(userId: string) {
  if (FEATURE_FLAGS.USE_POSTGRES_STATS) {
    try {
      return await postgresStats.getUserStats(userId);
    } catch (error) {
      console.error('PostgreSQL failed, falling back to Redis:', error);
      return await redisStats.getUserStats(userId);
    }
  }
  return await redisStats.getUserStats(userId);
}
```

### 5.3 Rollback-Prozedur

1. **Sofort-Rollback:** Feature Flag ausschalten
   ```bash
   export USE_POSTGRES_STATS=false
   pm2 restart schafkopf
   ```

2. **Daten-Sync:** Bei laengerer PostgreSQL-Nutzung muessen Daten zurueck synchronisiert werden
   ```typescript
   // scripts/sync-to-redis.ts
   async function syncStatsToRedis() {
     const allStats = await db.select().from(userStats);
     const redis = await getRedis();
     
     for (const stats of allStats) {
       await redis.set(`stats:user:${stats.userId}`, JSON.stringify(stats));
     }
   }
   ```

---

## Teil 6: Aenderungen an bestehenden Dateien

### 6.1 Zu modifizierende Dateien

| Datei | Aenderung |
|-------|-----------|
| `lib/auth/redis-adapter.ts` | Hybrid-Adapter implementieren |
| `lib/stats.ts` | PostgreSQL-Abfragen, Feature Flags |
| `lib/auth/users.ts` | PostgreSQL-Queries statt Redis |
| `lib/feedback/storage.ts` | PostgreSQL-Storage-Layer |
| `app/api/leaderboard/route.ts` | Neue Leaderboard-Queries |
| `app/api/user/stats/route.ts` | Stats-API anpassen |
| `package.json` | Drizzle Dependencies hinzufuegen |

### 6.2 Neue Dateien

| Datei | Zweck |
|-------|-------|
| `lib/db/index.ts` | Drizzle Client |
| `lib/db/schema.ts` | Schema-Definitionen |
| `drizzle.config.ts` | Drizzle Konfiguration |
| `drizzle/` | SQL-Migrations |
| `scripts/migrate-*.ts` | Datenmigrations-Skripte |
| `lib/config/feature-flags.ts` | Feature Flags |

### 6.3 Unveraendert bleiben (Redis)

| Datei | Grund |
|-------|-------|
| `lib/rooms.ts` | Fluechtige Raum-Daten (TTL 1h) |
| `lib/schafkopf/game-state.ts` | Active Games (TTL 1h) |
| `lib/pusher.ts` | Real-time Events |

---

## Teil 7: Environment Variables

### Neue Variables

```bash
# PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/schafkopf

# Feature Flags (fuer schrittweise Aktivierung)
USE_POSTGRES_USERS=false
USE_POSTGRES_STATS=false
USE_POSTGRES_LEADERBOARD=false
USE_POSTGRES_HISTORY=false
USE_POSTGRES_FEEDBACK=false
```

---

## Teil 8: Checkliste pro Phase

### Phase 1: User Accounts
- [ ] Drizzle installieren: `npm install drizzle-orm pg @auth/drizzle-adapter`
- [ ] `npm install -D drizzle-kit @types/pg`
- [ ] `drizzle.config.ts` erstellen
- [ ] Schema in `lib/db/schema.ts` definieren
- [ ] `drizzle-kit generate` ausfuehren
- [ ] `drizzle-kit migrate` auf VPS
- [ ] Hybrid-Adapter implementieren
- [ ] Migrationsskript ausfuehren
- [ ] Tests durchfuehren
- [ ] Feature Flag aktivieren
- [ ] 24h Monitoring

### Phase 2-5: Analog

---

## Kritische Dateien fuer Implementation

1. **`/Users/cschroeder/Github/schafkopf/lib/auth/redis-adapter.ts`** - Muss zu Hybrid-Adapter werden, behaelt Redis fuer Sessions
2. **`/Users/cschroeder/Github/schafkopf/lib/stats.ts`** - Hauptlogik fuer Stats/Leaderboards, muss PostgreSQL-Queries bekommen
3. **`/Users/cschroeder/Github/schafkopf/lib/auth/types.ts`** - Typen koennen bleiben, Drizzle inferiert Types
4. **`/Users/cschroeder/Github/schafkopf/lib/auth/users.ts`** - CRUD-Operationen muessen PostgreSQL nutzen
5. **`/Users/cschroeder/Github/schafkopf/lib/feedback/storage.ts`** - Komplettes Rewrite fuer PostgreSQL
