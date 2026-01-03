'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { setPlayerVoice } from '@/lib/bavarian-speech';

/**
 * ThemeProvider
 * Wendet Dark Mode Theme und Voice-Preference basierend auf User-Einstellungen an
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Settings aus Session laden (eingeloggte User)
    if (status === 'authenticated' && session?.user) {
      const userSettings = (session.user as { settings?: { darkMode?: boolean; voicePreference?: 'male' | 'female' } }).settings;

      // Dark Mode
      if (userSettings?.darkMode) {
        setTheme('dark');
      } else {
        setTheme('light');
      }

      // Voice Preference
      if (userSettings?.voicePreference) {
        setPlayerVoice(userSettings.voicePreference === 'male' ? 'm' : 'f');
      }
    } else if (status === 'unauthenticated') {
      // Fallback auf localStorage für Gäste
      try {
        const stored = localStorage.getItem('schafkopf-settings');
        if (stored) {
          const settings = JSON.parse(stored);
          if (settings.darkMode) {
            setTheme('dark');
          }
          if (settings.voicePreference) {
            setPlayerVoice(settings.voicePreference === 'male' ? 'm' : 'f');
          }
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [session, status]);

  // Theme auf <html> Element anwenden
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  return <>{children}</>;
}
