// "Aus is!" - Erkennung ob ein Spieler alle restlichen Stiche gewinnt
// Wenn ein Spieler die höchsten verbleibenden Trümpfe hat, kann er "aufdecken"

import { SpielState, Karte, Spielart } from './schafkopf/types';
import { istTrumpf, trumpfStaerke } from './schafkopf/rules';

/**
 * Sammelt alle bereits gespielten Karten aus den Stichen aller Spieler
 */
function getGespielteKarten(state: SpielState): Set<string> {
  const gespielt = new Set<string>();

  // Karten aus Stichen aller Spieler
  for (const spieler of state.spieler) {
    for (const stich of spieler.stiche) {
      for (const karte of stich) {
        gespielt.add(karte.id);
      }
    }
  }

  // Karten im aktuellen Stich
  for (const k of state.aktuellerStich.karten) {
    gespielt.add(k.karte.id);
  }

  return gespielt;
}

/**
 * Prüft ob ein Spieler "Aus is!" sagen kann
 * Bedingungen:
 * 1. Spieler ist am Zug und muss ausspielen (leerer Stich)
 * 2. Spieler hat nur noch Trümpfe auf der Hand
 * 3. Alle seine Trümpfe sind höher als alle verbleibenden Trümpfe der Gegner
 */
export function kannAusIs(state: SpielState, spielerId: string): boolean {
  if (state.phase !== 'spielen') return false;
  if (state.aktuellerStich.karten.length !== 0) return false; // Nur beim Ausspielen

  const spielerIndex = state.spieler.findIndex(s => s.id === spielerId);
  if (spielerIndex === -1) return false;
  if (state.aktuellerSpieler !== spielerIndex) return false;

  const spieler = state.spieler[spielerIndex];
  const spielart = state.gespielteAnsage;
  if (!spielart) return false;

  const meineHand = spieler.hand;
  if (meineHand.length === 0) return false;

  // Alle meine Karten müssen Trumpf sein
  const alleTrumpf = meineHand.every(k => istTrumpf(k, spielart));
  if (!alleTrumpf) return false;

  // Meine niedrigste Trumpf-Stärke
  const meineStaerken = meineHand.map(k => trumpfStaerke(k, spielart));
  const meineNiedrigste = Math.min(...meineStaerken);

  // Alle gespielten Karten sammeln
  const gespielteKarten = getGespielteKarten(state);

  // Meine Karten-IDs
  const meineKartenIds = new Set(meineHand.map(k => k.id));

  // Alle möglichen Trümpfe im Spiel ermitteln und prüfen welche noch bei Gegnern sein könnten
  const alleTruempfe = getAlleTruempfe(spielart);

  let gegnerHatHoeherenTrumpf = false;

  for (const trumpfId of alleTruempfe) {
    // Schon gespielt? Dann egal
    if (gespielteKarten.has(trumpfId)) continue;

    // Auf meiner Hand? Dann egal
    if (meineKartenIds.has(trumpfId)) continue;

    // Der Trumpf ist noch bei einem Gegner!
    // Prüfe ob er höher ist als mein niedrigster
    const trumpfStaerkeValue = getTrumpfStaerkeById(trumpfId, spielart);
    if (trumpfStaerkeValue >= meineNiedrigste) {
      gegnerHatHoeherenTrumpf = true;
      break;
    }
  }

  return !gegnerHatHoeherenTrumpf;
}

/**
 * Gibt alle Trumpf-Karten-IDs für eine Spielart zurück
 */
function getAlleTruempfe(spielart: Spielart): string[] {
  const truempfe: string[] = [];
  const farben = ['eichel', 'gras', 'herz', 'schellen'] as const;

  if (spielart === 'wenz') {
    // Nur Unter
    for (const farbe of farben) {
      truempfe.push(`${farbe}-unter`);
    }
  } else if (spielart === 'geier') {
    // Nur Ober
    for (const farbe of farben) {
      truempfe.push(`${farbe}-ober`);
    }
  } else {
    // Ober + Unter + Trumpffarbe
    for (const farbe of farben) {
      truempfe.push(`${farbe}-ober`);
      truempfe.push(`${farbe}-unter`);
    }

    // Trumpffarbe bestimmen
    let trumpfFarbe: string;
    if (spielart === 'sauspiel' || spielart === 'hochzeit') {
      trumpfFarbe = 'herz';
    } else if (spielart.startsWith('farbsolo-')) {
      trumpfFarbe = spielart.replace('farbsolo-', '');
    } else {
      return truempfe;
    }

    // Trumpffarbe-Karten (ohne Ober/Unter, die sind schon drin)
    for (const wert of ['ass', 'koenig', '10', '9'] as const) {
      truempfe.push(`${trumpfFarbe}-${wert}`);
    }
  }

  return truempfe;
}

/**
 * Berechnet die Trumpf-Stärke anhand der Karten-ID
 */
function getTrumpfStaerkeById(karteId: string, spielart: Spielart): number {
  const [farbe, wert] = karteId.split('-') as [string, string];
  const karte: Karte = { id: karteId, farbe: farbe as any, wert: wert as any };
  return trumpfStaerke(karte, spielart);
}
