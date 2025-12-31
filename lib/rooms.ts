// In-Memory Raum-Verwaltung (in Produktion: Redis/DB)

import { Raum } from './schafkopf/types';

// Globale Referenz um Hot-Reload zu überleben
declare global {
  // eslint-disable-next-line no-var
  var __activeRooms: Map<string, Raum> | undefined;
}

export const activeRooms = globalThis.__activeRooms ?? new Map<string, Raum>();
globalThis.__activeRooms = activeRooms;

export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function generatePlayerId(): string {
  return 'p_' + Math.random().toString(36).substring(2, 12);
}

export function createRoom(name: string, erstellerId: string, erstellerName: string): Raum {
  const room: Raum = {
    id: generateRoomId(),
    name,
    spieler: [{ id: erstellerId, name: erstellerName, isBot: false, ready: false }],
    maxSpieler: 4,
    status: 'offen',
    ersteller: erstellerId,
    erstelltAm: Date.now(),
  };

  activeRooms.set(room.id, room);
  return room;
}

export function joinRoom(
  roomId: string,
  playerId: string,
  playerName: string,
  isBot: boolean = false
): Raum | null {
  const room = activeRooms.get(roomId);
  if (!room) return null;
  if (room.spieler.length >= 4) return null;
  if (room.status !== 'offen') return null;

  // Prüfen ob Spieler bereits im Raum
  if (room.spieler.some(s => s.id === playerId)) {
    return room;
  }

  room.spieler.push({ id: playerId, name: playerName, isBot, ready: false });

  if (room.spieler.length === 4) {
    room.status = 'voll';
  }

  return room;
}

export function leaveRoom(roomId: string, playerId: string): Raum | null {
  const room = activeRooms.get(roomId);
  if (!room) return null;

  room.spieler = room.spieler.filter(s => s.id !== playerId);

  if (room.spieler.length === 0) {
    activeRooms.delete(roomId);
    return null;
  }

  room.status = 'offen';

  // Neuer Ersteller wenn der alte gegangen ist
  if (room.ersteller === playerId) {
    room.ersteller = room.spieler[0].id;
  }

  return room;
}

export function setPlayerReady(roomId: string, playerId: string, ready: boolean): Raum | null {
  const room = activeRooms.get(roomId);
  if (!room) return null;

  const player = room.spieler.find(s => s.id === playerId);
  if (!player) return null;

  player.ready = ready;
  return room;
}

export function addBotsToRoom(roomId: string): Raum | null {
  const room = activeRooms.get(roomId);
  if (!room) return null;

  const botNames = ['Bot Max', 'Bot Sepp', 'Bot Vroni', 'Bot Hans'];
  let botIndex = 0;

  while (room.spieler.length < 4) {
    const botId = `bot_${roomId}_${botIndex}`;
    const botName = botNames[botIndex % botNames.length];
    room.spieler.push({ id: botId, name: botName, isBot: true, ready: true });
    botIndex++;
  }

  room.status = 'voll';
  return room;
}

export function startGame(roomId: string): boolean {
  const room = activeRooms.get(roomId);
  if (!room) return false;
  if (room.spieler.length !== 4) return false;

  room.status = 'laeuft';
  return true;
}

export function getRoom(roomId: string): Raum | undefined {
  return activeRooms.get(roomId);
}

export function getAllRooms(): Raum[] {
  return Array.from(activeRooms.values()).filter(r => r.status !== 'laeuft');
}

export function deleteRoom(roomId: string): void {
  activeRooms.delete(roomId);
}
