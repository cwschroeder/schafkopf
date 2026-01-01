// API Route für Push-to-Talk Voice Messages

import { NextRequest, NextResponse } from 'next/server';
import { getPusherServer, EVENTS, roomChannel } from '@/lib/pusher';

// Max Audio-Größe: 150KB (ca. 5-7 Sekunden bei 64kbps)
const MAX_AUDIO_SIZE = 150 * 1024;

// Rate Limiting: Min. 1 Sekunde zwischen Nachrichten pro Spieler
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, playerId, playerName, audioBase64, mimeType } = body;

    // Validierung
    if (!roomId || !playerId || !playerName || !audioBase64) {
      return NextResponse.json(
        { error: 'Fehlende Parameter' },
        { status: 400 }
      );
    }

    // Größe prüfen (Base64 ist ~33% größer als binär)
    const audioSize = Math.ceil(audioBase64.length * 0.75);
    if (audioSize > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { error: 'Audio zu groß (max 5 Sekunden)' },
        { status: 413 }
      );
    }

    // Rate Limiting
    const rateLimitKey = `${roomId}:${playerId}`;
    const lastMessage = rateLimitMap.get(rateLimitKey) || 0;
    const now = Date.now();

    if (now - lastMessage < RATE_LIMIT_MS) {
      return NextResponse.json(
        { error: 'Zu viele Nachrichten, bitte warten' },
        { status: 429 }
      );
    }
    rateLimitMap.set(rateLimitKey, now);

    // Alte Rate-Limit-Einträge aufräumen (alle 100 Requests)
    if (Math.random() < 0.01) {
      const expireTime = now - 60000; // 1 Minute
      for (const [key, timestamp] of rateLimitMap.entries()) {
        if (timestamp < expireTime) {
          rateLimitMap.delete(key);
        }
      }
    }

    // Broadcast an alle Spieler im Raum
    const pusher = getPusherServer();
    await pusher.trigger(roomChannel(roomId), EVENTS.VOICE_MESSAGE, {
      playerId,
      playerName,
      audioBase64,
      mimeType: mimeType || 'audio/webm',
      timestamp: now,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Voice POST error:', error);
    return NextResponse.json(
      { error: 'Server-Fehler' },
      { status: 500 }
    );
  }
}
