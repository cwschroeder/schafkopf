// Kartendefinitionen - Kurzes Blatt (24 Karten)

import { Karte, Farbe, Wert } from './types';

export const FARBEN: Farbe[] = ['eichel', 'gras', 'herz', 'schellen'];
export const WERTE: Wert[] = ['9', '10', 'unter', 'ober', 'koenig', 'ass'];

// Augen-Werte
export const AUGEN: Record<Wert, number> = {
  '9': 0,
  '10': 10,
  'unter': 2,
  'ober': 3,
  'koenig': 4,
  'ass': 11,
};

// Alle 24 Karten erzeugen
export function erstelleKartenDeck(): Karte[] {
  const deck: Karte[] = [];
  for (const farbe of FARBEN) {
    for (const wert of WERTE) {
      deck.push({
        farbe,
        wert,
        id: `${farbe}-${wert}`,
      });
    }
  }
  return deck;
}

// Fisher-Yates Shuffle
export function mischen<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Karten austeilen (6 pro Spieler)
export function austeilen(): Karte[][] {
  const deck = mischen(erstelleKartenDeck());
  return [
    deck.slice(0, 6),
    deck.slice(6, 12),
    deck.slice(12, 18),
    deck.slice(18, 24),
  ];
}

// Augen einer Kartensammlung zählen
export function zaehleAugen(karten: Karte[]): number {
  return karten.reduce((sum, karte) => sum + AUGEN[karte.wert], 0);
}

// Karte als lesbaren String
export function karteZuString(karte: Karte): string {
  const farbenNamen: Record<Farbe, string> = {
    eichel: 'Eichel',
    gras: 'Gras',
    herz: 'Herz',
    schellen: 'Schellen',
  };
  const wertNamen: Record<Wert, string> = {
    '9': '9',
    '10': '10',
    unter: 'Unter',
    ober: 'Ober',
    koenig: 'König',
    ass: 'Ass',
  };
  return `${farbenNamen[karte.farbe]} ${wertNamen[karte.wert]}`;
}

// Finde Karte nach ID
export function findeKarte(hand: Karte[], karteId: string): Karte | undefined {
  return hand.find(k => k.id === karteId);
}
