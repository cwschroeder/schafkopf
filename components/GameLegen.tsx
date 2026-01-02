'use client';

import { hapticTap } from '@/lib/haptics';

interface GameLegenProps {
  onLegen: (willLegen: boolean) => void;
  kartenAnzahl: number;
  isLoading?: boolean;
}

export default function GameLegen({ onLegen, kartenAnzahl, isLoading = false }: GameLegenProps) {
  const handleLegen = (willLegen: boolean) => {
    hapticTap();
    onLegen(willLegen);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 bottom-sheet-backdrop z-40" />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bottom-sheet safe-area-bottom"
        style={{
          background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
          borderTop: '2px solid rgba(139,90,43,0.5)',
          borderRadius: '1.5rem 1.5rem 0 0',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Handle-Bar für visuelles Feedback */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="w-12 h-1 rounded-full"
            style={{ background: 'rgba(139,90,43,0.5)' }}
          />
        </div>

        <div className="px-6 pb-6 pt-2 flex flex-col gap-4">
          <h3
            className="text-xl font-bold text-center"
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

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleLegen(true)}
              disabled={isLoading}
              className={`btn btn-primary flex items-center justify-center gap-2 py-4 text-lg font-bold ${isLoading ? 'opacity-50' : ''}`}
            >
              {isLoading ? (
                <span className="spinner" />
              ) : (
                'Legen!'
              )}
            </button>
            <button
              onClick={() => handleLegen(false)}
              disabled={isLoading}
              className={`btn btn-secondary flex items-center justify-center gap-2 py-4 text-lg ${isLoading ? 'opacity-50' : ''}`}
            >
              {isLoading ? (
                <span className="spinner" />
              ) : (
                'Nein'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
