/**
 * Feature Flags für schrittweise PostgreSQL-Migration
 *
 * Ermöglicht Zero-Downtime Migration durch:
 * - Dual-Write während Migration
 * - Sofortiges Rollback durch Flag-Änderung
 * - Unabhängige Aktivierung pro System
 */

/**
 * Feature Flags für PostgreSQL-Migration
 * Jedes Flag aktiviert PostgreSQL als Primary für ein System
 */
export const FEATURE_FLAGS = {
  /**
   * User Accounts (Auth.js)
   * - true: PostgreSQL für User-Daten, Redis für Sessions
   * - false: Redis für alles (Fallback)
   */
  USE_POSTGRES_USERS: process.env.USE_POSTGRES_USERS === 'true',

  /**
   * User Statistics (Guthaben, Siege, etc.)
   * - true: PostgreSQL für Stats
   * - false: Redis für Stats
   */
  USE_POSTGRES_STATS: process.env.USE_POSTGRES_STATS === 'true',

  /**
   * Leaderboards (All-time, Weekly, Monthly)
   * - true: PostgreSQL mit SQL-Indices
   * - false: Redis Sorted Sets
   */
  USE_POSTGRES_LEADERBOARD: process.env.USE_POSTGRES_LEADERBOARD === 'true',

  /**
   * Game History (Spielergebnisse)
   * - true: PostgreSQL (permanent)
   * - false: Redis mit 90d TTL
   */
  USE_POSTGRES_HISTORY: process.env.USE_POSTGRES_HISTORY === 'true',

  /**
   * Feedback System
   * - true: PostgreSQL
   * - false: Redis mit 30d TTL
   */
  USE_POSTGRES_FEEDBACK: process.env.USE_POSTGRES_FEEDBACK === 'true',

  /**
   * Dual-Write Mode
   * Schreibt in beide Systeme während Migration
   * Sollte während aktiver Migration true sein
   */
  DUAL_WRITE_ENABLED: process.env.DUAL_WRITE_ENABLED === 'true',
} as const;

/**
 * Logging für Feature Flags (einmalig beim Start)
 */
export function logFeatureFlags(): void {
  console.log('[Feature Flags] PostgreSQL Migration Status:');
  console.log(`  Users:       ${FEATURE_FLAGS.USE_POSTGRES_USERS ? 'PostgreSQL' : 'Redis'}`);
  console.log(`  Stats:       ${FEATURE_FLAGS.USE_POSTGRES_STATS ? 'PostgreSQL' : 'Redis'}`);
  console.log(`  Leaderboard: ${FEATURE_FLAGS.USE_POSTGRES_LEADERBOARD ? 'PostgreSQL' : 'Redis'}`);
  console.log(`  History:     ${FEATURE_FLAGS.USE_POSTGRES_HISTORY ? 'PostgreSQL' : 'Redis'}`);
  console.log(`  Feedback:    ${FEATURE_FLAGS.USE_POSTGRES_FEEDBACK ? 'PostgreSQL' : 'Redis'}`);
  console.log(`  Dual-Write:  ${FEATURE_FLAGS.DUAL_WRITE_ENABLED ? 'Enabled' : 'Disabled'}`);
}

/**
 * Helper: Prüft ob mindestens ein PostgreSQL-Feature aktiv ist
 */
export function isPostgresEnabled(): boolean {
  return (
    FEATURE_FLAGS.USE_POSTGRES_USERS ||
    FEATURE_FLAGS.USE_POSTGRES_STATS ||
    FEATURE_FLAGS.USE_POSTGRES_LEADERBOARD ||
    FEATURE_FLAGS.USE_POSTGRES_HISTORY ||
    FEATURE_FLAGS.USE_POSTGRES_FEEDBACK
  );
}

/**
 * Helper: Prüft ob alle PostgreSQL-Features aktiv sind
 */
export function isFullyMigrated(): boolean {
  return (
    FEATURE_FLAGS.USE_POSTGRES_USERS &&
    FEATURE_FLAGS.USE_POSTGRES_STATS &&
    FEATURE_FLAGS.USE_POSTGRES_LEADERBOARD &&
    FEATURE_FLAGS.USE_POSTGRES_HISTORY &&
    FEATURE_FLAGS.USE_POSTGRES_FEEDBACK &&
    !FEATURE_FLAGS.DUAL_WRITE_ENABLED
  );
}
