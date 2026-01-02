'use client';

import { useState } from 'react';
import { Ansage, Farbe, Karte, Spielart } from '@/lib/schafkopf/types';
import { istTrumpf } from '@/lib/schafkopf/rules';
import { hapticTap } from '@/lib/haptics';

interface GameAnnounceProps {
  hand: Karte[];
  onAnsage: (ansage: Ansage, gesuchteAss?: Farbe) => void;
  bisherigeHoechsteAnsage?: Spielart | null;
}

// Bayerische Farbsymbole als SVG-Komponenten (passend zum noto Kartendeck)
const FarbIcon = ({ farbe, size = 20 }: { farbe: Farbe; size?: number }) => {
  const icons = {
    eichel: (
      <svg width={size} height={size} viewBox="0 0 40 52" fill="none">
        <ellipse cx="20" cy="30" rx="11" ry="14" fill="#5D4037" />
        <path d="M9 20 Q9 12 20 12 Q31 12 31 20 L31 22 Q31 26 20 26 Q9 26 9 22 Z" fill="#3E2723" />
        <path d="M12 18 L28 18 M13 20 L27 20 M14 22 L26 22" stroke="#5D4037" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="18" y="4" width="4" height="10" rx="2" fill="#6D4C41" />
        <ellipse cx="16" cy="28" rx="3" ry="4" fill="#8D6E63" opacity="0.4" />
      </svg>
    ),
    gras: (
      <svg width={size} height={size} viewBox="0 0 40 48" fill="none">
        <path d="M20 4 C32 8 36 20 34 32 C32 40 26 46 20 48 C14 46 8 40 6 32 C4 20 8 8 20 4" fill="#2E7D32" />
        <path d="M20 8 C28 11 31 20 30 30 C28 36 24 41 20 43 C16 41 12 36 10 30 C9 20 12 11 20 8" fill="#43A047" />
        <path d="M20 10 L20 42" stroke="#1B5E20" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 16 L14 22 M20 16 L26 22 M20 26 L12 34 M20 26 L28 34" stroke="#1B5E20" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    herz: (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 36 C8 26 4 18 4 12 C4 6 9 2 14 2 C17 2 19.5 4 20 6 C20.5 4 23 2 26 2 C31 2 36 6 36 12 C36 18 32 26 20 36" fill="#D32F2F" />
        <path d="M20 32 C10 24 7 17 7 12 C7 7 11 4 15 4 C17.5 4 19.5 5.5 20 7.5 C20.5 5.5 22.5 4 25 4 C29 4 33 7 33 12 C33 17 30 24 20 32" fill="#E53935" />
        <path d="M24 8 L34 18 M26 6 L36 16 M28 5 L36 13 M30 4 L36 10 M32 3 L36 7" stroke="#B71C1C" strokeWidth="0.8" opacity="0.5" />
      </svg>
    ),
    schellen: (
      <svg width={size} height={size} viewBox="0 0 40 48" fill="none">
        <ellipse cx="20" cy="6" rx="4" ry="3" fill="#BF360C" />
        <rect x="18" y="6" width="4" height="6" fill="#D84315" />
        <path d="M12 12 Q8 22 8 32 Q8 44 20 44 Q32 44 32 32 Q32 22 28 12 Z" fill="#FFB300" />
        <path d="M14 14 Q11 22 11 30 Q11 40 20 40 Q29 40 29 30 Q29 22 26 14 Z" fill="#FFC107" />
        <ellipse cx="20" cy="42" rx="10" ry="3" fill="#FF8F00" />
        <ellipse cx="20" cy="38" rx="3" ry="2.5" fill="#5D4037" />
        <ellipse cx="15" cy="24" rx="3" ry="5" fill="#FFE082" opacity="0.6" />
      </svg>
    ),
  };
  return icons[farbe];
};

// Bottom Sheet Wrapper Komponente
function BottomSheet({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 bottom-sheet-backdrop z-40" />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bottom-sheet safe-area-bottom max-h-[80vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
          borderTop: '2px solid rgba(139,90,43,0.5)',
          borderRadius: '1.5rem 1.5rem 0 0',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Handle-Bar */}
        <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-inherit">
          <div
            className="w-12 h-1 rounded-full"
            style={{ background: 'rgba(139,90,43,0.5)' }}
          />
        </div>

        <div className="px-4 pb-6 pt-2">
          {children}
        </div>
      </div>
    </>
  );
}

export default function GameAnnounce({
  hand,
  onAnsage,
  bisherigeHoechsteAnsage,
}: GameAnnounceProps) {
  const [showSauSelection, setShowSauSelection] = useState(false);
  const [showSoloSelection, setShowSoloSelection] = useState(false);
  const [showSoloToutSelection, setShowSoloToutSelection] = useState(false);

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
    'wenz-tout': 4,
    'geier-tout': 4,
    'farbsolo-eichel-tout': 5,
    'farbsolo-gras-tout': 5,
    'farbsolo-herz-tout': 5,
    'farbsolo-schellen-tout': 5,
  };

  const aktuelleWertigkeit = bisherigeHoechsteAnsage
    ? spielWertigkeit[bisherigeHoechsteAnsage] || 0
    : 0;

  const kannSauspielSagen = aktuelleWertigkeit < 1 && moeglicheSauFarben.length > 0;
  const kannWenzOderGeierSagen = aktuelleWertigkeit < 2;
  const kannSoloSagen = aktuelleWertigkeit < 3;
  const kannWenzGeierToutSagen = aktuelleWertigkeit < 4;
  const kannSoloToutSagen = aktuelleWertigkeit < 5;

  const handleAnsage = (ansage: Ansage, farbe?: Farbe) => {
    hapticTap();
    onAnsage(ansage, farbe);
  };

  if (showSauSelection) {
    return (
      <BottomSheet>
        <h3
          className="text-xl font-bold text-center mb-4"
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
                handleAnsage('sauspiel', farbe);
                setShowSauSelection(false);
              }}
              className="btn btn-primary flex items-center justify-center gap-3 py-4 text-lg"
            >
              <FarbIcon farbe={farbe} size={28} />
              <span className="capitalize">{farbe}</span>-Sau
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            hapticTap();
            setShowSauSelection(false);
          }}
          className="btn btn-secondary py-3 mt-4 w-full"
        >
          ← Zurück
        </button>
      </BottomSheet>
    );
  }

  if (showSoloSelection) {
    return (
      <BottomSheet>
        <h3
          className="text-xl font-bold text-center mb-4"
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
                handleAnsage(`farbsolo-${farbe}` as Ansage);
                setShowSoloSelection(false);
              }}
              className="btn btn-primary flex flex-col items-center gap-2 py-4 px-4"
            >
              <FarbIcon farbe={farbe} size={32} />
              <span className="capitalize">{farbe}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            hapticTap();
            setShowSoloSelection(false);
          }}
          className="btn btn-secondary py-3 mt-4 w-full"
        >
          ← Zurück
        </button>
      </BottomSheet>
    );
  }

  if (showSoloToutSelection) {
    return (
      <BottomSheet>
        <h3
          className="text-xl font-bold text-center"
          style={{
            background: 'linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Welches Solo Tout?
        </h3>
        <p className="text-xs text-amber-200 text-center mb-4">
          Du musst ALLE Stiche machen!
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(['eichel', 'gras', 'herz', 'schellen'] as Farbe[]).map(farbe => (
            <button
              key={farbe}
              onClick={() => {
                handleAnsage(`farbsolo-${farbe}-tout` as Ansage);
                setShowSoloToutSelection(false);
              }}
              className="btn flex flex-col items-center gap-2 py-4 px-4"
              style={{
                background: 'linear-gradient(135deg, #c92a2a 0%, #a61e1e 100%)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <FarbIcon farbe={farbe} size={32} />
              <span className="capitalize text-white">{farbe}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            hapticTap();
            setShowSoloToutSelection(false);
          }}
          className="btn btn-secondary py-3 mt-4 w-full"
        >
          ← Zurück
        </button>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet>
      <h3
        className="text-xl font-bold text-center mb-4"
        style={{
          background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Was spielst du?
      </h3>

      <div className="flex flex-col gap-3">
        {kannSauspielSagen && (
          <button
            onClick={() => {
              hapticTap();
              setShowSauSelection(true);
            }}
            className="btn btn-primary flex items-center justify-center gap-2 py-4 text-lg"
          >
            Sauspiel
          </button>
        )}

        {kannWenzOderGeierSagen && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAnsage('wenz')}
              className="btn btn-primary flex items-center justify-center gap-2 py-4 text-lg"
            >
              Wenz
            </button>
            <button
              onClick={() => handleAnsage('geier')}
              className="btn btn-primary flex items-center justify-center gap-2 py-4 text-lg"
            >
              Geier
            </button>
          </div>
        )}

        {kannSoloSagen && (
          <button
            onClick={() => {
              hapticTap();
              setShowSoloSelection(true);
            }}
            className="btn btn-primary flex items-center justify-center gap-2 py-4 text-lg"
          >
            Farbsolo
          </button>
        )}

        {/* Tout-Optionen - höhere Spiele */}
        {kannWenzGeierToutSagen && (
          <div className="border-t border-amber-900/50 pt-3 mt-2">
            <p className="text-xs text-amber-400 text-center mb-3">Tout (alle Stiche)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleAnsage('wenz-tout')}
                className="btn flex items-center justify-center gap-2 py-3 text-base"
                style={{
                  background: 'linear-gradient(135deg, #c92a2a 0%, #a61e1e 100%)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                }}
              >
                Wenz Tout
              </button>
              <button
                onClick={() => handleAnsage('geier-tout')}
                className="btn flex items-center justify-center gap-2 py-3 text-base"
                style={{
                  background: 'linear-gradient(135deg, #c92a2a 0%, #a61e1e 100%)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                }}
              >
                Geier Tout
              </button>
            </div>
          </div>
        )}

        {kannSoloToutSagen && (
          <button
            onClick={() => {
              hapticTap();
              setShowSoloToutSelection(true);
            }}
            className="btn flex items-center justify-center gap-2 py-3 text-base"
            style={{
              background: 'linear-gradient(135deg, #c92a2a 0%, #a61e1e 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
            }}
          >
            Farbsolo Tout
          </button>
        )}
      </div>

      <button
        onClick={() => handleAnsage('weiter')}
        className="btn btn-secondary py-4 text-lg mt-4 w-full"
      >
        Weiter (Passen)
      </button>
    </BottomSheet>
  );
}
