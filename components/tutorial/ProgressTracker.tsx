'use client';

import { UserTutorialState } from '@/lib/tutorial/types';

interface ProgressTrackerProps {
  state: UserTutorialState;
  totalLessons: number;
}

export default function ProgressTracker({ state, totalLessons }: ProgressTrackerProps) {
  const completedCount = Object.values(state.lessonProgress).filter(p => p.completed).length;
  const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
        border: '1px solid rgba(139,90,43,0.5)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-amber-200 font-semibold">Dein Fortschritt</span>
        <span className="text-amber-400 font-bold">{percentage}%</span>
      </div>

      {/* Fortschrittsbalken */}
      <div className="h-3 bg-black/30 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)',
          }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mt-3 text-sm">
        <span className="text-amber-100/70">
          {completedCount} von {totalLessons} Lektionen
        </span>
        {state.practiceGamesPlayed > 0 && (
          <span className="text-amber-100/70">
            {state.practiceGamesPlayed} Übungsspiele
          </span>
        )}
      </div>
    </div>
  );
}
