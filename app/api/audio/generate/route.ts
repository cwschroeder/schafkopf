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

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'echo' } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text ist erforderlich' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY nicht konfiguriert' }, { status: 500 });
    }

    // Validiere voice
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    if (!validVoices.includes(voice)) {
      return NextResponse.json({ error: `Ungültige Stimme. Erlaubt: ${validVoices.join(', ')}` }, { status: 400 });
    }

    // Generiere Audio mit OpenAI TTS
    // Deutscher Sprachhinweis für korrekte Aussprache des bayerischen Dialekts
    const germanizedText = `[Bayerisch] ${text}`;

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: germanizedText,
      response_format: 'mp3',
    });

    // Audio als Buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Dateiname: {voice-prefix}-{hash}.mp3
    const voicePrefix = voice === 'echo' || voice === 'onyx' || voice === 'fable' ? 'm' : 'f';
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
      voice,
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
