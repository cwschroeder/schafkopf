// Raum-Verwaltung mit PostgreSQL für Produktion

import { getDb, rooms } from './db';
import { eq, ne, and, gt, sql } from 'drizzle-orm';
import { Raum } from './schafkopf/types';

// Fallback für lokale Entwicklung ohne Datenbank
const localRooms = new Map<string, Raum>();
const isLocal = !process.env.DATABASE_URL;

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
    const db = getDb();
    await db.insert(rooms).values({
      id: room.id,
      name: room.name,
      erstellerId: room.ersteller,
      spieler: room.spieler,
      status: room.status,
      erstelltAm: new Date(room.erstelltAm),
    });
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

  // Männliche und weibliche Bots
  const maleBots = ['Bot Max', 'Bot Sepp', 'Bot Hans'];
  const femaleBots = ['Bot Vroni', 'Bot Annemarie'];

  // Anzahl benötigter Bots
  const botsNeeded = 4 - room.spieler.length;

  // Namen der bereits im Raum befindlichen Spieler (um Duplikate zu vermeiden)
  const existingNames = new Set(room.spieler.map(s => s.name));

  // Verfügbare Bots filtern
  const availableMale = maleBots.filter(b => !existingNames.has(b));
  const availableFemale = femaleBots.filter(b => !existingNames.has(b));

  // Mischen
  const shuffledMale = availableMale.sort(() => Math.random() - 0.5);
  const shuffledFemale = availableFemale.sort(() => Math.random() - 0.5);

  // Bot-Auswahl: Bei 3 Bots -> 2 Frauen, 1 Mann
  // Bei 2 Bots -> 1 Frau, 1 Mann
  // Bei 1 Bot -> zufällig
  let selectedBots: string[] = [];

  if (botsNeeded === 3) {
    // 2 Frauen + 1 Mann
    selectedBots = [
      ...shuffledFemale.slice(0, 2),
      ...shuffledMale.slice(0, 1)
    ];
  } else if (botsNeeded === 2) {
    // 1 Frau + 1 Mann
    selectedBots = [
      ...shuffledFemale.slice(0, 1),
      ...shuffledMale.slice(0, 1)
    ];
  } else if (botsNeeded === 1) {
    // Zufällig
    const allAvailable = [...shuffledMale, ...shuffledFemale];
    selectedBots = allAvailable.slice(0, 1);
  }

  // Shuffle selected bots for random seating order
  selectedBots = selectedBots.sort(() => Math.random() - 0.5);

  // Bots zum Raum hinzufügen
  let botIndex = 0;
  for (const botName of selectedBots) {
    const botId = `bot_${roomId}_${botIndex}`;
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

  const db = getDb();
  const [row] = await db.select().from(rooms).where(eq(rooms.id, roomId));

  if (!row) return undefined;

  return {
    id: row.id,
    name: row.name,
    spieler: row.spieler,
    maxSpieler: 4,
    status: row.status as 'offen' | 'voll' | 'laeuft',
    ersteller: row.erstellerId,
    erstelltAm: row.erstelltAm.getTime(),
  };
}

export async function getAllRooms(): Promise<Raum[]> {
  const MAX_AGE_MS = 60 * 60 * 1000; // 1 Stunde
  const cutoffTime = new Date(Date.now() - MAX_AGE_MS);

  if (isLocal) {
    const now = Date.now();
    return Array.from(localRooms.values()).filter(r =>
      r.status !== 'laeuft' && (now - (r.erstelltAm || 0)) < MAX_AGE_MS
    );
  }

  const db = getDb();

  // Nur nicht-laufende und nicht zu alte Räume anzeigen
  const rows = await db
    .select()
    .from(rooms)
    .where(and(
      ne(rooms.status, 'laeuft'),
      gt(rooms.erstelltAm, cutoffTime)
    ));

  // Alte Räume aufräumen (async, nicht blockierend)
  cleanupOldRooms(cutoffTime).catch(err => {
    console.error('[Rooms] Cleanup error:', err);
  });

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    spieler: row.spieler,
    maxSpieler: 4 as const,
    status: row.status as 'offen' | 'voll' | 'laeuft',
    ersteller: row.erstellerId,
    erstelltAm: row.erstelltAm.getTime(),
  }));
}

async function cleanupOldRooms(cutoffTime: Date): Promise<void> {
  if (isLocal) return;

  const db = getDb();
  await db.delete(rooms).where(
    sql`${rooms.erstelltAm} < ${cutoffTime}`
  );
}

export async function deleteRoom(roomId: string): Promise<void> {
  if (isLocal) {
    localRooms.delete(roomId);
  } else {
    const db = getDb();
    await db.delete(rooms).where(eq(rooms.id, roomId));
  }
}

async function saveRoom(room: Raum): Promise<void> {
  if (isLocal) {
    localRooms.set(room.id, room);
  } else {
    const db = getDb();
    await db
      .update(rooms)
      .set({
        name: room.name,
        erstellerId: room.ersteller,
        spieler: room.spieler,
        status: room.status,
      })
      .where(eq(rooms.id, room.id));
  }
}
