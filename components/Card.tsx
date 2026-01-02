'use client';

import { Karte, Farbe, Wert } from '@/lib/schafkopf/types';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Wert zu Dateinummer Mapping (basierend auf thielepaul/Schafkopf)
const WERT_TO_FILE_NUMBER: Record<Wert, string> = {
  '9': '9',
  '10': '10',
  'unter': '2',
  'ober': '3',
  'koenig': '4',
  'ass': '11',
};

// Farbe zu Dateiname-Präfix (Kapitalisiert)
const FARBE_TO_FILE_PREFIX: Record<Farbe, string> = {
  'eichel': 'Eichel',
  'gras': 'Gras',
  'herz': 'Herz',
  'schellen': 'Schellen',
};

// Generiere den Bildpfad für eine Karte
function getCardImagePath(karte: Karte): string {
  const farbePrefix = FARBE_TO_FILE_PREFIX[karte.farbe];
  const wertNumber = WERT_TO_FILE_NUMBER[karte.wert];
  return `${basePath}/cards/${farbePrefix}-${wertNumber}.svg`;
}

interface CardProps {
  karte: Karte;
  onClick?: () => void;
  selected?: boolean;
  preSelected?: boolean; // Vorauswahl wenn nicht am Zug
  disabled?: boolean;
  hidden?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Card({
  karte,
  onClick,
  selected = false,
  preSelected = false,
  disabled = false,
  hidden = false,
  size = 'md',
  className = '',
}: CardProps) {
  const sizeConfig = {
    sm: { width: 48, height: 87, className: 'w-12 h-[87px]' },
    md: { width: 60, height: 109, className: 'w-[60px] h-[109px] sm:w-[80px] sm:h-[145px]' },
    lg: { width: 96, height: 175, className: 'w-24 h-[175px]' },
  };

  const config = sizeConfig[size];

  if (hidden || karte.id === 'hidden') {
    return (
      <div
        className={`
          ${config.className}
          rounded-lg
          shadow-lg
          overflow-hidden
          ${className}
        `}
        style={{
          background: `
            linear-gradient(135deg, #1e3a5f 0%, #2c5282 50%, #1e3a5f 100%)
          `,
          border: '2px solid #4a6fa5',
        }}
      >
        {/* Rückseiten-Muster */}
        <div className="w-full h-full flex items-center justify-center p-1">
          <div
            className="w-full h-full rounded border-2 border-amber-500/40"
            style={{
              background: `
                repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 4px,
                  rgba(212, 175, 55, 0.1) 4px,
                  rgba(212, 175, 55, 0.1) 8px
                )
              `,
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-amber-400/60 text-lg font-serif">S</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const imagePath = getCardImagePath(karte);

  // Visual states: selected (amber) > preSelected (orange) > normal
  const ringClass = selected
    ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-transparent'
    : preSelected
    ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-transparent'
    : '';

  const shadowStyle = selected
    ? '0 4px 12px rgba(212, 175, 55, 0.5), 0 2px 8px rgba(0,0,0,0.3)'
    : preSelected
    ? '0 4px 12px rgba(255, 165, 0, 0.5), 0 2px 8px rgba(0,0,0,0.3)'
    : '0 2px 8px rgba(0,0,0,0.3)';

  return (
    <div
      onClick={handleClick}
      className={`
        card
        ${config.className}
        rounded-lg
        overflow-hidden
        ${ringClass}
        ${disabled ? 'disabled opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-2'}
        ${className}
      `}
      style={{
        boxShadow: shadowStyle,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagePath}
        alt={`${karte.farbe} ${karte.wert}`}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

// Kartenrücken-Komponente
export function CardBack({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeConfig = {
    sm: 'w-12 h-[87px]',
    md: 'w-[60px] h-[109px] sm:w-[80px] sm:h-[145px]',
    lg: 'w-24 h-[175px]',
  };

  return (
    <div
      className={`
        ${sizeConfig[size]}
        rounded-lg
        shadow-lg
        overflow-hidden
        ${className}
      `}
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 50%, #1e3a5f 100%)',
        border: '2px solid #4a6fa5',
      }}
    >
      <div className="w-full h-full flex items-center justify-center p-1">
        <div
          className="w-full h-full rounded border-2 border-amber-500/40 flex items-center justify-center"
          style={{
            background: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 4px,
                rgba(212, 175, 55, 0.1) 4px,
                rgba(212, 175, 55, 0.1) 8px
              )
            `,
          }}
        >
          <span className="text-amber-400/60 text-lg font-serif">S</span>
        </div>
      </div>
    </div>
  );
}
