'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiUrl } from '@/lib/api';
import { hapticTap, hapticSuccess } from '@/lib/haptics';

interface LinkLegacyPromptProps {
  legacyPlayerId: string;
  onLinked?: () => void;
  onDismiss?: () => void;
}

export default function LinkLegacyPrompt({
  legacyPlayerId,
  onLinked,
  onDismiss,
}: LinkLegacyPromptProps) {
  const { data: session } = useSession();
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Nicht anzeigen wenn nicht eingeloggt
  if (!session) return null;

  // Nicht anzeigen wenn erfolgreich verknüpft
  if (success) return null;

  const handleLink = async () => {
    hapticTap();
    setIsLinking(true);
    setError(null);

    try {
      const res = await fetch(apiUrl('/api/auth/link-legacy'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legacyPlayerId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verknüpfung fehlgeschlagen');
      }

      hapticSuccess();
      setSuccess(true);
      // Verknüpfung in localStorage merken, damit Dialog nicht wieder erscheint
      localStorage.setItem(`schafkopf-link-done-${legacyPlayerId}`, 'true');
      onLinked?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsLinking(false);
    }
  };

  const handleDismiss = () => {
    hapticTap();
    // In localStorage merken dass abgelehnt wurde
    localStorage.setItem(`schafkopf-link-dismissed-${legacyPlayerId}`, 'true');
    onDismiss?.();
  };

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'linear-gradient(135deg, #1e3a2f 0%, #2d4a3e 100%)',
        border: '1px solid rgba(45, 212, 191, 0.3)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">🔗</div>
        <div className="flex-1">
          <h3 className="font-semibold text-teal-100">
            Bisherige Spiele übernehmen?
          </h3>
          <p className="text-sm text-teal-300/80 mt-1">
            Du hast bereits als Gast gespielt. Möchtest du deine bisherigen Statistiken
            mit deinem Account verknüpfen?
          </p>

          {error && (
            <p className="text-sm text-red-400 mt-2">{error}</p>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleLink}
              disabled={isLinking}
              className="
                px-4 py-2 rounded-lg text-sm font-medium
                bg-teal-600 hover:bg-teal-500 text-white
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              {isLinking ? (
                <span className="flex items-center gap-2">
                  <span className="spinner w-4 h-4" />
                  Verknüpfe...
                </span>
              ) : (
                'Ja, verknüpfen'
              )}
            </button>
            <button
              onClick={handleDismiss}
              disabled={isLinking}
              className="
                px-4 py-2 rounded-lg text-sm
                text-teal-300 hover:text-teal-200
                transition-colors
              "
            >
              Nein, danke
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
