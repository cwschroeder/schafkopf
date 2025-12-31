'use client';

import { useState } from 'react';
import { Ansage, Farbe, Karte } from '@/lib/schafkopf/types';
import { istTrumpf } from '@/lib/schafkopf/rules';

interface GameAnnounceProps {
  hand: Karte[];
  onAnsage: (ansage: Ansage, gesuchteAss?: Farbe) => void;
  bisherigeHoechsteAnsage?: Ansage | null;
}

// Bayerische Farbsymbole als SVG-Komponenten (passend zum noto Kartendeck)
const FarbIcon = ({ farbe, size = 20 }: { farbe: Farbe; size?: number }) => {
  const icons = {
    // Eichel: Braune Eichel mit Hütchen
    eichel: (
      <svg width={size} height={size} viewBox="0 0 40 52" fill="none">
        {/* Eichel-Körper */}
        <ellipse cx="20" cy="30" rx="11" ry="14" fill="#5D4037" />
        {/* Eichel-Hütchen */}
        <path d="M9 20 Q9 12 20 12 Q31 12 31 20 L31 22 Q31 26 20 26 Q9 26 9 22 Z" fill="#3E2723" />
        {/* Hütchen-Textur */}
        <path d="M12 18 L28 18 M13 20 L27 20 M14 22 L26 22" stroke="#5D4037" strokeWidth="1.2" strokeLinecap="round" />
        {/* Stiel */}
        <rect x="18" y="4" width="4" height="10" rx="2" fill="#6D4C41" />
        {/* Glanzpunkt */}
        <ellipse cx="16" cy="28" rx="3" ry="4" fill="#8D6E63" opacity="0.4" />
      </svg>
    ),
    // Gras/Laub: Grünes Blatt (schildförmig)
    gras: (
      <svg width={size} height={size} viewBox="0 0 40 48" fill="none">
        {/* Blatt-Form (Schildform wie im bayerischen Deck) */}
        <path d="M20 4 C32 8 36 20 34 32 C32 40 26 46 20 48 C14 46 8 40 6 32 C4 20 8 8 20 4" fill="#2E7D32" />
        {/* Innere Blattform */}
        <path d="M20 8 C28 11 31 20 30 30 C28 36 24 41 20 43 C16 41 12 36 10 30 C9 20 12 11 20 8" fill="#43A047" />
        {/* Mittelader */}
        <path d="M20 10 L20 42" stroke="#1B5E20" strokeWidth="2" strokeLinecap="round" />
        {/* Seitenadern */}
        <path d="M20 16 L14 22 M20 16 L26 22 M20 26 L12 34 M20 26 L28 34" stroke="#1B5E20" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    // Herz: Rotes Herz (traditioneller bayerischer Stil)
    herz: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        {/* Herz-Form */}
        <path d="M20 36 C8 26 4 18 4 12 C4 6 9 2 14 2 C17 2 19.5 4 20 6 C20.5 4 23 2 26 2 C31 2 36 6 36 12 C36 18 32 26 20 36" fill="#D32F2F" />
        {/* Inneres Herz (heller) */}
        <path d="M20 32 C10 24 7 17 7 12 C7 7 11 4 15 4 C17.5 4 19.5 5.5 20 7.5 C20.5 5.5 22.5 4 25 4 C29 4 33 7 33 12 C33 17 30 24 20 32" fill="#E53935" />
        {/* Schattierung (typisch für bayerische Karten) */}
        <path d="M24 8 L34 18 M26 6 L36 16 M28 5 L36 13 M30 4 L36 10 M32 3 L36 7" stroke="#B71C1C" strokeWidth="0.8" opacity="0.5" />
      </svg>
    ),
    // Schellen: Goldene Glocke/Schelle
    schellen: (
      <svg width={size} height={size} viewBox="0 0 40 48" fill="none">
        {/* Aufhängung oben */}
        <ellipse cx="20" cy="6" rx="4" ry="3" fill="#BF360C" />
        <rect x="18" y="6" width="4" height="6" fill="#D84315" />
        {/* Glocken-Körper */}
        <path d="M12 12 Q8 22 8 32 Q8 44 20 44 Q32 44 32 32 Q32 22 28 12 Z" fill="#FFB300" />
        {/* Glocken-Innenseite (Schatten) */}
        <path d="M14 14 Q11 22 11 30 Q11 40 20 40 Q29 40 29 30 Q29 22 26 14 Z" fill="#FFC107" />
        {/* Glocken-Rand */}
        <ellipse cx="20" cy="42" rx="10" ry="3" fill="#FF8F00" />
        {/* Klöppel */}
        <ellipse cx="20" cy="38" rx="3" ry="2.5" fill="#5D4037" />
        {/* Glanzpunkt */}
        <ellipse cx="15" cy="24" rx="3" ry="5" fill="#FFE082" opacity="0.6" />
      </svg>
    ),
  };
  return icons[farbe];
};

export default function GameAnnounce({
  hand,
  onAnsage,
  bisherigeHoechsteAnsage,
}: GameAnnounceProps) {
  const [showSauSelection, setShowSauSelection] = useState(false);
  const [showSoloSelection, setShowSoloSelection] = useState(false);

  // Welche Sauspiel-Farben sind möglich?
  const moeglicheSauFarben: Farbe[] = (['eichel', 'gras', 'schellen'] as Farbe[]).filter(farbe => {
    const hatAss = hand.some(k => k.farbe === farbe && k.wert === 'ass');
    const hatFarbe = hand.some(k => k.farbe === farbe && !istTrumpf(k, 'sauspiel'));
    return !hatAss && hatFarbe;
  });

  const spielWertigkeit: Record<string, number> = {
    'sauspiel': 1,
    'hochzeit': 1,
    'wenz': 2,
    'geier': 2,
    'farbsolo-eichel': 3,
    'farbsolo-gras': 3,
    'farbsolo-herz': 3,
    'farbsolo-schellen': 3,
  };

  const aktuelleWertigkeit = bisherigeHoechsteAnsage
    ? spielWertigkeit[bisherigeHoechsteAnsage]
    : 0;

  const kannSauspielSagen = aktuelleWertigkeit < 1 && moeglicheSauFarben.length > 0;
  const kannWenzOderGeierSagen = aktuelleWertigkeit < 2;
  const kannSoloSagen = aktuelleWertigkeit < 3;

  const containerStyle = {
    background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
    border: '2px solid rgba(139,90,43,0.5)',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
  };

  if (showSauSelection) {
    return (
      <div className="rounded-2xl p-5 flex flex-col gap-4 min-w-[280px]" style={containerStyle}>
        <h3
          className="text-xl font-bold text-center"
          style={{
            background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Welche Sau?
        </h3>
        <div className="flex flex-col gap-3">
          {moeglicheSauFarben.map(farbe => (
            <button
              key={farbe}
              onClick={() => {
                onAnsage('sauspiel', farbe);
                setShowSauSelection(false);
              }}
              className="btn btn-primary flex items-center justify-center gap-3 py-3 text-lg"
            >
              <FarbIcon farbe={farbe} size={24} />
              <span className="capitalize">{farbe}</span>-Sau
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowSauSelection(false)}
          className="btn btn-secondary py-3"
        >
          ← Zurück
        </button>
      </div>
    );
  }

  if (showSoloSelection) {
    return (
      <div className="rounded-2xl p-5 flex flex-col gap-4 min-w-[280px]" style={containerStyle}>
        <h3
          className="text-xl font-bold text-center"
          style={{
            background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Welches Solo?
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {(['eichel', 'gras', 'herz', 'schellen'] as Farbe[]).map(farbe => (
            <button
              key={farbe}
              onClick={() => {
                onAnsage(`farbsolo-${farbe}` as Ansage);
                setShowSoloSelection(false);
              }}
              className="btn btn-primary flex flex-col items-center gap-2 py-3 px-4"
            >
              <FarbIcon farbe={farbe} size={28} />
              <span className="capitalize text-sm">{farbe}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowSoloSelection(false)}
          className="btn btn-secondary py-3"
        >
          ← Zurück
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 flex flex-col gap-3 min-w-[260px]" style={containerStyle}>
      <h3
        className="text-lg font-bold text-center"
        style={{
          background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Was spielst du?
      </h3>

      <div className="flex flex-col gap-2">
        {kannSauspielSagen && (
          <button
            onClick={() => setShowSauSelection(true)}
            className="btn btn-primary flex items-center justify-center gap-2 py-3 text-base"
          >
            Sauspiel
          </button>
        )}

        {kannWenzOderGeierSagen && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onAnsage('wenz')}
              className="btn btn-primary flex items-center justify-center gap-2 py-3 text-base"
            >
              Wenz
            </button>
            <button
              onClick={() => onAnsage('geier')}
              className="btn btn-primary flex items-center justify-center gap-2 py-3 text-base"
            >
              Geier
            </button>
          </div>
        )}

        {kannSoloSagen && (
          <button
            onClick={() => setShowSoloSelection(true)}
            className="btn btn-primary flex items-center justify-center gap-2 py-3 text-base"
          >
            Farbsolo
          </button>
        )}
      </div>

      <button
        onClick={() => onAnsage('weiter')}
        className="btn btn-secondary py-3 text-base"
      >
        Weiter (Passen)
      </button>
    </div>
  );
}
