'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import VoiceSelector from './VoiceSelector';
import ThemeToggle from './ThemeToggle';
import VolumeSlider from './VolumeSlider';
import { hapticMedium, hapticSuccess } from '@/lib/haptics';
import { apiUrl } from '@/lib/api';
import { UserSettings, DEFAULT_USER_SETTINGS } from '@/lib/auth/types';

interface SettingsFormProps {
  onSave?: () => void;
}

export default function SettingsForm({ onSave }: SettingsFormProps) {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Settings vom Server laden
  useEffect(() => {
    if (status === 'authenticated') {
      fetch(apiUrl('/api/user/settings'))
        .then(res => res.json())
        .then(data => {
          if (data.settings) {
            setSettings(data.settings);
          }
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    } else if (status === 'unauthenticated') {
      // Fallback auf localStorage für Gäste
      const stored = localStorage.getItem('schafkopf-settings');
      if (stored) {
        try {
          setSettings({ ...DEFAULT_USER_SETTINGS, ...JSON.parse(stored) });
        } catch {
          // Ignore invalid JSON
        }
      }
      setIsLoading(false);
    }
  }, [status]);

  // Settings updaten
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  // Speichern
  const handleSave = async () => {
    hapticMedium();
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      if (status === 'authenticated') {
        const res = await fetch(apiUrl('/api/user/settings'), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });

        if (!res.ok) throw new Error('Save failed');
      } else {
        // Für Gäste: localStorage
        localStorage.setItem('schafkopf-settings', JSON.stringify(settings));
      }

      hapticSuccess();
      setSaveStatus('success');
      setHasChanges(false);
      onSave?.();
      
      // Status nach 3 Sekunden zurücksetzen
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Settings save error:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Voice Preference */}
      <VoiceSelector
        value={settings.voicePreference}
        onChange={(value) => updateSetting('voicePreference', value)}
        disabled={isSaving}
      />

      {/* Dark Mode */}
      <ThemeToggle
        value={settings.darkMode}
        onChange={(value) => updateSetting('darkMode', value)}
        disabled={isSaving}
      />

      {/* Volume */}
      <VolumeSlider
        value={settings.audioVolume}
        onChange={(value) => updateSetting('audioVolume', value)}
        disabled={isSaving}
      />

      {/* Sound Effects Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-amber-200">
            Sound-Effekte
          </label>
          <p className="text-xs text-amber-400/60 mt-0.5">
            Klick- und Spielgeräusche
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.soundEffectsEnabled}
          onClick={() => updateSetting('soundEffectsEnabled', !settings.soundEffectsEnabled)}
          disabled={isSaving}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors duration-200 ease-in-out
            ${settings.soundEffectsEnabled ? 'bg-amber-600' : 'bg-amber-900/50'}
            ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white shadow-lg
              transition duration-200 ease-in-out
              ${settings.soundEffectsEnabled ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Speech Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-amber-200">
            Sprachausgabe
          </label>
          <p className="text-xs text-amber-400/60 mt-0.5">
            Ansagen und Spielkommentare vorlesen
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.speechEnabled}
          onClick={() => updateSetting('speechEnabled', !settings.speechEnabled)}
          disabled={isSaving}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors duration-200 ease-in-out
            ${settings.speechEnabled ? 'bg-amber-600' : 'bg-amber-900/50'}
            ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white shadow-lg
              transition duration-200 ease-in-out
              ${settings.speechEnabled ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-amber-800/30">
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className={`
            w-full py-3 px-4 rounded-lg font-medium
            transition-all duration-200
            ${hasChanges
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-amber-800/50 text-amber-400/50 cursor-not-allowed'
            }
            ${isSaving ? 'opacity-75' : ''}
          `}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="spinner w-5 h-5" />
              Speichert...
            </span>
          ) : saveStatus === 'success' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Gespeichert!
            </span>
          ) : saveStatus === 'error' ? (
            <span className="text-red-400">Fehler beim Speichern</span>
          ) : (
            'Einstellungen speichern'
          )}
        </button>

        {status === 'unauthenticated' && (
          <p className="text-xs text-amber-400/50 text-center mt-2">
            Einstellungen werden lokal gespeichert. Mit einem Account werden sie synchronisiert.
          </p>
        )}
      </div>
    </div>
  );
}
