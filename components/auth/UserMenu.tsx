'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status === 'loading') {
    return (
      <div className="w-10 h-10 rounded-full bg-amber-900/50 animate-pulse" />
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/schafkopf/login"
        className="px-4 py-2 text-sm font-medium text-amber-100 hover:text-white transition-colors"
      >
        Anmelden
      </Link>
    );
  }

  const { user } = session;
  const rotateClass = isOpen ? 'rotate-180' : '';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-amber-900/30 transition-colors"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || ''}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-sm font-bold">
            {user.name?.charAt(0).toUpperCase() || '?'}
          </div>
        )}
        <span className="text-sm font-medium text-amber-100 hidden sm:block">
          {user.name}
        </span>
        <svg
          className={`w-4 h-4 text-amber-100 transition-transform ${rotateClass}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#2a3a2e] rounded-lg shadow-lg border border-amber-900/50 py-1 z-50">
          <div className="px-4 py-2 border-b border-amber-900/50">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-amber-200/60 truncate">{user.email}</p>
          </div>

          <Link
            href="/schafkopf/settings"
            className="flex items-center gap-2 px-4 py-2 text-sm text-amber-100 hover:bg-amber-900/30"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Einstellungen
          </Link>

          <Link
            href="/schafkopf/leaderboard"
            className="flex items-center gap-2 px-4 py-2 text-sm text-amber-100 hover:bg-amber-900/30"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Leaderboard
          </Link>

          <button
            onClick={() => {
              setIsOpen(false);
              signOut({ callbackUrl: '/schafkopf/' });
            }}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Abmelden
          </button>
        </div>
      )}
    </div>
  );
}
