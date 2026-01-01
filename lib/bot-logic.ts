// Regelbasierte Bot-Logik für Schafkopf
// Ersetzt OpenAI API mit deterministischen Entscheidungen

import { SpielState, Karte, Ansage, Farbe, Stich } from './schafkopf/types';
import {
  spielbareKarten,
  istTrumpf,
  trumpfStaerke,
  stichGewinner,
} from './schafkopf/rules';
import { AUGEN, FARBEN } from './schafkopf/cards';

/**
 * Zählt Trümpfe in einer Hand für eine bestimmte Spielart
 */
function zaehleTruempfe(hand: Karte[], spielart: 'sauspiel' | 'wenz' | 'geier' | 'solo'): number {
  return hand.filter(k => {
    if (spielart === 'wenz') {
      return k.wert === 'unter';
    }
    if (spielart === 'geier') {
      return k.wert === 'ober';
    }
    // Sauspiel/Solo: Ober + Unter + Herz
    return k.wert === 'ober' || k.wert === 'unter' || k.farbe === 'herz';
  }).length;
}

/**
 * Bewertet die Stärke einer Sauspiel-Hand
 */
function bewerteSauspielHand(hand: Karte[]): { kannSpielen: boolean; gesuchteAss?: Farbe; staerke: number } {
  const trumpfAnzahl = zaehleTruempfe(hand, 'sauspiel');

  if (trumpfAnzahl < 4) {
    return { kannSpielen: false, staerke: 0 };
  }

  // Zähle starke Trümpfe (Ober und Unter)
  const ober = hand.filter(k => k.wert === 'ober');
  const unter = hand.filter(k => k.wert === 'unter');

  // Finde eine Farbe die wir rufen können (kein Ass dieser Farbe, aber mind. 1 Karte)
  const spielfarben: Farbe[] = ['eichel', 'gras', 'schellen']; // Herz ist Trumpf

  for (const farbe of spielfarben) {
    const hatAss = hand.some(k => k.farbe === farbe && k.wert === 'ass');
    const hatFarbe = hand.some(k => k.farbe === farbe && k.wert !== 'ober' && k.wert !== 'unter');

    if (!hatAss && hatFarbe) {
      // Berechne Handstärke
      const staerke =
        ober.filter(k => k.farbe === 'eichel' || k.farbe === 'gras').length * 10 + // Starke Ober
        ober.length * 5 +
        unter.filter(k => k.farbe === 'eichel' || k.farbe === 'gras').length * 5 + // Starke Unter
        unter.length * 3 +
        trumpfAnzahl;

      return { kannSpielen: true, gesuchteAss: farbe, staerke };
    }
  }

  return { kannSpielen: false, staerke: 0 };
}

/**
 * Bewertet die Stärke einer Wenz-Hand
 */
function bewerteWenzHand(hand: Karte[]): { kannSpielen: boolean; staerke: number } {
  const unter = hand.filter(k => k.wert === 'unter');

  if (unter.length < 3) {
    return { kannSpielen: false, staerke: 0 };
  }

  // Starke Unter (Eichel, Gras)
  const starkeUnter = unter.filter(k => k.farbe === 'eichel' || k.farbe === 'gras');

  // Braucht mind. 2 starke Unter oder 4 Unter insgesamt
  if (starkeUnter.length < 2 && unter.length < 4) {
    return { kannSpielen: false, staerke: 0 };
  }

  // Zähle Asse (wichtig beim Wenz)
  const asse = hand.filter(k => k.wert === 'ass');

  const staerke =
    starkeUnter.length * 10 +
    unter.length * 5 +
    asse.length * 8;

  return { kannSpielen: true, staerke };
}

/**
 * Bewertet die Stärke einer Geier-Hand
 */
function bewerteGeierHand(hand: Karte[]): { kannSpielen: boolean; staerke: number } {
  const ober = hand.filter(k => k.wert === 'ober');

  if (ober.length < 3) {
    return { kannSpielen: false, staerke: 0 };
  }

  const starkeOber = ober.filter(k => k.farbe === 'eichel' || k.farbe === 'gras');

  if (starkeOber.length < 2 && ober.length < 4) {
    return { kannSpielen: false, staerke: 0 };
  }

  const asse = hand.filter(k => k.wert === 'ass');

  const staerke =
    starkeOber.length * 10 +
    ober.length * 5 +
    asse.length * 8;

  return { kannSpielen: true, staerke };
}

/**
 * Bewertet die Stärke einer Solo-Hand
 */
function bewerteSoloHand(hand: Karte[], soloFarbe: Farbe): { kannSpielen: boolean; staerke: number } {
  // Zähle Trümpfe für diese Solo-Farbe
  const truempfe = hand.filter(k =>
    k.wert === 'ober' ||
    k.wert === 'unter' ||
    k.farbe === soloFarbe
  );

  if (truempfe.length < 6) {
    return { kannSpielen: false, staerke: 0 };
  }

  const ober = hand.filter(k => k.wert === 'ober');
  const unter = hand.filter(k => k.wert === 'unter');
  const farbTruempfe = hand.filter(k => k.farbe === soloFarbe && k.wert !== 'ober' && k.wert !== 'unter');

  // Braucht mindestens 2 Ober oder sehr starke Hand
  if (ober.length < 2 && truempfe.length < 7) {
    return { kannSpielen: false, staerke: 0 };
  }

  const staerke =
    ober.filter(k => k.farbe === 'eichel' || k.farbe === 'gras').length * 10 +
    ober.length * 5 +
    unter.length * 3 +
    farbTruempfe.filter(k => k.wert === 'ass').length * 8 +
    truempfe.length * 2;

  return { kannSpielen: true, staerke };
}

/**
 * Bot entscheidet über Spielansage
 */
export async function botAnsage(
  hand: Karte[],
  position: number,
  bisherigeAnsagen: { position: number; ansage: Ansage }[]
): Promise<{ ansage: Ansage; gesuchteAss?: Farbe }> {
  // Prüfe ob schon jemand angesagt hat
  const hatJemandAngesagt = bisherigeAnsagen.some(a => a.ansage !== 'weiter');

  // Wenn jemand schon angesagt hat, können wir nur mit stärkerem Spiel kontern
  // Für Einfachheit: Bot sagt dann weiter
  if (hatJemandAngesagt) {
    return { ansage: 'weiter' };
  }

  // Bewerte alle Möglichkeiten
  const sauspiel = bewerteSauspielHand(hand);
  const wenz = bewerteWenzHand(hand);
  const geier = bewerteGeierHand(hand);

  // Bewerte alle Solo-Optionen
  const soloOptionen = FARBEN.map(farbe => ({
    farbe,
    ...bewerteSoloHand(hand, farbe)
  })).filter(s => s.kannSpielen);

  const bestesSolo = soloOptionen.length > 0
    ? soloOptionen.reduce((best, s) => s.staerke > best.staerke ? s : best)
    : null;

  // Wähle beste Option
  const optionen: { typ: string; staerke: number; farbe?: Farbe }[] = [];

  if (sauspiel.kannSpielen) {
    optionen.push({ typ: 'sauspiel', staerke: sauspiel.staerke, farbe: sauspiel.gesuchteAss });
  }
  if (wenz.kannSpielen) {
    optionen.push({ typ: 'wenz', staerke: wenz.staerke });
  }
  if (geier.kannSpielen) {
    optionen.push({ typ: 'geier', staerke: geier.staerke });
  }
  if (bestesSolo) {
    optionen.push({ typ: 'solo', staerke: bestesSolo.staerke, farbe: bestesSolo.farbe });
  }

  if (optionen.length === 0) {
    return { ansage: 'weiter' };
  }

  // Wähle stärkste Option, aber mit Zufallsfaktor für Variabilität
  const besteOption = optionen.reduce((best, o) => o.staerke > best.staerke ? o : best);

  // Mindest-Schwelle für Ansage
  if (besteOption.staerke < 25) {
    return { ansage: 'weiter' };
  }

  switch (besteOption.typ) {
    case 'sauspiel':
      return { ansage: 'sauspiel', gesuchteAss: besteOption.farbe };
    case 'wenz':
      return { ansage: 'wenz' };
    case 'geier':
      return { ansage: 'geier' };
    case 'solo':
      return { ansage: `farbsolo-${besteOption.farbe}` as Ansage };
    default:
      return { ansage: 'weiter' };
  }
}

/**
 * Simuliert ob eine Karte den aktuellen Stich gewinnen würde
 */
function wuerdeStichGewinnen(
  karte: Karte,
  stich: Stich,
  spielart: string
): boolean {
  // Defensive: Prüfe ob Stich-Karten gültig sind
  if (!stich.karten || stich.karten.length === 0) {
    return true; // Erster im Stich
  }

  // Validiere, dass alle Stich-Karten das richtige Format haben
  const gueltigeKarten = stich.karten.filter(k => k && k.karte && k.karte.farbe && k.karte.wert);
  if (gueltigeKarten.length !== stich.karten.length) {
    console.warn('[Bot] Ungültige Karten im Stich gefunden, nehme an wir gewinnen');
    return true;
  }

  // Simuliere fertigen Stich
  const simulierterStich: Stich = {
    ...stich,
    karten: [...gueltigeKarten, { spielerId: 'test', karte }]
  };

  // Fülle mit Dummy-Karten auf wenn nötig
  while (simulierterStich.karten.length < 4) {
    simulierterStich.karten.push({
      spielerId: 'dummy',
      karte: { farbe: 'schellen', wert: '9', id: 'dummy' }
    });
  }

  const gewinnerIndex = stichGewinner(simulierterStich, spielart as any);
  return gewinnerIndex === gueltigeKarten.length; // Wir sind an Position nach den bisherigen Karten
}

/**
 * Bewertet den Wert einer Karte im aktuellen Kontext
 */
function bewerteKarte(
  karte: Karte,
  stich: Stich,
  state: SpielState,
  istSpielmacher: boolean
): number {
  const spielart = state.gespielteAnsage!;
  const kannGewinnen = wuerdeStichGewinnen(karte, stich, spielart);
  const augen = AUGEN[karte.wert];
  const istTrumpfKarte = istTrumpf(karte, spielart as any);

  let score = 0;

  if (stich.karten.length === 0) {
    // Wir spielen aus
    if (istSpielmacher) {
      // Als Spielmacher: Trümpfe rausziehen
      if (istTrumpfKarte) {
        score += 50 + trumpfStaerke(karte, spielart as any);
      } else if (karte.wert === 'ass') {
        // Asse einholen ist gut
        score += 40;
      } else {
        // Niedrige Karten sind weniger gut zum Ausspielen
        score += 20 - augen;
      }
    } else {
      // Als Gegner: Keine hohen Trümpfe verschwenden
      if (karte.wert === 'ass' && !istTrumpfKarte) {
        score += 30; // Asse sichern
      } else if (istTrumpfKarte) {
        score += 10 - trumpfStaerke(karte, spielart as any) / 10; // Niedrige Trümpfe bevorzugen
      } else {
        score += 25 - augen; // Niedrige Farbkarten
      }
    }
  } else {
    // Wir müssen bedienen
    if (kannGewinnen) {
      // Wir können gewinnen - defensiv mit Filter für gültige Karten
      const stichAugen = (stich.karten || [])
        .filter(k => k?.karte?.wert)
        .reduce((sum, k) => sum + AUGEN[k.karte.wert], 0) + augen;

      if (istSpielmacher) {
        // Als Spielmacher: Fetten Stich mitnehmen ist gut
        score += 30 + stichAugen;
      } else {
        // Als Gegner: Stiche dem Spielmacher wegnehmen
        score += 40 + stichAugen;
      }
    } else {
      // Wir können nicht gewinnen
      if (istSpielmacher) {
        // Schmieren: Hohe Augen zum Partner
        const partnerImStich = (stich.karten || []).some(k => k?.spielerId === state.partner);
        if (partnerImStich) {
          score += augen * 2; // Schmieren
        } else {
          score += 20 - augen; // Abwerfen
        }
      } else {
        // Als Gegner: Wenig Augen abgeben
        score += 30 - augen;
      }
    }
  }

  return score;
}

/**
 * Bot wählt eine Karte zum Spielen
 */
export async function botSpielzug(
  state: SpielState,
  spielerId: string
): Promise<string> {
  const spieler = state.spieler.find(s => s.id === spielerId);
  if (!spieler) {
    throw new Error('Spieler nicht gefunden');
  }

  const erlaubteKarten = spielbareKarten(
    spieler.hand,
    state.aktuellerStich,
    state.gespielteAnsage!,
    state.gesuchteAss || undefined
  );

  // Wenn nur eine Karte möglich, direkt spielen
  if (erlaubteKarten.length === 1) {
    return erlaubteKarten[0].id;
  }

  const istSpielmacher = spielerId === state.spielmacher || spielerId === state.partner;

  // Bewerte jede Karte
  const bewertungen = erlaubteKarten.map(karte => ({
    karte,
    score: bewerteKarte(karte, state.aktuellerStich, state, istSpielmacher)
  }));

  // Sortiere nach Score (höchster zuerst)
  bewertungen.sort((a, b) => b.score - a.score);

  // Kleine Zufallsvarianz: Manchmal nicht die optimale Karte wählen
  const zufall = Math.random();
  if (zufall < 0.1 && bewertungen.length > 1) {
    // 10% Chance auf zweitbeste Karte
    return bewertungen[1].karte.id;
  }

  return bewertungen[0].karte.id;
}

/**
 * Bot entscheidet ob "Du" gesagt wird
 */
export async function botDuEntscheidung(
  hand: Karte[],
  state: SpielState
): Promise<boolean> {
  // Einfache Heuristik: "Du" sagen wenn man sehr stark ist
  const trumpfAnzahl = hand.filter(k => {
    const isOber = k.wert === 'ober';
    const isUnter = k.wert === 'unter';
    return isOber || isUnter;
  }).length;

  // "Du" sagen wenn man mindestens 3 Ober/Unter hat
  return trumpfAnzahl >= 3;
}
