'use client';

import { useState } from 'react';
import { Ansage, Farbe, Karte, Spielart } from '@/lib/schafkopf/types';
import { istTrumpf } from '@/lib/schafkopf/rules';
import { hapticTap } from '@/lib/haptics';
import Card from './Card';
import FarbIcon from './FarbIcon';

interface GameAnnounceProps {
  hand: Karte[];
  onAnsage: (ansage: Ansage, gesuchteAss?: Farbe) => void;
  bisherigeHoechsteAnsage?: Spielart | null;
}

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
  const [toutMode, setToutMode] = useState(false);

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

  // Mit Tout-Toggle: Wenz/Geier/Solo brauchen höhere Wertigkeit
  const kannSauspielSagen = aktuelleWertigkeit < 1 && moeglicheSauFarben.length > 0 && !toutMode;
  const kannWenzOderGeierSagen = toutMode ? aktuelleWertigkeit < 4 : aktuelleWertigkeit < 2;
  const kannSoloSagen = toutMode ? aktuelleWertigkeit < 5 : aktuelleWertigkeit < 3;

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
            background: toutMode
              ? 'linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%)'
              : 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Welches Solo{toutMode ? ' Tout' : ''}?
        </h3>
        {toutMode && (
          <p className="text-xs text-red-300 text-center mb-4">
            Du musst ALLE Stiche machen!
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {(['eichel', 'gras', 'herz', 'schellen'] as Farbe[]).map(farbe => (
            <button
              key={farbe}
              onClick={() => {
                const ansage = toutMode ? `farbsolo-${farbe}-tout` : `farbsolo-${farbe}`;
                handleAnsage(ansage as Ansage);
                setShowSoloSelection(false);
              }}
              className={`btn ${toutMode ? '' : 'btn-primary'} flex flex-col items-center gap-2 py-4 px-4`}
              style={toutMode ? {
                background: 'linear-gradient(135deg, #c92a2a 0%, #a61e1e 100%)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
              } : undefined}
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

  // Button-Style basierend auf Tout-Modus
  const buttonStyle = toutMode ? {
    background: 'linear-gradient(135deg, #c92a2a 0%, #a61e1e 100%)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white',
  } : undefined;

  return (
    <BottomSheet>
      {/* Kartenvorschau - damit man sieht was man hat */}
      <div className="mb-3">
        <div className="flex justify-center items-end">
          {hand.map((karte, index) => (
            <div
              key={karte.id}
              style={{
                marginLeft: index > 0 ? '-12px' : '0',
                transform: `rotate(${(index - (hand.length - 1) / 2) * 4}deg)`,
                zIndex: index,
              }}
            >
              <Card karte={karte} size="sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Tout Toggle */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <h3
          className="text-xl font-bold"
          style={{
            background: toutMode
              ? 'linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%)'
              : 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Was spielst du?
        </h3>
        <button
          onClick={() => {
            hapticTap();
            setToutMode(!toutMode);
          }}
          className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
            toutMode
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          Tout
        </button>
      </div>

      {toutMode && (
        <p className="text-xs text-red-300 text-center mb-3 -mt-2">
          Du musst ALLE Stiche machen!
        </p>
      )}

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
              onClick={() => handleAnsage(toutMode ? 'wenz-tout' : 'wenz')}
              className={`btn ${toutMode ? '' : 'btn-primary'} flex items-center justify-center gap-2 py-4 text-lg`}
              style={buttonStyle}
            >
              Wenz{toutMode ? ' Tout' : ''}
            </button>
            <button
              onClick={() => handleAnsage(toutMode ? 'geier-tout' : 'geier')}
              className={`btn ${toutMode ? '' : 'btn-primary'} flex items-center justify-center gap-2 py-4 text-lg`}
              style={buttonStyle}
            >
              Geier{toutMode ? ' Tout' : ''}
            </button>
          </div>
        )}

        {kannSoloSagen && (
          <button
            onClick={() => {
              hapticTap();
              setShowSoloSelection(true);
            }}
            className={`btn ${toutMode ? '' : 'btn-primary'} flex items-center justify-center gap-2 py-4 text-lg`}
            style={buttonStyle}
          >
            Farbsolo{toutMode ? ' Tout' : ''}
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
