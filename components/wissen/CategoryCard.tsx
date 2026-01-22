'use client';

import Link from 'next/link';
import { WissenCategory, WISSEN_CATEGORIES } from '@/lib/wissen/types';
import { hapticTap } from '@/lib/haptics';

interface CategoryCardProps {
  categoryId: WissenCategory;
  articleCount: number;
  completedCount: number;
}

export default function CategoryCard({
  categoryId,
  articleCount,
  completedCount,
}: CategoryCardProps) {
  const category = WISSEN_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return null;

  const progress = articleCount > 0 ? Math.round((completedCount / articleCount) * 100) : 0;
  const isComplete = completedCount === articleCount && articleCount > 0;

  return (
    <Link href={`/wissen/${categoryId}`} className="block">
      <div
        className="relative rounded-xl p-4 transition-all hover:scale-[1.02] cursor-pointer"
        style={{
          background: isComplete
            ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
            : 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
          border: isComplete
            ? '1px solid #10b981'
            : '1px solid rgba(139,90,43,0.5)',
        }}
        onClick={() => hapticTap()}
      >
        {/* Icon */}
        <div className="text-4xl mb-3">{category.icon}</div>

        {/* Titel */}
        <h3 className="font-bold text-amber-200 text-lg">{category.title}</h3>
        <p className="text-amber-100/60 text-sm italic">{category.titleBavarian}</p>

        {/* Beschreibung */}
        <p className="text-amber-100/80 text-sm mt-2">{category.description}</p>

        {/* Fortschritt */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-amber-100/60 mb-1">
            <span>
              {completedCount} / {articleCount} Artikel
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: isComplete
                  ? '#10b981'
                  : 'linear-gradient(90deg, #d97706, #f59e0b)',
              }}
            />
          </div>
        </div>

        {/* Abgeschlossen Badge */}
        {isComplete && (
          <div className="absolute top-3 right-3 text-xl">✓</div>
        )}
      </div>
    </Link>
  );
}
