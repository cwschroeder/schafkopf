// Tipp-System für Übungsspiele
// Erklärt dem Spieler was zu tun ist und warum

import { SpielState, Karte, Ansage, Farbe } from './schafkopf/types';
import { spielbareKarten, istTrumpf, trumpfStaerke, stichGewinner } from './schafkopf/rules';
import { AUGEN, FARBEN } from './schafkopf/cards';

// === LEGEN-TIPP ===

export interface LegenHint {
  empfehlung: boolean;
  grund: string;
  details: string[];
}

/**
 * Gibt einen Tipp ob der Spieler "legen" sollte
 * WICHTIG: Beim Legen sieht man nur 3 Karten! Die Bewertung muss relativ sein.
 * @param sichtbareKarten - Die 3 Karten die der Spieler beim Legen sieht
 */
export function getLegenHint(sichtbareKarten: Karte[]): LegenHint {
  // Beim Legen sieht man nur 3 Karten!
  const anzahlKarten = sichtbareKarten.length;

  // Zähle Trümpfe für Sauspiel (Standard-Spielart)
  const ober = sichtbareKarten.filter(k => k.wert === 'ober');
  const unter = sichtbareKarten.filter(k => k.wert === 'unter');
  const herzKarten = sichtbareKarten.filter(k => k.farbe === 'herz' && k.wert !== 'ober' && k.wert !== 'unter');
  const trumpfAnzahl = ober.length + unter.length + herzKarten.length;

  const details: string[] = [];

  // Liste Trümpfe auf
  if (ober.length > 0) {
    const oberNamen = ober.map(k => kartenName(k)).join(', ');
    details.push(`${ober.length} Ober: ${oberNamen}`);
  }
  if (unter.length > 0) {
    const unterNamen = unter.map(k => kartenName(k)).join(', ');
    details.push(`${unter.length} Unter: ${unterNamen}`);
  }
  if (herzKarten.length > 0) {
    const herzNamen = herzKarten.map(k => kartenName(k)).join(', ');
    details.push(`${herzKarten.length} Herz: ${herzNamen}`);
  }

  // Zähle Asse (wichtig für Punkte)
  const asse = sichtbareKarten.filter(k => k.wert === 'ass' && k.farbe !== 'herz'); // Herz-Ass ist schon als Trumpf gezählt
  if (asse.length > 0) {
    details.push(`${asse.length} Farb-Ass(e): ${asse.map(k => kartenName(k)).join(', ')}`);
  }

  // Prüfe auf starke Trümpfe (Eichel/Gras Ober/Unter)
  const starkeOber = ober.filter(k => k.farbe === 'eichel' || k.farbe === 'gras');
  const starkeUnter = unter.filter(k => k.farbe === 'eichel' || k.farbe === 'gras');
  const hatStarkeTruempfe = starkeOber.length > 0 || starkeUnter.length > 0;

  // Bewertung relativ zur Anzahl sichtbarer Karten (normalerweise 3)
  // Bei 3 Karten: 3/3 Trümpfe = super, 2/3 = gut, 1/3 = mittel, 0/3 = schlecht
  const trumpfAnteil = trumpfAnzahl / anzahlKarten;

  if (trumpfAnteil >= 1.0) {
    // Alle sichtbaren Karten sind Trümpfe!
    return {
      empfehlung: true,
      grund: `Alle ${anzahlKarten} Karten sind Trümpfe - unbedingt legen!`,
      details
    };
  } else if (trumpfAnteil >= 0.66) {
    // 2 von 3 sind Trümpfe
    if (hatStarkeTruempfe) {
      return {
        empfehlung: true,
        grund: `${trumpfAnzahl} von ${anzahlKarten} Karten sind Trümpfe, davon starke. Legen empfohlen!`,
        details
      };
    }
    return {
      empfehlung: true,
      grund: `${trumpfAnzahl} von ${anzahlKarten} Karten sind Trümpfe - gute Chancen!`,
      details
    };
  } else if (trumpfAnzahl >= 1) {
    // 1 von 3 ist Trumpf
    if (hatStarkeTruempfe) {
      return {
        empfehlung: false,
        grund: `Nur ${trumpfAnzahl} Trumpf von ${anzahlKarten} Karten, aber immerhin ein starker. Riskant - eher nicht legen.`,
        details
      };
    }
    return {
      empfehlung: false,
      grund: `Nur ${trumpfAnzahl} Trumpf von ${anzahlKarten} Karten - besser nicht legen.`,
      details
    };
  } else {
    // Kein Trumpf sichtbar
    return {
      empfehlung: false,
      grund: `Kein Trumpf unter den ${anzahlKarten} Karten - auf keinen Fall legen!`,
      details
    };
  }
}

// === ANSAGE-TIPP ===

export interface AnsageHint {
  empfehlung: Ansage;
  gesuchteAss?: Farbe;
  grund: string;
  details: string[];
}

/**
 * Gibt einen Tipp welche Ansage der Spieler machen sollte
 */
export function getAnsageHint(hand: Karte[], bisherigeAnsagen: { position: number; ansage: Ansage }[]): AnsageHint {
  const details: string[] = [];

  // Prüfe ob schon jemand angesagt hat
  const andereAnsage = bisherigeAnsagen.find(a => a.ansage !== 'weiter');
  if (andereAnsage) {
    details.push(`Ein anderer Spieler hat bereits "${ansageZuText(andereAnsage.ansage)}" angesagt.`);
    return {
      empfehlung: 'weiter',
      grund: 'Ein anderer Spieler hat schon angesagt. Als Anfänger solltest du dann "Weiter" sagen.',
      details
    };
  }

  // Bewerte Sauspiel
  const sauspiel = bewerteSauspielHand(hand);
  if (sauspiel.kannSpielen && sauspiel.gesuchteAss) {
    details.push(`Du hast ${zaehleTruempfe(hand, 'sauspiel')} Trümpfe (Ober + Unter + Herz).`);
    details.push(`Du kannst auf ${farbName(sauspiel.gesuchteAss)}-Ass rufen.`);

    // Liste Trümpfe auf
    const truempfe = hand.filter(k => k.wert === 'ober' || k.wert === 'unter' || k.farbe === 'herz');
    details.push(`Deine Trümpfe: ${truempfe.map(k => kartenName(k)).join(', ')}`);

    return {
      empfehlung: 'sauspiel',
      gesuchteAss: sauspiel.gesuchteAss,
      grund: `Sauspiel auf ${farbName(sauspiel.gesuchteAss)}-Ass! Du suchst einen Partner, der das ${farbName(sauspiel.gesuchteAss)}-Ass hat.`,
      details
    };
  }

  // Bewerte Wenz
  const wenz = bewerteWenzHand(hand);
  if (wenz.kannSpielen) {
    const unter = hand.filter(k => k.wert === 'unter');
    details.push(`Du hast ${unter.length} Unter: ${unter.map(k => kartenName(k)).join(', ')}`);
    details.push('Beim Wenz sind nur Unter Trumpf, keine Ober und kein Herz!');

    // Asse sind wichtig beim Wenz
    const asse = hand.filter(k => k.wert === 'ass');
    if (asse.length > 0) {
      details.push(`Deine Asse sichern Stiche: ${asse.map(k => kartenName(k)).join(', ')}`);
    }

    return {
      empfehlung: 'wenz',
      grund: 'Wenz spielen! Du hast genug starke Unter für ein Solo-Spiel.',
      details
    };
  }

  // Bewerte Geier
  const geier = bewerteGeierHand(hand);
  if (geier.kannSpielen) {
    const ober = hand.filter(k => k.wert === 'ober');
    details.push(`Du hast ${ober.length} Ober: ${ober.map(k => kartenName(k)).join(', ')}`);
    details.push('Beim Geier sind nur Ober Trumpf, keine Unter und kein Herz!');

    return {
      empfehlung: 'geier',
      grund: 'Geier spielen! Du hast genug starke Ober für ein Solo-Spiel.',
      details
    };
  }

  // Keine spielbare Hand
  const trumpfAnzahl = zaehleTruempfe(hand, 'sauspiel');
  details.push(`Du hast nur ${trumpfAnzahl} Trümpfe - zu wenig zum Spielen.`);

  // Erkläre warum Sauspiel nicht geht
  const hatAlleAsse = ['eichel', 'gras', 'schellen'].every(farbe =>
    hand.some(k => k.farbe === farbe && k.wert === 'ass')
  );
  if (trumpfAnzahl >= 4 && hatAlleAsse) {
    details.push('Du hast alle Asse selbst, daher kein Sauspiel möglich.');
  } else if (trumpfAnzahl < 4) {
    details.push('Für Sauspiel brauchst du mindestens 4 Trümpfe.');
  }

  return {
    empfehlung: 'weiter',
    grund: 'Besser "Weiter" sagen. Deine Karten sind nicht stark genug.',
    details
  };
}

// === SPIELZUG-TIPP ===

export interface SpielzugHint {
  empfohleneKarte: Karte;
  grund: string;
  details: string[];
}

/**
 * Gibt einen Tipp welche Karte der Spieler spielen sollte
 */
export function getSpielzugHint(state: SpielState, spielerId: string): SpielzugHint | null {
  const spieler = state.spieler.find(s => s.id === spielerId);
  if (!spieler) return null;

  const erlaubteKarten = spielbareKarten(
    spieler.hand,
    state.aktuellerStich,
    state.gespielteAnsage!,
    state.gesuchteAss || undefined
  );

  if (erlaubteKarten.length === 0) return null;

  const details: string[] = [];
  const spielart = state.gespielteAnsage!;
  const istSpielmacher = spielerId === state.spielmacher || spielerId === state.partner;

  // Erkläre die Situation
  if (state.aktuellerStich.karten.length === 0) {
    details.push('Du spielst aus (erster im Stich).');
  } else {
    const ersteFarbe = state.aktuellerStich.karten[0].karte.farbe;
    const ersteKarteTrumpf = istTrumpf(state.aktuellerStich.karten[0].karte, spielart as any);

    if (ersteKarteTrumpf) {
      details.push('Trumpf wurde angespielt.');
    } else {
      details.push(`${farbName(ersteFarbe)} wurde angespielt.`);
    }

    // Muss bedienen?
    const kannBedienen = erlaubteKarten.some(k => {
      if (ersteKarteTrumpf) {
        return istTrumpf(k, spielart as any);
      }
      return k.farbe === ersteFarbe && !istTrumpf(k, spielart as any);
    });

    if (kannBedienen) {
      if (ersteKarteTrumpf) {
        details.push('Du musst mit Trumpf bedienen.');
      } else {
        details.push(`Du musst ${farbName(ersteFarbe)} bedienen.`);
      }
    } else {
      details.push('Du kannst nicht bedienen - spiele was du willst.');
    }
  }

  // Wenn nur eine Karte möglich
  if (erlaubteKarten.length === 1) {
    return {
      empfohleneKarte: erlaubteKarten[0],
      grund: `Du hast nur eine Möglichkeit: ${kartenName(erlaubteKarten[0])}`,
      details
    };
  }

  // Bewerte alle Karten und finde die beste
  const bewertungen = erlaubteKarten.map(karte => ({
    karte,
    score: bewerteKarteDetailliert(karte, state, istSpielmacher)
  }));

  bewertungen.sort((a, b) => b.score.wert - a.score.wert);
  const beste = bewertungen[0];

  // Füge Begründung hinzu
  details.push(beste.score.grund);

  return {
    empfohleneKarte: beste.karte,
    grund: `Spiele ${kartenName(beste.karte)}!`,
    details
  };
}

// === HILFSFUNKTIONEN ===

function kartenName(karte: Karte): string {
  const farben: Record<Farbe, string> = {
    eichel: 'Eichel',
    gras: 'Gras',
    herz: 'Herz',
    schellen: 'Schellen'
  };
  const werte: Record<string, string> = {
    ass: 'Ass',
    zehn: 'Zehn',
    koenig: 'König',
    ober: 'Ober',
    unter: 'Unter',
    '9': 'Neun',
    '8': 'Acht',
    '7': 'Sieben'
  };
  return `${farben[karte.farbe]}-${werte[karte.wert] || karte.wert}`;
}

function farbName(farbe: Farbe): string {
  const namen: Record<Farbe, string> = {
    eichel: 'Eichel',
    gras: 'Gras',
    herz: 'Herz',
    schellen: 'Schellen'
  };
  return namen[farbe];
}

function ansageZuText(ansage: Ansage): string {
  if (ansage === 'weiter') return 'Weiter';
  if (ansage === 'sauspiel') return 'Sauspiel';
  if (ansage === 'wenz') return 'Wenz';
  if (ansage === 'geier') return 'Geier';
  if (ansage.startsWith('farbsolo-')) {
    const farbe = ansage.replace('farbsolo-', '') as Farbe;
    return `${farbName(farbe)}-Solo`;
  }
  return ansage;
}

function zaehleTruempfe(hand: Karte[], spielart: 'sauspiel' | 'wenz' | 'geier' | 'solo'): number {
  return hand.filter(k => {
    if (spielart === 'wenz') return k.wert === 'unter';
    if (spielart === 'geier') return k.wert === 'ober';
    return k.wert === 'ober' || k.wert === 'unter' || k.farbe === 'herz';
  }).length;
}

function bewerteSauspielHand(hand: Karte[]): { kannSpielen: boolean; gesuchteAss?: Farbe; staerke: number } {
  const trumpfAnzahl = zaehleTruempfe(hand, 'sauspiel');
  if (trumpfAnzahl < 4) return { kannSpielen: false, staerke: 0 };

  const ober = hand.filter(k => k.wert === 'ober');
  const unter = hand.filter(k => k.wert === 'unter');
  const spielfarben: Farbe[] = ['eichel', 'gras', 'schellen'];

  for (const farbe of spielfarben) {
    const hatAss = hand.some(k => k.farbe === farbe && k.wert === 'ass');
    const hatFarbe = hand.some(k => k.farbe === farbe && k.wert !== 'ober' && k.wert !== 'unter');

    if (!hatAss && hatFarbe) {
      const staerke =
        ober.filter(k => k.farbe === 'eichel' || k.farbe === 'gras').length * 10 +
        ober.length * 5 +
        unter.filter(k => k.farbe === 'eichel' || k.farbe === 'gras').length * 5 +
        unter.length * 3 +
        trumpfAnzahl;
      return { kannSpielen: true, gesuchteAss: farbe, staerke };
    }
  }
  return { kannSpielen: false, staerke: 0 };
}

function bewerteWenzHand(hand: Karte[]): { kannSpielen: boolean; staerke: number } {
  const unter = hand.filter(k => k.wert === 'unter');
  if (unter.length < 3) return { kannSpielen: false, staerke: 0 };

  const starkeUnter = unter.filter(k => k.farbe === 'eichel' || k.farbe === 'gras');
  if (starkeUnter.length < 2 && unter.length < 4) return { kannSpielen: false, staerke: 0 };

  const asse = hand.filter(k => k.wert === 'ass');
  const staerke = starkeUnter.length * 10 + unter.length * 5 + asse.length * 8;
  return { kannSpielen: true, staerke };
}

function bewerteGeierHand(hand: Karte[]): { kannSpielen: boolean; staerke: number } {
  const ober = hand.filter(k => k.wert === 'ober');
  if (ober.length < 3) return { kannSpielen: false, staerke: 0 };

  const starkeOber = ober.filter(k => k.farbe === 'eichel' || k.farbe === 'gras');
  if (starkeOber.length < 2 && ober.length < 4) return { kannSpielen: false, staerke: 0 };

  const asse = hand.filter(k => k.wert === 'ass');
  const staerke = starkeOber.length * 10 + ober.length * 5 + asse.length * 8;
  return { kannSpielen: true, staerke };
}

function wuerdeStichGewinnen(karte: Karte, state: SpielState): boolean {
  const stich = state.aktuellerStich;
  const spielart = state.gespielteAnsage!;

  if (!stich.karten || stich.karten.length === 0) return true;

  const gueltigeKarten = stich.karten.filter(k => k && k.karte && k.karte.farbe && k.karte.wert);
  if (gueltigeKarten.length !== stich.karten.length) return true;

  const simulierterStich = {
    ...stich,
    karten: [...gueltigeKarten, { spielerId: 'test', karte }]
  };

  while (simulierterStich.karten.length < 4) {
    simulierterStich.karten.push({
      spielerId: 'dummy',
      karte: { farbe: 'schellen' as Farbe, wert: '9', id: 'dummy' }
    });
  }

  const gewinnerIndex = stichGewinner(simulierterStich, spielart as any);
  return gewinnerIndex === gueltigeKarten.length;
}

function bewerteKarteDetailliert(
  karte: Karte,
  state: SpielState,
  istSpielmacher: boolean
): { wert: number; grund: string } {
  const spielart = state.gespielteAnsage!;
  const stich = state.aktuellerStich;
  const kannGewinnen = wuerdeStichGewinnen(karte, state);
  const augen = AUGEN[karte.wert];
  const istTrumpfKarte = istTrumpf(karte, spielart as any);

  if (stich.karten.length === 0) {
    // Wir spielen aus
    if (istSpielmacher) {
      if (istTrumpfKarte) {
        return {
          wert: 50 + trumpfStaerke(karte, spielart as any),
          grund: 'Als Spielmacher solltest du Trümpfe rausziehen.'
        };
      } else if (karte.wert === 'ass') {
        return {
          wert: 40,
          grund: 'Asse einzuholen bringt sichere Punkte.'
        };
      } else {
        return {
          wert: 20 - augen,
          grund: 'Niedrige Karten sind weniger riskant zum Ausspielen.'
        };
      }
    } else {
      if (karte.wert === 'ass' && !istTrumpfKarte) {
        return {
          wert: 30,
          grund: 'Ein Ass sichert dir 11 Punkte.'
        };
      } else if (istTrumpfKarte) {
        return {
          wert: 10,
          grund: 'Spare deine Trümpfe für später.'
        };
      } else {
        return {
          wert: 25 - augen,
          grund: 'Niedrige Farbkarten sind gut zum Ausspielen.'
        };
      }
    }
  } else {
    // Wir müssen bedienen
    if (kannGewinnen) {
      const stichAugen = stich.karten
        .filter(k => k?.karte?.wert)
        .reduce((sum, k) => sum + AUGEN[k.karte.wert], 0) + augen;

      if (stichAugen >= 20) {
        return {
          wert: 50 + stichAugen,
          grund: `Ein fetter Stich mit ${stichAugen} Augen - zugreifen!`
        };
      }
      return {
        wert: 30 + stichAugen,
        grund: 'Du kannst den Stich gewinnen.'
      };
    } else {
      // Partner schmieren?
      const partnerImStich = stich.karten.some(k => k?.spielerId === state.partner);
      if (istSpielmacher && partnerImStich) {
        return {
          wert: augen * 2,
          grund: `Schmiere deinem Partner ${augen} Punkte!`
        };
      }
      return {
        wert: 20 - augen,
        grund: 'Du gewinnst nicht - wirf wenig Punkte ab.'
      };
    }
  }
}
