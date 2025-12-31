// Pusher Server & Client Konfiguration

import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-seitige Pusher-Instanz (Lazy Initialization)
let pusherServerInstance: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (!pusherServerInstance) {
    if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY ||
        !process.env.PUSHER_SECRET || !process.env.PUSHER_CLUSTER) {
      throw new Error('Pusher Server-Konfiguration fehlt. Bitte Umgebungsvariablen setzen.');
    }
    pusherServerInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return pusherServerInstance;
}

// Legacy export für Kompatibilität (wird bei erstem Zugriff initialisiert)
export const pusherServer = {
  trigger: (...args: Parameters<Pusher['trigger']>) => getPusherServer().trigger(...args),
  authorizeChannel: (...args: Parameters<Pusher['authorizeChannel']>) => getPusherServer().authorizeChannel(...args),
};

// Client-seitige Pusher-Instanz (Singleton)
let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!pusherClientInstance) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      console.warn('Pusher nicht konfiguriert - Echtzeit-Features deaktiviert');
      return null;
    }

    pusherClientInstance = new PusherClient(key, {
      cluster,
      authEndpoint: '/api/pusher/auth',
    });
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
