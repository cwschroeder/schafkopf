/**
 * Drizzle ORM Client für Schafkopf
 * PostgreSQL Connection Pool
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Singleton Pool und DB-Instanz
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * PostgreSQL Connection Pool initialisieren
 */
function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString,
      // Pool-Konfiguration für Next.js
      max: 10, // Max Connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Error Handler
    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool error:', err);
    });

    // Connection Logging (nur in Development)
    if (process.env.NODE_ENV === 'development') {
      pool.on('connect', () => {
        console.log('[DB] New client connected');
      });
    }
  }

  return pool;
}

/**
 * Drizzle DB-Instanz holen
 */
export function getDb() {
  if (!db) {
    db = drizzle(getPool(), { schema });
  }
  return db;
}

/**
 * Direkt exportierte DB-Instanz für einfache Imports
 * Lazy-initialized beim ersten Zugriff
 */
export const getDatabase = () => getDb();

// Convenience re-export des Schemas
export * from './schema';

/**
 * Health Check für PostgreSQL
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[DB] Health check failed:', error);
    return false;
  }
}

/**
 * Pool schließen (für Graceful Shutdown)
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    console.log('[DB] Connection pool closed');
  }
}
