'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LoginButton } from '@/components/auth/LoginButton';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      router.push('/lobby');
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Laden...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo / Titel */}
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-amber-400 mb-2">
            Schafkopf
          </h1>
          <p className="text-gray-300">Anmelden</p>
        </div>

        {/* Karten-Deko */}
        <div className="flex justify-center gap-2 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/schafkopf/cards/Eichel-11.svg" alt="Eichel Ass" className="w-12 h-auto rounded shadow-lg transform -rotate-12" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/schafkopf/cards/Gras-11.svg" alt="Gras Ass" className="w-12 h-auto rounded shadow-lg transform -rotate-4" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/schafkopf/cards/Herz-11.svg" alt="Herz Ass" className="w-12 h-auto rounded shadow-lg transform rotate-4" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/schafkopf/cards/Schellen-11.svg" alt="Schellen Ass" className="w-12 h-auto rounded shadow-lg transform rotate-12" />
        </div>

        {/* Login Options */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-center text-amber-100 mb-4">
            Mit Account anmelden
          </h2>

          <div className="space-y-3">
            <LoginButton provider="google" className="w-full" />
            <LoginButton provider="github" className="w-full" />
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800/50 text-gray-400">oder</span>
            </div>
          </div>

          <Link
            href="/"
            className="block w-full text-center px-6 py-3 rounded-lg font-medium bg-amber-700 hover:bg-amber-600 text-white transition-colors"
          >
            Als Gast spielen
          </Link>
        </div>

        {/* Info */}
        <div className="bg-gray-800/30 rounded-lg p-4 text-sm text-gray-400 space-y-2">
          <h3 className="font-semibold text-gray-300">Warum anmelden?</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Statistiken und Leaderboard</li>
            <li>Einstellungen werden gespeichert</li>
            <li>Deine Erfolge werden festgehalten</li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            Du kannst auch ohne Account spielen - deine bisherigen Spiele kannst du
            später mit deinem Account verknüpfen.
          </p>
        </div>
      </div>
    </main>
  );
}
