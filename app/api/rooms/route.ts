// API Routes für Raum-Verwaltung

import { NextRequest, NextResponse } from 'next/server';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  setPlayerReady,
  addBotsToRoom,
  startGame,
  getRoom,
  getAllRooms,
  generatePlayerId,
} from '@/lib/rooms';
import { getPusherServer, EVENTS, lobbyChannel, roomChannel } from '@/lib/pusher';
import { erstelleSpiel, saveGameState } from '@/lib/schafkopf/game-state';

// Helper für optionales Pusher-Triggern
async function triggerPusher(channel: string, event: string, data: unknown) {
  try {
    const pusher = getPusherServer();
    await pusher.trigger(channel, event, data);
  } catch (e) {
    console.warn('Pusher nicht verfügbar:', e);
  }
}

// GET - Alle Räume auflisten oder einzelnen Raum abrufen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (roomId) {
      // Einzelnen Raum abrufen
      const room = await getRoom(roomId);
      if (!room) {
        return NextResponse.json({ error: 'Raum nicht gefunden' }, { status: 404 });
      }
      return NextResponse.json(room);
    }

    // Alle offenen Räume
    const rooms = await getAllRooms();
    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Rooms GET error:', error);
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 });
  }
}

// POST - Raum erstellen oder beitreten
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, roomId, roomName, playerId, playerName } = body;

    switch (action) {
      case 'create': {
        const id = playerId || generatePlayerId();
        const room = await createRoom(roomName || 'Schafkopf-Tisch', id, playerName);

        await triggerPusher(lobbyChannel(), EVENTS.ROOM_CREATED, room);

        return NextResponse.json({ room, playerId: id });
      }

      case 'join': {
        const id = playerId || generatePlayerId();
        const room = await joinRoom(roomId, id, playerName);

        if (!room) {
          return NextResponse.json({ error: 'Raum nicht gefunden oder voll' }, { status: 400 });
        }

        await Promise.all([
          triggerPusher(lobbyChannel(), EVENTS.ROOM_UPDATED, room),
          triggerPusher(roomChannel(roomId), EVENTS.PLAYER_JOINED, {
            playerId: id,
            playerName,
            room,
          }),
        ]);

        return NextResponse.json({ room, playerId: id });
      }

      case 'leave': {
        const room = await leaveRoom(roomId, playerId);

        if (room) {
          await Promise.all([
            triggerPusher(lobbyChannel(), EVENTS.ROOM_UPDATED, room),
            triggerPusher(roomChannel(roomId), EVENTS.PLAYER_LEFT, {
              playerId,
              room,
            }),
          ]);
        } else {
          await triggerPusher(lobbyChannel(), EVENTS.ROOM_DELETED, { roomId });
        }

        return NextResponse.json({ success: true });
      }

      case 'ready': {
        const { ready } = body;
        const room = await setPlayerReady(roomId, playerId, ready);

        if (!room) {
          return NextResponse.json({ error: 'Raum nicht gefunden' }, { status: 400 });
        }

        await triggerPusher(roomChannel(roomId), EVENTS.PLAYER_READY, {
          playerId,
          ready,
          room,
        });

        return NextResponse.json({ room });
      }

      case 'addBots': {
        const room = await addBotsToRoom(roomId);

        if (!room) {
          return NextResponse.json({ error: 'Raum nicht gefunden' }, { status: 400 });
        }

        await Promise.all([
          triggerPusher(lobbyChannel(), EVENTS.ROOM_UPDATED, room),
          triggerPusher(roomChannel(roomId), EVENTS.ROOM_UPDATED, room),
        ]);

        return NextResponse.json({ room });
      }

      case 'start': {
        const room = await getRoom(roomId);
        if (!room || room.spieler.length !== 4) {
          return NextResponse.json({ error: 'Nicht genug Spieler' }, { status: 400 });
        }

        // Spiel starten
        await startGame(roomId);

        // Game State erstellen und speichern
        const gameState = erstelleSpiel(
          roomId,
          room.spieler.map(s => ({
            id: s.id,
            name: s.name,
            isBot: s.isBot,
          }))
        );
        await saveGameState(gameState);

        await Promise.all([
          triggerPusher(lobbyChannel(), EVENTS.ROOM_UPDATED, room),
          triggerPusher(roomChannel(roomId), EVENTS.GAME_STARTING, {
            roomId,
            gameState,
          }),
        ]);

        // Nach kurzer Verzögerung Bots starten (falls vorhanden)
        const hasBots = room.spieler.some(s => s.isBot);
        if (hasBots) {
          // Bots starten ihre Legen-Entscheidung nach 1 Sekunde
          setTimeout(async () => {
            try {
              const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
              await fetch(`${baseUrl}/api/game`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'triggerBots', roomId }),
              });
            } catch (e) {
              console.error('Bot trigger error:', e);
            }
          }, 1000);
        }

        return NextResponse.json({ success: true, roomId });
      }

      default:
        return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 });
    }
  } catch (error) {
    console.error('Rooms API error:', error);
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 });
  }
}
