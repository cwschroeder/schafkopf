'use client';

import { ReactElement } from 'react';
import { Farbe } from '@/lib/schafkopf/types';

// Bayerische Farbsymbole als SVG-Komponenten (passend zum noto Kartendeck)
export default function FarbIcon({ farbe, size = 20 }: { farbe: Farbe; size?: number }) {
  const icons: Record<Farbe, ReactElement> = {
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
}
