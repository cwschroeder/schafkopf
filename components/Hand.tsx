'use client';

import { useRef, useCallback, useState } from 'react';
import { Karte } from '@/lib/schafkopf/types';
import Card from './Card';
import { hapticTap, hapticMedium } from '@/lib/haptics';

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

// Swipe-Threshold in Pixeln
const SWIPE_THRESHOLD = 40;

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

  // Swipe-State pro Karte
  const [swipeState, setSwipeState] = useState<{
    karteId: string | null;
    startY: number;
    currentY: number;
    isSwiping: boolean;
  }>({ karteId: null, startY: 0, currentY: 0, isSwiping: false });

  // Touch-Start Handler für Swipe
  const handleTouchStart = useCallback((e: React.TouchEvent, karte: Karte) => {
    if (hidden || !isCurrentPlayer) return;

    const touch = e.touches[0];
    setSwipeState({
      karteId: karte.id,
      startY: touch.clientY,
      currentY: touch.clientY,
      isSwiping: true,
    });
  }, [hidden, isCurrentPlayer]);

  // Touch-Move Handler für Swipe
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeState.isSwiping || !swipeState.karteId) return;

    const touch = e.touches[0];
    setSwipeState(prev => ({
      ...prev,
      currentY: touch.clientY,
    }));
  }, [swipeState.isSwiping, swipeState.karteId]);

  // Touch-End Handler für Swipe
  const handleTouchEnd = useCallback((karte: Karte) => {
    if (!swipeState.isSwiping || swipeState.karteId !== karte.id) {
      setSwipeState({ karteId: null, startY: 0, currentY: 0, isSwiping: false });
      return;
    }

    const swipeDistance = swipeState.startY - swipeState.currentY;
    const istSpielbar = spielbareKarten.length === 0 || spielbareKarten.includes(karte.id);

    // Swipe nach oben erkannt?
    if (swipeDistance > SWIPE_THRESHOLD && istSpielbar && onCardPlay) {
      hapticMedium();
      onCardPlay(karte.id);
    }

    setSwipeState({ karteId: null, startY: 0, currentY: 0, isSwiping: false });
  }, [swipeState, spielbareKarten, onCardPlay]);

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
        hapticMedium();
        onCardPlay(karte.id);
        lastTapRef.current[karte.id] = 0; // Reset
        return;
      }
    }

    // Single Tap speichern
    lastTapRef.current[karte.id] = now;

    // Wenn nicht am Zug: Vorauswahl (Toggle)
    if (!isCurrentPlayer && onCardPreSelect) {
      hapticTap();
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

    hapticTap();
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
      hapticMedium();
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

  // Berechne Swipe-Offset für Animation
  const getSwipeOffset = (karteId: string): number => {
    if (swipeState.karteId !== karteId || !swipeState.isSwiping) return 0;
    const offset = swipeState.startY - swipeState.currentY;
    // Max -60px nach oben
    return Math.min(Math.max(offset, 0), 60);
  };

  // Ist die Karte bereit zum Spielen (Swipe-Threshold erreicht)?
  const isSwipeReady = (karteId: string): boolean => {
    if (swipeState.karteId !== karteId || !swipeState.isSwiping) return false;
    return (swipeState.startY - swipeState.currentY) > SWIPE_THRESHOLD;
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
            const swipeOffset = getSwipeOffset(karte.id);
            const swipeReady = isSwipeReady(karte.id);

            return (
              <div
                key={karte.id}
                className={`hand-card transition-all duration-200 cursor-pointer relative ${isPreSelected ? 'animate-pulse' : ''} ${swipeReady ? 'card-swipe-ready' : ''}`}
                style={{
                  transform: isSelected || isPreSelected
                    ? `translateY(-20px) scale(1.05)`
                    : swipeOffset > 0
                      ? `translateY(-${swipeOffset}px) rotate(${(index - (karten.length - 1) / 2) * 5}deg)`
                      : `rotate(${(index - (karten.length - 1) / 2) * 5}deg)`,
                  zIndex: isSelected || isPreSelected || swipeOffset > 0 ? 100 : index,
                  filter: isPreSelected ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.8))' : swipeReady ? 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.8))' : 'none',
                  touchAction: 'none', // Wichtig für Swipe-Geste
                  transition: swipeOffset > 0 ? 'none' : 'all 0.2s ease',
                }}
                onDoubleClick={() => handleDoubleClick(karte)}
                onTouchStart={(e) => handleTouchStart(e, karte)}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd(karte)}
              >
                <Card
                  karte={karte}
                  onClick={() => handleCardTap(karte)}
                  selected={isSelected}
                  disabled={!istSpielbar && isCurrentPlayer}
                  hidden={hidden}
                />

                {/* Swipe-Indikator */}
                {swipeReady && isCurrentPlayer && (
                  <div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap animate-bounce"
                    style={{
                      background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
                      color: '#1a1a1a',
                      boxShadow: '0 4px 12px rgba(212, 175, 55, 0.6)',
                    }}
                  >
                    Loslassen!
                  </div>
                )}

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

      {/* Hinweis - aktualisiert für Swipe */}
      {karten.length > 0 && (
        <div
          className="text-xs text-amber-200/70 text-center px-2"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
        >
          {isCurrentPlayer
            ? (selectedCard ? 'Nach oben wischen zum Spielen' : 'Tippen zum Auswählen, wischen zum Spielen')
            : preSelectedCard
              ? 'Wird automatisch gespielt'
              : 'Tippen zum Vorauswählen'}
        </div>
      )}
    </div>
  );
}
