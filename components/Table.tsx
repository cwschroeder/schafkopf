'use client';

import { SpielState } from '@/lib/schafkopf/types';
import { spielbareKarten } from '@/lib/schafkopf/rules';
import Hand from './Hand';
import PlayerInfo from './PlayerInfo';
import Stich from './Stich';

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
    <div className="relative w-full max-w-2xl mx-auto" style={{ aspectRatio: '5/4' }}>
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

      {/* Meine Karten (unten) */}
      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 sm:gap-2">
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

      {/* Spielinfo Overlay (dekoriert) */}
      <div
        className="absolute top-6 sm:top-10 left-6 sm:left-10 rounded-lg px-3 py-2 text-xs sm:text-sm"
        style={{
          background: 'linear-gradient(135deg, rgba(62,39,35,0.95) 0%, rgba(78,52,46,0.95) 100%)',
          border: '1px solid rgba(139,90,43,0.5)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <div className="font-semibold text-amber-200">
          {state.gespielteAnsage
            ? state.gespielteAnsage.charAt(0).toUpperCase() + state.gespielteAnsage.slice(1)
            : 'Ansage...'}
        </div>
        <div className="text-gray-300">Stich {state.stichNummer + 1}/6</div>
        {state.kontra && <div className="text-red-400 font-bold">Du!</div>}
        {state.re && <div className="text-amber-400 font-bold">Re!</div>}
      </div>

      {/* Du/Re Buttons (dekoriert) */}
      {state.phase === 'spielen' && state.stichNummer === 0 && (
        <div className="absolute top-6 sm:top-10 right-6 sm:right-10 flex gap-2">
          {!state.kontra && state.spielmacher !== myPlayerId && state.partner !== myPlayerId && (
            <DuButton roomId={state.id} playerId={myPlayerId} />
          )}
          {state.kontra && !state.re && (state.spielmacher === myPlayerId || state.partner === myPlayerId) && (
            <ReButton roomId={state.id} playerId={myPlayerId} />
          )}
        </div>
      )}

      {/* Dekorative Ecken */}
      <TableCorner position="top-left" />
      <TableCorner position="top-right" />
      <TableCorner position="bottom-left" />
      <TableCorner position="bottom-right" />
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

function DuButton({ roomId, playerId }: { roomId: string; playerId: string }) {
  const handleDu = async () => {
    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'du', roomId, playerId }),
    });
  };

  return (
    <button
      onClick={handleDu}
      className="px-3 py-1.5 rounded-lg font-bold text-sm transition-all duration-200 hover:scale-105"
      style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        boxShadow: '0 2px 8px rgba(220,38,38,0.4)',
        border: '1px solid rgba(255,255,255,0.2)',
        color: 'white',
      }}
    >
      Du!
    </button>
  );
}

function ReButton({ roomId, playerId }: { roomId: string; playerId: string }) {
  const handleRe = async () => {
    await fetch('/api/game', {
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
