'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UpdateState {
  updateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 Minuten
const DISMISSED_KEY = 'update-banner-dismissed';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 Stunden

export function useUpdateCheck() {
  const [state, setState] = useState<UpdateState>({
    updateAvailable: false,
    registration: null,
  });
  const [dismissed, setDismissed] = useState(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Prüfe ob Banner kürzlich geschlossen wurde
  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION_MS) {
        setDismissed(true);
      } else {
        localStorage.removeItem(DISMISSED_KEY);
      }
    }
  }, []);

  // Check für Service Worker Updates
  const checkForUpdate = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;

      // Trigger Update-Check
      await registration.update();

      // Prüfe ob neue Version wartet
      if (registration.waiting) {
        setState({ updateAvailable: true, registration });
        return;
      }

      // Listener für künftige Updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Neue Version installiert, wartet auf Aktivierung
              setState({ updateAvailable: true, registration });
            }
          });
        }
      });

      setState(prev => ({ ...prev, registration }));
    } catch (error) {
      console.error('[UpdateCheck] Fehler beim Update-Check:', error);
    }
  }, []);

  // Initiale Prüfung und periodischer Check
  useEffect(() => {
    // Initiale Prüfung nach 3 Sekunden (App muss erst laden)
    const initialTimeout = setTimeout(checkForUpdate, 3000);

    // Periodische Prüfung
    checkIntervalRef.current = setInterval(checkForUpdate, CHECK_INTERVAL_MS);

    // Prüfe auch wenn App wieder in Vordergrund kommt
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimeout);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdate]);

  // Update durchführen
  const performUpdate = useCallback(() => {
    if (state.registration?.waiting) {
      // Sage dem wartenden SW, dass er aktivieren soll
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    // Reload nach kurzer Verzögerung
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, [state.registration]);

  // Banner schließen
  const dismissUpdate = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  }, []);

  return {
    updateAvailable: state.updateAvailable && !dismissed,
    performUpdate,
    dismissUpdate,
  };
}
