'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { hapticTap } from '@/lib/haptics';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Schließen bei Klick außerhalb
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Loading State
  if (status === 'loading') {
    return (
      <div className="w-10 h-10 rounded-full bg-amber-900/50 animate-pulse" />
    );
  }

  // Nicht eingeloggt -> Login Button
  if (!session) {
    return (
      <Link
        href="/login"
        className="
          px-4 py-2 rounded-lg
          bg-amber-700 hover:bg-amber-600
          text-white text-sm font-medium
          transition-colors
        "
        onClick={() => hapticTap()}
      >
        Anmelden
      </Link>
    );
  }

  // Eingeloggt -> Avatar mit Dropdown
  const user = session.user;
  const initials = user.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || '??';

  const handleSignOut = async () => {
    hapticTap();
    setIsOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => {
          hapticTap();
          setIsOpen(!isOpen);
        }}
        className="
          w-10 h-10 rounded-full
          overflow-hidden
          border-2 border-amber-600 hover:border-amber-500
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-brown-900
        "
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-amber-800 flex items-center justify-center text-amber-200 font-bold text-sm">
            {initials}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="
              absolute right-0 mt-2 w-56
              rounded-lg shadow-2xl
              bg-[#2a1810]
              border-2 border-amber-600/70
              overflow-hidden
              z-50
            "
          >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-amber-800/50">
            <p className="text-sm font-medium text-amber-100 truncate">
              {user.name}
            </p>
            <p className="text-xs text-amber-400 truncate">
              {user.email}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/settings"
              onClick={() => {
                hapticTap();
                setIsOpen(false);
              }}
              className="
                flex items-center gap-3 px-4 py-2
                text-sm text-amber-200 hover:bg-amber-800/50
                transition-colors
              "
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Einstellungen
            </Link>

            <Link
              href="/leaderboard"
              onClick={() => {
                hapticTap();
                setIsOpen(false);
              }}
              className="
                flex items-center gap-3 px-4 py-2
                text-sm text-amber-200 hover:bg-amber-800/50
                transition-colors
              "
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Leaderboard
            </Link>
          </div>

          {/* Logout */}
          <div className="py-1 border-t border-amber-800/50">
            <button
              onClick={handleSignOut}
              className="
                flex items-center gap-3 w-full px-4 py-2
                text-sm text-red-400 hover:bg-red-900/30
                transition-colors
              "
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Abmelden
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
