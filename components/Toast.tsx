'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';

interface ToastItem {
  id: number;
  type: string;
  text: string;
  timestamp: number;
}

const TOAST_DURATION = 5000; // 5 Sekunden

/**
 * Toast-Container für App-weite Benachrichtigungen
 * Zeigt Nachrichten aus dem GameStore als animierte Toasts an
 */
export default function ToastContainer() {
  const { messages } = useGameStore();
  const [visibleToasts, setVisibleToasts] = useState<ToastItem[]>([]);
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState(Date.now());

  // Neue Nachrichten als Toasts anzeigen
  useEffect(() => {
    const newMessages = messages.filter((m) => m.timestamp > lastSeenTimestamp);

    if (newMessages.length > 0) {
      const newToasts = newMessages.map((m, idx) => ({
        id: m.timestamp + idx,
        type: m.type,
        text: m.text,
        timestamp: m.timestamp,
      }));

      setVisibleToasts((prev) => [...prev, ...newToasts]);
      setLastSeenTimestamp(Date.now());
    }
  }, [messages, lastSeenTimestamp]);

  // Toasts nach Timeout entfernen
  useEffect(() => {
    if (visibleToasts.length === 0) return;

    const timer = setTimeout(() => {
      setVisibleToasts((prev) => prev.slice(1));
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [visibleToasts]);

  // Toast schließen
  const dismissToast = (id: number) => {
    setVisibleToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (visibleToasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] flex flex-col gap-2 pointer-events-none max-w-md w-full px-4">
      {visibleToasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto
            flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg
            animate-slide-down
            ${getToastStyle(toast.type)}
          `}
          onClick={() => dismissToast(toast.id)}
        >
          <span className="text-lg">{getToastIcon(toast.type)}</span>
          <span className="flex-1 text-sm font-medium">{toast.text}</span>
          <button
            className="p-1 hover:bg-white/10 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              dismissToast(toast.id);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function getToastStyle(type: string): string {
  switch (type) {
    case 'success':
      return 'bg-emerald-600/95 text-white border border-emerald-500/50';
    case 'error':
      return 'bg-red-600/95 text-white border border-red-500/50';
    case 'warning':
      return 'bg-amber-600/95 text-white border border-amber-500/50';
    case 'info':
    default:
      return 'bg-gray-800/95 text-white border border-gray-700/50';
  }
}

function getToastIcon(type: string): string {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
    default:
      return 'ℹ';
  }
}
