'use client';

import Link from 'next/link';
import { WissenArticle, ArticleProgress, WISSEN_CATEGORIES } from '@/lib/wissen/types';
import { hapticTap } from '@/lib/haptics';

interface ArticleCardProps {
  article: WissenArticle;
  progress?: ArticleProgress;
}

export default function ArticleCard({ article, progress }: ArticleCardProps) {
  const completed = progress?.quizCompleted;
  const category = WISSEN_CATEGORIES.find((c) => c.id === article.category);
  const icon = category?.icon || '📚';

  return (
    <Link href={`/wissen/artikel/${article.id}`} className="block">
      <div
        className="relative rounded-xl p-4 transition-all hover:scale-[1.02] cursor-pointer"
        style={{
          background: completed
            ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
            : 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
          border: completed
            ? '1px solid #10b981'
            : '1px solid rgba(139,90,43,0.5)',
        }}
        onClick={() => hapticTap()}
      >
        {/* Status Icon */}
        <div className="absolute top-3 right-3 text-xl">
          {completed ? '✓' : icon}
        </div>

        {/* Inhalt */}
        <div className="pr-8">
          <h3 className="font-bold text-amber-200 text-lg">{article.title}</h3>
          {article.titleBavarian && (
            <p className="text-amber-100/60 text-sm italic">
              {article.titleBavarian}
            </p>
          )}
          <p className="text-amber-100/80 text-sm mt-1">{article.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-amber-100/60">
            <span>~{article.estimatedMinutes} Min.</span>
            {article.quiz.length > 0 && <span>{article.quiz.length} Fragen</span>}
            {progress?.quizScore !== undefined && progress.quizScore > 0 && (
              <span className="text-green-400">{progress.quizScore}% richtig</span>
            )}
          </div>
        </div>

        {/* Fortschrittsbalken bei angefangenen aber nicht abgeschlossenen Artikeln */}
        {progress && !completed && progress.attempts > 0 && (
          <div className="mt-3 h-1 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${progress.quizScore}%` }}
            />
          </div>
        )}

        {/* Gelesen-Indikator */}
        {progress?.read && !completed && (
          <div className="mt-2 text-xs text-amber-300/70">Angefangen</div>
        )}
      </div>
    </Link>
  );
}
