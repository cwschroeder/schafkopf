// Hinweise für den Übungsmodus

import { SpielState, Karte, Stich } from '../schafkopf/types';
import { spielbareKarten, istTrumpf, trumpfStaerke, stichGewinner } from '../schafkopf/rules';
import { AUGEN } from '../schafkopf/cards';
import { OptimalPlayResult } from './types';

/**
 * Prüft ob eine Karte den aktuellen Stich gewinnen würde
 */
function wuerdeStichGewinnen(
  karte: Karte,
  stich: Stich,
  spielart: string
): boolean {
  if (!stich.karten || stich.karten.length === 0) {
    return true;
  }

  const gueltigeKarten = stich.karten.filter(k => k && k.karte && k.karte.farbe && k.karte.wert);
  if (gueltigeKarten.length !== stich.karten.length) {
    return true;
  }

  const simulierterStich: Stich = {
    ...stich,
    karten: [...gueltigeKarten, { spielerId: 'test', karte }]
  };

  while (simulierterStich.karten.length < 4) {
    simulierterStich.karten.push({
      spielerId: 'dummy',
      karte: { farbe: 'schellen', wert: '9', id: 'dummy' }
    });
  }

  const gewinnerIndex = stichGewinner(simulierterStich, spielart as any);
  return gewinnerIndex === gueltigeKarten.length;
}

/**
 * Generiert Erklärungen für eine Karten-Wahl
 */
function getKartenGruende(
  karte: Karte,
  stich: Stich,
  state: SpielState,
  istSpielmacher: boolean,
  kannGewinnen: boolean
): string[] {
  const gruende: string[] = [];
  const spielart = state.gespielteAnsage!;
  const augen = AUGEN[karte.wert];
  const istTrumpfKarte = istTrumpf(karte, spielart as any);

  if (stich.karten.length === 0) {
    // Ausspielen
    if (istTrumpfKarte) {
      if (istSpielmacher) {
        gruende.push('Trumpf ausspielen zieht den Gegnern die Trümpfe');
      } else {
        gruende.push('Trumpf spielen um Kontrolle zu gewinnen');
      }
      const staerke = trumpfStaerke(karte, spielart as any);
      if (staerke >= 10) {
        gruende.push('Hoher Trumpf - schwer zu schlagen');
      }
    } else if (karte.wert === 'ass') {
      gruende.push('Sau (Ass) früh einholen sichert 11 Augen');
    } else if (augen === 0) {
      gruende.push('Neuner loswerden - keine Punkte verschenkt');
    } else if (augen >= 10) {
      gruende.push('Vorsicht: Hohe Augen können gestochen werden');
    }
  } else {
    // Bedienen/Zugeben
    if (kannGewinnen) {
      const stichAugen = stich.karten
        .filter(k => k?.karte?.wert)
        .reduce((sum, k) => sum + AUGEN[k.karte.wert], 0);

      if (stichAugen >= 10) {
        gruende.push(`Stich ist ${stichAugen + augen} Augen wert - lohnt sich!`);
      }
      if (istTrumpfKarte) {
        gruende.push('Mit Trumpf reinstechen');
      } else {
        gruende.push('Gewinnt den Stich');
      }
    } else {
      // Kann nicht gewinnen
      const partnerImStich = stich.karten?.some(k => k?.spielerId === state.partner);

      if (istSpielmacher && partnerImStich) {
        if (augen >= 10) {
          gruende.push('Schmieren - hohe Augen zum Partner geben');
        } else {
          gruende.push('Partner gewinnt - ihm Punkte zuspielen');
        }
      } else {
        if (augen === 0) {
          gruende.push('Abschmeißen - keine Punkte verschenken');
        } else if (augen <= 3) {
          gruende.push('Niedrige Karte abwerfen');
        } else {
          gruende.push('Achtung: Gibt dem Gegner Punkte');
        }
      }
    }
  }

  return gruende;
}

/**
 * Ermittelt die Situation des aktuellen Spielzugs
 */
function getSituation(stich: Stich, istSpielmacher: boolean): string {
  if (stich.karten.length === 0) {
    return istSpielmacher ? 'Du spielst aus (als Spielmacher)' : 'Du spielst aus';
  }

  const position = stich.karten.length + 1;
  const positionText = ['Erster', 'Zweiter', 'Dritter', 'Letzter'][stich.karten.length];

  if (position === 4) {
    return 'Du bist als Letzter dran - du siehst alle Karten';
  }

  return `Du bist als ${positionText} dran`;
}

/**
 * Bewertet eine Karte im Kontext (vereinfachte Version der Bot-Logic)
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
    if (istSpielmacher) {
      if (istTrumpfKarte) {
        score += 50 + trumpfStaerke(karte, spielart as any);
      } else if (karte.wert === 'ass') {
        score += 40;
      } else {
        score += 20 - augen;
      }
    } else {
      if (karte.wert === 'ass' && !istTrumpfKarte) {
        score += 30;
      } else if (istTrumpfKarte) {
        score += 10 - trumpfStaerke(karte, spielart as any) / 10;
      } else {
        score += 25 - augen;
      }
    }
  } else {
    if (kannGewinnen) {
      const stichAugen = (stich.karten || [])
        .filter(k => k?.karte?.wert)
        .reduce((sum, k) => sum + AUGEN[k.karte.wert], 0) + augen;

      if (istSpielmacher) {
        score += 30 + stichAugen;
      } else {
        score += 40 + stichAugen;
      }
    } else {
      if (istSpielmacher) {
        const partnerImStich = (stich.karten || []).some(k => k?.spielerId === state.partner);
        if (partnerImStich) {
          score += augen * 2;
        } else {
          score += 20 - augen;
        }
      } else {
        score += 30 - augen;
      }
    }
  }

  return score;
}

/**
 * Analysiert den optimalen Spielzug und liefert Erklärungen
 */
export function getOptimalPlayAnalysis(
  state: SpielState,
  spielerId: string
): OptimalPlayResult | null {
  const spieler = state.spieler.find(s => s.id === spielerId);
  if (!spieler || !state.gespielteAnsage) {
    return null;
  }

  const erlaubteKarten = spielbareKarten(
    spieler.hand,
    state.aktuellerStich,
    state.gespielteAnsage,
    state.gesuchteAss || undefined
  );

  if (erlaubteKarten.length === 0) {
    return null;
  }

  const istSpielmacher = spielerId === state.spielmacher || spielerId === state.partner;
  const spielart = state.gespielteAnsage;

  // Bewerte alle Karten
  const bewertungen = erlaubteKarten.map(karte => {
    const score = bewerteKarte(karte, state.aktuellerStich, state, istSpielmacher);
    const kannGewinnen = wuerdeStichGewinnen(karte, state.aktuellerStich, spielart);
    const reasons = getKartenGruende(
      karte,
      state.aktuellerStich,
      state,
      istSpielmacher,
      kannGewinnen
    );

    return {
      card: karte,
      score,
      reasons,
    };
  });

  // Sortiere nach Score
  bewertungen.sort((a, b) => b.score - a.score);

  const situation = getSituation(state.aktuellerStich, istSpielmacher);

  return {
    optimalCard: bewertungen[0].card,
    score: bewertungen[0].score,
    reasons: bewertungen[0].reasons,
    situation,
    allOptions: bewertungen,
  };
}

/**
 * Vergleicht den gespielten Zug mit dem optimalen
 */
export function analyzePlayedCard(
  state: SpielState,
  spielerId: string,
  playedCardId: string
): {
  wasOptimal: boolean;
  optimalCard: Karte;
  playedCard: Karte;
  scoreDifference: number;
  feedback: string;
} | null {
  const analysis = getOptimalPlayAnalysis(state, spielerId);
  if (!analysis) return null;

  const spieler = state.spieler.find(s => s.id === spielerId);
  const playedCard = spieler?.hand.find(k => k.id === playedCardId);
  if (!playedCard) return null;

  const playedOption = analysis.allOptions.find(o => o.card.id === playedCardId);
  const wasOptimal = playedCardId === analysis.optimalCard.id;
  const scoreDifference = analysis.score - (playedOption?.score || 0);

  let feedback: string;
  if (wasOptimal) {
    feedback = 'Perfekt gespielt!';
  } else if (scoreDifference < 10) {
    feedback = 'Guter Zug, fast optimal.';
  } else if (scoreDifference < 25) {
    feedback = 'Solider Zug, aber es gab eine bessere Option.';
  } else {
    feedback = 'Das war nicht optimal - schau dir den Tipp an!';
  }

  return {
    wasOptimal,
    optimalCard: analysis.optimalCard,
    playedCard,
    scoreDifference,
    feedback,
  };
}
