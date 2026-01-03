'use client';

import Link from 'next/link';
import { LeaderboardEntry } from '@/lib/auth/types';
import { hapticTap } from '@/lib/haptics';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  highlightUserId?: string;
}

export default function LeaderboardTable({
  entries,
  isLoading = false,
  highlightUserId,
}: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-amber-900/20 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-amber-400/60">
        <p className="text-lg">Noch keine Einträge</p>
        <p className="text-sm mt-2">Spiele ein paar Runden um im Leaderboard zu erscheinen!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const isHighlighted = entry.userId === highlightUserId;

        return (
          <Link
            key={entry.userId}
            href={`/profile/${entry.userId}`}
            onClick={() => hapticTap()}
            className={`
              flex items-center gap-4 p-3 rounded-lg transition-all
              ${isHighlighted
                ? 'bg-amber-700/50 border-2 border-amber-500'
                : 'bg-amber-900/30 hover:bg-amber-900/50 border border-transparent'
              }
            `}
          >
            {/* Rang */}
            <div className="w-10 text-center">
              {entry.rank <= 3 ? (
                <span className="text-2xl">
                  {entry.rank === 1 && '🥇'}
                  {entry.rank === 2 && '🥈'}
                  {entry.rank === 3 && '🥉'}
                </span>
              ) : (
                <span className="text-lg font-bold text-amber-400">
                  {entry.rank}
                </span>
              )}
            </div>

            {/* Avatar */}
            <div className="flex-shrink-0">
              {entry.image ? (
                <img
                  src={entry.image}
                  alt={entry.name}
                  className="w-10 h-10 rounded-full border-2 border-amber-600"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-800 flex items-center justify-center text-amber-200 font-bold">
                  {entry.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Name & Stats */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-100 truncate">
                {entry.name}
              </p>
              <p className="text-xs text-amber-400/60">
                {entry.siege} Siege • {entry.winRate}% Winrate
              </p>
            </div>

            {/* Guthaben */}
            <div className="text-right">
              <p className={`font-bold ${entry.guthaben >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {entry.guthaben >= 0 ? '+' : ''}{(entry.guthaben / 100).toFixed(2)} €
              </p>
              <p className="text-xs text-amber-400/60">
                {entry.spieleGesamt} Spiele
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
