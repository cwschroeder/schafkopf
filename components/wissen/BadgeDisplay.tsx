'use client';

import { WissenBadge, UserWissenState } from '@/lib/wissen/types';
import { WISSEN_BADGES, getBadgeTierGradient } from '@/lib/wissen/badges';

interface BadgeDisplayProps {
  earnedBadgeIds: string[];
  showAll?: boolean; // Zeigt auch nicht verdiente Badges (ausgegraut)
  compact?: boolean; // Kompakte Ansicht fuer Sidebar
}

export default function BadgeDisplay({
  earnedBadgeIds,
  showAll = false,
  compact = false,
}: BadgeDisplayProps) {
  const badges = showAll
    ? WISSEN_BADGES
    : WISSEN_BADGES.filter((b) => earnedBadgeIds.includes(b.id));

  if (badges.length === 0 && !showAll) {
    return (
      <div className="text-amber-100/60 text-sm text-center py-4">
        Noch keine Badges verdient. Lies Artikel und bestehe Quizze!
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => {
          const earned = earnedBadgeIds.includes(badge.id);
          return (
            <div
              key={badge.id}
              className={`text-2xl ${earned ? '' : 'opacity-30 grayscale'}`}
              title={earned ? badge.name : `${badge.name} (nicht freigeschaltet)`}
            >
              {badge.icon}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {badges.map((badge) => {
        const earned = earnedBadgeIds.includes(badge.id);
        return (
          <div
            key={badge.id}
            className={`rounded-xl p-3 text-center transition-all ${
              earned ? '' : 'opacity-40 grayscale'
            }`}
            style={{
              background: earned
                ? getBadgeTierGradient(badge.tier)
                : 'linear-gradient(135deg, #4b5563 0%, #374151 100%)',
              border: earned
                ? `2px solid ${
                    badge.tier === 'gold'
                      ? '#ffd700'
                      : badge.tier === 'silver'
                      ? '#c0c0c0'
                      : '#cd7f32'
                  }`
                : '1px solid #4b5563',
            }}
          >
            <div className="text-3xl mb-1">{badge.icon}</div>
            <div
              className={`font-bold text-sm ${
                earned ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {badge.name}
            </div>
            {badge.nameBavarian && earned && (
              <div className="text-xs text-gray-700 italic">
                {badge.nameBavarian}
              </div>
            )}
            {!earned && (
              <div className="text-xs text-gray-500 mt-1">{badge.description}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Animation fuer neu freigeschaltete Badges
export function BadgeUnlockAnimation({ badge }: { badge: WissenBadge }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fadeIn">
      <div
        className="rounded-2xl p-8 text-center animate-bounce-in"
        style={{
          background: getBadgeTierGradient(badge.tier),
          boxShadow: '0 0 60px rgba(255, 215, 0, 0.5)',
        }}
      >
        <div className="text-6xl mb-4 animate-pulse">{badge.icon}</div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          Badge freigeschaltet!
        </div>
        <div className="text-xl font-semibold text-gray-800">{badge.name}</div>
        {badge.nameBavarian && (
          <div className="text-gray-700 italic">{badge.nameBavarian}</div>
        )}
        <div className="text-sm text-gray-600 mt-2">{badge.description}</div>
      </div>
    </div>
  );
}
