// Schafkopf Types - Kurzes Blatt

export type Farbe = 'eichel' | 'gras' | 'herz' | 'schellen';
export type Wert = '9' | '10' | 'unter' | 'ober' | 'koenig' | 'ass';

export interface Karte {
  farbe: Farbe;
  wert: Wert;
  id: string; // z.B. "herz-ober"
}

export type Spielart =
  | 'sauspiel'
  | 'wenz'
  | 'geier'
  | 'farbsolo-eichel'
  | 'farbsolo-gras'
  | 'farbsolo-herz'
  | 'farbsolo-schellen'
  | 'wenz-tout'
  | 'geier-tout'
  | 'farbsolo-eichel-tout'
  | 'farbsolo-gras-tout'
  | 'farbsolo-herz-tout'
  | 'farbsolo-schellen-tout'
  | 'hochzeit';

export type Ansage = 'weiter' | Spielart;

// Hilfsfunktionen für Tout
export function istTout(spielart: Spielart | null): boolean {
  return spielart?.endsWith('-tout') ?? false;
}

export function getBaseSolo(spielart: Spielart): Spielart {
  // Entfernt -tout Suffix falls vorhanden
  if (spielart.endsWith('-tout')) {
    return spielart.replace('-tout', '') as Spielart;
  }
  return spielart;
}

export interface Spieler {
  id: string;
  name: string;
  isBot: boolean;
  hand: Karte[];
  anfangsHand: Karte[]; // Original-Hand beim Austeilen (für Laufende-Berechnung)
  stiche: Karte[][];
  guthaben: number; // in Cent
  position: 0 | 1 | 2 | 3;
  hatAngesagt: boolean;
  ansage: Ansage | null;
  hatGelegt: boolean; // Hat beim Austeilen "gelegt" (verdoppelt)
}

export interface Stich {
  karten: { spielerId: string; karte: Karte }[];
  gewinner: string | null;
}

export type SpielPhase =
  | 'warten'      // Warten auf Spieler
  | 'austeilen'   // Karten werden ausgeteilt (Animation)
  | 'legen'       // Spieler entscheiden ob sie legen (verdoppeln)
  | 'ansagen'     // Spielansage-Phase
  | 'spielen'     // Karten spielen
  | 'stich-ende'  // Stich wird aufgelöst
  | 'runde-ende'; // Runde beendet, Abrechnung

export interface SpielState {
  id: string;
  spieler: Spieler[];
  phase: SpielPhase;
  geber: number; // Position 0-3 des Gebers

  // Legen-Phase
  legenEntscheidungen: string[]; // Spieler-IDs die bereits entschieden haben

  // Ansage
  aktuellerAnsager: number; // Position 0-3 (rechts vom Geber beginnt)
  gespielteAnsage: Spielart | null;
  spielmacher: string | null; // Spieler-ID
  partner: string | null; // Bei Sauspiel: Partner-ID
  gesuchteAss: Farbe | null; // Bei Sauspiel: Welche Sau wird gesucht

  // Du/Re
  kontra: boolean; // "Du" wurde gesagt
  re: boolean; // "Re" wurde gesagt

  // Spielverlauf
  aktuellerSpieler: number; // Position 0-3
  aktuellerStich: Stich;
  letzterStich: Stich | null; // Für "Letzter Stich" Anzeige
  stichNummer: number;

  // Ergebnis
  augenSpielmacher: number;
  augenGegner: number;
  ergebnis?: SpielErgebnis; // Gesetzt wenn phase='runde-ende'
}

export interface Raum {
  id: string;
  name: string;
  spieler: { id: string; name: string; isBot: boolean; ready: boolean }[];
  maxSpieler: 4;
  status: 'offen' | 'voll' | 'laeuft';
  ersteller: string;
  erstelltAm: number;
}

export interface SpielErgebnis {
  gewinner: 'spielmacher' | 'gegner';
  spielmacherId: string; // ID des Spielmachers (für korrekte Zuordnung nach neuer Runde)
  partnerId: string | null; // ID des Partners (bei Sauspiel)
  augenSpielmacher: number; // Augen des Spielmacher-Teams
  augenGegner: number; // Augen der Gegner
  schneider: boolean;
  schwarz: boolean;
  tout: boolean; // War es ein Tout-Spiel?
  toutGewonnen: boolean; // Hat der Tout-Spieler alle Stiche gemacht?
  laufende: number;
  grundTarif: number; // 10 oder 20 Cent
  kontraMultiplikator: number; // 1, 2 (Kontra), 4 (Re)
  legenMultiplikator: number; // 2^n wobei n = Anzahl Leger
  gesamtWert: number; // Endwert in Cent
  auszahlungen: { spielerId: string; betrag: number }[];
}
