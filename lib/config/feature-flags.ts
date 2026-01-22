/**
 * Feature Flags
 *
 * Note: PostgreSQL-Migration ist abgeschlossen.
 * Alle Daten werden nun in PostgreSQL gespeichert.
 * Diese Datei wird für zukünftige Feature Flags beibehalten.
 */

/**
 * Logging für Systemkonfiguration (einmalig beim Start)
 */
export function logFeatureFlags(): void {
  console.log('[System] Database: PostgreSQL');
  console.log('[System] Sessions: JWT (stateless)');
}

/**
 * Helper: Prüft ob PostgreSQL konfiguriert ist
 */
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}
