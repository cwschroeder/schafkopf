// Punkteberechnung und Tarife

import { Spielart, SpielErgebnis, Spieler } from './types';
import { zaehlenLaufende } from './rules';
import { zaehleAugen } from './cards';

// Tarife in Cent
export const TARIFE = {
  sauspiel: 10,
  wenz: 20,
  geier: 20,
  'farbsolo-eichel': 20,
  'farbsolo-gras': 20,
  'farbsolo-herz': 20,
  'farbsolo-schellen': 20,
  hochzeit: 10,
} as const;

// Laufende-Bonus pro Laufendem (ab 3)
export const LAUFENDE_BONUS = 10; // Cent

interface AbrechnungsParams {
  spielart: Spielart;
  spielmacherId: string;
  partnerId: string | null; // Bei Sauspiel
  spieler: Spieler[];
  kontra: boolean;
  re: boolean;
}

/**
 * Berechnet das Spielergebnis und die Auszahlungen
 */
export function berechneErgebnis(params: AbrechnungsParams): SpielErgebnis {
  const { spielart, spielmacherId, partnerId, spieler, kontra, re } = params;

  // Sammle alle Stiche der Parteien
  const spielmacherTeam = partnerId
    ? [spielmacherId, partnerId]
    : [spielmacherId];

  let spielmacherAugen = 0;
  let spielmacherStiche: number = 0;
  let gegnerAugen = 0;
  let gegnerStiche: number = 0;
  let spielmacherAlleKarten: typeof spieler[0]['stiche'][0] = [];

  for (const s of spieler) {
    const alleKartenInStichen = s.stiche.flat();
    const augen = zaehleAugen(alleKartenInStichen);

    if (spielmacherTeam.includes(s.id)) {
      spielmacherAugen += augen;
      spielmacherStiche += s.stiche.length;
      spielmacherAlleKarten = [...spielmacherAlleKarten, ...alleKartenInStichen];
    } else {
      gegnerAugen += augen;
      gegnerStiche += s.stiche.length;
    }
  }

  // Gewinner bestimmen (61 Augen zum Gewinnen, bei Kontra braucht Spielmacher mehr)
  const spielmacherGewinnt = spielmacherAugen >= 61;
  const gewinner = spielmacherGewinnt ? 'spielmacher' : 'gegner';

  // Schneider & Schwarz
  const schneider = spielmacherGewinnt
    ? gegnerAugen < 31
    : spielmacherAugen < 31;

  const schwarz = spielmacherGewinnt
    ? gegnerStiche === 0
    : spielmacherStiche === 0;

  // Laufende berechnen
  const laufende = zaehlenLaufende(spielmacherAlleKarten, spielart);

  // Grundtarif
  const grundTarif = TARIFE[spielart];

  // Kontra/Re Multiplikator
  let kontraMultiplikator = 1;
  if (kontra) kontraMultiplikator = 2;
  if (re) kontraMultiplikator = 4;

  // Gesamtwert berechnen
  let gesamtWert = grundTarif;

  // Schneider/Schwarz Bonus
  if (schneider) gesamtWert *= 2;
  if (schwarz) gesamtWert *= 2; // Zusätzlich zu Schneider

  // Laufende-Bonus
  if (laufende >= 3) {
    gesamtWert += laufende * LAUFENDE_BONUS;
  }

  // Kontra/Re anwenden
  gesamtWert *= kontraMultiplikator;

  // Auszahlungen berechnen
  const auszahlungen = berechneAuszahlungen(
    spieler,
    spielmacherTeam,
    gewinner,
    gesamtWert
  );

  return {
    gewinner,
    schneider,
    schwarz,
    laufende,
    grundTarif,
    kontraMultiplikator,
    gesamtWert,
    auszahlungen,
  };
}

/**
 * Berechnet wer wem wie viel zahlt
 */
function berechneAuszahlungen(
  spieler: Spieler[],
  spielmacherTeam: string[],
  gewinner: 'spielmacher' | 'gegner',
  wert: number
): SpielErgebnis['auszahlungen'] {
  const auszahlungen: SpielErgebnis['auszahlungen'] = [];

  const istSolo = spielmacherTeam.length === 1;
  const spielmacherId = spielmacherTeam[0];

  if (istSolo) {
    // Solo: Spielmacher gegen 3
    if (gewinner === 'spielmacher') {
      // Spielmacher bekommt von jedem Gegner
      auszahlungen.push({ spielerId: spielmacherId, betrag: wert * 3 });
      for (const s of spieler) {
        if (s.id !== spielmacherId) {
          auszahlungen.push({ spielerId: s.id, betrag: -wert });
        }
      }
    } else {
      // Spielmacher zahlt an jeden Gegner
      auszahlungen.push({ spielerId: spielmacherId, betrag: -wert * 3 });
      for (const s of spieler) {
        if (s.id !== spielmacherId) {
          auszahlungen.push({ spielerId: s.id, betrag: wert });
        }
      }
    }
  } else {
    // Sauspiel/Hochzeit: 2 vs 2
    const partnerId = spielmacherTeam[1];

    if (gewinner === 'spielmacher') {
      // Spielmacher-Team bekommt von Gegnern
      for (const s of spieler) {
        if (spielmacherTeam.includes(s.id)) {
          auszahlungen.push({ spielerId: s.id, betrag: wert });
        } else {
          auszahlungen.push({ spielerId: s.id, betrag: -wert });
        }
      }
    } else {
      // Gegner-Team bekommt von Spielmacher-Team
      for (const s of spieler) {
        if (spielmacherTeam.includes(s.id)) {
          auszahlungen.push({ spielerId: s.id, betrag: -wert });
        } else {
          auszahlungen.push({ spielerId: s.id, betrag: wert });
        }
      }
    }
  }

  return auszahlungen;
}

/**
 * Formatiert Cent-Betrag als Euro-String
 */
export function formatiereBetrag(cent: number): string {
  const euro = cent / 100;
  const vorzeichen = cent >= 0 ? '+' : '';
  return `${vorzeichen}${euro.toFixed(2)} €`;
}

/**
 * Gibt eine lesbare Zusammenfassung des Ergebnisses
 */
export function ergebnisZusammenfassung(ergebnis: SpielErgebnis): string {
  let text = ergebnis.gewinner === 'spielmacher' ? 'Gewonnen!' : 'Verloren!';

  if (ergebnis.schwarz) {
    text += ' (Schwarz)';
  } else if (ergebnis.schneider) {
    text += ' (Schneider)';
  }

  if (ergebnis.laufende >= 3) {
    text += ` mit ${ergebnis.laufende} Laufenden`;
  }

  if (ergebnis.kontraMultiplikator > 1) {
    text += ergebnis.kontraMultiplikator === 4 ? ' (Re)' : ' (Du)';
  }

  return text;
}
