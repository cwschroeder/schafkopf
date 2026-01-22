'use client';

import { Spieler } from '@/lib/schafkopf/types';
import { formatiereBetrag } from '@/lib/schafkopf/scoring';

interface PlayerInfoProps {
  spieler: Spieler;
  isCurrentPlayer?: boolean;
  isMe?: boolean;
  position: 'bottom' | 'left' | 'top' | 'right';
  isSpielmacher?: boolean;
  isPartner?: boolean;
  isGeber?: boolean;
  showCardCount?: boolean;
  isWaitingForLegen?: boolean;  // Spieler muss noch Legen-Entscheidung treffen
  isAusspieler?: boolean;       // Hat als erstes ausgespielt (Vorhand)
}

export default function PlayerInfo({
  spieler,
  isCurrentPlayer = false,
  isMe = false,
  position,
  isSpielmacher = false,
  isPartner = false,
  isGeber = false,
  showCardCount = false,
  isWaitingForLegen = false,
  isAusspieler = false,
}: PlayerInfoProps) {
  // Layout je nach Position anpassen
  const isHorizontal = position === 'left' || position === 'right';

  return (
    <div
      className={`
        flex ${isHorizontal ? 'flex-col' : 'flex-row'} items-center gap-2
        ${isCurrentPlayer ? 'current-player' : ''}
      `}
    >
      {/* Hauptcontainer mit Name und Icons */}
      <div
        className={`
          px-3 py-1.5 rounded-lg text-sm font-semibold
          flex items-center gap-2
          transition-all duration-300
          ${isCurrentPlayer ? 'scale-110 animate-pulse-glow' : ''}
        `}
        style={{
          background: isMe
            ? 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)'
            : isCurrentPlayer
              ? 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)'
              : 'linear-gradient(135deg, #5d4037 0%, #4e342e 100%)',
          color: isMe ? '#1a1a1a' : '#e5d3b3',
          border: isCurrentPlayer
            ? '3px solid #fbbf24'
            : isWaitingForLegen
              ? '2px solid #f59e0b'
              : '1px solid rgba(139,90,43,0.5)',
          boxShadow: isCurrentPlayer
            ? '0 0 20px rgba(251,191,36,0.7), 0 0 40px rgba(124,58,237,0.5), 0 4px 8px rgba(0,0,0,0.4)'
            : isWaitingForLegen
              ? '0 0 10px rgba(245,158,11,0.4), 0 2px 4px rgba(0,0,0,0.3)'
              : '0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {/* Bot Icon */}
        {spieler.isBot && (
          <span className="opacity-70">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2M7.5 13A2.5 2.5 0 005 15.5 2.5 2.5 0 007.5 18a2.5 2.5 0 002.5-2.5A2.5 2.5 0 007.5 13m9 0a2.5 2.5 0 00-2.5 2.5 2.5 2.5 0 002.5 2.5 2.5 2.5 0 002.5-2.5 2.5 2.5 0 00-2.5-2.5z" />
            </svg>
          </span>
        )}

        {/* Name */}
        <span className="truncate max-w-[80px] sm:max-w-[100px]">{spieler.name}</span>

        {/* Spielmacher Krone */}
        {isSpielmacher && (
          <span className="text-amber-300" title="Spielmacher">👑</span>
        )}

        {/* Partner Icon */}
        {isPartner && (
          <span className="text-blue-300" title="Partner">🤝</span>
        )}

        {/* Geber Icon */}
        {isGeber && (
          <span className="text-emerald-400" title="Geber">🃏</span>
        )}

        {/* Ausspieler (Vorhand) Badge - nur bei Stich 0 */}
        {isAusspieler && (
          <span
            className="px-1 py-0.5 rounded text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              color: 'white',
            }}
            title="Vorhand (spielt aus)"
          >
            Vorhand
          </span>
        )}

        {/* Wartet auf Legen-Entscheidung */}
        {isWaitingForLegen && (
          <span className="text-amber-400" title="Muss noch entscheiden">⏳</span>
        )}

        {/* Gelegt Indicator */}
        {spieler.hatGelegt && (
          <span
            className="px-1 py-0.5 rounded text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: 'white',
            }}
            title="Hat gelegt (verdoppelt)"
          >
            2x
          </span>
        )}
      </div>

      {/* Info-Zeile: Karten, Stiche, Guthaben */}
      <div className={`flex ${isHorizontal ? 'flex-col' : 'flex-row'} items-center gap-1.5`}>
        {/* Kartenanzahl (nur für Gegner) */}
        {showCardCount && spieler.hand.length > 0 && (
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
            style={{
              background: 'rgba(0,0,0,0.4)',
              color: '#e5d3b3',
            }}
            title={`${spieler.hand.length} Karten`}
          >
            <span>🃏</span>
            <span className="font-semibold">{spieler.hand.length}</span>
          </div>
        )}

        {/* Stiche-Anzeige als kleine Kartenstapel */}
        {spieler.stiche.length > 0 && (
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
            style={{
              background: 'linear-gradient(135deg, #166534 0%, #14532d 100%)',
              color: '#86efac',
              border: '1px solid rgba(134, 239, 172, 0.3)',
            }}
            title={`${spieler.stiche.length} Stiche gewonnen`}
          >
            <StichIcons count={spieler.stiche.length} />
            <span className="font-bold">{spieler.stiche.length}</span>
          </div>
        )}

        {/* Guthaben */}
        <div
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{
            background: spieler.guthaben >= 0
              ? 'linear-gradient(135deg, #166534 0%, #14532d 100%)'
              : 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
            color: spieler.guthaben >= 0 ? '#86efac' : '#fca5a5',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {formatiereBetrag(spieler.guthaben)}
        </div>
      </div>
    </div>
  );
}

// Kleine Stich-Icons
function StichIcons({ count }: { count: number }) {
  // Maximal 6 Icons zeigen
  const displayCount = Math.min(count, 6);

  return (
    <div className="flex -space-x-1">
      {Array.from({ length: displayCount }).map((_, i) => (
        <div
          key={i}
          className="w-2.5 h-3.5 rounded-sm"
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)',
            border: '1px solid #b8860b',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
        />
      ))}
    </div>
  );
}
