'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { hapticTap } from '@/lib/haptics';
import UserMenu from '@/components/auth/UserMenu';
import SettingsForm from '@/components/settings/SettingsForm';

export default function SettingsPage() {
  const { data: session, status } = useSession();

  return (
    <main className="min-h-screen p-4 safe-area-top">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/lobby"
              className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
              onClick={() => hapticTap()}
            >
              &larr; Zurück zur Lobby
            </Link>
            <h1 className="text-2xl font-bold text-amber-400 mt-1">
              Einstellungen
            </h1>
          </div>
          <UserMenu />
        </div>

        {/* User Info wenn eingeloggt */}
        {session?.user && (
          <div
            className="rounded-xl p-4"
            style={{
              background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
              border: '1px solid rgba(139,90,43,0.3)',
            }}
          >
            <div className="flex items-center gap-4">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || ''}
                  className="w-14 h-14 rounded-full border-2 border-amber-600"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-amber-800 flex items-center justify-center text-amber-200 text-xl font-bold">
                  {session.user.name?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <p className="font-semibold text-amber-100">
                  {session.user.name}
                </p>
                <p className="text-sm text-amber-400">
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nicht eingeloggt - Hinweis */}
        {status === 'unauthenticated' && (
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
              border: '1px solid rgba(139,90,43,0.3)',
            }}
          >
            <p className="text-amber-200 mb-3">
              Melde dich an, um deine Einstellungen geräteübergreifend zu speichern.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-medium transition-colors"
              onClick={() => hapticTap()}
            >
              Anmelden
            </Link>
          </div>
        )}

        {/* Settings Form */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
            border: '1px solid rgba(139,90,43,0.3)',
          }}
        >
          <SettingsForm />
        </div>

        {/* Admin Link (nur für Entwickler sichtbar) */}
        {session?.user?.email === 'christian.w.schroeder@gmail.com' && (
          <div className="text-center">
            <Link
              href="/settings/audio"
              className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
              onClick={() => hapticTap()}
            >
              Audio-Admin &rarr;
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
