import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

// lamejs für MP3-Encoding
// @ts-expect-error - lamejs hat keine TypeScript-Definitionen
import lamejs from 'lamejs';

const MANIFEST_PATH = path.join(process.cwd(), 'public', 'audio', 'manifest.json');
const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

interface AudioManifestEntry {
  text: string;
  speech: string;
  m?: string;
  f?: string;
  category: string;
  custom?: boolean;
}

interface AudioManifest {
  [speech: string]: AudioManifestEntry;
}

function hashText(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex').slice(0, 8);
}

async function loadManifest(): Promise<AudioManifest> {
  if (existsSync(MANIFEST_PATH)) {
    const data = await readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(data);
  }
  return {};
}

async function saveManifest(manifest: AudioManifest): Promise<void> {
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

/**
 * WAV zu MP3 konvertieren mit lamejs
 */
function wavToMp3(wavBuffer: ArrayBuffer): Buffer {
  const wavData = new DataView(wavBuffer);

  // WAV Header parsen
  const numChannels = wavData.getUint16(22, true);
  const sampleRate = wavData.getUint32(24, true);
  const bitsPerSample = wavData.getUint16(34, true);

  // Daten extrahieren (nach Header bei Offset 44)
  const dataOffset = 44;
  const dataLength = wavData.getUint32(40, true);
  const samples = dataLength / (bitsPerSample / 8);
  const samplesPerChannel = samples / numChannels;

  // 16-bit Samples extrahieren
  const left = new Int16Array(samplesPerChannel);
  const right = numChannels > 1 ? new Int16Array(samplesPerChannel) : left;

  for (let i = 0; i < samplesPerChannel; i++) {
    const offset = dataOffset + i * numChannels * 2;
    left[i] = wavData.getInt16(offset, true);
    if (numChannels > 1) {
      right[i] = wavData.getInt16(offset + 2, true);
    }
  }

  // MP3 Encoder erstellen
  const mp3Encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128);

  const mp3Data: Uint8Array[] = [];
  const blockSize = 1152;

  for (let i = 0; i < samplesPerChannel; i += blockSize) {
    const leftChunk = left.subarray(i, i + blockSize);
    const rightChunk = numChannels > 1 ? right.subarray(i, i + blockSize) : leftChunk;

    let mp3buf: Uint8Array;
    if (numChannels === 1) {
      mp3buf = mp3Encoder.encodeBuffer(leftChunk);
    } else {
      mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk);
    }

    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  // Finalisieren
  const end = mp3Encoder.flush();
  if (end.length > 0) {
    mp3Data.push(end);
  }

  // Zusammenfügen
  const totalLength = mp3Data.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of mp3Data) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return Buffer.from(result);
}

/**
 * WebM/Opus zu WAV konvertieren (einfache Methode - erfordert AudioContext)
 * Da wir auf dem Server sind, erwarten wir bereits WAV vom Client
 */
function isWavFile(buffer: ArrayBuffer): boolean {
  const view = new DataView(buffer);
  // Check for RIFF header
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  return riff === 'RIFF';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const audioFile = formData.get('audio') as File | null;
    const speech = formData.get('speech') as string | null;
    const gender = formData.get('gender') as 'm' | 'f' | null;

    if (!audioFile || !speech || !gender) {
      return NextResponse.json(
        { error: 'audio, speech und gender sind erforderlich' },
        { status: 400 }
      );
    }

    if (gender !== 'm' && gender !== 'f') {
      return NextResponse.json(
        { error: 'gender muss "m" oder "f" sein' },
        { status: 400 }
      );
    }

    // Audio-Daten lesen
    const arrayBuffer = await audioFile.arrayBuffer();

    // Prüfen ob WAV
    if (!isWavFile(arrayBuffer)) {
      return NextResponse.json(
        { error: 'Audio muss im WAV-Format sein. Bitte im Browser konvertieren.' },
        { status: 400 }
      );
    }

    // Zu MP3 konvertieren
    const mp3Buffer = wavToMp3(arrayBuffer);

    // Dateiname generieren
    const hash = hashText(speech);
    const filename = `${gender}-${hash}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);

    // MP3 speichern
    await writeFile(filepath, mp3Buffer);

    // Manifest aktualisieren
    const manifest = await loadManifest();

    if (!manifest[speech]) {
      // Neuer Eintrag - versuche Kategorie zu ermitteln
      manifest[speech] = {
        text: speech, // Fallback
        speech: speech,
        category: 'custom',
        custom: true,
      };
    }

    // Audio-Referenz setzen
    if (gender === 'm') {
      manifest[speech].m = filename;
    } else {
      manifest[speech].f = filename;
    }

    await saveManifest(manifest);

    return NextResponse.json({
      success: true,
      filename,
      path: `/audio/${filename}`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload fehlgeschlagen' },
      { status: 500 }
    );
  }
}
