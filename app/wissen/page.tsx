'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { hapticTap } from '@/lib/haptics';
import { WISSEN_CATEGORIES, UserWissenState } from '@/lib/wissen/types';
import { WISSEN_ARTICLES, getArticlesByCategory } from '@/lib/wissen/articles';
import { loadWissenProgress } from '@/lib/wissen/progress';
import CategoryCard from '@/components/wissen/CategoryCard';
import BadgeDisplay from '@/components/wissen/BadgeDisplay';

export default function WissenPage() {
  const [progress, setProgress] = useState<UserWissenState | null>(null);

  useEffect(() => {
    setProgress(loadWissenProgress());
  }, []);

  // Statistiken berechnen
  const totalArticles = WISSEN_ARTICLES.length;
  const completedArticles = progress
    ? Object.values(progress.articleProgress).filter((p) => p.quizCompleted).length
    : 0;
  const overallProgress = totalArticles > 0
    ? Math.round((completedArticles / totalArticles) * 100)
    : 0;

  return (
    <main className="min-h-screen p-4 safe-area-top safe-area-bottom">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="pt-4 mb-6">
          <Link
            href="/lobby"
            className="text-amber-400 text-sm hover:text-amber-300"
            onClick={() => hapticTap()}
          >
            &larr; Zurueck
          </Link>
          <h1 className="text-2xl font-bold text-amber-400 mt-2">
            Rund ums Schafkopf
          </h1>
          <p className="text-amber-100/70 text-sm mt-1">
            Entdecke die Geschichte, Kultur und Sprache des bayerischen Kartenspiels
          </p>
        </div>

        {/* Gesamtfortschritt */}
        <div
          className="rounded-xl p-4 mb-6"
          style={{
            background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
            border: '1px solid rgba(139,90,43,0.5)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-200 font-semibold">Dein Fortschritt</span>
            <span className="text-amber-400 font-bold">{overallProgress}%</span>
          </div>
          <div className="h-3 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${overallProgress}%`,
                background:
                  overallProgress === 100
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : 'linear-gradient(90deg, #d97706, #f59e0b)',
              }}
            />
          </div>
          <div className="text-amber-100/60 text-sm mt-2">
            {completedArticles} von {totalArticles} Artikeln abgeschlossen
          </div>

          {/* Streak Anzeige */}
          {progress && progress.readStreak > 0 && (
            <div className="mt-3 pt-3 border-t border-amber-800/30 flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <span className="text-amber-300 font-semibold">
                {progress.readStreak} {progress.readStreak === 1 ? 'Tag' : 'Tage'} in Folge
              </span>
            </div>
          )}
        </div>

        {/* Kategorien */}
        <h2 className="text-lg font-semibold text-amber-300 mb-3">Kategorien</h2>
        <div className="grid gap-4 mb-8">
          {WISSEN_CATEGORIES.map((category) => {
            const articles = getArticlesByCategory(category.id);
            const completedCount = progress
              ? articles.filter((a) => progress.articleProgress[a.id]?.quizCompleted).length
              : 0;

            return (
              <CategoryCard
                key={category.id}
                categoryId={category.id}
                articleCount={articles.length}
                completedCount={completedCount}
              />
            );
          })}
        </div>

        {/* Badges */}
        <h2 className="text-lg font-semibold text-amber-300 mb-3">Deine Badges</h2>
        <div
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
            border: '1px solid rgba(139,90,43,0.5)',
          }}
        >
          <BadgeDisplay
            earnedBadgeIds={progress?.earnedBadges || []}
            showAll={true}
          />
        </div>

        {/* Info-Box */}
        <div
          className="mt-8 p-4 rounded-lg border border-amber-500/30"
          style={{
            background:
              'linear-gradient(135deg, rgba(217,119,6,0.1) 0%, rgba(180,83,9,0.1) 100%)',
          }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">📚</span>
            <div>
              <div className="text-amber-300 font-semibold mb-1">
                Werde zum Schafkopf-Experten!
              </div>
              <p className="text-amber-100/80 text-sm">
                Lies alle Artikel, bestehe die Quizze und sammle Badges.
                Entdecke dabei spannendes Wissen ueber das bayerische Kulturgut Schafkopf.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
