// API Routes für Spielzüge

import { NextRequest, NextResponse } from 'next/server';
import {
  getSpielState,
  verarbeiteLegen,
  verarbeiteAnsage,
  verarbeiteSpielzug,
  naechsterStich,
  beendeRunde,
  sageDu,
  sageRe,
  getSpielerSicht,
  erstelleSpiel,
  activeGames,
} from '@/lib/schafkopf/game-state';
import { pusherServer, EVENTS, gameChannel, roomChannel } from '@/lib/pusher';
import { botAnsage, botSpielzug } from '@/lib/openai';
import { Ansage, Farbe } from '@/lib/schafkopf/types';

// GET - Spielzustand abrufen
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  const playerId = searchParams.get('playerId');

  if (!roomId) {
    return NextResponse.json({ error: 'roomId fehlt' }, { status: 400 });
  }

  const state = getSpielState(roomId);
  if (!state) {
    return NextResponse.json({ error: 'Spiel nicht gefunden' }, { status: 404 });
  }

  // Spielersicht zurückgeben (versteckt andere Karten)
  const sicht = playerId ? getSpielerSicht(state, playerId) : state;
  return NextResponse.json(sicht);
}

// POST - Spielaktion ausführen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, roomId, playerId, ...params } = body;

    let state = getSpielState(roomId);
    if (!state) {
      return NextResponse.json({ error: 'Spiel nicht gefunden' }, { status: 404 });
    }

    switch (action) {
      case 'legen': {
        const { willLegen } = params as { willLegen: boolean };

        state = verarbeiteLegen(state, playerId, willLegen);
        activeGames.set(roomId, state);

        // Broadcast an alle Spieler
        await broadcastGameState(roomId, state);

        // Event für Legen
        await pusherServer.trigger(roomChannel(roomId), EVENTS.LEGEN, {
          playerId,
          willLegen,
        });

        // Bot-Legen verarbeiten
        await processeBotLegen(roomId, state);

        return NextResponse.json({ success: true });
      }

      case 'ansage': {
        const { ansage, gesuchteAss } = params as { ansage: Ansage; gesuchteAss?: Farbe };

        state = verarbeiteAnsage(state, playerId, ansage, gesuchteAss);
        activeGames.set(roomId, state);

        // Broadcast an alle Spieler
        await broadcastGameState(roomId, state);

        // Event für die Ansage
        await pusherServer.trigger(roomChannel(roomId), EVENTS.ANSAGE, {
          playerId,
          ansage,
          gesuchteAss,
        });

        // Bot-Ansagen verarbeiten
        await processeBotAnsagen(roomId, state);

        return NextResponse.json({ success: true });
      }

      case 'spielzug': {
        const { karteId } = params as { karteId: string };

        state = verarbeiteSpielzug(state, playerId, karteId);
        activeGames.set(roomId, state);

        await pusherServer.trigger(roomChannel(roomId), EVENTS.KARTE_GESPIELT, {
          playerId,
          karteId,
        });

        await broadcastGameState(roomId, state);

        // Stich-Ende oder Runde-Ende?
        console.log('[Spielzug] Phase nach Zug:', state.phase, 'StichNr:', state.stichNummer);

        if (state.phase === 'stich-ende' || state.phase === 'runde-ende') {
          await pusherServer.trigger(roomChannel(roomId), EVENTS.STICH_ENDE, {
            gewinner: state.aktuellerStich.gewinner,
            stich: state.aktuellerStich,
          });

          // Runde-Ende sofort verarbeiten (keine setTimeout - funktioniert nicht in Next.js)
          if (state.phase === 'runde-ende') {
            console.log('[Spielzug] RUNDE ENDE erkannt! Berechne Ergebnis...');
            try {
              const { state: endState, ergebnis } = beendeRunde(state);
              activeGames.set(roomId, endState);

              console.log('[Spielzug] Ergebnis berechnet, sende RUNDE_ENDE Event...');
              await pusherServer.trigger(roomChannel(roomId), EVENTS.RUNDE_ENDE, {
                ergebnis,
              });

              await broadcastGameState(roomId, endState);
              console.log('[Spielzug] RUNDE_ENDE Event gesendet!');
              return NextResponse.json({ success: true, phase: 'runde-ende' });
            } catch (error) {
              console.error('[Spielzug] FEHLER bei beendeRunde:', error);
              return NextResponse.json({ error: String(error) }, { status: 500 });
            }
          }

          // Normales Stich-Ende: Nächster Stich wird vom Client getriggert
          return NextResponse.json({ success: true, phase: 'stich-ende' });
        } else {
          // Nächster Spieler - Bot?
          await processeBotSpielzuege(roomId, state);
        }

        return NextResponse.json({ success: true });
      }

      case 'du': {
        state = sageDu(state, playerId);
        activeGames.set(roomId, state);

        await pusherServer.trigger(roomChannel(roomId), EVENTS.DU_GESAGT, { playerId });
        await broadcastGameState(roomId, state);

        return NextResponse.json({ success: true });
      }

      case 're': {
        state = sageRe(state, playerId);
        activeGames.set(roomId, state);

        await pusherServer.trigger(roomChannel(roomId), EVENTS.RE_GESAGT, { playerId });
        await broadcastGameState(roomId, state);

        return NextResponse.json({ success: true });
      }

      case 'triggerBots': {
        // Trigger Bot-Aktionen basierend auf aktueller Phase
        if (state.phase === 'legen') {
          await processeBotLegen(roomId, state);
        } else if (state.phase === 'ansagen') {
          await processeBotAnsagen(roomId, state);
        } else if (state.phase === 'spielen') {
          await processeBotSpielzuege(roomId, state);
        }
        return NextResponse.json({ success: true });
      }

      case 'naechsterStich': {
        // Nach Stich-Animation: Nächsten Stich starten
        if (state.phase !== 'stich-ende') {
          return NextResponse.json({ success: true }); // Bereits weiter
        }

        state = naechsterStich(state);
        activeGames.set(roomId, state);
        await broadcastGameState(roomId, state);

        // Bot-Züge verarbeiten
        await processeBotSpielzuege(roomId, state);

        return NextResponse.json({ success: true });
      }

      case 'neueRunde': {
        // Neue Runde mit gleichen Spielern starten
        // Geber rotiert rechts herum
        const neuState = erstelleSpiel(
          roomId,
          state.spieler.map(s => ({
            id: s.id,
            name: s.name,
            isBot: s.isBot,
          })),
          state.geber // Vorheriger Geber wird übergeben
        );

        // Guthaben übernehmen
        for (const spieler of neuState.spieler) {
          const alter = state.spieler.find(s => s.id === spieler.id);
          if (alter) {
            spieler.guthaben = alter.guthaben;
          }
        }

        activeGames.set(roomId, neuState);
        await broadcastGameState(roomId, neuState);

        // Bot-Legen starten (dann automatisch Ansagen)
        await processeBotLegen(roomId, neuState);

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 });
    }
  } catch (error) {
    console.error('Game API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server-Fehler' },
      { status: 500 }
    );
  }
}

// Hilfsfunktionen

async function broadcastGameState(roomId: string, state: ReturnType<typeof getSpielState>) {
  if (!state) return;

  // Für jeden Spieler individuelle Sicht senden
  for (const spieler of state.spieler) {
    const sicht = getSpielerSicht(state, spieler.id);
    await pusherServer.trigger(`private-player-${spieler.id}`, EVENTS.GAME_STATE, sicht);
  }

  // Öffentliche Events
  await pusherServer.trigger(roomChannel(roomId), EVENTS.GAME_STATE, {
    phase: state.phase,
    aktuellerSpieler: state.aktuellerSpieler,
    aktuellerAnsager: state.aktuellerAnsager,
    stichNummer: state.stichNummer,
    gespielteAnsage: state.gespielteAnsage,
    kontra: state.kontra,
    re: state.re,
  });
}

async function processeBotAnsagen(roomId: string, state: ReturnType<typeof getSpielState>) {
  if (!state || state.phase !== 'ansagen') return;

  const aktuellerSpieler = state.spieler[state.aktuellerAnsager];
  if (!aktuellerSpieler.isBot) return;

  // Bot "denkt" kurz
  await pusherServer.trigger(roomChannel(roomId), EVENTS.BOT_THINKING, {
    botId: aktuellerSpieler.id,
  });

  await new Promise(resolve => setTimeout(resolve, 1500));

  // Bot-Ansage generieren
  const bisherigeAnsagen = state.spieler
    .filter(s => s.hatAngesagt)
    .map(s => ({ position: s.position, ansage: s.ansage! }));

  const { ansage, gesuchteAss } = await botAnsage(
    aktuellerSpieler.hand,
    aktuellerSpieler.position,
    bisherigeAnsagen
  );

  // Ansage verarbeiten
  state = verarbeiteAnsage(state, aktuellerSpieler.id, ansage, gesuchteAss);
  activeGames.set(roomId, state);

  await pusherServer.trigger(roomChannel(roomId), EVENTS.BOT_ACTION, {
    botId: aktuellerSpieler.id,
    action: 'ansage',
    ansage,
    gesuchteAss,
  });

  await broadcastGameState(roomId, state);

  // Nächste Bot-Ansage (rekursiv)
  if (state.phase === 'ansagen') {
    await processeBotAnsagen(roomId, state);
  } else if (state.phase === 'spielen') {
    // Spiel startet, Bot-Züge prüfen
    await processeBotSpielzuege(roomId, state);
  }
}

async function processeBotLegen(roomId: string, state: ReturnType<typeof getSpielState>) {
  if (!state || state.phase !== 'legen') {
    // Wenn Phase gewechselt hat, Bot-Ansagen starten
    if (state?.phase === 'ansagen') {
      await processeBotAnsagen(roomId, state);
    }
    return;
  }

  // Finde nächsten Bot der noch nicht entschieden hat
  const botsNichtEntschieden = state.spieler.filter(
    s => s.isBot && !state!.legenEntscheidungen.includes(s.id)
  );

  if (botsNichtEntschieden.length === 0) return;

  const bot = botsNichtEntschieden[0];

  // Bot "denkt" kurz
  await pusherServer.trigger(roomChannel(roomId), EVENTS.BOT_THINKING, {
    botId: bot.id,
  });

  await new Promise(resolve => setTimeout(resolve, 800));

  // Bot-Entscheidung: Legt bei guten Karten (vereinfacht: bei 3+ Trümpfen)
  // Zähle grob Ober und Unter als "gute" Karten
  const guteKarten = bot.hand.filter(k => k.wert === 'ober' || k.wert === 'unter').length;
  const willLegen = guteKarten >= 3 && Math.random() > 0.3; // Mit Zufall

  // Legen verarbeiten
  state = verarbeiteLegen(state, bot.id, willLegen);
  activeGames.set(roomId, state);

  await pusherServer.trigger(roomChannel(roomId), EVENTS.BOT_ACTION, {
    botId: bot.id,
    action: 'legen',
    willLegen,
  });

  await broadcastGameState(roomId, state);

  // Rekursiv nächste Bots
  await processeBotLegen(roomId, state);
}

async function processeBotSpielzuege(roomId: string, state: ReturnType<typeof getSpielState>) {
  console.log('[Bot] processeBotSpielzuege called, phase:', state?.phase, 'stichNr:', state?.stichNummer);
  if (!state || state.phase !== 'spielen') {
    console.log('[Bot] Returning early - not in spielen phase');
    return;
  }

  const aktuellerSpieler = state.spieler[state.aktuellerSpieler];
  if (!aktuellerSpieler.isBot) return;

  // Bot "denkt"
  await pusherServer.trigger(roomChannel(roomId), EVENTS.BOT_THINKING, {
    botId: aktuellerSpieler.id,
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Bot-Spielzug generieren
  const karteId = await botSpielzug(state, aktuellerSpieler.id);

  // Spielzug ausführen
  state = verarbeiteSpielzug(state, aktuellerSpieler.id, karteId);
  activeGames.set(roomId, state);

  await pusherServer.trigger(roomChannel(roomId), EVENTS.BOT_ACTION, {
    botId: aktuellerSpieler.id,
    action: 'spielzug',
    karteId,
  });

  await broadcastGameState(roomId, state);

  console.log('[Bot] Nach Spielzug - phase:', state.phase, 'stichNr:', state.stichNummer);

  // Stich-Ende oder Runde-Ende?
  if (state.phase === 'stich-ende' || state.phase === 'runde-ende') {
    console.log('[Bot] Stich/Runde Ende erkannt!');
    await pusherServer.trigger(roomChannel(roomId), EVENTS.STICH_ENDE, {
      gewinner: state.aktuellerStich.gewinner,
      stich: state.aktuellerStich,
    });

    // Runde-Ende sofort verarbeiten (kein setTimeout in serverless)
    if (state.phase === 'runde-ende') {
      console.log('[Bot] RUNDE ENDE! Berechne Ergebnis...');
      // Kurze Pause für Animation
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const { state: endState, ergebnis } = beendeRunde(state);
        activeGames.set(roomId, endState);
        console.log('[Bot] Ergebnis:', ergebnis);

        await pusherServer.trigger(roomChannel(roomId), EVENTS.RUNDE_ENDE, { ergebnis });
        await broadcastGameState(roomId, endState);
        console.log('[Bot] RUNDE_ENDE Event gesendet!');
      } catch (error) {
        console.error('[Bot] FEHLER bei beendeRunde:', error);
      }
    } else {
      // Normaler Stich-Ende: Nach Pause nächster Stich
      await new Promise(resolve => setTimeout(resolve, 2000));

      let currentState = getSpielState(roomId);
      if (!currentState || currentState.phase !== 'stich-ende') return;

      currentState = naechsterStich(currentState);
      activeGames.set(roomId, currentState);
      await broadcastGameState(roomId, currentState);
      await processeBotSpielzuege(roomId, currentState);
    }
  } else {
    // Nächster Bot-Zug
    await processeBotSpielzuege(roomId, state);
  }
}
