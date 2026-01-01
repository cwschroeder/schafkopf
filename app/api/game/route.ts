// API Routes für Spielzüge

import { NextRequest, NextResponse } from 'next/server';
import {
  loadGameState,
  saveGameState,
  verarbeiteLegen,
  verarbeiteAnsage,
  verarbeiteSpielzug,
  naechsterStich,
  beendeRunde,
  sageDu,
  sageRe,
  getSpielerSicht,
  erstelleSpiel,
} from '@/lib/schafkopf/game-state';
import { kannAusIs } from '@/lib/aus-is';
import { getPusherServer, EVENTS, roomChannel } from '@/lib/pusher';
import { botAnsage, botSpielzug } from '@/lib/bot-logic';
import { Ansage, Farbe, SpielState } from '@/lib/schafkopf/types';

// Helper für optionales Pusher-Triggern
async function triggerPusher(channel: string, event: string, data: unknown) {
  try {
    const pusher = getPusherServer();
    await pusher.trigger(channel, event, data);
  } catch (e) {
    console.warn('Pusher nicht verfügbar:', e);
  }
}

// GET - Spielzustand abrufen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const playerId = searchParams.get('playerId');

    if (!roomId) {
      return NextResponse.json({ error: 'roomId fehlt' }, { status: 400 });
    }

    const state = await loadGameState(roomId);
    if (!state) {
      return NextResponse.json({ error: 'Spiel nicht gefunden' }, { status: 404 });
    }

    // Spielersicht zurückgeben (versteckt andere Karten)
    const sicht = playerId ? getSpielerSicht(state, playerId) : state;
    return NextResponse.json(sicht);
  } catch (error) {
    console.error('Game GET error:', error);
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 });
  }
}

// POST - Spielaktion ausführen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, roomId, playerId, ...params } = body;

    let state = await loadGameState(roomId);
    if (!state) {
      return NextResponse.json({ error: 'Spiel nicht gefunden' }, { status: 404 });
    }

    switch (action) {
      case 'legen': {
        const { willLegen } = params as { willLegen: boolean };

        state = verarbeiteLegen(state, playerId, willLegen);
        await saveGameState(state);

        // Broadcast an alle Spieler
        await broadcastGameState(roomId, state);

        // Event für Legen
        await triggerPusher(roomChannel(roomId), EVENTS.LEGEN, {
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
        await saveGameState(state);

        // Broadcast an alle Spieler
        await broadcastGameState(roomId, state);

        // Event für die Ansage
        await triggerPusher(roomChannel(roomId), EVENTS.ANSAGE, {
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
        await saveGameState(state);

        await triggerPusher(roomChannel(roomId), EVENTS.KARTE_GESPIELT, {
          playerId,
          karteId,
        });

        await broadcastGameState(roomId, state);

        // Stich-Ende oder Runde-Ende?
        console.log('[Spielzug] Phase nach Zug:', state.phase, 'StichNr:', state.stichNummer);

        if (state.phase === 'stich-ende' || state.phase === 'runde-ende') {
          await triggerPusher(roomChannel(roomId), EVENTS.STICH_ENDE, {
            gewinner: state.aktuellerStich.gewinner,
            stich: state.aktuellerStich,
          });

          // Runde-Ende sofort verarbeiten (keine setTimeout - funktioniert nicht in Next.js)
          if (state.phase === 'runde-ende') {
            console.log('[Spielzug] RUNDE ENDE erkannt! Berechne Ergebnis...');
            try {
              const { state: endState, ergebnis } = beendeRunde(state);
              await saveGameState(endState);

              console.log('[Spielzug] Ergebnis berechnet, sende RUNDE_ENDE Event...');
              await triggerPusher(roomChannel(roomId), EVENTS.RUNDE_ENDE, {
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
        await saveGameState(state);

        await triggerPusher(roomChannel(roomId), EVENTS.DU_GESAGT, { playerId });
        await broadcastGameState(roomId, state);

        return NextResponse.json({ success: true });
      }

      case 're': {
        state = sageRe(state, playerId);
        await saveGameState(state);

        await triggerPusher(roomChannel(roomId), EVENTS.RE_GESAGT, { playerId });
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
        await saveGameState(state);
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

        await saveGameState(neuState);
        await broadcastGameState(roomId, neuState);

        // Bot-Legen starten (dann automatisch Ansagen)
        await processeBotLegen(roomId, neuState);

        return NextResponse.json({ success: true });
      }

      case 'ausIs': {
        // "Aus is!" - Spieler hat alle höchsten Trümpfe und beendet das Spiel
        if (!kannAusIs(state, playerId)) {
          return NextResponse.json({ error: 'Aus is! nicht möglich' }, { status: 400 });
        }

        // Alle restlichen Karten des Spielers automatisch spielen
        const spielerIndex = state.spieler.findIndex(s => s.id === playerId);
        const spieler = state.spieler[spielerIndex];

        // Event für "Aus is!" senden
        await triggerPusher(roomChannel(roomId), EVENTS.AUS_IS, {
          playerId,
          restlicheKarten: spieler.hand.map(k => k.id),
        });

        // Alle restlichen Stiche dem Spieler geben
        while (spieler.hand.length > 0) {
          // Aktuellen Stich "spielen" - alle Karten in einen Fake-Stich
          const stichKarten = [];

          // Spieler spielt seine erste Karte
          const meineKarte = spieler.hand.shift()!;
          stichKarten.push(meineKarte);

          // Andere Spieler "geben zu" (ihre erste Karte)
          for (let i = 1; i < 4; i++) {
            const andererIndex = (spielerIndex + i) % 4;
            const anderer = state.spieler[andererIndex];
            if (anderer.hand.length > 0) {
              stichKarten.push(anderer.hand.shift()!);
            }
          }

          // Stich dem Spieler geben
          spieler.stiche.push(stichKarten);
          state.stichNummer++;
        }

        // Runde beenden
        state.phase = 'runde-ende';
        state.aktuellerStich = { karten: [], gewinner: playerId };

        const { state: endState, ergebnis } = beendeRunde(state);
        await saveGameState(endState);

        await triggerPusher(roomChannel(roomId), EVENTS.RUNDE_ENDE, { ergebnis });
        await broadcastGameState(roomId, endState);

        return NextResponse.json({ success: true, ergebnis });
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

async function broadcastGameState(roomId: string, state: SpielState | undefined) {
  if (!state) return;

  // Für jeden Spieler individuelle Sicht senden
  for (const spieler of state.spieler) {
    const sicht = getSpielerSicht(state, spieler.id);
    await triggerPusher(`private-player-${spieler.id}`, EVENTS.GAME_STATE, sicht);
  }

  // Öffentliche Events
  await triggerPusher(roomChannel(roomId), EVENTS.GAME_STATE, {
    phase: state.phase,
    aktuellerSpieler: state.aktuellerSpieler,
    aktuellerAnsager: state.aktuellerAnsager,
    stichNummer: state.stichNummer,
    gespielteAnsage: state.gespielteAnsage,
    kontra: state.kontra,
    re: state.re,
  });
}

async function processeBotAnsagen(roomId: string, state: SpielState | undefined) {
  console.log('[Bot] processeBotAnsagen called, phase:', state?.phase);

  try {
    if (!state) return;

    // Wenn Phase zu 'spielen' gewechselt hat, Bot-Spielzüge starten
    if (state.phase === 'spielen') {
      console.log('[Bot] Phase ist spielen, starte Bot-Spielzüge');
      await processeBotSpielzuege(roomId, state);
      return;
    }

    if (state.phase !== 'ansagen') return;

    const aktuellerSpieler = state.spieler[state.aktuellerAnsager];
    console.log('[Bot] Aktueller Ansager:', aktuellerSpieler?.name, 'isBot:', aktuellerSpieler?.isBot);

    if (!aktuellerSpieler?.isBot) return;

    // Bot "denkt" kurz
    await triggerPusher(roomChannel(roomId), EVENTS.BOT_THINKING, {
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

    console.log('[Bot]', aktuellerSpieler.name, 'sagt an:', ansage, gesuchteAss ? `(${gesuchteAss})` : '');

    // Ansage verarbeiten
    state = verarbeiteAnsage(state, aktuellerSpieler.id, ansage, gesuchteAss);
    await saveGameState(state);

    await triggerPusher(roomChannel(roomId), EVENTS.BOT_ACTION, {
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
  } catch (error) {
    console.error('[Bot] FEHLER in processeBotAnsagen:', error);
  }
}

async function processeBotLegen(roomId: string, state: SpielState | undefined) {
  console.log('[Bot] processeBotLegen called, phase:', state?.phase);

  try {
    if (!state || state.phase !== 'legen') {
      // Wenn Phase gewechselt hat, Bot-Ansagen starten
      if (state?.phase === 'ansagen') {
        console.log('[Bot] Phase ist ansagen, starte Bot-Ansagen');
        await processeBotAnsagen(roomId, state);
      }
      return;
    }

    // Finde nächsten Bot der noch nicht entschieden hat
    const botsNichtEntschieden = state.spieler.filter(
      s => s.isBot && !state!.legenEntscheidungen.includes(s.id)
    );

    console.log('[Bot] Bots nicht entschieden:', botsNichtEntschieden.length);

    if (botsNichtEntschieden.length === 0) {
      console.log('[Bot] Alle Bots haben entschieden');
      return;
    }

    const bot = botsNichtEntschieden[0];
    console.log('[Bot] Verarbeite Legen für:', bot.name);

    // Bot "denkt" kurz
    await triggerPusher(roomChannel(roomId), EVENTS.BOT_THINKING, {
      botId: bot.id,
    });

    await new Promise(resolve => setTimeout(resolve, 800));

    // Bot-Entscheidung: Legt bei guten Karten (vereinfacht: bei 3+ Trümpfen)
    // Zähle grob Ober und Unter als "gute" Karten
    const guteKarten = bot.hand.filter(k => k.wert === 'ober' || k.wert === 'unter').length;
    const willLegen = guteKarten >= 3 && Math.random() > 0.3; // Mit Zufall

    console.log('[Bot]', bot.name, 'entscheidet:', willLegen ? 'legt' : 'legt nicht');

    // Legen verarbeiten
    state = verarbeiteLegen(state, bot.id, willLegen);
    await saveGameState(state);

    await triggerPusher(roomChannel(roomId), EVENTS.BOT_ACTION, {
      botId: bot.id,
      action: 'legen',
      willLegen,
    });

    await broadcastGameState(roomId, state);

    // Rekursiv nächste Bots
    await processeBotLegen(roomId, state);
  } catch (error) {
    console.error('[Bot] FEHLER in processeBotLegen:', error);
  }
}

// Maximale Anzahl Retries bei Bot-Fehlern
const MAX_BOT_RETRIES = 2;

async function processeBotSpielzuege(roomId: string, state: SpielState | undefined, retryCount = 0) {
  console.log('[Bot] processeBotSpielzuege called, phase:', state?.phase, 'stichNr:', state?.stichNummer, 'retry:', retryCount);

  if (!state || state.phase !== 'spielen') {
    console.log('[Bot] Returning early - not in spielen phase');
    return;
  }

  const aktuellerSpieler = state.spieler[state.aktuellerSpieler];
  if (!aktuellerSpieler) {
    console.error('[Bot] Aktueller Spieler nicht gefunden, Index:', state.aktuellerSpieler);
    return;
  }

  console.log('[Bot] Aktueller Spieler:', aktuellerSpieler.name, 'isBot:', aktuellerSpieler.isBot);
  if (!aktuellerSpieler.isBot) return;

  try {
    // Bot "denkt"
    await triggerPusher(roomChannel(roomId), EVENTS.BOT_THINKING, {
      botId: aktuellerSpieler.id,
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Bot-Spielzug generieren
    let karteId: string;
    try {
      karteId = await botSpielzug(state, aktuellerSpieler.id);
    } catch (botError) {
      console.error('[Bot] Fehler bei botSpielzug, spiele erste erlaubte Karte:', botError);
      // Fallback: Spiele erste erlaubte Karte
      const { spielbareKarten } = await import('@/lib/schafkopf/rules');
      const erlaubteKarten = spielbareKarten(
        aktuellerSpieler.hand,
        state.aktuellerStich,
        state.gespielteAnsage!,
        state.gesuchteAss || undefined
      );
      if (erlaubteKarten.length === 0) {
        console.error('[Bot] Keine erlaubten Karten! Hand:', aktuellerSpieler.hand);
        return;
      }
      karteId = erlaubteKarten[0].id;
    }

    console.log('[Bot] Spielzug generiert:', karteId);

    // Spielzug ausführen
    state = verarbeiteSpielzug(state, aktuellerSpieler.id, karteId);
    await saveGameState(state);

    await triggerPusher(roomChannel(roomId), EVENTS.BOT_ACTION, {
      botId: aktuellerSpieler.id,
      action: 'spielzug',
      karteId,
    });

    await broadcastGameState(roomId, state);

    console.log('[Bot] Nach Spielzug - phase:', state.phase, 'stichNr:', state.stichNummer);

    // Stich-Ende oder Runde-Ende?
    if (state.phase === 'stich-ende' || state.phase === 'runde-ende') {
      console.log('[Bot] Stich/Runde Ende erkannt!');
      await triggerPusher(roomChannel(roomId), EVENTS.STICH_ENDE, {
        gewinner: state.aktuellerStich.gewinner,
        stich: state.aktuellerStich,
      });

      // Runde-Ende sofort verarbeiten (kein setTimeout in serverless)
      if (state.phase === 'runde-ende') {
        console.log('[Bot] RUNDE ENDE! Berechne Ergebnis...');
        // Kurze Pause für Animation
        await new Promise(resolve => setTimeout(resolve, 2000));

        const { state: endState, ergebnis } = beendeRunde(state);
        await saveGameState(endState);
        console.log('[Bot] Ergebnis:', ergebnis);

        await triggerPusher(roomChannel(roomId), EVENTS.RUNDE_ENDE, { ergebnis });
        await broadcastGameState(roomId, endState);
        console.log('[Bot] RUNDE_ENDE Event gesendet!');
      } else {
        // Normaler Stich-Ende: Nach Pause nächster Stich
        await new Promise(resolve => setTimeout(resolve, 2000));

        let currentState = await loadGameState(roomId);
        if (!currentState || currentState.phase !== 'stich-ende') {
          console.log('[Bot] State nicht mehr stich-ende, abbrechen');
          return;
        }

        currentState = naechsterStich(currentState);
        await saveGameState(currentState);
        await broadcastGameState(roomId, currentState);
        // Rekursion mit resettetem Retry-Counter (neuer Spielzug)
        await processeBotSpielzuege(roomId, currentState, 0);
      }
    } else {
      // Nächster Bot-Zug - Retry-Counter resetten (erfolgreicher Zug)
      await processeBotSpielzuege(roomId, state, 0);
    }
  } catch (error) {
    console.error('[Bot] FEHLER in processeBotSpielzuege:', error);

    // Retry-Limit prüfen
    if (retryCount >= MAX_BOT_RETRIES) {
      console.error('[Bot] Max Retries erreicht, breche ab. Spiel muss manuell fortgesetzt werden.');
      // Event senden damit Client weiß, dass etwas schief ging
      await triggerPusher(roomChannel(roomId), EVENTS.BOT_ACTION, {
        botId: aktuellerSpieler.id,
        action: 'error',
        message: 'Bot konnte nicht spielen',
      });
      return;
    }

    // Bei Fehler: State neu laden und nochmal versuchen nach kurzer Pause
    await new Promise(resolve => setTimeout(resolve, 1000));
    const freshState = await loadGameState(roomId);
    if (freshState?.phase === 'spielen') {
      const nextPlayer = freshState.spieler[freshState.aktuellerSpieler];
      if (nextPlayer?.isBot) {
        console.log('[Bot] Retry nach Fehler... (Versuch', retryCount + 1, 'von', MAX_BOT_RETRIES, ')');
        await processeBotSpielzuege(roomId, freshState, retryCount + 1);
      }
    }
  }
}
