// Spielzustand-Management

import { SpielState, Spieler, Spielart, Ansage, Karte, Stich, Farbe, SpielErgebnis } from './types';
import { austeilen, zaehleAugen } from './cards';
import { istTrumpf, stichGewinner, spielbareKarten, sortiereHand } from './rules';
import { berechneErgebnis } from './scoring';
import { createClient, RedisClientType } from 'redis';

const GAME_PREFIX = 'game:';
const isLocal = !process.env.REDIS_URL;

// Redis-Client (Lazy Init)
let redis: RedisClientType | null = null;
let redisConnecting: Promise<RedisClientType> | null = null;

async function getRedis(): Promise<RedisClientType> {
  if (redis?.isOpen) return redis;

  if (redisConnecting) return redisConnecting;

  redisConnecting = (async () => {
    redis = createClient({ url: process.env.REDIS_URL });
    redis.on('error', (err) => console.error('Redis Error:', err));
    await redis.connect();
    return redis;
  })();

  return redisConnecting;
}

// Lokaler Fallback für Entwicklung
const localGames = new Map<string, SpielState>();

// Wrapper für KV/lokalen Speicher
export const activeGames = {
  get: (key: string): SpielState | undefined => localGames.get(key),
  set: (key: string, value: SpielState): void => { localGames.set(key, value); },
  delete: (key: string): void => { localGames.delete(key); },
};

// Async Speicher-Funktionen
export async function saveGameState(state: SpielState): Promise<void> {
  if (isLocal) {
    localGames.set(state.id, state);
  } else {
    const r = await getRedis();
    await r.set(`${GAME_PREFIX}${state.id}`, JSON.stringify(state), { EX: 3600 }); // 1h TTL
  }
}

export async function loadGameState(roomId: string): Promise<SpielState | undefined> {
  if (isLocal) {
    return localGames.get(roomId);
  }
  const r = await getRedis();
  const data = await r.get(`${GAME_PREFIX}${roomId}`);
  return data ? JSON.parse(data) : undefined;
}

export async function deleteGameState(roomId: string): Promise<void> {
  if (isLocal) {
    localGames.delete(roomId);
  } else {
    const r = await getRedis();
    await r.del(`${GAME_PREFIX}${roomId}`);
  }
}

/**
 * Erstellt ein neues Spiel
 * @param vorherigerGeber - Position des Gebers der letzten Runde (undefined = erstes Spiel)
 */
export function erstelleSpiel(
  raumId: string,
  spielerDaten: { id: string; name: string; isBot: boolean }[],
  vorherigerGeber?: number
): SpielState {
  const haende = austeilen();

  // Geber rotiert nach rechts (im Uhrzeigersinn)
  const geber = vorherigerGeber !== undefined
    ? ((vorherigerGeber + 1) % 4) as 0 | 1 | 2 | 3
    : 0; // Erstes Spiel: Position 0 gibt

  // Rechts vom Geber kommt raus (im Uhrzeigersinn = +1)
  const ersterSpieler = ((geber + 1) % 4) as 0 | 1 | 2 | 3;

  console.log(`[Spiel] Neues Spiel - Geber: Position ${geber}, Erster Spieler: Position ${ersterSpieler}`);

  const spieler: Spieler[] = spielerDaten.map((s, i) => ({
    id: s.id,
    name: s.name,
    isBot: s.isBot,
    hand: haende[i],
    stiche: [],
    guthaben: 0,
    position: i as 0 | 1 | 2 | 3,
    hatAngesagt: false,
    ansage: null,
    hatGelegt: false,
  }));

  const state: SpielState = {
    id: raumId,
    spieler,
    phase: 'legen', // Startet mit Legen-Phase
    geber,
    legenEntscheidungen: [],
    aktuellerAnsager: ersterSpieler, // Rechts vom Geber beginnt
    gespielteAnsage: null,
    spielmacher: null,
    partner: null,
    gesuchteAss: null,
    kontra: false,
    re: false,
    aktuellerSpieler: ersterSpieler, // Rechts vom Geber kommt raus
    aktuellerStich: { karten: [], gewinner: null },
    stichNummer: 0,
    augenSpielmacher: 0,
    augenGegner: 0,
  };

  activeGames.set(raumId, state);
  return state;
}

/**
 * Verarbeitet eine Legen-Entscheidung (Klopfen)
 */
export function verarbeiteLegen(
  state: SpielState,
  spielerId: string,
  willLegen: boolean
): SpielState {
  if (state.phase !== 'legen') {
    throw new Error('Nicht in Legen-Phase');
  }

  // Prüfen ob Spieler schon entschieden hat
  if (state.legenEntscheidungen.includes(spielerId)) {
    return state;
  }

  // Entscheidung speichern
  state.legenEntscheidungen.push(spielerId);

  // Wenn gelegt wird, beim Spieler markieren
  if (willLegen) {
    const spieler = state.spieler.find(s => s.id === spielerId);
    if (spieler) {
      spieler.hatGelegt = true;
    }
  }

  // Wenn alle entschieden haben, zur Ansage-Phase wechseln
  if (state.legenEntscheidungen.length >= 4) {
    state.phase = 'ansagen';
  }

  return state;
}

/**
 * Verarbeitet eine Spielansage
 */
export function verarbeiteAnsage(
  state: SpielState,
  spielerId: string,
  ansage: Ansage,
  gesuchteAss?: Farbe // Bei Sauspiel
): SpielState {
  const spielerIndex = state.spieler.findIndex(s => s.id === spielerId);
  if (spielerIndex === -1 || spielerIndex !== state.aktuellerAnsager) {
    throw new Error('Nicht am Zug');
  }

  const spieler = state.spieler[spielerIndex];
  spieler.hatAngesagt = true;
  spieler.ansage = ansage;

  // Wenn ein Spiel angesagt wurde (nicht "weiter")
  if (ansage !== 'weiter') {
    // Höhere Spiele überschreiben niedrigere
    const spielWertigkeit: Record<Spielart, number> = {
      'sauspiel': 1,
      'hochzeit': 1,
      'wenz': 2,
      'geier': 2,
      'farbsolo-eichel': 3,
      'farbsolo-gras': 3,
      'farbsolo-herz': 3,
      'farbsolo-schellen': 3,
    };

    const neueWertigkeit = spielWertigkeit[ansage];
    const aktuelleWertigkeit = state.gespielteAnsage
      ? spielWertigkeit[state.gespielteAnsage]
      : 0;

    if (neueWertigkeit > aktuelleWertigkeit) {
      state.gespielteAnsage = ansage;
      state.spielmacher = spielerId;

      if (ansage === 'sauspiel' && gesuchteAss) {
        state.gesuchteAss = gesuchteAss;
        // Partner wird später beim Ausspielen der Sau erkannt
      }
    }
  }

  // Nächster Ansager
  state.aktuellerAnsager = ((state.aktuellerAnsager + 1) % 4) as 0 | 1 | 2 | 3;

  // Alle haben angesagt?
  if (state.spieler.every(s => s.hatAngesagt)) {
    if (state.gespielteAnsage) {
      // Spiel beginnt
      state.phase = 'spielen';
      // Spielmacher kommt raus
      const spielmacherIndex = state.spieler.findIndex(s => s.id === state.spielmacher);
      state.aktuellerSpieler = spielmacherIndex as 0 | 1 | 2 | 3;

      // Hände sortieren
      for (const s of state.spieler) {
        s.hand = sortiereHand(s.hand, state.gespielteAnsage!);
      }
    } else {
      // Alle haben "weiter" gesagt - neu mischen
      return erstelleSpiel(state.id, state.spieler.map(s => ({
        id: s.id,
        name: s.name,
        isBot: s.isBot,
      })));
    }
  }

  return state;
}

/**
 * Verarbeitet einen Spielzug (Karte spielen)
 */
export function verarbeiteSpielzug(
  state: SpielState,
  spielerId: string,
  karteId: string
): SpielState {
  if (state.phase !== 'spielen') {
    throw new Error('Nicht in der Spielphase');
  }

  const spielerIndex = state.spieler.findIndex(s => s.id === spielerId);
  if (spielerIndex === -1 || spielerIndex !== state.aktuellerSpieler) {
    throw new Error('Nicht am Zug');
  }

  const spieler = state.spieler[spielerIndex];
  const karteIndex = spieler.hand.findIndex(k => k.id === karteId);
  if (karteIndex === -1) {
    throw new Error('Karte nicht auf der Hand');
  }

  const karte = spieler.hand[karteIndex];

  // Prüfen ob die Karte gespielt werden darf
  const erlaubteKarten = spielbareKarten(
    spieler.hand,
    state.aktuellerStich,
    state.gespielteAnsage!,
    state.gesuchteAss || undefined
  );

  if (!erlaubteKarten.some(k => k.id === karteId)) {
    throw new Error('Karte darf nicht gespielt werden');
  }

  // Karte aus Hand entfernen und in Stich legen
  spieler.hand.splice(karteIndex, 1);
  state.aktuellerStich.karten.push({ spielerId, karte });

  // Bei Sauspiel: Partner erkennen wenn Sau gespielt wird
  if (
    state.gespielteAnsage === 'sauspiel' &&
    state.gesuchteAss &&
    karte.farbe === state.gesuchteAss &&
    karte.wert === 'ass' &&
    !state.partner
  ) {
    state.partner = spielerId;
  }

  // Stich vollständig?
  if (state.aktuellerStich.karten.length === 4) {
    // Gewinner ermitteln
    const gewinnerOffset = stichGewinner(state.aktuellerStich, state.gespielteAnsage!);
    const erstePosition = state.spieler.findIndex(
      s => s.id === state.aktuellerStich.karten[0].spielerId
    );
    const gewinnerPosition = (erstePosition + gewinnerOffset) % 4;
    const gewinner = state.spieler[gewinnerPosition];

    state.aktuellerStich.gewinner = gewinner.id;
    console.log(`[Stich] Gewinner: ${gewinner.name} (Position ${gewinnerPosition})`);

    // Stich dem Gewinner geben
    gewinner.stiche.push(state.aktuellerStich.karten.map(k => k.karte));

    state.phase = 'stich-ende';
    state.stichNummer++;

    // Alle 6 Stiche gespielt?
    if (state.stichNummer >= 6) {
      state.phase = 'runde-ende';
    } else {
      // Nach kurzer Pause: Neuer Stich, Gewinner kommt raus
      state.aktuellerSpieler = gewinnerPosition as 0 | 1 | 2 | 3;
      console.log(`[Stich] Nächster Spieler: ${gewinner.name} (Position ${gewinnerPosition})`);
    }
  } else {
    // Nächster Spieler
    state.aktuellerSpieler = ((state.aktuellerSpieler + 1) % 4) as 0 | 1 | 2 | 3;
  }

  return state;
}

/**
 * Startet den nächsten Stich nach der Pause
 */
export function naechsterStich(state: SpielState): SpielState {
  if (state.phase !== 'stich-ende') {
    throw new Error('Nicht im Stich-Ende');
  }

  state.aktuellerStich = { karten: [], gewinner: null };
  state.phase = 'spielen';

  return state;
}

/**
 * Berechnet und wendet das Spielergebnis an
 */
export function beendeRunde(state: SpielState): { state: SpielState; ergebnis: SpielErgebnis } {
  if (state.phase !== 'runde-ende') {
    throw new Error('Runde nicht beendet');
  }

  const ergebnis = berechneErgebnis({
    spielart: state.gespielteAnsage!,
    spielmacherId: state.spielmacher!,
    partnerId: state.partner,
    spieler: state.spieler,
    kontra: state.kontra,
    re: state.re,
  });

  // Guthaben anpassen
  for (const auszahlung of ergebnis.auszahlungen) {
    const spieler = state.spieler.find(s => s.id === auszahlung.spielerId);
    if (spieler) {
      spieler.guthaben += auszahlung.betrag;
    }
  }

  return { state, ergebnis };
}

/**
 * Verarbeitet "Du" (Kontra) Ansage
 */
export function sageDu(state: SpielState, spielerId: string): SpielState {
  // Nur Gegner können "Du" sagen
  const istGegner = spielerId !== state.spielmacher && spielerId !== state.partner;
  if (!istGegner) {
    throw new Error('Nur Gegner können Du sagen');
  }

  if (state.kontra) {
    throw new Error('Du wurde bereits gesagt');
  }

  state.kontra = true;
  return state;
}

/**
 * Verarbeitet "Re" Ansage
 */
export function sageRe(state: SpielState, spielerId: string): SpielState {
  // Nur Spielmacher-Team kann "Re" sagen
  const istSpielmacherTeam = spielerId === state.spielmacher || spielerId === state.partner;
  if (!istSpielmacherTeam) {
    throw new Error('Nur Spielmacher-Team kann Re sagen');
  }

  if (!state.kontra) {
    throw new Error('Du muss zuerst gesagt werden');
  }

  if (state.re) {
    throw new Error('Re wurde bereits gesagt');
  }

  state.re = true;
  return state;
}

/**
 * Holt den aktuellen Spielzustand (sync für lokale Entwicklung)
 */
export function getSpielState(raumId: string): SpielState | undefined {
  return localGames.get(raumId);
}

/**
 * Holt den aktuellen Spielzustand (async für Produktion mit KV)
 */
export async function getSpielStateAsync(raumId: string): Promise<SpielState | undefined> {
  return loadGameState(raumId);
}

/**
 * Gibt die sichtbaren Informationen für einen Spieler zurück
 * (versteckt die Karten der anderen Spieler)
 */
export function getSpielerSicht(state: SpielState, spielerId: string): SpielState {
  const sicht = JSON.parse(JSON.stringify(state)) as SpielState;

  for (const spieler of sicht.spieler) {
    if (spieler.id !== spielerId) {
      // Anzahl der Karten beibehalten, aber Werte verstecken
      spieler.hand = spieler.hand.map(() => ({
        farbe: 'schellen' as Farbe,
        wert: '9' as const,
        id: 'hidden',
      }));
    }
  }

  return sicht;
}
