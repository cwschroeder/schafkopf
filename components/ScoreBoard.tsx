'use client';

import { useState, useEffect } from 'react';
import { hapticGewonnen, hapticVerloren } from '@/lib/haptics';
import { SpielErgebnis, Spieler, Karte } from '@/lib/schafkopf/types';
import { formatiereBetrag, ergebnisZusammenfassung } from '@/lib/schafkopf/scoring';
import { AUGEN } from '@/lib/schafkopf/cards';

interface ScoreBoardProps {
  ergebnis: SpielErgebnis;
  spieler: Spieler[];
  spielmacherId: string;
  partnerId: string | null;
  playerId: string; // Aktueller Spieler (für Anzeige ob ICH gewonnen habe)
  playerName?: string; // Für Fallback-Match wenn IDs nicht übereinstimmen
  onNeueRunde: () => void;
  onBeenden: () => void;
}

export default function ScoreBoard({
  ergebnis,
  spieler,
  spielmacherId,
  partnerId,
  playerId,
  playerName,
  onNeueRunde,
  onBeenden,
}: ScoreBoardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const spielmacher = spieler.find(s => s.id === spielmacherId);
  const partner = partnerId ? spieler.find(s => s.id === partnerId) : null;

  // Helper: Augen einer Karte
  const getAugen = (karte: Karte) => AUGEN[karte.wert];

  // Helper: Karte als kurzen String
  const karteKurz = (karte: Karte) => {
    const farbenSymbole: Record<string, string> = {
      eichel: '🌰',
      gras: '🍀',
      herz: '❤️',
      schellen: '🔔',
    };
    const wertKurz: Record<string, string> = {
      '9': '9', '10': '10', 'unter': 'U', 'ober': 'O', 'koenig': 'K', 'ass': 'A',
    };
    return `${farbenSymbole[karte.farbe]}${wertKurz[karte.wert]}`;
  };

  // Alle Stiche sammeln für Details
  const alleStiche: { karten: Karte[]; gewinner: string; augen: number; team: 'spielmacher' | 'gegner' }[] = [];
  const spielmacherTeamIds = partnerId ? [spielmacherId, partnerId] : [spielmacherId];

  for (const s of spieler) {
    for (const stich of s.stiche) {
      const augen = stich.reduce((sum, k) => sum + getAugen(k), 0);
      const istSpielmacherTeam = spielmacherTeamIds.includes(s.id);
      alleStiche.push({
        karten: stich,
        gewinner: s.name,
        augen,
        team: istSpielmacherTeam ? 'spielmacher' : 'gegner',
      });
    }
  }

  const spielmacherTeam = partner
    ? `${spielmacher?.name} & ${partner.name}`
    : spielmacher?.name;

  const gegner = spieler
    .filter(s => s.id !== spielmacherId && s.id !== partnerId)
    .map(s => s.name)
    .join(' & ');

  // Finde den aktuellen Spieler - erst nach ID, dann nach Name als Fallback
  let meinSpieler = spieler.find(s => s.id === playerId);
  if (!meinSpieler && playerName) {
    // Fallback: Suche nach Name (falls ID nicht matcht, z.B. nach Session-Wechsel)
    meinSpieler = spieler.find(s => s.name === playerName);
    console.log('[ScoreBoard] ID-Match fehlgeschlagen, Name-Fallback:', meinSpieler?.name);
  }

  // Prüfe ob ICH (der aktuelle Spieler) gewonnen habe
  const meineId = meinSpieler?.id;
  const binImSpielmacherTeam = meineId === spielmacherId || meineId === partnerId;
  const spielmacherHatGewonnen = ergebnis.gewinner === 'spielmacher';
  const ichHabeGewonnen = binImSpielmacherTeam === spielmacherHatGewonnen;

  // Haptic Feedback beim Anzeigen des Ergebnisses
  useEffect(() => {
    if (ichHabeGewonnen) {
      hapticGewonnen();
    } else {
      hapticVerloren();
    }
  }, [ichHabeGewonnen]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-1 sm:p-4">
      <div
        className="rounded-2xl p-2 sm:p-4 md:p-6 w-full flex flex-col gap-1.5 sm:gap-3 max-h-[98vh] landscape:max-h-[95vh] overflow-y-auto max-w-md landscape:max-w-3xl"
        style={{
          background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
          border: '2px solid rgba(139,90,43,0.5)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Überschrift mit Ergebnis */}
        <div
          className="text-center py-1.5 sm:py-2 rounded-lg shrink-0"
          style={{
            background: ichHabeGewonnen
              ? 'linear-gradient(135deg, #166534 0%, #14532d 100%)'
              : 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
          }}
        >
          <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white flex items-center justify-center gap-1 sm:gap-2">
            {ichHabeGewonnen ? '🎉' : '😔'}
            {ichHabeGewonnen ? 'Gewonnen!' : 'Verloren!'} {ergebnis.schneider && '(Schneider)'} {ergebnis.schwarz && '(Schwarz)'} {ergebnis.laufende >= 3 && `mit ${ergebnis.laufende} Laufenden`}
            {ichHabeGewonnen ? '🎉' : '😔'}
          </h2>
        </div>

        {/* Hauptinhalt - im Landscape 2 Spalten */}
        <div className="flex flex-col landscape:flex-row landscape:gap-2 gap-1.5 sm:gap-3 min-h-0 overflow-y-auto">
          {/* Linke Spalte: Spieldetails */}
          <div
            className="rounded-lg p-2 sm:p-3 space-y-1 sm:space-y-1.5 text-xs sm:text-sm landscape:flex-1 landscape:min-w-0"
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(139,90,43,0.3)',
            }}
          >
            <div className="flex justify-between text-amber-100 gap-2">
              <span className="text-amber-300/70 shrink-0">Spielmacher:</span>
              <span className="font-semibold truncate">{spielmacherTeam}</span>
            </div>
            <div className="flex justify-between text-amber-100 gap-2">
              <span className="text-amber-300/70 shrink-0">Gegner:</span>
              <span className="font-semibold truncate">{gegner}</span>
            </div>
            <hr className="border-amber-800/30" />
            {/* Augen-Anzeige */}
            <div className="flex justify-between items-center">
              <span className="text-amber-300/70">Augen:</span>
              <div className="flex gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded ${ergebnis.augenSpielmacher >= 61 ? 'bg-green-800/50 text-green-300' : 'bg-red-800/50 text-red-300'}`}>
                  Spielm: {ergebnis.augenSpielmacher}
                </span>
                <span className={`px-2 py-0.5 rounded ${ergebnis.augenGegner >= 61 ? 'bg-green-800/50 text-green-300' : 'bg-red-800/50 text-red-300'}`}>
                  Gegner: {ergebnis.augenGegner}
                </span>
              </div>
            </div>
            <hr className="border-amber-800/30" />
            <div className="flex justify-between text-amber-100">
              <span className="text-amber-300/70">Grundtarif:</span>
              <span>{ergebnis.grundTarif} Ct</span>
            </div>
            {ergebnis.schneider && (
              <div className="flex justify-between text-amber-400">
                <span>⚡ Schneider:</span>
                <span className="font-bold">×2</span>
              </div>
            )}
            {ergebnis.schwarz && (
              <div className="flex justify-between text-red-400">
                <span>💀 Schwarz:</span>
                <span className="font-bold">×2</span>
              </div>
            )}
            {ergebnis.laufende > 0 && (
              <div className="flex justify-between text-blue-400">
                <span>🏃 {ergebnis.laufende} Laufende:</span>
                <span className="font-bold">+{ergebnis.laufende * 10} Ct</span>
              </div>
            )}
            {ergebnis.kontraMultiplikator > 1 && (
              <div className="flex justify-between text-purple-400">
                <span>📢 {ergebnis.kontraMultiplikator === 4 ? 'Re' : 'Du'}:</span>
                <span className="font-bold">×{ergebnis.kontraMultiplikator}</span>
              </div>
            )}
            {ergebnis.legenMultiplikator > 1 && (
              <div className="flex justify-between text-orange-400">
                <span>🎲 Gelegt ({Math.log2(ergebnis.legenMultiplikator)}×):</span>
                <span className="font-bold">×{ergebnis.legenMultiplikator}</span>
              </div>
            )}
            <hr className="border-amber-800/30" />
            <div className="flex justify-between text-sm sm:text-base font-bold text-amber-200">
              <span>Gesamt:</span>
              <span
                className="px-2 py-0.5 rounded"
                style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
                  color: '#1a1a1a',
                }}
              >
                {ergebnis.gesamtWert} Ct
              </span>
            </div>
            {/* Details Button */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-2 w-full py-1 text-xs rounded transition-colors"
              style={{
                background: 'rgba(139,90,43,0.3)',
                color: '#d4af37',
              }}
            >
              {showDetails ? '▲ Details ausblenden' : '▼ Details anzeigen'}
            </button>
            {/* Details Panel */}
            {showDetails && (
              <div className="mt-2 space-y-1 text-xs">
                <div className="font-semibold text-amber-300 mb-1">Stich-Aufschlüsselung:</div>
                {alleStiche.map((stich, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center px-1.5 py-0.5 rounded"
                    style={{
                      background: stich.team === 'spielmacher'
                        ? 'rgba(22,101,52,0.2)'
                        : 'rgba(153,27,27,0.2)',
                    }}
                  >
                    <span className="text-amber-100/70 truncate">
                      {stich.karten.map(k => karteKurz(k)).join(' ')}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="text-amber-100/50 text-[10px]">{stich.gewinner}</span>
                      <span
                        className="font-bold px-1 rounded"
                        style={{
                          color: stich.team === 'spielmacher' ? '#86efac' : '#fca5a5',
                        }}
                      >
                        {stich.augen}
                      </span>
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-1 border-t border-amber-800/30">
                  <span className="text-green-400">Spielm: {ergebnis.augenSpielmacher}</span>
                  <span className="text-red-400">Gegner: {ergebnis.augenGegner}</span>
                </div>
              </div>
            )}
          </div>

          {/* Rechte Spalte: Auszahlung & Kontostand */}
          <div className="flex flex-col gap-1.5 sm:gap-3 landscape:flex-1 landscape:min-w-0">
            {/* Auszahlung */}
            <div
              className="rounded-lg p-2 sm:p-3"
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(139,90,43,0.3)',
              }}
            >
              <h3 className="font-semibold mb-1 sm:mb-2 text-amber-300 flex items-center gap-1 text-xs sm:text-sm">
                💰 Auszahlung
              </h3>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 sm:gap-y-1 text-xs sm:text-sm">
                {ergebnis.auszahlungen.map(a => {
                  const s = spieler.find(sp => sp.id === a.spielerId);
                  const istPositiv = a.betrag >= 0;
                  return (
                    <div
                      key={a.spielerId}
                      className="flex justify-between items-center"
                    >
                      <span className="text-amber-100 truncate mr-1">{s?.name}:</span>
                      <span
                        className="font-bold px-1.5 py-0.5 rounded text-xs shrink-0"
                        style={{
                          background: istPositiv
                            ? 'linear-gradient(135deg, #166534 0%, #14532d 100%)'
                            : 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
                          color: istPositiv ? '#86efac' : '#fca5a5',
                        }}
                      >
                        {istPositiv ? '+' : ''}{formatiereBetrag(a.betrag)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kontostand */}
            <div
              className="rounded-lg p-2 sm:p-3"
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(139,90,43,0.3)',
              }}
            >
              <h3 className="font-semibold mb-1 sm:mb-2 text-amber-300 flex items-center gap-1 text-xs sm:text-sm">
                📊 Kontostand
              </h3>
              <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                {spieler.map(s => {
                  const istPositiv = s.guthaben >= 0;
                  return (
                    <div
                      key={s.id}
                      className="flex justify-between items-center px-1.5 py-0.5 rounded"
                      style={{
                        background: 'rgba(0,0,0,0.2)',
                      }}
                    >
                      <span className="text-amber-100/80 text-xs truncate max-w-[50px]">
                        {s.name}
                      </span>
                      <span
                        className="font-bold text-xs"
                        style={{
                          color: istPositiv ? '#86efac' : '#fca5a5',
                        }}
                      >
                        {formatiereBetrag(s.guthaben)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Buttons - immer sichtbar */}
        <div className="flex gap-2 sm:gap-3 shrink-0 pt-1">
          <button
            onClick={onNeueRunde}
            className="flex-1 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
              color: '#1a1a1a',
              boxShadow: '0 4px 12px rgba(212,175,55,0.3)',
            }}
          >
            🃏 Neue Runde
          </button>
          <button
            onClick={onBeenden}
            className="flex-1 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #5d4037 0%, #4e342e 100%)',
              color: '#e5d3b3',
              border: '1px solid rgba(139,90,43,0.5)',
            }}
          >
            Beenden
          </button>
        </div>
      </div>
    </div>
  );
}
