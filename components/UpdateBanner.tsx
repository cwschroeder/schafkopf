'use client';

import { useUpdateCheck } from '@/lib/useUpdateCheck';

export function UpdateBanner() {
  const { updateAvailable, performUpdate, dismissUpdate } = useUpdateCheck();

  if (!updateAvailable) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium shadow-lg safe-area-top"
      style={{
        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
        color: 'white',
      }}
    >
      <span className="flex items-center gap-2">
        <span className="text-lg">🔄</span>
        <span>Neue Version verfügbar!</span>
      </span>
      <button
        onClick={performUpdate}
        className="px-3 py-1 bg-white text-amber-800 rounded-lg font-semibold hover:bg-amber-50 transition-colors text-sm"
      >
        Jetzt laden
      </button>
      <button
        onClick={dismissUpdate}
        className="p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Schließen"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
