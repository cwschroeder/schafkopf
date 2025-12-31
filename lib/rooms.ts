// Raum-Verwaltung mit Upstash Redis für Produktion

import { Redis } from '@upstash/redis';
import { Raum } from './schafkopf/types';

const ROOM_PREFIX = 'room:';
const ROOMS_LIST_KEY = 'rooms:list';

// Fallback für lokale Entwicklung ohne Redis
const localRooms = new Map<string, Raum>();
const isLocal = !process.env.UPSTASH_REDIS_REST_URL;

// Redis-Client (Lazy Init)
let redis: Redis | null = null;
function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function generatePlayerId(): string {
  return 'p_' + Math.random().toString(36).substring(2, 12);
}

export async function createRoom(name: string, erstellerId: string, erstellerName: string): Promise<Raum> {
  const room: Raum = {
    id: generateRoomId(),
    name,
    spieler: [{ id: erstellerId, name: erstellerName, isBot: false, ready: false }],
    maxSpieler: 4,
    status: 'offen',
    ersteller: erstellerId,
    erstelltAm: Date.now(),
  };

  if (isLocal) {
    localRooms.set(room.id, room);
  } else {
    const r = getRedis();
    await r.set(`${ROOM_PREFIX}${room.id}`, room, { ex: 3600 }); // 1 Stunde TTL
    await r.sadd(ROOMS_LIST_KEY, room.id);
  }

  return room;
}

export async function joinRoom(
  roomId: string,
  playerId: string,
  playerName: string,
  isBot: boolean = false
): Promise<Raum | null> {
  const room = await getRoom(roomId);
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

  await saveRoom(room);
  return room;
}

export async function leaveRoom(roomId: string, playerId: string): Promise<Raum | null> {
  const room = await getRoom(roomId);
  if (!room) return null;

  room.spieler = room.spieler.filter(s => s.id !== playerId);

  if (room.spieler.length === 0) {
    await deleteRoom(roomId);
    return null;
  }

  room.status = 'offen';

  // Neuer Ersteller wenn der alte gegangen ist
  if (room.ersteller === playerId) {
    room.ersteller = room.spieler[0].id;
  }

  await saveRoom(room);
  return room;
}

export async function setPlayerReady(roomId: string, playerId: string, ready: boolean): Promise<Raum | null> {
  const room = await getRoom(roomId);
  if (!room) return null;

  const player = room.spieler.find(s => s.id === playerId);
  if (!player) return null;

  player.ready = ready;
  await saveRoom(room);
  return room;
}

export async function addBotsToRoom(roomId: string): Promise<Raum | null> {
  const room = await getRoom(roomId);
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
  await saveRoom(room);
  return room;
}

export async function startGame(roomId: string): Promise<boolean> {
  const room = await getRoom(roomId);
  if (!room) return false;
  if (room.spieler.length !== 4) return false;

  room.status = 'laeuft';
  await saveRoom(room);
  return true;
}

export async function getRoom(roomId: string): Promise<Raum | undefined> {
  if (isLocal) {
    return localRooms.get(roomId);
  }
  const room = await getRedis().get<Raum>(`${ROOM_PREFIX}${roomId}`);
  return room || undefined;
}

export async function getAllRooms(): Promise<Raum[]> {
  if (isLocal) {
    return Array.from(localRooms.values()).filter(r => r.status !== 'laeuft');
  }

  const roomIds = await getRedis().smembers(ROOMS_LIST_KEY);
  if (!roomIds || roomIds.length === 0) return [];

  const rooms: Raum[] = [];
  for (const id of roomIds) {
    const room = await getRedis().get<Raum>(`${ROOM_PREFIX}${id}`);
    if (room && room.status !== 'laeuft') {
      rooms.push(room);
    }
  }
  return rooms;
}

export async function deleteRoom(roomId: string): Promise<void> {
  if (isLocal) {
    localRooms.delete(roomId);
  } else {
    await getRedis().del(`${ROOM_PREFIX}${roomId}`);
    await getRedis().srem(ROOMS_LIST_KEY, roomId);
  }
}

async function saveRoom(room: Raum): Promise<void> {
  if (isLocal) {
    localRooms.set(room.id, room);
  } else {
    await getRedis().set(`${ROOM_PREFIX}${room.id}`, room, { ex: 3600 }); // 1 Stunde TTL
  }
}
