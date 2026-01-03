'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { hapticTap } from '@/lib/haptics';
import { loadTutorialProgress } from '@/lib/tutorial/progress';
import { LESSONS, LESSON_CATEGORIES } from '@/lib/tutorial/lessons';
import { UserTutorialState } from '@/lib/tutorial/types';
import ProgressTracker from '@/components/tutorial/ProgressTracker';

export default function TutorialHome() {
  const router = useRouter();
  const [progress, setProgress] = useState<UserTutorialState | null>(null);

  useEffect(() => {
    setProgress(loadTutorialProgress());
  }, []);

  const completedCount = progress
    ? Object.values(progress.lessonProgress).filter(p => p.completed).length
    : 0;

  const hasStarted = completedCount > 0;

  return (
    <main className="min-h-screen p-4 safe-area-top safe-area-bottom">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="text-amber-400 text-sm hover:text-amber-300"
            onClick={() => hapticTap()}
          >
            &larr; Zur Startseite
          </Link>
          <h1 className="text-3xl font-bold text-amber-400 mt-3">
            Schafkopf lernen
          </h1>
          <p className="text-gray-300 mt-1">
            Vom Anfänger zum Profi
          </p>
        </div>

        {/* Fortschritt */}
        {progress && (
          <ProgressTracker state={progress} totalLessons={LESSONS.length} />
        )}

        {/* Hauptoptionen */}
        <div className="grid gap-4">
          {/* Lektionen */}
          <button
            onClick={() => {
              hapticTap();
              router.push('/lernen/lektionen');
            }}
            className="w-full text-left rounded-xl p-5 transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
              border: '1px solid rgba(139,90,43,0.5)',
            }}
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">📚</span>
              <div>
                <h3 className="font-bold text-amber-200 text-lg">Lektionen</h3>
                <p className="text-amber-100/70 text-sm">
                  Interaktives Lernen mit Quiz
                </p>
                {hasStarted && (
                  <p className="text-amber-400 text-xs mt-1">
                    {completedCount} von {LESSONS.length} abgeschlossen
                  </p>
                )}
              </div>
            </div>
          </button>

          {/* Regelwerk */}
          <button
            onClick={() => {
              hapticTap();
              router.push('/lernen/regelbuch');
            }}
            className="w-full text-left rounded-xl p-5 transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
              border: '1px solid rgba(139,90,43,0.5)',
            }}
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">📖</span>
              <div>
                <h3 className="font-bold text-amber-200 text-lg">Regelbuch</h3>
                <p className="text-amber-100/70 text-sm">
                  Nachschlagen & Suchen
                </p>
              </div>
            </div>
          </button>

          {/* Übungsmodus */}
          <button
            onClick={() => {
              hapticTap();
              router.push('/lernen/ueben');
            }}
            className="w-full text-left rounded-xl p-5 transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
              border: '1px solid rgba(139,90,43,0.5)',
            }}
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">🎮</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-amber-200 text-lg">Übungsspiel</h3>
                  <span
                    className="px-2 py-0.5 text-xs rounded-full"
                    style={{ background: '#d97706', color: 'white' }}
                  >
                    Mit Tipps
                  </span>
                </div>
                <p className="text-amber-100/70 text-sm">
                  Gegen Bots mit Hilfestellungen
                </p>
                {progress && progress.practiceGamesPlayed > 0 && (
                  <p className="text-amber-400 text-xs mt-1">
                    {progress.practiceGamesPlayed} Spiele gespielt
                  </p>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Quick Start für Anfänger */}
        {!hasStarted && (
          <div
            className="rounded-xl p-5 mt-4"
            style={{
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            }}
          >
            <h3 className="font-bold text-white text-lg">Neu hier?</h3>
            <p className="text-amber-100 text-sm mt-1">
              Starte mit den Grundlagen und lerne Schritt für Schritt das
              bayerische Kartenspiel.
            </p>
            <button
              onClick={() => {
                hapticTap();
                router.push('/lernen/lektionen/basics-kartenspiel');
              }}
              className="mt-4 px-5 py-2 bg-white text-amber-800 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
            >
              Los geht&apos;s!
            </button>
          </div>
        )}

        {/* Kategorien-Übersicht */}
        <div className="pt-4">
          <h2 className="text-lg font-semibold text-amber-300 mb-3">
            Themengebiete
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {LESSON_CATEGORIES.map(cat => {
              const catLessons = LESSONS.filter(l => l.category === cat.id);
              const catCompleted = progress
                ? catLessons.filter(l => progress.lessonProgress[l.id]?.completed).length
                : 0;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    hapticTap();
                    router.push(`/lernen/lektionen?kategorie=${cat.id}`);
                  }}
                  className="rounded-lg p-3 text-left transition-all hover:scale-[1.02]"
                  style={{
                    background:
                      catCompleted === catLessons.length && catLessons.length > 0
                        ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                        : 'rgba(62, 39, 35, 0.7)',
                    border: '1px solid rgba(139,90,43,0.3)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-amber-200 font-medium text-sm">
                      {cat.title}
                    </span>
                  </div>
                  <p className="text-amber-100/50 text-xs mt-1">
                    {catCompleted}/{catLessons.length} Lektionen
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
