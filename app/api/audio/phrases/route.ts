import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Alle Sprüche aus bavarian-speech.ts importieren
import {
  BAVARIAN_ANSAGEN,
  KARTEN_KOMMENTARE,
  UNTER_KOMMENTARE,
  STICH_GEWONNEN,
  STICH_VERLOREN,
  SPIEL_START,
  SPIEL_GEWONNEN,
  SPIEL_VERLOREN,
  DU_GESAGT,
  RE_GESAGT,
  LEGEN_JA,
  LEGEN_NEIN,
  ALLGEMEINE_KOMMENTARE,
  MITSPIELER_AUFFORDERN_STECHEN,
  MITSPIELER_VERPASST_STECHEN,
  MITSPIELER_STICH_SERIE,
  MITSPIELER_STICH_VERSCHENKT,
  MITSPIELER_PARTNER_GEFUNDEN,
  AUS_IS,
  BavarianPhrase,
} from '@/lib/bavarian-speech';

interface AudioManifest {
  [speech: string]: {
    text: string;       // Anzeige-Text
    speech: string;     // TTS-Text (kann editiert werden)
    m?: string;         // männliche Audio-Datei
    f?: string;         // weibliche Audio-Datei
    category: string;   // Kategorie für Gruppierung
  };
}

const MANIFEST_PATH = path.join(process.cwd(), 'public', 'audio', 'manifest.json');

// Hash für Dateinamen
function hashText(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex').slice(0, 8);
}

// Alle Sprüche sammeln mit Kategorien
function collectAllPhrases(): { phrase: BavarianPhrase; category: string }[] {
  const phrases: { phrase: BavarianPhrase; category: string }[] = [];

  // Ansagen
  for (const [key, arr] of Object.entries(BAVARIAN_ANSAGEN)) {
    for (const p of arr) {
      phrases.push({ phrase: p, category: `ansage-${key}` });
    }
  }

  // Karten-Kommentare
  for (const [key, arr] of Object.entries(KARTEN_KOMMENTARE)) {
    for (const p of arr) {
      phrases.push({ phrase: p, category: `karte-${key}` });
    }
  }

  // Andere Kategorien
  const categories: [BavarianPhrase[], string][] = [
    [UNTER_KOMMENTARE, 'unter'],
    [STICH_GEWONNEN, 'stich-gewonnen'],
    [STICH_VERLOREN, 'stich-verloren'],
    [SPIEL_START, 'spiel-start'],
    [SPIEL_GEWONNEN, 'spiel-gewonnen'],
    [SPIEL_VERLOREN, 'spiel-verloren'],
    [DU_GESAGT, 'du-gesagt'],
    [RE_GESAGT, 're-gesagt'],
    [LEGEN_JA, 'legen-ja'],
    [LEGEN_NEIN, 'legen-nein'],
    [ALLGEMEINE_KOMMENTARE, 'allgemein'],
    // Mitspieler-Reaktionen
    [MITSPIELER_AUFFORDERN_STECHEN, 'mitspieler-auffordern'],
    [MITSPIELER_VERPASST_STECHEN, 'mitspieler-verpasst'],
    [MITSPIELER_STICH_SERIE, 'mitspieler-serie'],
    [MITSPIELER_STICH_VERSCHENKT, 'mitspieler-verschenkt'],
    [MITSPIELER_PARTNER_GEFUNDEN, 'mitspieler-partner'],
    [AUS_IS, 'aus-is'],
  ];

  for (const [arr, cat] of categories) {
    for (const p of arr) {
      phrases.push({ phrase: p, category: cat });
    }
  }

  return phrases;
}

// Manifest laden oder erstellen
async function loadManifest(): Promise<AudioManifest> {
  if (existsSync(MANIFEST_PATH)) {
    const data = await readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(data);
  }
  return {};
}

// Manifest speichern
async function saveManifest(manifest: AudioManifest): Promise<void> {
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

// GET: Alle Sprüche mit Audio-Status
export async function GET() {
  try {
    const allPhrases = collectAllPhrases();
    const manifest = await loadManifest();

    // Deduplizieren nach speech-Text
    const seen = new Set<string>();
    const uniquePhrases: typeof allPhrases = [];

    for (const p of allPhrases) {
      if (!seen.has(p.phrase.speech)) {
        seen.add(p.phrase.speech);
        uniquePhrases.push(p);
      }
    }

    // Mit Manifest-Daten anreichern
    const result = uniquePhrases.map(({ phrase, category }) => {
      const manifestEntry = manifest[phrase.speech];
      const hash = hashText(manifestEntry?.speech || phrase.speech);

      return {
        text: phrase.text,
        speech: manifestEntry?.speech || phrase.speech,
        originalSpeech: phrase.speech,
        category,
        audioM: manifestEntry?.m || null,
        audioF: manifestEntry?.f || null,
        expectedM: `m-${hash}.mp3`,
        expectedF: `f-${hash}.mp3`,
        hasAudioM: manifestEntry?.m ? existsSync(path.join(process.cwd(), 'public', 'audio', manifestEntry.m)) : false,
        hasAudioF: manifestEntry?.f ? existsSync(path.join(process.cwd(), 'public', 'audio', manifestEntry.f)) : false,
      };
    });

    // Gruppieren nach Kategorie
    const grouped: Record<string, typeof result> = {};
    for (const r of result) {
      if (!grouped[r.category]) {
        grouped[r.category] = [];
      }
      grouped[r.category].push(r);
    }

    return NextResponse.json({
      total: result.length,
      withAudio: result.filter(r => r.hasAudioM || r.hasAudioF).length,
      phrases: result,
      grouped,
    });
  } catch (error) {
    console.error('Failed to get phrases:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fehler beim Laden der Sprüche' },
      { status: 500 }
    );
  }
}

// POST: Manifest aktualisieren (nach Audio-Generierung)
export async function POST(request: NextRequest) {
  try {
    const { originalSpeech, speech, audioM, audioF } = await request.json();

    if (!originalSpeech) {
      return NextResponse.json({ error: 'originalSpeech ist erforderlich' }, { status: 400 });
    }

    const manifest = await loadManifest();

    // Finde den ursprünglichen Text-Eintrag
    const allPhrases = collectAllPhrases();
    const original = allPhrases.find(p => p.phrase.speech === originalSpeech);

    if (!original) {
      return NextResponse.json({ error: 'Spruch nicht gefunden' }, { status: 404 });
    }

    // Aktualisiere oder erstelle Manifest-Eintrag
    const existing = manifest[originalSpeech] || {};
    manifest[originalSpeech] = {
      text: original.phrase.text,
      speech: speech || existing.speech || originalSpeech,
      category: original.category,
      m: audioM || existing.m,
      f: audioF || existing.f,
    };

    await saveManifest(manifest);

    return NextResponse.json({ success: true, entry: manifest[originalSpeech] });
  } catch (error) {
    console.error('Failed to update manifest:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fehler beim Speichern' },
      { status: 500 }
    );
  }
}
