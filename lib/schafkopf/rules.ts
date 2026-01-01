// Schafkopf Spielregeln - Trumpflogik und Stich-Auswertung

import { Karte, Farbe, Wert, Spielart, Stich, getBaseSolo } from './types';

// Trumpfreihenfolge für Ober (höchster zuerst)
const OBER_REIHENFOLGE: Farbe[] = ['eichel', 'gras', 'herz', 'schellen'];
// Trumpfreihenfolge für Unter
const UNTER_REIHENFOLGE: Farbe[] = ['eichel', 'gras', 'herz', 'schellen'];

// Reihenfolge innerhalb einer Farbe (höchster zuerst, ohne Ober/Unter)
const FARB_REIHENFOLGE: Wert[] = ['ass', 'koenig', '10', '9'];

// Herz-Trumpf Reihenfolge (ohne Ober/Unter)
const HERZ_TRUMPF_REIHENFOLGE: Wert[] = ['ass', 'koenig', '10', '9'];

/**
 * Prüft ob eine Karte Trumpf ist
 */
export function istTrumpf(karte: Karte, spielart: Spielart): boolean {
  // Normalisiere Spielart (entferne -tout Suffix für Trumpf-Logik)
  const basisSpielart = getBaseSolo(spielart);

  // Ober sind immer Trumpf (außer bei Wenz)
  if (karte.wert === 'ober' && basisSpielart !== 'wenz') {
    return true;
  }

  // Unter sind immer Trumpf (außer bei Geier)
  if (karte.wert === 'unter' && basisSpielart !== 'geier') {
    return true;
  }

  // Bei Sauspiel/Hochzeit: Herz ist Trumpf
  if ((basisSpielart === 'sauspiel' || basisSpielart === 'hochzeit') && karte.farbe === 'herz') {
    return true;
  }

  // Bei Farbsolo: Die gewählte Farbe ist Trumpf
  if (basisSpielart.startsWith('farbsolo-')) {
    const trumpfFarbe = basisSpielart.replace('farbsolo-', '') as Farbe;
    if (karte.farbe === trumpfFarbe) {
      return true;
    }
  }

  // Bei Wenz: Nur Unter sind Trumpf (keine Farbe)
  // Bei Geier: Nur Ober sind Trumpf (keine Farbe)

  return false;
}

/**
 * Gibt die Trumpfstärke einer Karte zurück (höher = stärker)
 * Nicht-Trumpf Karten geben -1 zurück
 */
export function trumpfStaerke(karte: Karte, spielart: Spielart): number {
  if (!istTrumpf(karte, spielart)) {
    return -1;
  }

  // Normalisiere Spielart (entferne -tout Suffix)
  const basisSpielart = getBaseSolo(spielart);

  let staerke = 0;

  // Bei Wenz: Nur Unter (4 Stück)
  if (basisSpielart === 'wenz') {
    if (karte.wert === 'unter') {
      return 100 + (3 - UNTER_REIHENFOLGE.indexOf(karte.farbe));
    }
    return -1;
  }

  // Bei Geier: Nur Ober (4 Stück)
  if (basisSpielart === 'geier') {
    if (karte.wert === 'ober') {
      return 100 + (3 - OBER_REIHENFOLGE.indexOf(karte.farbe));
    }
    return -1;
  }

  // Normal/Sauspiel/Hochzeit/Farbsolo: Ober > Unter > Trumpffarbe
  if (karte.wert === 'ober') {
    // Ober: 200-203 (Eichel=203, Gras=202, Herz=201, Schellen=200)
    return 200 + (3 - OBER_REIHENFOLGE.indexOf(karte.farbe));
  }

  if (karte.wert === 'unter') {
    // Unter: 100-103 (Eichel=103, Gras=102, Herz=101, Schellen=100)
    return 100 + (3 - UNTER_REIHENFOLGE.indexOf(karte.farbe));
  }

  // Trumpffarbe (nicht Ober/Unter): 0-5
  // Ass=5, König=4, 10=3, 9=2, 8=1, 7=0
  const trumpfFarbeIndex = FARB_REIHENFOLGE.indexOf(karte.wert);
  if (trumpfFarbeIndex !== -1) {
    return 5 - trumpfFarbeIndex;
  }

  return -1;
}

/**
 * Gibt die Stärke einer Nicht-Trumpf-Karte innerhalb ihrer Farbe zurück
 */
export function farbStaerke(karte: Karte): number {
  // Ass=5, König=4, 10=3, 9=2, 8=1, 7=0
  // Ober und Unter sind nie in der Farbstärke (sie sind Trumpf)
  if (karte.wert === 'ober' || karte.wert === 'unter') {
    return -1;
  }
  return 5 - FARB_REIHENFOLGE.indexOf(karte.wert);
}

/**
 * Bestimmt die angespielte Farbe eines Stichs
 */
export function angespieltefarbe(stich: Stich, spielart: Spielart): Farbe | 'trumpf' {
  if (!stich.karten || stich.karten.length === 0) {
    throw new Error('Stich hat keine Karten');
  }

  const ersteStichKarte = stich.karten[0];
  if (!ersteStichKarte || !ersteStichKarte.karte) {
    throw new Error('Erste Karte im Stich ist ungültig');
  }

  const ersteKarte = ersteStichKarte.karte;

  if (istTrumpf(ersteKarte, spielart)) {
    return 'trumpf';
  }

  return ersteKarte.farbe;
}

/**
 * Prüft ob ein Spieler eine bestimmte Karte spielen darf
 */
export function darfKarteSpielen(
  karte: Karte,
  hand: Karte[],
  stich: Stich,
  spielart: Spielart,
  gesuchteAss?: Farbe // Bei Sauspiel: Die gesuchte Sau-Farbe
): boolean {
  // Wenn nur noch eine Karte auf der Hand ist, MUSS diese gespielt werden
  if (hand.length === 1) {
    return true;
  }

  // Erste Karte im Stich: Alles erlaubt (außer Sauspiel-Regeln)
  if (stich.karten.length === 0) {
    // Bei Sauspiel: Man darf nicht die gesuchte Farbe anspielen, wenn man die Sau selbst hat
    // (außer man hat 4 oder mehr Karten dieser Farbe)
    if (spielart === 'sauspiel' && gesuchteAss && karte.farbe === gesuchteAss) {
      const hatSau = hand.some(k => k.farbe === gesuchteAss && k.wert === 'ass');
      if (hatSau) {
        const kartenDerFarbe = hand.filter(k => k.farbe === gesuchteAss && !istTrumpf(k, spielart));
        // Davon eine sein darf, wenn man nur noch die Sau hat oder 4+ Karten
        if (kartenDerFarbe.length >= 4) {
          return true; // "Davonlaufen" erlaubt
        }
        // Ansonsten darf man die Farbe nicht anspielen
        return false;
      }
    }
    return true;
  }

  const farbe = angespieltefarbe(stich, spielart);

  // Trumpf angespielt
  if (farbe === 'trumpf') {
    // Hat der Spieler Trumpf? Dann muss er Trumpf bedienen
    const hatTrumpf = hand.some(k => istTrumpf(k, spielart));
    if (hatTrumpf) {
      return istTrumpf(karte, spielart);
    }
    // Kein Trumpf auf der Hand: Alles erlaubt
    return true;
  }

  // Farbe angespielt
  // Hat der Spieler diese Farbe (Nicht-Trumpf)?
  const hatFarbe = hand.some(k => k.farbe === farbe && !istTrumpf(k, spielart));
  if (hatFarbe) {
    // Bei Sauspiel: Wenn die gesuchte Sau-Farbe angespielt wird, MUSS die Sau zugegeben werden!
    if (spielart === 'sauspiel' && gesuchteAss && farbe === gesuchteAss) {
      const hatSau = hand.some(k => k.farbe === gesuchteAss && k.wert === 'ass');
      if (hatSau) {
        // Spieler hat die Sau - nur die Sau ist erlaubt!
        return karte.farbe === gesuchteAss && karte.wert === 'ass';
      }
    }
    // Muss Farbe bedienen
    return karte.farbe === farbe && !istTrumpf(karte, spielart);
  }

  // Keine Karte der Farbe: Alles erlaubt (auch Trumpf)
  // ABER: Bei Sauspiel darf die gesuchte Sau nicht geschmiert werden!
  if (spielart === 'sauspiel' && gesuchteAss) {
    const istGesuchteAss = karte.farbe === gesuchteAss && karte.wert === 'ass';
    if (istGesuchteAss) {
      // Die Sau darf nur gespielt werden wenn:
      // 1. Die Sau-Farbe angespielt wurde (dann Farbzwang - aber das wird oben schon behandelt)
      // 2. Man keine andere Karte mehr hat
      const andereKarten = hand.filter(k => !(k.farbe === gesuchteAss && k.wert === 'ass'));
      if (andereKarten.length > 0) {
        // Es gibt andere Karten - Sau darf nicht geschmiert werden
        return false;
      }
      // Nur noch die Sau auf der Hand - dann darf sie gespielt werden
    }
  }

  return true;
}

/**
 * Bestimmt den Gewinner eines Stichs
 * Gibt den Index (0-3) der gewinnenden Karte zurück
 */
export function stichGewinner(stich: Stich, spielart: Spielart): number {
  if (!stich.karten || stich.karten.length !== 4) {
    throw new Error('Stich muss 4 Karten haben');
  }

  // Validiere alle Karten
  for (let i = 0; i < stich.karten.length; i++) {
    if (!stich.karten[i] || !stich.karten[i].karte) {
      throw new Error(`Karte ${i} im Stich ist ungültig`);
    }
  }

  const farbe = angespieltefarbe(stich, spielart);
  let gewinnerIndex = 0;
  let hoechsteStaerke = -999; // Muss niedriger sein als alle möglichen Kartenstärken

  for (let i = 0; i < stich.karten.length; i++) {
    const karte = stich.karten[i].karte;

    // Trumpf schlägt immer
    if (istTrumpf(karte, spielart)) {
      const staerke = trumpfStaerke(karte, spielart);
      if (staerke > hoechsteStaerke) {
        hoechsteStaerke = staerke;
        gewinnerIndex = i;
      }
    } else if (hoechsteStaerke < 0) {
      // Noch kein Trumpf gespielt - Farbstärke zählt
      if (karte.farbe === farbe) {
        const staerke = farbStaerke(karte);
        // Wir nutzen negative Werte für Nicht-Trumpf um sie von Trumpf zu unterscheiden
        // -100 bis -95 für Farbkarten (damit Trumpf immer gewinnt)
        const adjustedStaerke = -100 + staerke;
        if (adjustedStaerke > hoechsteStaerke) {
          hoechsteStaerke = adjustedStaerke;
          gewinnerIndex = i;
        }
      }
    }
  }

  return gewinnerIndex;
}

/**
 * Gibt alle spielbaren Karten zurück
 */
export function spielbareKarten(
  hand: Karte[],
  stich: Stich,
  spielart: Spielart,
  gesuchteAss?: Farbe
): Karte[] {
  return hand.filter(karte => darfKarteSpielen(karte, hand, stich, spielart, gesuchteAss));
}

/**
 * Zählt die Laufenden (Ober/Unter-Reihe) für die Punktberechnung
 */
export function zaehlenLaufende(spielmacherKarten: Karte[], spielart: Spielart): number {
  // Normalisiere Spielart (entferne -tout Suffix)
  const basisSpielart = getBaseSolo(spielart);

  // Die höchsten Trümpfe in Reihenfolge
  const trumpfReihenfolge: string[] = [];

  if (basisSpielart === 'wenz') {
    // Nur Unter bei Wenz
    for (const farbe of UNTER_REIHENFOLGE) {
      trumpfReihenfolge.push(`${farbe}-unter`);
    }
  } else if (basisSpielart === 'geier') {
    // Nur Ober bei Geier
    for (const farbe of OBER_REIHENFOLGE) {
      trumpfReihenfolge.push(`${farbe}-ober`);
    }
  } else {
    // Normal: Erst Ober, dann Unter
    for (const farbe of OBER_REIHENFOLGE) {
      trumpfReihenfolge.push(`${farbe}-ober`);
    }
    for (const farbe of UNTER_REIHENFOLGE) {
      trumpfReihenfolge.push(`${farbe}-unter`);
    }
  }

  // Zähle von oben, wie viele der Spielmacher "hat" oder "nicht hat"
  const spielmacherIds = new Set(spielmacherKarten.map(k => k.id));

  const hatErsten = spielmacherIds.has(trumpfReihenfolge[0]);
  let laufende = 0;

  for (const karteId of trumpfReihenfolge) {
    if (spielmacherIds.has(karteId) === hatErsten) {
      laufende++;
    } else {
      break;
    }
  }

  // Mindestens 3 Laufende zählen (mit oder ohne)
  return laufende >= 3 ? laufende : 0;
}

/**
 * Sortiert Karten nach Schafkopf-Konvention
 */
export function sortiereHand(hand: Karte[], spielart: Spielart): Karte[] {
  return [...hand].sort((a, b) => {
    const aTrumpf = istTrumpf(a, spielart);
    const bTrumpf = istTrumpf(b, spielart);

    // Trumpf kommt zuerst
    if (aTrumpf && !bTrumpf) return -1;
    if (!aTrumpf && bTrumpf) return 1;

    if (aTrumpf && bTrumpf) {
      // Beide Trumpf: Nach Stärke sortieren
      return trumpfStaerke(b, spielart) - trumpfStaerke(a, spielart);
    }

    // Beide Nicht-Trumpf: Nach Farbe, dann Stärke
    const farbOrder: Farbe[] = ['eichel', 'gras', 'herz', 'schellen'];
    const farbDiff = farbOrder.indexOf(a.farbe) - farbOrder.indexOf(b.farbe);
    if (farbDiff !== 0) return farbDiff;

    return farbStaerke(b) - farbStaerke(a);
  });
}
