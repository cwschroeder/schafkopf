'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useGameStore } from '@/lib/store';
import { hapticTap } from '@/lib/haptics';
import FeedbackModal from './FeedbackModal';
import { apiUrl } from '@/lib/api';

interface FeedbackButtonProps {
  className?: string;
  /**
   * 'fab' - Floating action button (default, hidden on game pages)
   * 'header' - Inline button for header bar
   */
  variant?: 'fab' | 'header';
}

export default function FeedbackButton({ className = '', variant = 'fab' }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const { data: session } = useSession();
  const { playerId } = useGameStore();
  const pathname = usePathname();

  // Check if on game page (for conditional rendering later)
  const isGamePage = pathname?.startsWith('/game/');

  // Check for pending notifications
  useEffect(() => {
    const checkNotifications = async () => {
      const userId = session?.user?.id || playerId;
      if (!userId) return;

      try {
        const res = await fetch(apiUrl('/api/feedback/notifications'), {
          headers: userId.startsWith('p_') ? { 'x-user-id': userId } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setHasNotification(data.count > 0);
        }
      } catch {
        // Ignore errors silently
      }
    };

    checkNotifications();

    // Check on visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [session?.user?.id, playerId]);

  // Hide FAB on game pages (game page has its own header button)
  // Note: This must come AFTER all hooks!
  if (variant === 'fab' && isGamePage) {
    return null;
  }

  const handleOpen = () => {
    hapticTap();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Header variant - compact icon button
  if (variant === 'header') {
    return (
      <>
        <button
          onClick={handleOpen}
          className={`
            relative p-2 rounded
            bg-gray-800/90 text-gray-300 hover:text-teal-400 hover:bg-gray-700/90
            transition-colors
            min-w-[44px] min-h-[44px]
            flex items-center justify-center
            ${className}
          `}
          aria-label="Feedback geben"
        >
          {/* Feedback Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>

          {/* Notification Badge */}
          {hasNotification && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                background: '#ef4444',
                color: 'white',
              }}
            >
              !
            </span>
          )}
        </button>

        {/* Modal */}
        {isOpen && <FeedbackModal onClose={handleClose} />}
      </>
    );
  }

  // FAB variant - floating action button
  return (
    <>
      <button
        onClick={handleOpen}
        className={`
          fixed bottom-20 right-4 z-50
          w-14 h-14 rounded-full
          flex items-center justify-center
          shadow-lg hover:shadow-xl
          transition-all duration-200
          active:scale-95
          ${className}
        `}
        style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
        }}
        aria-label="Feedback geben"
      >
        {/* Bug/Feedback Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>

        {/* Notification Badge */}
        {hasNotification && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: '2px solid white',
            }}
          >
            !
          </span>
        )}
      </button>

      {/* Modal */}
      {isOpen && <FeedbackModal onClose={handleClose} />}
    </>
  );
}
