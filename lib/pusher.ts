// Pusher Server & Client Konfiguration

import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-seitige Pusher-Instanz
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-seitige Pusher-Instanz (Singleton)
let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (typeof window === 'undefined') {
    throw new Error('Pusher Client nur im Browser verfügbar');
  }

  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint: '/api/pusher/auth',
      }
    );
  }

  return pusherClientInstance;
}

// Event-Namen
export const EVENTS = {
  // Lobby-Events
  ROOM_CREATED: 'room-created',
  ROOM_UPDATED: 'room-updated',
  ROOM_DELETED: 'room-deleted',
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  PLAYER_READY: 'player-ready',
  GAME_STARTING: 'game-starting',

  // Spiel-Events
  GAME_STATE: 'game-state',
  LEGEN: 'legen',
  ANSAGE: 'ansage',
  KARTE_GESPIELT: 'karte-gespielt',
  STICH_ENDE: 'stich-ende',
  RUNDE_ENDE: 'runde-ende',
  DU_GESAGT: 'du-gesagt',
  RE_GESAGT: 're-gesagt',

  // Bot-Events
  BOT_THINKING: 'bot-thinking',
  BOT_ACTION: 'bot-action',
} as const;

// Channel-Namen
export function lobbyChannel(): string {
  return 'presence-lobby';
}

export function roomChannel(roomId: string): string {
  return `presence-room-${roomId}`;
}

export function gameChannel(roomId: string): string {
  return `private-game-${roomId}`;
}
