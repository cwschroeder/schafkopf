/**
 * Haptic Feedback Utility für Mobile
 * Verwendet die Vibration API für haptisches Feedback
 */

// Prüft ob Vibration unterstützt wird
export const supportsHaptics = (): boolean => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

// Basis-Vibration
const vibrate = (pattern: number | number[]): void => {
  if (supportsHaptics()) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently fail - manche Browser blockieren Vibration
    }
  }
};

/**
 * Kurzer Tap - für Kartenauswahl, UI-Interaktionen
 */
export const hapticTap = (): void => {
  vibrate(10);
};

/**
 * Medium Feedback - für wichtige Aktionen wie Karte spielen
 */
export const hapticMedium = (): void => {
  vibrate(30);
};

/**
 * Erfolgs-Feedback - für Sieg, erfolgreiche Aktionen
 */
export const hapticSuccess = (): void => {
  vibrate([30, 50, 30]);
};

/**
 * Fehler-Feedback - für Niederlage, ungültige Aktionen
 */
export const hapticError = (): void => {
  vibrate([50, 30, 50, 30, 100]);
};

/**
 * Warnung-Feedback - für Kontra, Ansagen
 */
export const hapticWarning = (): void => {
  vibrate([20, 10, 20]);
};

/**
 * Lang - für besondere Momente (Schwarz, Tout)
 */
export const hapticLong = (): void => {
  vibrate(100);
};

/**
 * Stich gewonnen - positives kurzes Feedback
 */
export const hapticStichGewonnen = (): void => {
  vibrate([15, 30, 15]);
};

/**
 * Ansage gemacht
 */
export const hapticAnsage = (): void => {
  vibrate([20, 20, 40]);
};

/**
 * Spiel gewonnen
 */
export const hapticGewonnen = (): void => {
  vibrate([30, 50, 30, 50, 60]);
};

/**
 * Spiel verloren
 */
export const hapticVerloren = (): void => {
  vibrate([100, 50, 100]);
};
