import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Hash für Dateinamen generieren
function hashText(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex').slice(0, 8);
}

// Voice-Key Mapping: voiceKey -> OpenAI voice
const VOICE_MAPPING: Record<string, string> = {
  m1: 'echo',    // männlich 1 (tief, ruhig)
  m2: 'onyx',    // männlich 2 (kräftig)
  f1: 'nova',    // weiblich 1 (warm)
  f2: 'shimmer', // weiblich 2 (hell)
  // Legacy
  echo: 'echo',
  onyx: 'onyx',
  nova: 'nova',
  shimmer: 'shimmer',
  alloy: 'alloy',
  fable: 'fable',
};

// VoiceKey -> Dateiprefix Mapping
const VOICE_PREFIX: Record<string, string> = {
  m1: 'm1',
  m2: 'm2',
  f1: 'f1',
  f2: 'f2',
  // Legacy
  echo: 'm',
  onyx: 'm',
  fable: 'm',
  nova: 'f',
  shimmer: 'f',
  alloy: 'f',
};

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'm1', voiceKey } = await request.json();
    // voiceKey hat Priorität, ansonsten voice als Fallback
    const effectiveVoiceKey = voiceKey || voice;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text ist erforderlich' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY nicht konfiguriert' }, { status: 500 });
    }

    // Validiere voice/voiceKey
    const openaiVoice = VOICE_MAPPING[effectiveVoiceKey];
    if (!openaiVoice) {
      return NextResponse.json({
        error: `Ungültige Stimme "${effectiveVoiceKey}". Erlaubt: m1, m2, f1, f2`
      }, { status: 400 });
    }

    // Generiere Audio mit OpenAI TTS
    // Deutscher Sprachhinweis für korrekte Aussprache des bayerischen Dialekts
    const germanizedText = `[Bayerisch] ${text}`;

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: openaiVoice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: germanizedText,
      response_format: 'mp3',
    });

    // Audio als Buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Dateiname: {voice-prefix}-{hash}.mp3
    const voicePrefix = VOICE_PREFIX[effectiveVoiceKey] || 'm1';
    const hash = hashText(text);
    const filename = `${voicePrefix}-${hash}.mp3`;

    // Speichern in public/audio/
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    if (!existsSync(audioDir)) {
      await mkdir(audioDir, { recursive: true });
    }

    const filepath = path.join(audioDir, filename);
    await writeFile(filepath, buffer);

    // Base64 für Vorschau zurückgeben
    const base64 = buffer.toString('base64');

    return NextResponse.json({
      success: true,
      filename,
      text,
      voice: effectiveVoiceKey,
      voiceKey: effectiveVoiceKey,
      openaiVoice,
      voicePrefix,
      audio: `data:audio/mp3;base64,${base64}`,
      size: buffer.length,
    });
  } catch (error) {
    console.error('TTS Generation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TTS-Generierung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
