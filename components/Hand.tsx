'use client';

import { useRef, useCallback } from 'react';
import { Karte } from '@/lib/schafkopf/types';
import Card from './Card';

interface HandProps {
  karten: Karte[];
  spielbareKarten?: string[]; // IDs der spielbaren Karten
  selectedCard?: string | null;
  preSelectedCard?: string | null; // Vorauswahl wenn nicht am Zug
  onCardSelect?: (karteId: string | null) => void;
  onCardPreSelect?: (karteId: string | null) => void; // Toggle Vorauswahl
  onCardPlay?: (karteId: string) => void;
  isCurrentPlayer?: boolean;
  hidden?: boolean;
}

// Timeout für Double-Tap Detection (ms)
const DOUBLE_TAP_DELAY = 300;

export default function Hand({
  karten,
  spielbareKarten = [],
  selectedCard,
  preSelectedCard,
  onCardSelect,
  onCardPreSelect,
  onCardPlay,
  isCurrentPlayer = false,
  hidden = false,
}: HandProps) {
  // Für Double-Tap Detection pro Karte
  const lastTapRef = useRef<{ [karteId: string]: number }>({});

  // Kombinierter Touch/Click Handler für Mobile-freundliches Double-Tap
  const handleCardTap = useCallback((karte: Karte) => {
    if (hidden) return;

    const now = Date.now();
    const lastTap = lastTapRef.current[karte.id] || 0;
    const isDoubleTap = now - lastTap < DOUBLE_TAP_DELAY;

    if (isDoubleTap && isCurrentPlayer) {
      // Double-Tap → Karte spielen
      const istSpielbar = spielbareKarten.length === 0 || spielbareKarten.includes(karte.id);
      if (istSpielbar && onCardPlay) {
        onCardPlay(karte.id);
        lastTapRef.current[karte.id] = 0; // Reset
        return;
      }
    }

    // Single Tap speichern
    lastTapRef.current[karte.id] = now;

    // Wenn nicht am Zug: Vorauswahl (Toggle)
    if (!isCurrentPlayer && onCardPreSelect) {
      if (preSelectedCard === karte.id) {
        onCardPreSelect(null);
      } else {
        onCardPreSelect(karte.id);
      }
      return;
    }

    // Am Zug: Auswahl togglen
    const istSpielbar = spielbareKarten.length === 0 || spielbareKarten.includes(karte.id);
    if (!istSpielbar) return;

    if (onCardSelect) {
      if (selectedCard === karte.id) {
        // Bereits ausgewählt → abwählen
        onCardSelect(null);
      } else {
        // Neue Auswahl
        onCardSelect(karte.id);
      }
    }
  }, [hidden, isCurrentPlayer, spielbareKarten, selectedCard, preSelectedCard, onCardSelect, onCardPreSelect, onCardPlay]);

  // Doppelklick = sofort spielen (für Desktop)
  const handleDoubleClick = (karte: Karte) => {
    if (hidden || !isCurrentPlayer) return;

    const istSpielbar = spielbareKarten.length === 0 || spielbareKarten.includes(karte.id);
    if (!istSpielbar) return;

    if (onCardPlay) {
      onCardPlay(karte.id);
    }
  };

  // Überlappung basierend auf Kartenzahl berechnen (mehr Karten = mehr Überlappung)
  const getOverlap = () => {
    if (hidden) return '4px';
    // Auf Mobilgeräten stärkere Überlappung
    const baseOverlap = karten.length > 4 ? -24 : -18;
    return `${baseOverlap}px`;
  };

  return (
    <div className="flex flex-col items-center gap-1 sm:gap-2">
      <div className="flex justify-center items-end">
        <div
          className="flex"
          style={{
            gap: getOverlap(),
          }}
        >
          {karten.map((karte, index) => {
            const istSpielbar = spielbareKarten.length === 0 || spielbareKarten.includes(karte.id);
            const isSelected = selectedCard === karte.id;
            const isPreSelected = preSelectedCard === karte.id;

            return (
              <div
                key={karte.id}
                className={`hand-card transition-all duration-200 cursor-pointer relative ${isPreSelected ? 'animate-pulse' : ''}`}
                style={{
                  transform: isSelected || isPreSelected
                    ? 'translateY(-20px) scale(1.05)'
                    : `rotate(${(index - (karten.length - 1) / 2) * 5}deg)`,
                  zIndex: isSelected || isPreSelected ? 100 : index,
                  filter: isPreSelected ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.8))' : 'none',
                  touchAction: 'manipulation', // Verhindert Zoom bei Double-Tap
                }}
                onDoubleClick={() => handleDoubleClick(karte)}
              >
                <Card
                  karte={karte}
                  onClick={() => handleCardTap(karte)}
                  selected={isSelected}
                  disabled={!istSpielbar && isCurrentPlayer}
                  hidden={hidden}
                />
                {/* Vorauswahl-Indikator */}
                {isPreSelected && (
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.5)',
                    }}
                  >
                    Nächste
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hinweis */}
      {karten.length > 0 && (
        <div
          className="text-xs text-amber-200/70 text-center"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
        >
          {isCurrentPlayer
            ? 'Doppelklick zum Spielen'
            : preSelectedCard
              ? 'Wird automatisch gespielt'
              : 'Klick zum Vorauswählen'}
        </div>
      )}
    </div>
  );
}
