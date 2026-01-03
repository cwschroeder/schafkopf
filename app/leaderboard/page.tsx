'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';
import { hapticTap } from '@/lib/haptics';
import { LeaderboardEntry } from '@/lib/auth/types';
import UserMenu from '@/components/auth/UserMenu';
import PeriodTabs from '@/components/leaderboard/PeriodTabs';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';

type Period = 'alltime' | 'weekly' | 'monthly';

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState<Period>('alltime');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Leaderboard laden
  useEffect(() => {
    setIsLoading(true);

    fetch(apiUrl(`/api/leaderboard?period=${period}&limit=50`))
      .then(res => res.json())
      .then(data => {
        setEntries(data.entries || []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [period]);

  return (
    <main className="min-h-screen p-4 safe-area-top">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/lobby"
              className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
              onClick={() => hapticTap()}
            >
              &larr; Zur Lobby
            </Link>
            <h1 className="text-2xl font-bold text-amber-400 mt-1">
              Leaderboard
            </h1>
          </div>
          <UserMenu />
        </div>

        {/* Period Tabs */}
        <PeriodTabs value={period} onChange={setPeriod} />

        {/* Leaderboard Table */}
        <div
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
            border: '1px solid rgba(139,90,43,0.3)',
          }}
        >
          <LeaderboardTable
            entries={entries}
            isLoading={isLoading}
            highlightUserId={session?.user?.id}
          />
        </div>

        {/* Eigene Stats wenn eingeloggt */}
        {session?.user && (
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
              border: '1px solid rgba(139,90,43,0.3)',
            }}
          >
            <Link
              href={`/profile/${session.user.id}`}
              className="text-amber-400 hover:text-amber-300 transition-colors"
              onClick={() => hapticTap()}
            >
              Mein Profil anzeigen &rarr;
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
