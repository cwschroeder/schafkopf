'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { hapticTap } from '@/lib/haptics';
import { loadTutorialProgress, recordPracticeGame, saveTutorialProgress } from '@/lib/tutorial/progress';
import { apiUrl } from '@/lib/api';
import { savePlayerToStorage } from '@/lib/store';
import { UserTutorialState } from '@/lib/tutorial/types';

export default function UebenPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<UserTutorialState | null>(null);
  const [hintsEnabled, setHintsEnabled] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    setProgress(loadTutorialProgress());
  }, []);

  const handleStartPractice = async () => {
    if (isStarting) return;
    setIsStarting(true);
    hapticTap();

    try {
      // Übungsspiel registrieren
      if (progress) {
        const updatedProgress = recordPracticeGame(progress, hintsEnabled);
        setProgress(updatedProgress);
      }

      // Practice-ID: Verwende existierende oder erstelle neue
      // Wichtig: Wir generieren die ID ERST kurz vor dem API-Call um Race Conditions zu vermeiden
      const existingPlayer = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('schafkopf-player') || 'null')
        : null;

      // Nur existierende Practice-ID wiederverwenden (nicht normale Spieler-IDs)
      const practicePlayerId = existingPlayer?.id?.startsWith('practice_')
        ? existingPlayer.id
        : 'practice_' + Date.now();
      const practicePlayerName = 'Übender';
      savePlayerToStorage(practicePlayerId, practicePlayerName);

      // Erstelle einen Praxis-Raum
      const response = await fetch(apiUrl('/api/rooms'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: 'Übungsspiel',
          playerId: practicePlayerId,
          playerName: practicePlayerName,
          isPractice: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Speichere Hint-Einstellung
        if (typeof window !== 'undefined') {
          localStorage.setItem('schafkopf-practice-hints', hintsEnabled ? 'true' : 'false');
        }
        router.push(`/game/${data.room.id}?practice=true&hints=${hintsEnabled}`);
      } else {
        console.error('Fehler beim Erstellen des Übungsspiels');
        setIsStarting(false);
      }
    } catch (error) {
      console.error('Fehler:', error);
      setIsStarting(false);
    }
  };

  return (
    <main className="min-h-screen p-4 pb-24 safe-area-top safe-area-bottom">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="pt-4">
          <Link
            href="/lernen"
            className="text-amber-400 text-sm hover:text-amber-300"
            onClick={() => hapticTap()}
          >
            &larr; Zurück
          </Link>
          <h1 className="text-2xl font-bold text-amber-400 mt-2">Übungsmodus</h1>
          <p className="text-amber-100/60 text-sm mt-1">
            Spiele gegen Bots und lerne dabei
          </p>
        </div>

        {/* Beschreibung */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
            border: '1px solid rgba(139,90,43,0.5)',
          }}
        >
          <div className="flex items-start gap-4">
            <span className="text-4xl">🎮</span>
            <div>
              <h3 className="font-bold text-amber-200 text-lg">So funktioniert&apos;s</h3>
              <ul className="text-amber-100/80 text-sm mt-2 space-y-2">
                <li className="flex items-start gap-2">
                  <span>🤖</span>
                  <span>Du spielst gegen 3 Computer-Gegner</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>💡</span>
                  <span>Bei aktivierten Tipps zeigen wir dir die optimale Karte</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>📊</span>
                  <span>Nach jedem Stich siehst du eine Analyse</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🎯</span>
                  <span>Kein Druck - übe so lange du willst!</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Einstellungen */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
            border: '1px solid rgba(139,90,43,0.5)',
          }}
        >
          <h3 className="font-semibold text-amber-300 mb-4">Einstellungen</h3>

          {/* Tipps Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-200 font-medium">Tipps anzeigen</p>
              <p className="text-amber-100/60 text-sm">
                Zeigt die optimale Karte mit Erklärung
              </p>
            </div>
            <button
              onClick={() => {
                hapticTap();
                setHintsEnabled(!hintsEnabled);
              }}
              className={`w-14 h-8 rounded-full transition-all relative ${
                hintsEnabled ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${
                  hintsEnabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Statistik */}
        {progress && progress.practiceGamesPlayed > 0 && (
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(62, 39, 35, 0.5)',
              border: '1px solid rgba(139,90,43,0.3)',
            }}
          >
            <h3 className="font-semibold text-amber-300 mb-2">Deine Statistik</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-amber-400">
                  {progress.practiceGamesPlayed}
                </p>
                <p className="text-amber-100/60 text-sm">Übungsspiele</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-400">
                  {progress.practiceGamesWithHints}
                </p>
                <p className="text-amber-100/60 text-sm">mit Tipps</p>
              </div>
            </div>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={handleStartPractice}
          disabled={isStarting}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            color: 'white',
          }}
        >
          {isStarting ? 'Starte...' : 'Übungsspiel starten'}
        </button>

        {/* Hinweis */}
        <p className="text-center text-amber-100/50 text-sm">
          Übungsspiele zählen nicht für die Bestenliste
        </p>
      </div>
    </main>
  );
}
