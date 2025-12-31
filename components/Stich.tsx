'use client';

import { Stich as StichType, Spieler } from '@/lib/schafkopf/types';
import Card from './Card';
import { useEffect, useState, useRef } from 'react';

interface StichProps {
  stich: StichType;
  spieler: Spieler[];
  myPosition: number;
  onTakeTrick?: () => void;
  isCollecting?: boolean; // Animation zum Einsammeln
}

export default function Stich({ stich, spieler, myPosition, onTakeTrick, isCollecting = false }: StichProps) {
  const [animatedCards, setAnimatedCards] = useState<Set<string>>(new Set());
  const [collecting, setCollecting] = useState(false);
  const prevStichLengthRef = useRef(stich.karten.length);

  // Animation triggern wenn neue Karte gespielt wird
  useEffect(() => {
    if (stich.karten.length > 0) {
      const lastCard = stich.karten[stich.karten.length - 1];
      if (!animatedCards.has(lastCard.karte.id)) {
        // Kurze Verzögerung für die Animation
        setTimeout(() => {
          setAnimatedCards(prev => new Set([...prev, lastCard.karte.id]));
        }, 50);
      }
    }
  }, [stich.karten.length]);

  // Reset wenn neuer Stich
  useEffect(() => {
    if (stich.karten.length === 0) {
      setAnimatedCards(new Set());
      setCollecting(false);
    }
  }, [stich.karten.length]);

  // Collect-Animation starten wenn isCollecting true wird
  useEffect(() => {
    if (isCollecting && stich.karten.length === 4 && stich.gewinner) {
      setCollecting(true);
    }
  }, [isCollecting, stich.karten.length, stich.gewinner]);

  // Bildschirmgröße für responsive Animationen
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Gewinner-Position für Einsammel-Animation berechnen
  const getCollectPosition = (gewinnerId: string): { x: number; y: number } => {
    const gewinnerIndex = spieler.findIndex(s => s.id === gewinnerId);
    const relativ = (gewinnerIndex - myPosition + 4) % 4;
    const dist = isMobile ? 100 : 150;
    const distX = isMobile ? 120 : 180;
    const positions = {
      0: { x: 0, y: dist },      // bottom (ich)
      1: { x: distX, y: 0 },     // right
      2: { x: 0, y: -dist },     // top
      3: { x: -distX, y: 0 },    // left
    };
    return positions[relativ as 0 | 1 | 2 | 3];
  };

  // Positionen relativ zu meiner Position berechnen
  const getRelativePosition = (spielerIndex: number): 'bottom' | 'left' | 'top' | 'right' => {
    const relativ = (spielerIndex - myPosition + 4) % 4;
    const positions: ('bottom' | 'left' | 'top' | 'right')[] = ['bottom', 'right', 'top', 'left'];
    return positions[relativ];
  };

  // Ziel-Positionen für die Karten in der Mitte (responsive)
  const offset = isMobile ? 18 : 25;
  const offsetX = isMobile ? 22 : 30;
  const cardPositions: Record<string, { x: number; y: number; rotation: number }> = {
    bottom: { x: 0, y: offset, rotation: 5 },
    top: { x: 0, y: -offset, rotation: -5 },
    left: { x: -offsetX, y: 0, rotation: -8 },
    right: { x: offsetX, y: 0, rotation: 8 },
  };

  // Start-Positionen (von wo die Karten kommen) - responsive
  const startDist = isMobile ? 80 : 120;
  const startDistX = isMobile ? 100 : 140;
  const startPositions: Record<string, { x: number; y: number }> = {
    bottom: { x: 0, y: startDist },
    top: { x: 0, y: -startDist },
    left: { x: -startDistX, y: 0 },
    right: { x: startDistX, y: 0 },
  };

  const gewinnerSpieler = stich.gewinner
    ? spieler.find(s => s.id === stich.gewinner)
    : null;

  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52">
      {stich.karten.map((k, index) => {
        const spielerIndex = spieler.findIndex(s => s.id === k.spielerId);
        const position = getRelativePosition(spielerIndex);
        const isGewinner = stich.gewinner === k.spielerId;
        const kartenSpieler = spieler.find(s => s.id === k.spielerId);
        const endPos = cardPositions[position];
        const startPos = startPositions[position];
        const isAnimated = animatedCards.has(k.karte.id);

        // Aktuelle Position (animiert oder Start)
        const currentX = isAnimated ? endPos.x : startPos.x;
        const currentY = isAnimated ? endPos.y : startPos.y;
        const currentRotation = isAnimated ? endPos.rotation : 0;
        const currentScale = isAnimated ? 1 : 0.8;
        const currentOpacity = isAnimated ? 1 : 0;

        // Collect-Animation: Karten fliegen zum Gewinner
        const collectPos = stich.gewinner ? getCollectPosition(stich.gewinner) : { x: 0, y: 0 };
        const collectX = collecting ? collectPos.x : currentX;
        const collectY = collecting ? collectPos.y : currentY;
        const collectRotation = collecting ? (index * 15 - 20) : currentRotation;
        const collectScale = collecting ? 0.4 : currentScale;
        const collectOpacity = collecting ? 0 : currentOpacity;

        return (
          <div
            key={k.karte.id}
            className="absolute left-1/2 top-1/2"
            style={{
              transform: `translate(-50%, -50%) translate(${collectX}px, ${collectY}px) rotate(${collectRotation}deg) scale(${collectScale})`,
              opacity: collectOpacity,
              transition: collecting
                ? 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              filter: isGewinner && !collecting ? 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.9))' : 'none',
              zIndex: index + 1,
            }}
          >
            <Card karte={k.karte} size="sm" />
            {/* Name-Label an der Karte */}
            <div
              className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap"
              style={{
                fontSize: '10px',
                background: isGewinner
                  ? 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)'
                  : 'rgba(0,0,0,0.8)',
                color: isGewinner ? '#1a1a1a' : '#e5d3b3',
                padding: '2px 8px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                fontWeight: isGewinner ? 'bold' : 'normal',
              }}
            >
              {kartenSpieler?.name?.slice(0, 10)}
            </div>
          </div>
        );
      })}

      {/* Gewinner-Overlay bei vollständigem Stich */}
      {stich.karten.length === 4 && stich.gewinner && (
        <div
          className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer"
          onClick={onTakeTrick}
          style={{
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <div
            className="px-4 py-2 rounded-lg text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(139,90,43,0.95) 0%, rgba(62,39,35,0.95) 100%)',
              border: '2px solid #d4af37',
              boxShadow: '0 4px 20px rgba(212,175,55,0.4), 0 4px 12px rgba(0,0,0,0.4)',
              animation: 'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div className="text-amber-300 font-bold text-sm flex items-center gap-2">
              <span className="text-lg">👑</span>
              {gewinnerSpieler?.name}
            </div>
            <div className="text-amber-200 text-xs">
              Stich gewonnen!
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Letzter Stich Overlay
export function LetzterStich({
  stich,
  spieler,
  onClose,
}: {
  stich: StichType;
  spieler: Spieler[];
  onClose: () => void;
}) {
  const gewinner = spieler.find(s => s.id === stich.gewinner);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-6 flex flex-col items-center gap-4 max-w-sm mx-4"
        style={{
          background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
          border: '2px solid rgba(139,90,43,0.5)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3
          className="text-lg font-bold"
          style={{
            background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Letzter Stich
        </h3>

        <div className="flex gap-3">
          {stich.karten.map(k => {
            const istGewinner = k.spielerId === stich.gewinner;
            return (
              <div
                key={k.karte.id}
                className="flex flex-col items-center gap-1"
                style={{
                  filter: istGewinner ? 'drop-shadow(0 0 6px rgba(212,175,55,0.6))' : 'none',
                }}
              >
                <Card karte={k.karte} size="sm" />
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: istGewinner
                      ? 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)'
                      : 'rgba(0,0,0,0.3)',
                    color: istGewinner ? '#1a1a1a' : '#e5d3b3',
                  }}
                >
                  {spieler.find(s => s.id === k.spielerId)?.name}
                </span>
              </div>
            );
          })}
        </div>

        {gewinner && (
          <p className="text-amber-300 font-semibold flex items-center gap-2">
            <span>👑</span>
            {gewinner.name} gewinnt!
          </p>
        )}

        <button
          onClick={onClose}
          className="btn btn-secondary mt-2"
        >
          Schließen
        </button>
      </div>
    </div>
  );
}
