// Real-time Kommunikation - Socket.IO Implementation
// Ersetzt Pusher mit selbst-gehostetem Socket.IO Server

import { io, Socket } from 'socket.io-client';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Socket Server URL (läuft auf Port 3002)
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';

// Server-seitige Trigger-Funktion (ruft den Socket-Server via HTTP auf)
export function getPusherServer() {
  const triggerUrl = process.env.SOCKET_TRIGGER_URL || 'http://localhost:3002/trigger';

  return {
    trigger: async (channel: string | string[], event: string, data: unknown) => {
      const channels = Array.isArray(channel) ? channel : [channel];

      for (const ch of channels) {
        try {
          const response = await fetch(triggerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel: ch, event, data }),
          });

          if (!response.ok) {
            console.warn(`[Socket] Trigger fehlgeschlagen für ${ch}:${event}`);
          }
        } catch (e) {
          console.warn(`[Socket] Trigger-Fehler für ${ch}:${event}:`, e);
        }
      }
    },
    // Kompatibilitäts-Dummy für authorizeChannel
    authorizeChannel: () => null,
  };
}

// Legacy export für Kompatibilität
export const pusherServer = getPusherServer();

// Client-seitige Socket.IO-Instanz
let socketInstance: Socket | null = null;
let currentPlayerId: string | null = null;
let currentPlayerName: string | null = null;

// Connection Status für UI-Feedback
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';
let connectionStatus: ConnectionStatus = 'disconnected';
let connectionListeners: ((status: ConnectionStatus) => void)[] = [];

function setConnectionStatus(status: ConnectionStatus) {
  connectionStatus = status;
  connectionListeners.forEach(listener => listener(status));
}

export function getConnectionStatus(): ConnectionStatus {
  return connectionStatus;
}

export function onConnectionChange(callback: (status: ConnectionStatus) => void): () => void {
  connectionListeners.push(callback);
  // Sofort aktuellen Status mitteilen
  callback(connectionStatus);
  return () => {
    connectionListeners = connectionListeners.filter(l => l !== callback);
  };
}

export function getPusherClient(playerId?: string, playerName?: string): Socket | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Socket.IO URL bestimmen
  let socketUrl = SOCKET_SERVER_URL;

  // Im Browser: Relative URL basierend auf aktuellem Host
  if (typeof window !== 'undefined') {
    const host = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // Auf Production: Socket-Server läuft auf separatem Port
    // Auf lokaler Entwicklung: localhost:3002
    if (host.includes('mqtt.ivu-software.de')) {
      // Production: Nginx proxy zum Socket-Server
      socketUrl = `${window.location.protocol}//${host}`;
    }
  }

  // Neuen Socket erstellen wenn sich Player-Info ändert
  if (playerId && playerName && (playerId !== currentPlayerId || playerName !== currentPlayerName)) {
    if (socketInstance) {
      socketInstance.disconnect();
    }

    currentPlayerId = playerId;
    currentPlayerName = playerName;

    socketInstance = io(socketUrl, {
      path: `${basePath}/socket.io`,
      auth: { playerId, playerName },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Verbunden:', socketInstance?.id);
      setConnectionStatus('connected');
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] Getrennt:', reason);
      setConnectionStatus('disconnected');
    });

    socketInstance.on('reconnect_attempt', (attempt) => {
      console.log('[Socket] Reconnect-Versuch:', attempt);
      setConnectionStatus('reconnecting');
    });

    socketInstance.on('reconnect', () => {
      console.log('[Socket] Reconnected');
      setConnectionStatus('connected');
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('[Socket] Verbindungsfehler:', err.message);
      setConnectionStatus('disconnected');
    });
  }

  // Falls noch kein Socket und keine Player-Info, trotzdem erstellen
  if (!socketInstance && !playerId) {
    socketInstance = io(socketUrl, {
      path: `${basePath}/socket.io`,
      transports: ['websocket', 'polling'],
    });
  }

  return socketInstance;
}

// Hilfsfunktion zum Abonnieren eines Channels
export function subscribeToChannel(
  socket: Socket,
  channel: string,
  playerId?: string,
  playerName?: string
): void {
  socket.emit('subscribe', { channel, playerId, playerName });
}

// Hilfsfunktion zum Verlassen eines Channels
export function unsubscribeFromChannel(socket: Socket, channel: string): void {
  socket.emit('unsubscribe', channel);
}

// Event-Namen (unverändert)
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
  AUS_IS: 'aus-is',

  // Bot-Events
  BOT_THINKING: 'bot-thinking',
  BOT_ACTION: 'bot-action',

  // Voice-Events
  VOICE_MESSAGE: 'voice-message',
} as const;

// Channel-Namen (unverändert)
export function lobbyChannel(): string {
  return 'presence-lobby';
}

export function roomChannel(roomId: string): string {
  return `presence-room-${roomId}`;
}

export function gameChannel(roomId: string): string {
  return `private-game-${roomId}`;
}
