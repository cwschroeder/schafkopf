'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { GoogleLoginButton, GitHubLoginButton } from '@/components/auth/LoginButton';
import { hapticTap } from '@/lib/haptics';

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/lobby';

  // Wenn bereits eingeloggt, weiterleiten
  useEffect(() => {
    if (session) {
      router.push(callbackUrl);
    }
  }, [session, router, callbackUrl]);

  // Loading State
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Logo / Title */}
      <div className="text-center mb-8">
        <h1
          className="text-4xl font-bold mb-2"
          style={{
            background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Schafkopf
        </h1>
        <p className="text-amber-200/70">Online spielen mit Freunden</p>
      </div>

      {/* Login Card */}
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
          border: '1px solid rgba(139,90,43,0.3)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        }}
      >
        <h2 className="text-xl font-bold text-amber-100 text-center mb-6">
          Anmelden
        </h2>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500/30">
            <p className="text-sm text-red-300 text-center">
              {error === 'OAuthSignin' && 'Fehler beim Starten der Anmeldung.'}
              {error === 'OAuthCallback' && 'Fehler bei der Rückmeldung vom Provider.'}
              {error === 'OAuthCreateAccount' && 'Fehler beim Erstellen des Accounts.'}
              {error === 'Callback' && 'Ein Fehler ist aufgetreten.'}
              {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'Callback'].includes(error) && 
                'Ein unbekannter Fehler ist aufgetreten.'}
            </p>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="flex flex-col gap-3">
          <GoogleLoginButton />
          <GitHubLoginButton />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-amber-800/50" />
          <span className="text-amber-500 text-sm">oder</span>
          <div className="flex-1 h-px bg-amber-800/50" />
        </div>

        {/* Guest Button */}
        <Link
          href="/lobby"
          onClick={() => hapticTap()}
          className="
            flex items-center justify-center gap-2 w-full
            px-6 py-3 rounded-lg font-medium
            bg-amber-800/50 hover:bg-amber-800
            text-amber-200 hover:text-amber-100
            border border-amber-700/50 hover:border-amber-600
            transition-all duration-200
          "
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Als Gast spielen
        </Link>

        {/* Info Text */}
        <p className="text-center text-xs text-amber-400/60 mt-4">
          Mit einem Account werden deine Statistiken gespeichert und du erscheinst im Leaderboard.
        </p>
      </div>

      {/* Back Link */}
      <Link
        href="/"
        className="mt-6 text-amber-500 hover:text-amber-400 text-sm transition-colors"
        onClick={() => hapticTap()}
      >
        &larr; Zurück zur Startseite
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
