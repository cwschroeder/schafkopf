'use client';

interface GameLegenProps {
  onLegen: (willLegen: boolean) => void;
  kartenAnzahl: number; // Wieviele Karten der Spieler sieht
}

export default function GameLegen({ onLegen, kartenAnzahl }: GameLegenProps) {
  const containerStyle = {
    background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
    border: '2px solid rgba(139,90,43,0.5)',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
  };

  return (
    <div className="rounded-xl p-4 flex flex-col gap-3 min-w-[240px]" style={containerStyle}>
      <h3
        className="text-lg font-bold text-center"
        style={{
          background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Willst du legen?
      </h3>

      <p className="text-sm text-center text-amber-200/70">
        {kartenAnzahl} Karten gesehen - Einsatz verdoppeln?
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onLegen(true)}
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
            color: '#1a1a1a',
          }}
        >
          Legen!
        </button>
        <button
          onClick={() => onLegen(false)}
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #5d4037 0%, #4e342e 100%)',
            color: '#e5d3b3',
            border: '1px solid rgba(139,90,43,0.5)',
          }}
        >
          Nein
        </button>
      </div>
    </div>
  );
}
