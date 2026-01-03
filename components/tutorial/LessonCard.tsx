'use client';

import Link from 'next/link';
import { Lesson, LessonProgress } from '@/lib/tutorial/types';
import { hapticTap } from '@/lib/haptics';

interface LessonCardProps {
  lesson: Lesson;
  progress?: LessonProgress;
  locked?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  basics: '🎴',
  trump: '👑',
  gameflow: '🔄',
  gametypes: '🎯',
  scoring: '🏆',
  tactics: '🧠',
};

export default function LessonCard({ lesson, progress, locked }: LessonCardProps) {
  const completed = progress?.completed;
  const icon = CATEGORY_ICONS[lesson.category] || '📚';

  const cardContent = (
    <div
      className={`relative rounded-xl p-4 transition-all ${
        locked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] cursor-pointer'
      }`}
      style={{
        background: completed
          ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
          : locked
          ? 'linear-gradient(135deg, #4b5563 0%, #374151 100%)'
          : 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
        border: locked
          ? '1px solid #4b5563'
          : completed
          ? '1px solid #10b981'
          : '1px solid rgba(139,90,43,0.5)',
      }}
      onClick={() => !locked && hapticTap()}
    >
      {/* Status Icon */}
      <div className="absolute top-3 right-3 text-xl">
        {locked ? '🔒' : completed ? '✓' : icon}
      </div>

      {/* Inhalt */}
      <div className="pr-8">
        <h3 className="font-bold text-amber-200 text-lg">{lesson.title}</h3>
        {lesson.titleBavarian && (
          <p className="text-amber-100/60 text-sm italic">{lesson.titleBavarian}</p>
        )}
        <p className="text-amber-100/80 text-sm mt-1">{lesson.description}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-amber-100/60">
          <span>~{lesson.estimatedMinutes} Min.</span>
          {lesson.quiz.length > 0 && <span>{lesson.quiz.length} Fragen</span>}
          {progress?.quizScore !== undefined && progress.quizScore > 0 && (
            <span className="text-green-400">{progress.quizScore}% richtig</span>
          )}
        </div>
      </div>

      {/* Fortschrittsbalken */}
      {progress && !completed && progress.attempts > 0 && (
        <div className="mt-3 h-1 bg-black/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all"
            style={{ width: `${progress.quizScore}%` }}
          />
        </div>
      )}
    </div>
  );

  if (locked) {
    return cardContent;
  }

  return (
    <Link href={`/lernen/lektionen/${lesson.id}`}>
      {cardContent}
    </Link>
  );
}
