/**
 * Mitspieler-Reaktionen
 *
 * Logik für situationsbedingte Kommentare von Bot-Mitspielern
 * (nicht dem aktiven Spieler, und nie dem menschlichen Spieler)
 */

import { SpielState, Karte, Spieler, Spielart } from './schafkopf/types';
import { istTrumpf } from './schafkopf/rules';
import { AUGEN } from './schafkopf/cards';
import {
  MITSPIELER_AUFFORDERN_STECHEN,
  MITSPIELER_VERPASST_STECHEN,
  MITSPIELER_STICH_SERIE,
  MITSPIELER_STICH_VERSCHENKT,
  MITSPIELER_PARTNER_GEFUNDEN,
  BavarianPhrase,
} from './bavarian-speech';

// Situationstypen
export type MitspielerSituation =
  | 'auffordern-stechen'
  | 'verpasst-stechen'
  | 'stich-serie'
  | 'stich-verschenkt'
  | 'partner-gefunden';

// Reaktion mit Sprecher-Info
export interface MitspielerReaktion {
  situation: MitspielerSituation;
  sprecherId: string;     // Bot-ID der sprechen soll
  sprecherName: string;   // Name für Anzeige
  phrase: BavarianPhrase; // Spruch
}

// Wahrscheinlichkeiten für jede Situation (0-1)
const WAHRSCHEINLICHKEITEN: Record<MitspielerSituation, number> = {
  'auffordern-stechen': 0.6,
  'verpasst-stechen': 0.8,
  'stich-serie': 0.7,
  'stich-verschenkt': 0.5,
  'partner-gefunden': 0.9,
};

// Spruch-Listen pro Situation
const SPRUECHE: Record<MitspielerSituation, BavarianPhrase[]> = {
  'auffordern-stechen': MITSPIELER_AUFFORDERN_STECHEN,
  'verpasst-stechen': MITSPIELER_VERPASST_STECHEN,
  'stich-serie': MITSPIELER_STICH_SERIE,
  'stich-verschenkt': MITSPIELER_STICH_VERSCHENKT,
  'partner-gefunden': MITSPIELER_PARTNER_GEFUNDEN,
};

// Stich-Historie für Serie-Erkennung
let stichHistorie: string[] = [];

/**
 * Setzt die Stich-Historie zurück (bei neuem Spiel aufrufen)
 */
export function resetStichHistorie(): void {
  stichHistorie = [];
}

/**
 * Fügt einen Stich-Gewinner zur Historie hinzu
 */
export function addStichGewinner(gewinnerId: string): void {
  stichHistorie.push(gewinnerId);
}

/**
 * Zählt aufeinanderfolgende Stiche eines Spielers (von hinten)
 */
function getStichSerie(spielerId: string): number {
  let serie = 0;
  for (let i = stichHistorie.length - 1; i >= 0; i--) {
    if (stichHistorie[i] === spielerId) {
      serie++;
    } else {
      break;
    }
  }
  return serie;
}

/**
 * Berechnet die Augen im aktuellen Stich
 */
function getStichAugen(state: SpielState): number {
  return state.aktuellerStich.karten.reduce(
    (sum, k) => sum + AUGEN[k.karte.wert],
    0
  );
}

/**
 * Findet einen zufälligen Bot-Mitspieler (nicht der aktive Spieler, nicht der Mensch)
 */
function findeBotMitspieler(
  state: SpielState,
  ausgeschlossen?: string // Spieler-ID die nicht sprechen soll
): Spieler | null {
  const kandidaten = state.spieler.filter(s =>
    s.isBot &&
    s.id !== ausgeschlossen
  );

  if (kandidaten.length === 0) return null;

  return kandidaten[Math.floor(Math.random() * kandidaten.length)];
}

/**
 * Wählt einen zufälligen Spruch aus
 */
function waehleZufallsSpruch(situation: MitspielerSituation): BavarianPhrase {
  const sprueche = SPRUECHE[situation];
  return sprueche[Math.floor(Math.random() * sprueche.length)];
}

/**
 * Prüft ob Reaktion basierend auf Wahrscheinlichkeit triggern soll
 */
function sollTriggern(situation: MitspielerSituation): boolean {
  return Math.random() < WAHRSCHEINLICHKEITEN[situation];
}

/**
 * SITUATION 1: Aufforderung zum Stechen
 * Trigger: 3 Karten im Stich mit hohem Augenwert (>=15), letzter Spieler dran
 */
export function checkAufforderungStechen(
  state: SpielState
): MitspielerReaktion | null {
  // Nur bei 3 Karten im Stich
  if (state.aktuellerStich.karten.length !== 3) return null;

  // Hoher Stich-Wert?
  const augen = getStichAugen(state);
  if (augen < 15) return null;

  // Wahrscheinlichkeitsprüfung
  if (!sollTriggern('auffordern-stechen')) return null;

  // Aktiver Spieler ist der letzte
  const aktiverSpieler = state.spieler[state.aktuellerSpieler];

  // Bot-Mitspieler finden (nicht der aktive Spieler)
  const sprecher = findeBotMitspieler(state, aktiverSpieler.id);
  if (!sprecher) return null;

  return {
    situation: 'auffordern-stechen',
    sprecherId: sprecher.id,
    sprecherName: sprecher.name,
    phrase: waehleZufallsSpruch('auffordern-stechen'),
  };
}

/**
 * SITUATION 2: Verpasstes Stechen
 * Trigger: Spieler hat Trumpf auf der Hand, spielt aber keinen Trumpf bei hohem Stich
 * HINWEIS: Diese Funktion muss VOR dem Kartenspielen mit der alten Hand aufgerufen werden
 */
export function checkVerpasstStechen(
  state: SpielState,
  spielerId: string,
  gespielteKarte: Karte,
  alteHand: Karte[]
): MitspielerReaktion | null {
  if (!state.gespielteAnsage) return null;

  // Nur wenn nicht selbst angespielt (dann gibt's nix zu stechen)
  if (state.aktuellerStich.karten.length === 0) return null;

  // Stich muss wertvoll sein
  const augen = getStichAugen(state);
  if (augen < 12) return null;

  // Gespielte Karte ist kein Trumpf?
  const hatNichtGestochen = !istTrumpf(gespielteKarte, state.gespielteAnsage);
  if (!hatNichtGestochen) return null;

  // Hatte der Spieler Trumpf auf der Hand?
  const hatteTrumpf = alteHand.some(k =>
    istTrumpf(k, state.gespielteAnsage!) && k.id !== gespielteKarte.id
  );
  if (!hatteTrumpf) return null;

  // Wahrscheinlichkeitsprüfung
  if (!sollTriggern('verpasst-stechen')) return null;

  // Bot-Mitspieler finden
  const sprecher = findeBotMitspieler(state, spielerId);
  if (!sprecher) return null;

  return {
    situation: 'verpasst-stechen',
    sprecherId: sprecher.id,
    sprecherName: sprecher.name,
    phrase: waehleZufallsSpruch('verpasst-stechen'),
  };
}

/**
 * SITUATION 3: Stich-Serie
 * Trigger: Ein Spieler macht 3+ Stiche hintereinander
 */
export function checkStichSerie(
  state: SpielState,
  gewinnerId: string
): MitspielerReaktion | null {
  // Gewinner zur Historie hinzufügen
  addStichGewinner(gewinnerId);

  // Serie prüfen
  const serie = getStichSerie(gewinnerId);
  if (serie < 3) return null;

  // Wahrscheinlichkeitsprüfung
  if (!sollTriggern('stich-serie')) return null;

  // Bot-Mitspieler finden (nicht der Gewinner)
  const sprecher = findeBotMitspieler(state, gewinnerId);
  if (!sprecher) return null;

  return {
    situation: 'stich-serie',
    sprecherId: sprecher.id,
    sprecherName: sprecher.name,
    phrase: waehleZufallsSpruch('stich-serie'),
  };
}

/**
 * SITUATION 4: Hoher Stich verschenkt
 * Trigger: Gegner gewinnt Stich mit 20+ Augen
 */
export function checkStichVerschenkt(
  state: SpielState,
  gewinnerId: string,
  stichAugen: number
): MitspielerReaktion | null {
  // Hoher Stich?
  if (stichAugen < 20) return null;

  // Ist der Gewinner Gegner des Spielmachers?
  const istGegner = gewinnerId !== state.spielmacher && gewinnerId !== state.partner;

  // Finde einen Bot-Mitspieler aus dem Spielmacher-Team, der kommentieren kann
  const spielmacherTeam = [state.spielmacher, state.partner].filter(Boolean) as string[];
  const kandidaten = state.spieler.filter(s =>
    s.isBot &&
    spielmacherTeam.includes(s.id) &&
    s.id !== gewinnerId
  );

  // Wenn der Gewinner im Spielmacher-Team ist, suche Gegner-Bots die kommentieren
  if (!istGegner) {
    // Gegner freuen sich nicht laut wenn der Spielmacher Punkte macht
    return null;
  }

  if (kandidaten.length === 0) return null;

  // Wahrscheinlichkeitsprüfung
  if (!sollTriggern('stich-verschenkt')) return null;

  const sprecher = kandidaten[Math.floor(Math.random() * kandidaten.length)];

  return {
    situation: 'stich-verschenkt',
    sprecherId: sprecher.id,
    sprecherName: sprecher.name,
    phrase: waehleZufallsSpruch('stich-verschenkt'),
  };
}

/**
 * SITUATION 5: Partner gefunden
 * Trigger: Bei Sauspiel wird die gesuchte Sau gespielt und Partner wird bekannt
 */
export function checkPartnerGefunden(
  state: SpielState,
  gespielteKarte: Karte,
  spielerId: string
): MitspielerReaktion | null {
  // Nur bei Sauspiel
  if (state.gespielteAnsage !== 'sauspiel') return null;

  // Gesuchte Sau?
  if (!state.gesuchteAss) return null;
  if (gespielteKarte.farbe !== state.gesuchteAss || gespielteKarte.wert !== 'ass') {
    return null;
  }

  // Der Spieler der die Sau spielt ist der Partner
  // (und war vorher unbekannt)
  if (state.partner !== null) {
    // Partner war schon bekannt
    return null;
  }

  // Wahrscheinlichkeitsprüfung
  if (!sollTriggern('partner-gefunden')) return null;

  // Gegner-Bot soll kommentieren
  const gegner = state.spieler.filter(s =>
    s.isBot &&
    s.id !== state.spielmacher &&
    s.id !== spielerId // nicht der Partner selbst
  );

  if (gegner.length === 0) return null;

  const sprecher = gegner[Math.floor(Math.random() * gegner.length)];

  return {
    situation: 'partner-gefunden',
    sprecherId: sprecher.id,
    sprecherName: sprecher.name,
    phrase: waehleZufallsSpruch('partner-gefunden'),
  };
}

/**
 * Hauptfunktion: Prüft alle Situationen nach Stich-Ende
 */
export function checkMitspielerReaktionNachStich(
  state: SpielState,
  gewinnerId: string,
  stichAugen: number
): MitspielerReaktion | null {
  // Priorisierte Prüfung

  // 1. Stich-Serie (spektakulär)
  const serieReaktion = checkStichSerie(state, gewinnerId);
  if (serieReaktion) return serieReaktion;

  // 2. Hoher Stich verschenkt (emotional)
  const verschenktReaktion = checkStichVerschenkt(state, gewinnerId, stichAugen);
  if (verschenktReaktion) return verschenktReaktion;

  return null;
}

/**
 * Prüft vor dem Kartenspielen auf Aufforderung zum Stechen
 */
export function checkMitspielerReaktionVorSpielzug(
  state: SpielState
): MitspielerReaktion | null {
  return checkAufforderungStechen(state);
}
