'use client';

import { usePushToTalk } from '@/hooks/usePushToTalk';

interface VoiceButtonProps {
  roomId: string;
  playerId: string;
  playerName: string;
}

export function VoiceButton({ roomId, playerId, playerName }: VoiceButtonProps) {
  const {
    isRecording,
    isSending,
    isSupported,
    startRecording,
    stopRecording,
    error,
  } = usePushToTalk({
    roomId,
    playerId,
    playerName,
    maxDuration: 5,
  });

  // Nicht anzeigen wenn nicht unterstützt
  if (!isSupported) {
    return null;
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    startRecording();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    stopRecording();
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    // Auch stoppen wenn Pointer den Button verlässt
    if (isRecording) {
      stopRecording();
    }
  };

  return (
    <div className="voice-button-container">
      <button
        className={`voice-button ${isRecording ? 'recording' : ''} ${isSending ? 'sending' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onContextMenu={(e) => e.preventDefault()}
        disabled={isSending}
        title={isRecording ? 'Loslassen zum Senden' : 'Gedrückt halten zum Sprechen'}
      >
        {/* Mikrofon Icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mic-icon"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>

        {/* Pulse-Ringe bei Aufnahme */}
        {isRecording && (
          <>
            <span className="pulse-ring pulse-ring-1" />
            <span className="pulse-ring pulse-ring-2" />
          </>
        )}

        {/* Sende-Spinner */}
        {isSending && <span className="send-spinner" />}
      </button>

      {/* Fehleranzeige */}
      {error && <div className="voice-error">{error}</div>}

      <style jsx>{`
        .voice-button-container {
          position: fixed;
          bottom: 1rem;
          left: 1rem;
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .voice-button {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 50%;
          border: none;
          background: linear-gradient(145deg, #3b82f6, #2563eb);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }

        .voice-button:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.5);
        }

        .voice-button:active:not(:disabled),
        .voice-button.recording {
          transform: scale(0.95);
          background: linear-gradient(145deg, #ef4444, #dc2626);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.5);
        }

        .voice-button.sending {
          background: linear-gradient(145deg, #6b7280, #4b5563);
          cursor: wait;
        }

        .voice-button:disabled {
          opacity: 0.7;
        }

        .mic-icon {
          width: 1.5rem;
          height: 1.5rem;
          z-index: 1;
        }

        .pulse-ring {
          position: absolute;
          border: 2px solid rgba(239, 68, 68, 0.6);
          border-radius: 50%;
          animation: pulse 1.5s ease-out infinite;
        }

        .pulse-ring-1 {
          width: 100%;
          height: 100%;
          animation-delay: 0s;
        }

        .pulse-ring-2 {
          width: 100%;
          height: 100%;
          animation-delay: 0.5s;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .send-spinner {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid transparent;
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .voice-error {
          background: rgba(220, 38, 38, 0.9);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          max-width: 150px;
          text-align: center;
        }

        /* Landscape Mobile: Button weiter nach rechts */
        @media (max-height: 500px) and (orientation: landscape) {
          .voice-button-container {
            bottom: 0.5rem;
            left: 0.5rem;
          }

          .voice-button {
            width: 2.5rem;
            height: 2.5rem;
          }

          .mic-icon {
            width: 1.2rem;
            height: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
}
