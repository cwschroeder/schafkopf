'use client';

import { useState } from 'react';
import { hapticTap } from '@/lib/haptics';
import { Karte, Spieler } from '@/lib/schafkopf/types';
import Card from './Card';
import { getLegenHint, LegenHint } from '@/lib/practice-hints';

interface GameLegenProps {
  onLegen: (willLegen: boolean) => void;
  kartenAnzahl: number;
  isLoading?: boolean;
  karten?: Karte[]; // Die 3 Karten die der Spieler beim Legen sieht
  hintsEnabled?: boolean;
  spieler?: Spieler[]; // Alle Spieler für Warte-Anzeige
  legenEntscheidungen?: string[]; // IDs der Spieler die schon entschieden haben
  myPlayerId?: string; // Eigene ID
}

export default function GameLegen({
  onLegen,
  kartenAnzahl,
  isLoading = false,
  karten = [],
  hintsEnabled = false,
  spieler = [],
  legenEntscheidungen = [],
  myPlayerId = '',
}: GameLegenProps) {
  const [showHint, setShowHint] = useState(false);
  const [hint, setHint] = useState<LegenHint | null>(null);

  const handleLegen = (willLegen: boolean) => {
    hapticTap();
    onLegen(willLegen);
  };

  const handleShowHint = () => {
    hapticTap();
    // WICHTIG: Nur die 3 sichtbaren Karten für den Hint verwenden!
    if (!hint && karten.length > 0) {
      setHint(getLegenHint(karten));
    }
    setShowHint(!showHint);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 bottom-sheet-backdrop z-40" />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bottom-sheet safe-area-bottom"
        style={{
          background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
          borderTop: '2px solid rgba(139,90,43,0.5)',
          borderRadius: '1.5rem 1.5rem 0 0',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Handle-Bar für visuelles Feedback */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="w-12 h-1 rounded-full"
            style={{ background: 'rgba(139,90,43,0.5)' }}
          />
        </div>

        <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
          <h3
            className="text-base sm:text-lg font-bold text-center"
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Willst du legen?
          </h3>

          {/* Karten-Anzeige - größer und besser lesbar */}
          {karten.length > 0 && (
            <div className="flex justify-center items-end gap-1 py-3 -mx-2">
              {karten.map((karte, index) => (
                <div
                  key={karte.id}
                  className="transition-transform hover:scale-105"
                  style={{
                    transform: `rotate(${(index - 1) * 6}deg)`,
                    marginLeft: index > 0 ? '-12px' : '0',
                    zIndex: index,
                  }}
                >
                  <Card karte={karte} size="md" />
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-center text-amber-200/70">
            {kartenAnzahl} Karten gesehen - Einsatz verdoppeln?
          </p>

          {/* Tipp-Button (nur bei Übungsspiel) */}
          {hintsEnabled && (
            <button
              onClick={handleShowHint}
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all"
              style={{
                background: showHint ? 'rgba(217, 119, 6, 0.3)' : 'rgba(139,90,43,0.3)',
                border: '1px solid rgba(217, 119, 6, 0.5)',
                color: '#fbbf24',
              }}
            >
              <span>💡</span>
              {showHint ? 'Tipp ausblenden' : 'Tipp anzeigen'}
            </button>
          )}

          {/* Hint-Anzeige */}
          {showHint && hint && (
            <div
              className="rounded-lg p-3 text-sm"
              style={{
                background: hint.empfehlung
                  ? 'rgba(34, 197, 94, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
                border: hint.empfehlung
                  ? '1px solid rgba(34, 197, 94, 0.4)'
                  : '1px solid rgba(239, 68, 68, 0.4)',
              }}
            >
              <p className="font-semibold text-amber-200 mb-2">
                {hint.empfehlung ? '✅ Empfehlung: Legen!' : '❌ Empfehlung: Nicht legen'}
              </p>
              <p className="text-amber-100/80 mb-2">{hint.grund}</p>
              {hint.details.length > 0 && (
                <ul className="text-amber-100/60 text-xs space-y-1">
                  {hint.details.map((detail, i) => (
                    <li key={i}>• {detail}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleLegen(true)}
              disabled={isLoading}
              className={`btn btn-primary flex items-center justify-center gap-2 py-2.5 text-base font-bold ${isLoading ? 'opacity-50' : ''}`}
            >
              {isLoading ? (
                <span className="spinner" />
              ) : (
                'Legen!'
              )}
            </button>
            <button
              onClick={() => handleLegen(false)}
              disabled={isLoading}
              className={`btn btn-secondary flex items-center justify-center gap-2 py-2.5 text-base ${isLoading ? 'opacity-50' : ''}`}
            >
              {isLoading ? (
                <span className="spinner" />
              ) : (
                'Nein'
              )}
            </button>
          </div>

          {/* Warte auf... Anzeige */}
          {spieler.length > 0 && (() => {
            const wartendeSpieler = spieler.filter(
              s => !legenEntscheidungen.includes(s.id) && s.id !== myPlayerId
            );
            if (wartendeSpieler.length === 0) return null;
            return (
              <div className="pt-2 border-t border-amber-800/30 text-center">
                <p className="text-xs text-amber-200/60 flex items-center justify-center gap-1">
                  <span>⏳</span>
                  <span>Warte auf: {wartendeSpieler.map(s => s.name).join(', ')}</span>
                </p>
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
