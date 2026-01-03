'use client';

import { useState, useEffect } from 'react';
import { SpielState } from '@/lib/schafkopf/types';
import { spielbareKarten } from '@/lib/schafkopf/rules';
import { apiUrl } from '@/lib/api';
import { kannAusIs } from '@/lib/aus-is';
import { AUS_IS, randomPhrase, speak } from '@/lib/bavarian-speech';
import Hand from './Hand';
import PlayerInfo from './PlayerInfo';
import Stich, { LetzterStich } from './Stich';
import Card from './Card';

interface TableProps {
  state: SpielState;
  myPlayerId: string;
  selectedCard: string | null;
  preSelectedCard: string | null;
  onCardSelect: (karteId: string | null) => void;
  onCardPreSelect: (karteId: string | null) => void;
  onCardPlay: (karteId: string) => void;
  isCollecting?: boolean;
  speechBubble?: { text: string; playerId: string } | null;
}

export default function Table({
  state,
  myPlayerId,
  selectedCard,
  preSelectedCard,
  onCardSelect,
  onCardPreSelect,
  onCardPlay,
  isCollecting = false,
  speechBubble = null,
}: TableProps) {
  const [showLetzterStich, setShowLetzterStich] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(true);

  // Auto-Minimize nach 3 Sekunden wenn expanded
  useEffect(() => {
    if (infoExpanded && state.phase === 'spielen') {
      const timer = setTimeout(() => {
        setInfoExpanded(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [infoExpanded, state.phase]);

  // Meine Position finden
  const myIndex = state.spieler.findIndex(s => s.id === myPlayerId);
  const mySpieler = state.spieler[myIndex];

  // Spieler relativ zu mir anordnen
  // Index 0 = ich (unten), 1 = rechts, 2 = oben, 3 = links
  const getRelativeSpieler = (offset: number) => {
    return state.spieler[(myIndex + offset) % 4];
  };

  const spielerBottom = mySpieler;
  const spielerRight = getRelativeSpieler(1);
  const spielerTop = getRelativeSpieler(2);
  const spielerLeft = getRelativeSpieler(3);

  // Bin ich am Zug?
  const isMyTurn = state.aktuellerSpieler === myIndex && state.phase === 'spielen';

  // Welche Karten darf ich spielen?
  const meineSpielbarenKarten = isMyTurn
    ? spielbareKarten(
        mySpieler.hand,
        state.aktuellerStich,
        state.gespielteAnsage!,
        state.gesuchteAss || undefined
      ).map(k => k.id)
    : [];

  return (
    <div
      className="relative w-full h-full max-h-full game-table"
      style={{ aspectRatio: '4/3', maxWidth: 'min(100%, 130vh)' }}
    >
      {/* Holztisch-Hintergrund */}
      <div
        className="absolute inset-0 rounded-3xl"
        style={{
          background: `
            linear-gradient(180deg,
              #5d4037 0%,
              #6d4c41 5%,
              #4e342e 95%,
              #3e2723 100%
            )
          `,
          boxShadow: `
            inset 0 2px 10px rgba(255,255,255,0.1),
            inset 0 -2px 10px rgba(0,0,0,0.3),
            0 10px 40px rgba(0,0,0,0.5)
          `,
        }}
      >
        {/* Holzmaserung */}
        <div
          className="absolute inset-0 rounded-3xl opacity-30"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 20px,
                rgba(0,0,0,0.05) 20px,
                rgba(0,0,0,0.05) 40px
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 100px,
                rgba(139,90,43,0.1) 100px,
                rgba(139,90,43,0.1) 200px
              )
            `,
          }}
        />
      </div>

      {/* Tischrand (Holzleiste) */}
      <div
        className="absolute inset-2 sm:inset-4 rounded-2xl"
        style={{
          background: 'linear-gradient(180deg, #8d6e63 0%, #6d4c41 50%, #5d4037 100%)',
          boxShadow: `
            inset 0 2px 4px rgba(255,255,255,0.2),
            inset 0 -2px 4px rgba(0,0,0,0.3)
          `,
        }}
      />

      {/* Grüner Filz (Spielfläche) */}
      <div
        className="absolute inset-4 sm:inset-8 rounded-xl"
        style={{
          background: `
            radial-gradient(ellipse at center,
              #2d6a4f 0%,
              #1b4332 60%,
              #14342b 100%
            )
          `,
          boxShadow: `
            inset 0 0 60px rgba(0,0,0,0.4),
            inset 0 0 20px rgba(0,0,0,0.2)
          `,
        }}
      >
        {/* Filz-Textur */}
        <div
          className="absolute inset-0 rounded-xl opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Stich in der Mitte */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Stich stich={state.aktuellerStich} spieler={state.spieler} myPosition={myIndex} isCollecting={isCollecting} />
      </div>

      {/* Letzter Stich beim Gewinner anzeigen */}
      {state.letzterStich && state.letzterStich.karten.length > 0 && state.letzterStich.gewinner && (() => {
        const gewinnerIndex = state.spieler.findIndex(s => s.id === state.letzterStich!.gewinner);
        const relativPos = (gewinnerIndex - myIndex + 4) % 4;
        const positions: ('bottom' | 'right' | 'top' | 'left')[] = ['bottom', 'right', 'top', 'left'];
        const gewinnerPosition = positions[relativPos];
        return (
          <LetzterStichBeiGewinner
            stich={state.letzterStich}
            spieler={state.spieler}
            myPosition={myIndex}
            gewinnerPosition={gewinnerPosition}
            onClick={() => setShowLetzterStich(true)}
          />
        );
      })()}

      {/* Spieler oben */}
      <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2">
        <PlayerInfo
          spieler={spielerTop}
          isCurrentPlayer={state.aktuellerSpieler === (myIndex + 2) % 4}
          position="top"
          isSpielmacher={state.spielmacher === spielerTop.id}
          isPartner={state.partner === spielerTop.id}
          isGeber={state.geber === (myIndex + 2) % 4}
          showCardCount
        />
        {speechBubble?.playerId === spielerTop.id && (
          <SpeechBubble text={speechBubble.text} position="top" />
        )}
      </div>

      {/* Spieler rechts */}
      <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2">
        <PlayerInfo
          spieler={spielerRight}
          isCurrentPlayer={state.aktuellerSpieler === (myIndex + 1) % 4}
          position="right"
          isSpielmacher={state.spielmacher === spielerRight.id}
          isPartner={state.partner === spielerRight.id}
          isGeber={state.geber === (myIndex + 1) % 4}
          showCardCount
        />
        {speechBubble?.playerId === spielerRight.id && (
          <SpeechBubble text={speechBubble.text} position="right" />
        )}
      </div>

      {/* Spieler links */}
      <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2">
        <PlayerInfo
          spieler={spielerLeft}
          isCurrentPlayer={state.aktuellerSpieler === (myIndex + 3) % 4}
          position="left"
          isSpielmacher={state.spielmacher === spielerLeft.id}
          isPartner={state.partner === spielerLeft.id}
          isGeber={state.geber === (myIndex + 3) % 4}
          showCardCount
        />
        {speechBubble?.playerId === spielerLeft.id && (
          <SpeechBubble text={speechBubble.text} position="left" />
        )}
      </div>

      {/* Meine Karten (unten) - z-45 damit über Ansage-Backdrop sichtbar */}
      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 sm:gap-2 z-[45]">
        <Hand
          karten={state.phase === 'legen' ? mySpieler.hand.slice(0, 3) : mySpieler.hand}
          spielbareKarten={meineSpielbarenKarten}
          selectedCard={selectedCard}
          preSelectedCard={preSelectedCard}
          onCardSelect={onCardSelect}
          onCardPreSelect={onCardPreSelect}
          onCardPlay={onCardPlay}
          isCurrentPlayer={isMyTurn}
        />
        <PlayerInfo
          spieler={spielerBottom}
          isCurrentPlayer={isMyTurn}
          isMe={true}
          position="bottom"
          isSpielmacher={state.spielmacher === spielerBottom.id}
          isPartner={state.partner === spielerBottom.id}
          isGeber={state.geber === myIndex}
        />
      </div>

      {/* Spielinfo Overlay - kompaktierbar */}
      <div
        className="absolute top-4 sm:top-6 left-2 sm:left-6 transition-all duration-300 cursor-pointer"
        onClick={() => setInfoExpanded(!infoExpanded)}
        style={{
          background: 'linear-gradient(135deg, rgba(62,39,35,0.95) 0%, rgba(78,52,46,0.95) 100%)',
          border: '1px solid rgba(139,90,43,0.5)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          borderRadius: infoExpanded ? '0.5rem' : '9999px',
          padding: infoExpanded ? '0.5rem 0.75rem' : '0.35rem 0.6rem',
          minWidth: infoExpanded ? 'auto' : 'auto',
        }}
      >
        {infoExpanded ? (
          // Expandierter Zustand
          <div className="text-xs sm:text-sm">
            {state.gespielteAnsage ? (
              <>
                <div className="font-semibold text-amber-200">
                  {formatAnsage(state.gespielteAnsage, state.gesuchteAss)}
                </div>
                <div className="text-gray-400 text-xs">
                  von {state.spieler.find(s => s.id === state.spielmacher)?.name || 'Unbekannt'}
                </div>
              </>
            ) : (
              <div className="font-semibold text-amber-200">Ansage...</div>
            )}
            <div className="text-gray-300 mt-1">Stich {state.stichNummer + 1}/6</div>
            {state.kontra && <div className="text-red-400 font-bold">Du!</div>}
            {state.re && <div className="text-amber-400 font-bold">Re!</div>}
            {state.letzterStich && state.letzterStich.karten.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLetzterStich(true);
                }}
                className="mt-2 text-xs px-2 py-1 rounded transition-all hover:scale-105 min-h-[32px]"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,90,43,0.8) 0%, rgba(62,39,35,0.8) 100%)',
                  border: '1px solid rgba(212,175,55,0.5)',
                  color: '#e5d3b3',
                }}
              >
                Letzter Stich
              </button>
            )}
            <div className="text-[10px] text-gray-500 mt-1 text-center">▼ tippen zum minimieren</div>
          </div>
        ) : (
          // Minimierter Zustand - kompakte Chips
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
            <span className="font-bold text-amber-200">
              {state.gespielteAnsage ? formatAnsageKurz(state.gespielteAnsage, state.gesuchteAss) : '?'}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-300">{state.stichNummer + 1}/6</span>
            {state.kontra && <span className="text-red-400 font-bold">Du</span>}
            {state.re && <span className="text-amber-400 font-bold">Re</span>}
          </div>
        )}
      </div>

      {/* Kontra/Re Buttons - bis man selbst ausgespielt hat */}
      {(() => {
        // Kontra möglich: Bis man selbst eine Karte gespielt hat
        // Prüfe ob ich bereits in einem Stich gespielt habe
        const hatSchonGespielt = state.stichNummer > 0 ||
          state.aktuellerStich.karten.some(k => k.spielerId === myPlayerId);

        const showKontraRe = (state.phase === 'spielen' || state.phase === 'stich-ende') && !hatSchonGespielt;

        if (!showKontraRe) return null;

        return (
          <div className="absolute top-6 sm:top-10 right-6 sm:right-10 flex gap-2">
            {!state.kontra && state.spielmacher !== myPlayerId && state.partner !== myPlayerId && (
              <KontraButton roomId={state.id} playerId={myPlayerId} />
            )}
            {state.kontra && !state.re && (state.spielmacher === myPlayerId || state.partner === myPlayerId) && (
              <ReButton roomId={state.id} playerId={myPlayerId} />
            )}
          </div>
        );
      })()}

      {/* Aus is! Button */}
      {kannAusIs(state, myPlayerId) && (
        <div className="absolute bottom-32 sm:bottom-36 right-4 sm:right-8">
          <AusIsButton roomId={state.id} playerId={myPlayerId} />
        </div>
      )}

      {/* Dekorative Ecken */}
      <TableCorner position="top-left" />
      <TableCorner position="top-right" />
      <TableCorner position="bottom-left" />
      <TableCorner position="bottom-right" />

      {/* Letzter Stich Modal */}
      {showLetzterStich && state.letzterStich && state.letzterStich.karten.length > 0 && (
        <LetzterStich
          stich={state.letzterStich}
          spieler={state.spieler}
          onClose={() => setShowLetzterStich(false)}
        />
      )}
    </div>
  );
}

// Dekorative Eckverzierung
function TableCorner({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const positionClasses = {
    'top-left': 'top-3 left-3 sm:top-5 sm:left-5',
    'top-right': 'top-3 right-3 sm:top-5 sm:right-5 rotate-90',
    'bottom-left': 'bottom-3 left-3 sm:bottom-5 sm:left-5 -rotate-90',
    'bottom-right': 'bottom-3 right-3 sm:bottom-5 sm:right-5 rotate-180',
  };

  return (
    <div className={`absolute ${positionClasses[position]} w-4 h-4 sm:w-6 sm:h-6 opacity-40`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path
          d="M2 2 L8 2 L8 4 L4 4 L4 8 L2 8 Z"
          fill="#d4af37"
        />
      </svg>
    </div>
  );
}

function KontraButton({ roomId, playerId }: { roomId: string; playerId: string }) {
  const handleKontra = async () => {
    await fetch(apiUrl('/api/game'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'du', roomId, playerId }),
    });
  };

  return (
    <button
      onClick={handleKontra}
      className="px-3 py-1.5 rounded-lg font-bold text-sm transition-all duration-200 hover:scale-105"
      style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        boxShadow: '0 2px 8px rgba(220,38,38,0.4)',
        border: '1px solid rgba(255,255,255,0.2)',
        color: 'white',
      }}
    >
      Kontra!
    </button>
  );
}

function ReButton({ roomId, playerId }: { roomId: string; playerId: string }) {
  const handleRe = async () => {
    await fetch(apiUrl('/api/game'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 're', roomId, playerId }),
    });
  };

  return (
    <button
      onClick={handleRe}
      className="px-3 py-1.5 rounded-lg font-bold text-sm transition-all duration-200 hover:scale-105"
      style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
        border: '1px solid rgba(255,255,255,0.2)',
        color: 'black',
      }}
    >
      Re!
    </button>
  );
}

function AusIsButton({ roomId, playerId }: { roomId: string; playerId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAusIs = async () => {
    if (isLoading) return;
    setIsLoading(true);

    // Spruch abspielen
    const phrase = randomPhrase(AUS_IS);
    speak(phrase.speech);

    await fetch(apiUrl('/api/game'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ausIs', roomId, playerId }),
    });

    setIsLoading(false);
  };

  return (
    <button
      onClick={handleAusIs}
      disabled={isLoading}
      className="px-4 py-2 rounded-lg font-bold text-base transition-all duration-200 hover:scale-105 animate-pulse"
      style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        boxShadow: '0 4px 12px rgba(16,185,129,0.5)',
        border: '2px solid rgba(255,255,255,0.3)',
        color: 'white',
      }}
    >
      Aus is!
    </button>
  );
}

// Formatiert die Ansage für die Anzeige
function formatAnsage(ansage: string, gesuchteAss?: string | null): string {
  const FARBEN_NAMEN: Record<string, string> = {
    eichel: 'Eichel',
    gras: 'Gras',
    herz: 'Herz',
    schellen: 'Schellen',
  };

  if (ansage === 'sauspiel' && gesuchteAss) {
    return `Sauspiel auf ${FARBEN_NAMEN[gesuchteAss] || gesuchteAss}`;
  }

  if (ansage.startsWith('farbsolo-')) {
    const farbe = ansage.replace('farbsolo-', '').replace('-tout', '');
    const isTout = ansage.includes('-tout');
    return `${FARBEN_NAMEN[farbe] || farbe}-Solo${isTout ? ' Tout' : ''}`;
  }

  const ANSAGEN_NAMEN: Record<string, string> = {
    sauspiel: 'Sauspiel',
    wenz: 'Wenz',
    geier: 'Geier',
    hochzeit: 'Hochzeit',
    'wenz-tout': 'Wenz Tout',
    'geier-tout': 'Geier Tout',
  };

  return ANSAGEN_NAMEN[ansage] || ansage.charAt(0).toUpperCase() + ansage.slice(1);
}

// Kurze Ansage-Darstellung für minimierte Ansicht
function formatAnsageKurz(ansage: string, gesuchteAss?: string | null): string {
  const FARBEN_KURZ: Record<string, string> = {
    eichel: 'E',
    gras: 'G',
    herz: 'H',
    schellen: 'S',
  };

  if (ansage === 'sauspiel' && gesuchteAss) {
    return `🐷${FARBEN_KURZ[gesuchteAss] || ''}`;
  }

  if (ansage.startsWith('farbsolo-')) {
    const parts = ansage.replace('farbsolo-', '').split('-');
    const farbe = parts[0];
    const isTout = parts.includes('tout');
    return `Solo${FARBEN_KURZ[farbe] || ''}${isTout ? '!' : ''}`;
  }

  const KURZ: Record<string, string> = {
    wenz: 'Wenz',
    geier: 'Geier',
    hochzeit: 'HZ',
    'wenz-tout': 'Wenz!',
    'geier-tout': 'Geier!',
  };

  return KURZ[ansage] || ansage.slice(0, 4);
}

// Letzter Stich Anzeige beim Gewinner
function LetzterStichBeiGewinner({
  stich,
  spieler,
  myPosition,
  gewinnerPosition,
  onClick,
}: {
  stich: { karten: { spielerId: string; karte: { id: string; farbe: string; wert: string } }[]; gewinner: string | null };
  spieler: { id: string; name: string }[];
  myPosition: number;
  gewinnerPosition: 'top' | 'right' | 'left' | 'bottom';
  onClick: () => void;
}) {
  if (!stich.karten || stich.karten.length === 0) return null;

  // Position am Bildschirmrand je nach Gewinner-Position
  const positionClasses: Record<string, string> = {
    bottom: 'bottom-24 left-1/2 -translate-x-1/2',
    top: 'top-20 left-1/2 -translate-x-1/2',
    left: 'left-16 top-1/2 -translate-y-1/2',
    right: 'right-16 top-1/2 -translate-y-1/2',
  };

  // Karten sortiert nach Spielreihenfolge anzeigen
  return (
    <div
      className={`absolute ${positionClasses[gewinnerPosition]} cursor-pointer z-10 transition-all hover:scale-110`}
      onClick={onClick}
      title="Letzter Stich anzeigen"
    >
      <div className="relative flex gap-0.5">
        {stich.karten.map((k, i) => {
          const isWinner = k.spielerId === stich.gewinner;
          return (
            <div
              key={k.karte.id}
              className="relative"
              style={{
                transform: `rotate(${(i - 1.5) * 5}deg)`,
                marginLeft: i > 0 ? '-8px' : '0',
                zIndex: i,
              }}
            >
              <div
                className="w-6 h-9 sm:w-8 sm:h-12 rounded overflow-hidden border"
                style={{
                  borderColor: isWinner ? '#d4af37' : 'rgba(139,90,43,0.5)',
                  borderWidth: isWinner ? '2px' : '1px',
                  boxShadow: isWinner
                    ? '0 0 8px rgba(212,175,55,0.6)'
                    : '0 1px 3px rgba(0,0,0,0.3)',
                }}
              >
                <Card karte={k.karte as any} size="sm" />
              </div>
            </div>
          );
        })}
      </div>
      <div
        className="text-center text-[9px] sm:text-[10px] mt-1 px-1 py-0.5 rounded"
        style={{
          background: 'rgba(62,39,35,0.9)',
          color: '#d4af37',
        }}
      >
        {spieler.find(s => s.id === stich.gewinner)?.name?.slice(0, 8)}
      </div>
    </div>
  );
}

// Bayerische Sprechblase
function SpeechBubble({ text, position }: { text: string; position: 'top' | 'right' | 'left' | 'bottom' }) {
  const positionStyles: Record<string, React.CSSProperties> = {
    top: { marginTop: '8px' },
    right: { marginLeft: '-60px', marginTop: '50px' },
    left: { marginLeft: '60px', marginTop: '50px' },
    bottom: { marginBottom: '8px' },
  };

  return (
    <div
      className="animate-bounce-in"
      style={{
        ...positionStyles[position],
        animation: 'bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div
        className="px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap"
        style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)',
          color: '#78350f',
          border: '2px solid #d97706',
          boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)',
          fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
        }}
      >
        {text}
        {/* Sprechblasen-Pfeil */}
        <div
          className="absolute w-0 h-0"
          style={{
            top: position === 'bottom' ? '-8px' : 'auto',
            bottom: position === 'top' ? '-8px' : 'auto',
            left: '50%',
            transform: 'translateX(-50%)',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: position === 'top' ? 'none' : '8px solid #fcd34d',
            borderTop: position === 'bottom' ? 'none' : '8px solid #fcd34d',
          }}
        />
      </div>
    </div>
  );
}
