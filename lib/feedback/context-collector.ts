/**
 * Context Collector für Feedback-Reports
 * Sammelt automatisch App-Infos, Fehler und Game-State
 */

import type { FeedbackContext } from './types';

// Console Error Buffer (letzten 10 Fehler)
const consoleErrorBuffer: string[] = [];
const MAX_ERRORS = 10;

// Original console.error speichern und überschreiben
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    // Fehler zum Buffer hinzufügen
    const errorMessage = args
      .map((arg) => {
        if (arg instanceof Error) {
          return `${arg.name}: ${arg.message}`;
        }
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');

    consoleErrorBuffer.push(`[${new Date().toISOString()}] ${errorMessage}`);

    // Buffer begrenzen
    while (consoleErrorBuffer.length > MAX_ERRORS) {
      consoleErrorBuffer.shift();
    }

    // Original aufrufen
    originalConsoleError.apply(console, args);
  };
}

/**
 * Aktuellen Feedback-Context sammeln
 */
export async function collectFeedbackContext(): Promise<FeedbackContext> {
  // App-Version holen
  let appVersion = 'unknown';
  let buildTime: string | undefined;

  try {
    const res = await fetch('/schafkopf/api/version');
    if (res.ok) {
      const data = await res.json();
      appVersion = data.version || 'unknown';
      buildTime = data.buildTime;
    }
  } catch {
    // Fallback
  }

  // Game-Context aus URL und localStorage
  let gameId: string | undefined;
  let roomId: string | undefined;

  if (typeof window !== 'undefined') {
    const urlMatch = window.location.pathname.match(/\/game\/([A-Z0-9]+)/);
    if (urlMatch) {
      roomId = urlMatch[1];
      // gameId ist oft gleich roomId
      gameId = roomId;
    }
  }

  // Screen-Größe
  const screenSize =
    typeof window !== 'undefined'
      ? `${window.innerWidth}x${window.innerHeight}`
      : 'unknown';

  return {
    appVersion,
    buildTime,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    screenSize,
    currentUrl: typeof window !== 'undefined' ? window.location.href : 'unknown',
    gameId,
    roomId,
    consoleErrors: [...consoleErrorBuffer],
    timestamp: new Date(),
  };
}

/**
 * Console-Error-Buffer manuell leeren
 */
export function clearErrorBuffer(): void {
  consoleErrorBuffer.length = 0;
}

/**
 * Letzten Fehler zum Buffer hinzufügen (für manuelles Tracking)
 */
export function addErrorToBuffer(error: Error | string): void {
  const errorMessage =
    error instanceof Error ? `${error.name}: ${error.message}` : error;

  consoleErrorBuffer.push(`[${new Date().toISOString()}] ${errorMessage}`);

  while (consoleErrorBuffer.length > MAX_ERRORS) {
    consoleErrorBuffer.shift();
  }
}
