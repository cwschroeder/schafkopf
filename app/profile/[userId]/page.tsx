'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';
import { hapticTap } from '@/lib/haptics';
import { PublicProfile } from '@/lib/auth/types';
import UserMenu from '@/components/auth/UserMenu';

// Ansage-Namen für Anzeige
const ANSAGE_NAMEN: Record<string, string> = {
  sauspiel: 'Sauspiel',
  wenz: 'Wenz',
  geier: 'Geier',
  'farbsolo-eichel': 'Eichel-Solo',
  'farbsolo-gras': 'Gras-Solo',
  'farbsolo-herz': 'Herz-Solo',
  'farbsolo-schellen': 'Schellen-Solo',
  'wenz-tout': 'Wenz Tout',
  'geier-tout': 'Geier Tout',
};

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = use(params);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profil laden
  useEffect(() => {
    if (!userId) return;

    fetch(apiUrl(`/api/user/${userId}`))
      .then(res => {
        if (!res.ok) throw new Error('User nicht gefunden');
        return res.json();
      })
      .then(data => {
        setProfile(data.profile);
        setRank(data.rank);
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen p-4 safe-area-top">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <h1 className="text-xl text-red-400">{error || 'Profil nicht gefunden'}</h1>
          <Link
            href="/leaderboard"
            className="inline-block text-amber-400 hover:text-amber-300"
            onClick={() => hapticTap()}
          >
            &larr; Zum Leaderboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 safe-area-top">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/leaderboard"
            className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
            onClick={() => hapticTap()}
          >
            &larr; Zum Leaderboard
          </Link>
          <UserMenu />
        </div>

        {/* Profil Header */}
        <div
          className="rounded-xl p-6 text-center"
          style={{
            background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
            border: '1px solid rgba(139,90,43,0.3)',
          }}
        >
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            {profile.image ? (
              <img
                src={profile.image}
                alt={profile.name}
                className="w-24 h-24 rounded-full border-4 border-amber-600"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-amber-800 flex items-center justify-center text-amber-200 text-3xl font-bold">
                {profile.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold text-amber-100">{profile.name}</h1>

          {/* Rang */}
          {rank && (
            <div className="mt-2">
              {rank <= 3 ? (
                <span className="text-2xl">
                  {rank === 1 && '🥇'}
                  {rank === 2 && '🥈'}
                  {rank === 3 && '🥉'}
                </span>
              ) : (
                <span className="text-amber-400">Rang #{rank}</span>
              )}
            </div>
          )}

          {/* Mitglied seit */}
          <p className="text-sm text-amber-400/60 mt-2">
            Dabei seit {new Date(profile.memberSince).toLocaleDateString('de-DE', {
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>

        {/* Stats */}
        <div
          className="rounded-xl p-6 space-y-4"
          style={{
            background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
            border: '1px solid rgba(139,90,43,0.3)',
          }}
        >
          <h2 className="text-lg font-semibold text-amber-300">Statistiken</h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Guthaben */}
            <div className="text-center p-3 rounded-lg bg-amber-900/30">
              <p className={`text-2xl font-bold ${profile.stats.guthaben >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {profile.stats.guthaben >= 0 ? '+' : ''}
                {(profile.stats.guthaben / 100).toFixed(2)} €
              </p>
              <p className="text-xs text-amber-400/60">Guthaben</p>
            </div>

            {/* Spiele */}
            <div className="text-center p-3 rounded-lg bg-amber-900/30">
              <p className="text-2xl font-bold text-amber-100">
                {profile.stats.spieleGesamt}
              </p>
              <p className="text-xs text-amber-400/60">Spiele</p>
            </div>

            {/* Siege */}
            <div className="text-center p-3 rounded-lg bg-amber-900/30">
              <p className="text-2xl font-bold text-amber-100">
                {profile.stats.siege}
              </p>
              <p className="text-xs text-amber-400/60">Siege</p>
            </div>

            {/* Win Rate */}
            <div className="text-center p-3 rounded-lg bg-amber-900/30">
              <p className="text-2xl font-bold text-amber-100">
                {profile.stats.winRate}%
              </p>
              <p className="text-xs text-amber-400/60">Win-Rate</p>
            </div>
          </div>

          {/* Lieblingsansage */}
          {profile.stats.lieblingsAnsage && (
            <div className="text-center p-3 rounded-lg bg-amber-900/30">
              <p className="text-lg font-semibold text-amber-100">
                {ANSAGE_NAMEN[profile.stats.lieblingsAnsage] || profile.stats.lieblingsAnsage}
              </p>
              <p className="text-xs text-amber-400/60">Lieblingsspiel</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
