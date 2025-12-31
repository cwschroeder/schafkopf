'use client';

import { useState, useEffect } from 'react';

interface DealingAnimationProps {
  onComplete: () => void;
  playerPositions: { position: 'bottom' | 'right' | 'top' | 'left'; name: string }[];
}

// Kartenrücken-Design
const CardBack = ({ style, className }: { style?: React.CSSProperties; className?: string }) => (
  <div
    className={`w-10 h-14 sm:w-12 sm:h-16 rounded-md shadow-lg ${className}`}
    style={{
      background: 'linear-gradient(145deg, #1a237e 0%, #283593 50%, #1a237e 100%)',
      border: '2px solid #0d1b4c',
      ...style,
    }}
  >
    <div
      className="w-full h-full rounded flex items-center justify-center"
      style={{
        background: `
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 3px,
            rgba(255,215,0,0.15) 3px,
            rgba(255,215,0,0.15) 6px
          )
        `,
      }}
    >
      <div
        className="w-6 h-8 sm:w-7 sm:h-10 rounded border-2"
        style={{
          borderColor: 'rgba(255,215,0,0.5)',
          background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.2) 0%, transparent 70%)',
        }}
      />
    </div>
  </div>
);

export default function DealingAnimation({ onComplete, playerPositions }: DealingAnimationProps) {
  const [phase, setPhase] = useState<'shuffle' | 'deal' | 'done'>('shuffle');
  const [dealingCard, setDealingCard] = useState(0);
  const [shuffleOffset, setShuffleOffset] = useState(0);

  // Misch-Animation
  useEffect(() => {
    if (phase !== 'shuffle') return;

    const shuffleInterval = setInterval(() => {
      setShuffleOffset(prev => (prev + 1) % 6);
    }, 150);

    const shuffleTimer = setTimeout(() => {
      clearInterval(shuffleInterval);
      setPhase('deal');
    }, 800); // Schneller mischen

    return () => {
      clearInterval(shuffleInterval);
      clearTimeout(shuffleTimer);
    };
  }, [phase]);

  // Austeil-Animation (12 Karten = 3 pro Spieler für Legen-Phase)
  useEffect(() => {
    if (phase !== 'deal') return;

    const totalCards = 12; // Nur 3 pro Spieler vor Legen-Abfrage
    if (dealingCard >= totalCards) {
      setPhase('done');
      setTimeout(onComplete, 300);
      return;
    }

    const timer = setTimeout(() => {
      setDealingCard(prev => prev + 1);
    }, 60); // Schnellere Austeilung

    return () => clearTimeout(timer);
  }, [phase, dealingCard, onComplete]);

  // Positionen für fliegende Karten
  const getTargetPosition = (cardIndex: number) => {
    const playerIndex = cardIndex % 4;
    const position = playerPositions[playerIndex]?.position || 'bottom';

    const positions = {
      bottom: { x: 0, y: 80 },
      right: { x: 100, y: 0 },
      top: { x: 0, y: -80 },
      left: { x: -100, y: 0 },
    };

    return positions[position];
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Kartenstapel in der Mitte */}
      <div className="relative">
        {/* Misch-Animation: Stapel */}
        {phase === 'shuffle' && (
          <div className="relative">
            {/* Unterer Stapel */}
            {[...Array(8)].map((_, i) => (
              <div
                key={`stack-${i}`}
                className="absolute transition-transform duration-100"
                style={{
                  transform: `
                    translateY(${-i * 2}px)
                    translateX(${i === shuffleOffset ? 15 : i === (shuffleOffset + 3) % 6 ? -15 : 0}px)
                    rotate(${(i - 4) * 2}deg)
                  `,
                  zIndex: i,
                }}
              >
                <CardBack />
              </div>
            ))}

            {/* Mischen-Text */}
            <div
              className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-amber-300 font-bold text-lg whitespace-nowrap"
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              Karten mischen...
            </div>
          </div>
        )}

        {/* Austeil-Animation */}
        {phase === 'deal' && (
          <div className="relative">
            {/* Verbleibender Stapel */}
            {[...Array(Math.max(0, 24 - dealingCard))].map((_, i) => (
              <div
                key={`remaining-${i}`}
                className="absolute"
                style={{
                  transform: `translateY(${-i * 1.5}px) rotate(${(i - 4) * 0.5}deg)`,
                  zIndex: i,
                }}
              >
                <CardBack />
              </div>
            ))}

            {/* Fliegende Karten */}
            {[...Array(dealingCard)].map((_, i) => {
              const target = getTargetPosition(i);
              return (
                <div
                  key={`flying-${i}`}
                  className="absolute transition-all duration-300 ease-out"
                  style={{
                    transform: `translate(${target.x}px, ${target.y}px) rotate(${Math.random() * 10 - 5}deg)`,
                    opacity: 0.8,
                    zIndex: 50 + i,
                  }}
                >
                  <CardBack />
                </div>
              );
            })}

            {/* Austeilen-Text */}
            <div
              className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-amber-300 font-bold text-lg whitespace-nowrap"
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              Karten austeilen... ({Math.floor(dealingCard / 4) + 1}/3)
            </div>
          </div>
        )}

        {/* Fertig */}
        {phase === 'done' && (
          <div
            className="text-amber-300 font-bold text-xl"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            Fertig!
          </div>
        )}
      </div>
    </div>
  );
}
