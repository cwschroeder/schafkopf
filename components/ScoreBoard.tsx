'use client';

import { SpielErgebnis, Spieler } from '@/lib/schafkopf/types';
import { formatiereBetrag, ergebnisZusammenfassung } from '@/lib/schafkopf/scoring';

interface ScoreBoardProps {
  ergebnis: SpielErgebnis;
  spieler: Spieler[];
  spielmacherId: string;
  partnerId: string | null;
  onNeueRunde: () => void;
  onBeenden: () => void;
}

export default function ScoreBoard({
  ergebnis,
  spieler,
  spielmacherId,
  partnerId,
  onNeueRunde,
  onBeenden,
}: ScoreBoardProps) {
  const spielmacher = spieler.find(s => s.id === spielmacherId);
  const partner = partnerId ? spieler.find(s => s.id === partnerId) : null;

  const spielmacherTeam = partner
    ? `${spielmacher?.name} & ${partner.name}`
    : spielmacher?.name;

  const gegner = spieler
    .filter(s => s.id !== spielmacherId && s.id !== partnerId)
    .map(s => s.name)
    .join(' & ');

  const gewonnen = ergebnis.gewinner === 'spielmacher';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl p-6 max-w-md w-full flex flex-col gap-4"
        style={{
          background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
          border: '2px solid rgba(139,90,43,0.5)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Überschrift mit Ergebnis */}
        <div
          className="text-center py-3 rounded-lg"
          style={{
            background: gewonnen
              ? 'linear-gradient(135deg, #166534 0%, #14532d 100%)'
              : 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
          }}
        >
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            {gewonnen ? '🎉' : '😔'}
            {ergebnisZusammenfassung(ergebnis)}
            {gewonnen ? '🎉' : '😔'}
          </h2>
        </div>

        {/* Spieldetails */}
        <div
          className="rounded-lg p-4 space-y-2"
          style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(139,90,43,0.3)',
          }}
        >
          <div className="flex justify-between text-amber-100">
            <span className="text-amber-300/70">Spielmacher:</span>
            <span className="font-semibold">{spielmacherTeam}</span>
          </div>
          <div className="flex justify-between text-amber-100">
            <span className="text-amber-300/70">Gegner:</span>
            <span className="font-semibold">{gegner}</span>
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
          <hr className="border-amber-800/30" />
          <div className="flex justify-between text-lg font-bold text-amber-200">
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
        </div>

        {/* Auszahlung */}
        <div
          className="rounded-lg p-4"
          style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(139,90,43,0.3)',
          }}
        >
          <h3 className="font-semibold mb-3 text-amber-300 flex items-center gap-2">
            💰 Auszahlung
          </h3>
          <div className="space-y-2">
            {ergebnis.auszahlungen.map(a => {
              const s = spieler.find(sp => sp.id === a.spielerId);
              const istPositiv = a.betrag >= 0;
              return (
                <div
                  key={a.spielerId}
                  className="flex justify-between items-center"
                >
                  <span className="text-amber-100">{s?.name}:</span>
                  <span
                    className="font-bold px-2 py-0.5 rounded"
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
          className="rounded-lg p-4"
          style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(139,90,43,0.3)',
          }}
        >
          <h3 className="font-semibold mb-3 text-amber-300 flex items-center gap-2">
            📊 Kontostand
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {spieler.map(s => {
              const istPositiv = s.guthaben >= 0;
              return (
                <div
                  key={s.id}
                  className="flex justify-between items-center px-2 py-1 rounded"
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                  }}
                >
                  <span className="text-amber-100/80 text-sm truncate max-w-[60px]">
                    {s.name}
                  </span>
                  <span
                    className="font-bold text-sm"
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

        {/* Buttons */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={onNeueRunde}
            className="flex-1 py-3 rounded-lg font-bold text-lg transition-all duration-200 hover:scale-105"
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
            className="flex-1 py-3 rounded-lg font-bold transition-all duration-200 hover:scale-105"
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
