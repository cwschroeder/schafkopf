'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { hapticTap } from '@/lib/haptics';
import { loadTutorialProgress } from '@/lib/tutorial/progress';
import { LESSONS, LESSON_CATEGORIES, getLessonsByCategory } from '@/lib/tutorial/lessons';
import { UserTutorialState } from '@/lib/tutorial/types';
import LessonCard from '@/components/tutorial/LessonCard';

export default function LektionenPage() {
  const searchParams = useSearchParams();
  const filterCategory = searchParams.get('kategorie');

  const [progress, setProgress] = useState<UserTutorialState | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(filterCategory);

  useEffect(() => {
    setProgress(loadTutorialProgress());
  }, []);

  useEffect(() => {
    if (filterCategory) {
      setActiveCategory(filterCategory);
    }
  }, [filterCategory]);

  // Gruppiere Lektionen nach Kategorie
  const categories = LESSON_CATEGORIES.map(cat => ({
    ...cat,
    lessons: getLessonsByCategory(cat.id),
  }));

  // Filtere wenn eine Kategorie aktiv ist
  const displayCategories = activeCategory
    ? categories.filter(c => c.id === activeCategory)
    : categories;

  return (
    <main className="min-h-screen p-4 safe-area-top safe-area-bottom">
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
          <h1 className="text-2xl font-bold text-amber-400 mt-2">Lektionen</h1>
        </div>

        {/* Kategorie-Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              hapticTap();
              setActiveCategory(null);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              !activeCategory
                ? 'bg-amber-500 text-white'
                : 'bg-amber-900/50 text-amber-200 hover:bg-amber-800/50'
            }`}
          >
            Alle
          </button>
          {LESSON_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                hapticTap();
                setActiveCategory(activeCategory === cat.id ? null : cat.id);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-900/50 text-amber-200 hover:bg-amber-800/50'
              }`}
            >
              {cat.icon} {cat.title}
            </button>
          ))}
        </div>

        {/* Lektionen nach Kategorie */}
        {displayCategories.map(cat => (
          <div key={cat.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{cat.icon}</span>
              <h2 className="text-lg font-semibold text-amber-300">{cat.title}</h2>
              <span className="text-amber-100/50 text-sm">- {cat.description}</span>
            </div>

            <div className="space-y-3">
              {cat.lessons.map(lesson => {
                const lessonProgress = progress?.lessonProgress[lesson.id];
                const isUnlocked = progress?.unlockedLessons.includes(lesson.id) ?? false;
                const isLocked = !isUnlocked && lesson.requiredLessons.length > 0;

                return (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    progress={lessonProgress}
                    locked={isLocked}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Hinweis wenn keine Lektionen */}
        {displayCategories.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            Keine Lektionen in dieser Kategorie gefunden.
          </div>
        )}
      </div>
    </main>
  );
}
