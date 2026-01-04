// Raum-Verwaltung mit Redis für Produktion

import { createClient, RedisClientType } from 'redis';
import { Raum } from './schafkopf/types';

const ROOM_PREFIX = 'room:';
const ROOMS_LIST_KEY = 'rooms:list';

// Fallback für lokale Entwicklung ohne Redis
const localRooms = new Map<string, Raum>();
const isLocal = !process.env.REDIS_URL;

// Redis-Client (Lazy Init mit Connection Pooling)
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
    const r = await getRedis();
    await r.set(`${ROOM_PREFIX}${room.id}`, JSON.stringify(room), { EX: 3600 });
    await r.sAdd(ROOMS_LIST_KEY, room.id);
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

  // Männliche und weibliche Bots getrennt für zufällige Auswahl
  const maleBots = ['Bot Max', 'Bot Sepp', 'Bot Hans'];
  const femaleBots = ['Bot Vroni', 'Bot Annemarie'];

  // Alle Bots mischen für zufällige Auswahl
  const allBots = [...maleBots, ...femaleBots];
  const shuffledBots = allBots.sort(() => Math.random() - 0.5);

  // Namen der bereits im Raum befindlichen Spieler (um Duplikate zu vermeiden)
  const existingNames = new Set(room.spieler.map(s => s.name));

  let botIndex = 0;
  let shuffleIndex = 0;

  while (room.spieler.length < 4) {
    // Finde einen Bot-Namen der noch nicht verwendet wird
    let botName = shuffledBots[shuffleIndex % shuffledBots.length];
    while (existingNames.has(botName)) {
      shuffleIndex++;
      botName = shuffledBots[shuffleIndex % shuffledBots.length];
      // Sicherheit: Verhindere Endlosschleife
      if (shuffleIndex > shuffledBots.length * 2) break;
    }

    const botId = `bot_${roomId}_${botIndex}`;
    room.spieler.push({ id: botId, name: botName, isBot: true, ready: true });
    existingNames.add(botName);
    botIndex++;
    shuffleIndex++;
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
  const r = await getRedis();
  const data = await r.get(`${ROOM_PREFIX}${roomId}`);
  return data ? JSON.parse(data) : undefined;
}

export async function getAllRooms(): Promise<Raum[]> {
  const MAX_AGE_MS = 60 * 60 * 1000; // 1 Stunde
  const now = Date.now();

  if (isLocal) {
    return Array.from(localRooms.values()).filter(r =>
      r.status !== 'laeuft' && (now - (r.erstelltAm || 0)) < MAX_AGE_MS
    );
  }

  const r = await getRedis();
  const roomIds = await r.sMembers(ROOMS_LIST_KEY);
  if (!roomIds || roomIds.length === 0) return [];

  const rooms: Raum[] = [];
  const expiredIds: string[] = [];

  for (const id of roomIds) {
    const data = await r.get(`${ROOM_PREFIX}${id}`);
    if (data) {
      const room = JSON.parse(data) as Raum;
      const age = now - (room.erstelltAm || 0);
      // Nur nicht-laufende und nicht zu alte Räume anzeigen
      if (room.status !== 'laeuft' && age < MAX_AGE_MS) {
        rooms.push(room);
      } else if (age >= MAX_AGE_MS) {
        expiredIds.push(id);
      }
    } else {
      // Raum existiert nicht mehr in Redis, aus Liste entfernen
      expiredIds.push(id);
    }
  }

  // Alte/gelöschte Räume aus der Liste entfernen
  if (expiredIds.length > 0) {
    await r.sRem(ROOMS_LIST_KEY, expiredIds);
  }

  return rooms;
}

export async function deleteRoom(roomId: string): Promise<void> {
  if (isLocal) {
    localRooms.delete(roomId);
  } else {
    const r = await getRedis();
    await r.del(`${ROOM_PREFIX}${roomId}`);
    await r.sRem(ROOMS_LIST_KEY, roomId);
  }
}

async function saveRoom(room: Raum): Promise<void> {
  if (isLocal) {
    localRooms.set(room.id, room);
  } else {
    const r = await getRedis();
    await r.set(`${ROOM_PREFIX}${room.id}`, JSON.stringify(room), { EX: 3600 });
  }
}
