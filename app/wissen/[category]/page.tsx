'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { hapticTap } from '@/lib/haptics';
import {
  WissenCategory,
  WISSEN_CATEGORIES,
  UserWissenState,
} from '@/lib/wissen/types';
import { getArticlesByCategory } from '@/lib/wissen/articles';
import { loadWissenProgress, getCategoryProgress } from '@/lib/wissen/progress';
import ArticleCard from '@/components/wissen/ArticleCard';

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.category as WissenCategory;

  const [progress, setProgress] = useState<UserWissenState | null>(null);

  useEffect(() => {
    setProgress(loadWissenProgress());
  }, []);

  const category = WISSEN_CATEGORIES.find((c) => c.id === categoryId);
  const articles = getArticlesByCategory(categoryId);

  if (!category) {
    return (
      <main className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl text-amber-400 mb-4">Kategorie nicht gefunden</h1>
          <Link href="/wissen" className="text-amber-300 underline">
            Zurueck zur Uebersicht
          </Link>
        </div>
      </main>
    );
  }

  const categoryProgress = progress
    ? getCategoryProgress(
        progress,
        articles.map((a) => a.id)
      )
    : { completed: 0, total: articles.length, percent: 0 };

  return (
    <main className="min-h-screen p-4 safe-area-top safe-area-bottom">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="pt-4 mb-6">
          <Link
            href="/wissen"
            className="text-amber-400 text-sm hover:text-amber-300"
            onClick={() => hapticTap()}
          >
            &larr; Alle Kategorien
          </Link>

          {/* Kategorie-Header */}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-4xl">{category.icon}</span>
            <div>
              <h1 className="text-2xl font-bold text-amber-400">
                {category.title}
              </h1>
              <p className="text-amber-100/60 text-sm italic">
                {category.titleBavarian}
              </p>
            </div>
          </div>
          <p className="text-amber-100/80 text-sm mt-2">{category.description}</p>
        </div>

        {/* Fortschritt */}
        <div
          className="rounded-xl p-4 mb-6"
          style={{
            background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
            border: '1px solid rgba(139,90,43,0.5)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-200 font-semibold">Fortschritt</span>
            <span className="text-amber-400 font-bold">
              {categoryProgress.percent}%
            </span>
          </div>
          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${categoryProgress.percent}%`,
                background:
                  categoryProgress.percent === 100
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : 'linear-gradient(90deg, #d97706, #f59e0b)',
              }}
            />
          </div>
          <div className="text-amber-100/60 text-sm mt-1">
            {categoryProgress.completed} von {categoryProgress.total} Artikeln
          </div>
        </div>

        {/* Artikel-Liste */}
        <h2 className="text-lg font-semibold text-amber-300 mb-3">Artikel</h2>
        <div className="space-y-4">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              progress={progress?.articleProgress[article.id]}
            />
          ))}
        </div>

        {/* Leere Liste */}
        {articles.length === 0 && (
          <div className="text-center text-amber-100/60 py-8">
            Noch keine Artikel in dieser Kategorie.
          </div>
        )}
      </div>
    </main>
  );
}
