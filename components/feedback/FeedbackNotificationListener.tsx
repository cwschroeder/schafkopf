'use client';

import { useFeedbackNotifications } from '@/lib/useFeedbackNotifications';

/**
 * Unsichtbare Komponente die Feedback-Benachrichtigungen überwacht
 * Wird in layout.tsx eingebunden und prüft periodisch auf neue Notifications
 */
export default function FeedbackNotificationListener() {
  // Der Hook macht alles automatisch:
  // - Prüft bei App-Start
  // - Prüft bei Visibility-Change
  // - Zeigt Toasts für neue Notifications
  // - Markiert angezeigte Notifications als gelesen
  useFeedbackNotifications();

  // Rendert nichts - ist nur für den Side-Effect
  return null;
}
