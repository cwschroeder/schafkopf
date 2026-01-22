'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useGameStore } from './store';
import { apiUrl } from './api';
import type { PendingNotification } from './feedback/types';

interface FeedbackNotificationState {
  notifications: PendingNotification[];
  hasNotifications: boolean;
  isLoading: boolean;
}

// Wie lange nach dem Schließen keine Notifications mehr zeigen (Session-basiert)
const LAST_CHECK_KEY = 'feedback-notifications-last-check';
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 Minuten

/**
 * Hook zum Prüfen und Anzeigen von Feedback-Benachrichtigungen
 * - Prüft bei App-Start und Visibility-Change
 * - Zeigt Toasts für gelöste Issues
 * - Markiert Notifications als gelesen nach Anzeige
 */
export function useFeedbackNotifications() {
  const { data: session } = useSession();
  const { playerId, addMessage } = useGameStore();
  const [state, setState] = useState<FeedbackNotificationState>({
    notifications: [],
    hasNotifications: false,
    isLoading: false,
  });

  const lastCheckRef = useRef<number>(0);
  const shownNotificationsRef = useRef<Set<string>>(new Set());

  // User-ID ermitteln
  const userId = session?.user?.id || playerId;

  // Notifications vom Server abrufen
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    // Throttle: Nicht öfter als alle 30 Sekunden prüfen
    const now = Date.now();
    if (now - lastCheckRef.current < 30000) {
      return;
    }
    lastCheckRef.current = now;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const headers: HeadersInit = {};
      if (userId.startsWith('p_')) {
        headers['x-user-id'] = userId;
      }

      const res = await fetch(apiUrl('/api/feedback/notifications'), {
        headers,
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error('Fetch fehlgeschlagen');
      }

      const data = await res.json();

      setState({
        notifications: data.notifications || [],
        hasNotifications: (data.notifications || []).length > 0,
        isLoading: false,
      });

      // Neue Notifications als Toasts anzeigen
      const newNotifications = (data.notifications || []).filter(
        (n: PendingNotification) => !shownNotificationsRef.current.has(n.reportId)
      );

      if (newNotifications.length > 0) {
        newNotifications.forEach((notification: PendingNotification) => {
          // Toast anzeigen
          addMessage(
            'success',
            `✅ Dein Feedback "${notification.reportTitle}" wurde bearbeitet!`
          );
          shownNotificationsRef.current.add(notification.reportId);
        });

        // Nach Anzeige als gelesen markieren
        await markAsRead(newNotifications.map((n: PendingNotification) => n.reportId));
      }
    } catch (error) {
      console.error('[FeedbackNotifications] Fehler:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [userId, addMessage]);

  // Notifications als gelesen markieren
  const markAsRead = async (reportIds: string[]) => {
    if (!userId || reportIds.length === 0) return;

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (userId.startsWith('p_')) {
        headers['x-user-id'] = userId;
      }

      await fetch(apiUrl('/api/feedback/notifications'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ reportIds }),
      });

      // State aktualisieren
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.filter(
          (n) => !reportIds.includes(n.reportId)
        ),
        hasNotifications: prev.notifications.length - reportIds.length > 0,
      }));
    } catch (error) {
      console.error('[FeedbackNotifications] Markieren fehlgeschlagen:', error);
    }
  };

  // Initial und bei Visibility-Change prüfen
  useEffect(() => {
    if (!userId) return;

    // Initiale Prüfung nach 2 Sekunden (App muss erst laden)
    const initialTimeout = setTimeout(fetchNotifications, 2000);

    // Periodische Prüfung
    const interval = setInterval(fetchNotifications, CHECK_INTERVAL_MS);

    // Bei Visibility-Change prüfen
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, fetchNotifications]);

  return {
    notifications: state.notifications,
    hasNotifications: state.hasNotifications,
    isLoading: state.isLoading,
    refetch: fetchNotifications,
    markAsRead,
  };
}
