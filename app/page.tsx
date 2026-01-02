'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore, loadPlayerFromStorage, savePlayerToStorage } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const { playerId, playerName, setPlayer } = useGameStore();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Prüfen ob bereits ein Spieler gespeichert ist
    const stored = loadPlayerFromStorage();
    if (stored) {
      setPlayer(stored.id, stored.name);
      setName(stored.name);
    }
    setIsLoading(false);
  }, [setPlayer]);

  const handleStart = () => {
    if (!name.trim()) return;

    const id = playerId || 'p_' + Math.random().toString(36).substring(2, 12);
    setPlayer(id, name.trim());
    savePlayerToStorage(id, name.trim());
    router.push('/lobby');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Laden...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo / Titel */}
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-amber-400 mb-2">
            Schafkopf
          </h1>
          <p className="text-gray-300">Online mit Freunden spielen</p>
        </div>

        {/* Karten-Deko - echte bayerische Karten */}
        <div className="flex justify-center gap-2 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/schafkopf/cards/Eichel-11.svg" alt="Eichel Ass" className="w-12 h-auto rounded shadow-lg transform -rotate-12" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/schafkopf/cards/Gras-11.svg" alt="Gras Ass" className="w-12 h-auto rounded shadow-lg transform -rotate-4" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/schafkopf/cards/Herz-11.svg" alt="Herz Ass" className="w-12 h-auto rounded shadow-lg transform rotate-4" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/schafkopf/cards/Schellen-11.svg" alt="Schellen Ass" className="w-12 h-auto rounded shadow-lg transform rotate-12" />
        </div>

        {/* Name-Eingabe */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Dein Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="z.B. Sepp"
              className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600
                         focus:border-amber-500 focus:ring-1 focus:ring-amber-500
                         outline-none transition-colors text-white placeholder-gray-400"
              maxLength={20}
            />
          </div>

          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className="w-full btn btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Zur Lobby
          </button>
        </div>

        {/* Spielinfo */}
        <div className="bg-gray-800/30 rounded-lg p-4 text-sm text-gray-400 space-y-2">
          <h3 className="font-semibold text-gray-300">Kurzes Blatt</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Sauspiel, Wenz, Geier, Farbsolo</li>
            <li>Hochzeit, Du, Re</li>
            <li>10 Ct Sauspiel / 20 Ct Solo</li>
            <li>KI-Bots füllen fehlende Spieler auf</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
