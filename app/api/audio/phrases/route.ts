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

interface AudioManifestEntry {
  text: string;       // Anzeige-Text
  speech: string;     // TTS-Text (kann editiert werden)
  // 4 Stimmen für unterschiedliche Bots
  m1?: string;        // männlich 1 (echo)
  m2?: string;        // männlich 2 (onyx)
  f1?: string;        // weiblich 1 (nova)
  f2?: string;        // weiblich 2 (shimmer)
  // Legacy (Abwärtskompatibilität)
  m?: string;         // alt: männliche Audio-Datei -> wird auf m1 gemappt
  f?: string;         // alt: weibliche Audio-Datei -> wird auf f1 gemappt
  category: string;   // Kategorie für Gruppierung
  custom?: boolean;   // Benutzerdefinierter Spruch
}

interface AudioManifest {
  [speech: string]: AudioManifestEntry;
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

// Custom Sprüche aus Manifest laden
async function getCustomPhrases(manifest: AudioManifest): Promise<{ phrase: BavarianPhrase; category: string }[]> {
  const customs: { phrase: BavarianPhrase; category: string }[] = [];

  for (const [key, entry] of Object.entries(manifest)) {
    if (entry.custom) {
      customs.push({
        phrase: { text: entry.text, speech: entry.speech },
        category: entry.category,
      });
    }
  }

  return customs;
}

// GET: Alle Sprüche mit Audio-Status
export async function GET() {
  try {
    const manifest = await loadManifest();
    const builtInPhrases = collectAllPhrases();
    const customPhrases = await getCustomPhrases(manifest);
    const allPhrases = [...builtInPhrases, ...customPhrases];

    // Deduplizieren nach speech-Text
    const seen = new Set<string>();
    const uniquePhrases: typeof allPhrases = [];

    for (const p of allPhrases) {
      if (!seen.has(p.phrase.speech)) {
        seen.add(p.phrase.speech);
        uniquePhrases.push(p);
      }
    }

    // Helper: Audio-Datei für Voice-Key ermitteln (mit Legacy-Fallback)
    const getAudioFile = (entry: AudioManifestEntry | undefined, voiceKey: 'm1' | 'm2' | 'f1' | 'f2'): string | null => {
      if (!entry) return null;
      // Direkt prüfen
      if (entry[voiceKey]) return entry[voiceKey]!;
      // Legacy-Fallback: m -> m1, f -> f1
      if (voiceKey === 'm1' && entry.m) return entry.m;
      if (voiceKey === 'f1' && entry.f) return entry.f;
      return null;
    };

    // Mit Manifest-Daten anreichern
    const result = uniquePhrases.map(({ phrase, category }) => {
      const manifestEntry = manifest[phrase.speech];
      const hash = hashText(manifestEntry?.speech || phrase.speech);

      const audioM1 = getAudioFile(manifestEntry, 'm1');
      const audioM2 = getAudioFile(manifestEntry, 'm2');
      const audioF1 = getAudioFile(manifestEntry, 'f1');
      const audioF2 = getAudioFile(manifestEntry, 'f2');

      return {
        text: phrase.text,
        speech: manifestEntry?.speech || phrase.speech,
        originalSpeech: phrase.speech,
        category,
        // 4 Stimmen
        audioM1,
        audioM2,
        audioF1,
        audioF2,
        hasAudioM1: audioM1 ? existsSync(path.join(process.cwd(), 'public', 'audio', audioM1)) : false,
        hasAudioM2: audioM2 ? existsSync(path.join(process.cwd(), 'public', 'audio', audioM2)) : false,
        hasAudioF1: audioF1 ? existsSync(path.join(process.cwd(), 'public', 'audio', audioF1)) : false,
        hasAudioF2: audioF2 ? existsSync(path.join(process.cwd(), 'public', 'audio', audioF2)) : false,
        // Legacy (Abwärtskompatibilität)
        audioM: audioM1,
        audioF: audioF1,
        hasAudioM: audioM1 ? existsSync(path.join(process.cwd(), 'public', 'audio', audioM1)) : false,
        hasAudioF: audioF1 ? existsSync(path.join(process.cwd(), 'public', 'audio', audioF1)) : false,
        custom: manifestEntry?.custom || false,
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

// Voice-Key zu Manifest-Key Mapping
type VoiceKey = 'm1' | 'm2' | 'f1' | 'f2';

// POST: Manifest aktualisieren (nach Audio-Generierung)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalSpeech, speech, voiceKey, audioFile } = body;
    // Legacy-Support
    const { audioM, audioF } = body;

    if (!originalSpeech) {
      return NextResponse.json({ error: 'originalSpeech ist erforderlich' }, { status: 400 });
    }

    const manifest = await loadManifest();

    // Finde den ursprünglichen Text-Eintrag (built-in oder custom)
    const builtInPhrases = collectAllPhrases();
    const customPhrases = await getCustomPhrases(manifest);
    const allPhrases = [...builtInPhrases, ...customPhrases];
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
      // 4 Stimmen
      m1: existing.m1,
      m2: existing.m2,
      f1: existing.f1,
      f2: existing.f2,
      // Legacy
      m: existing.m,
      f: existing.f,
      custom: existing.custom,
    };

    // Neue Stimme setzen (voiceKey = m1, m2, f1, f2)
    if (voiceKey && audioFile) {
      const validKeys: VoiceKey[] = ['m1', 'm2', 'f1', 'f2'];
      if (validKeys.includes(voiceKey as VoiceKey)) {
        const key = voiceKey as VoiceKey;
        manifest[originalSpeech][key] = audioFile;
      }
    }

    // Legacy-Support
    if (audioM) manifest[originalSpeech].m1 = audioM;
    if (audioF) manifest[originalSpeech].f1 = audioF;

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

// PATCH: TTS-Text speichern (ohne Audio-Generierung)
export async function PATCH(request: NextRequest) {
  try {
    const { originalSpeech, speech } = await request.json();

    if (!originalSpeech || !speech) {
      return NextResponse.json(
        { error: 'originalSpeech und speech sind erforderlich' },
        { status: 400 }
      );
    }

    const manifest = await loadManifest();

    // Finde den ursprünglichen Text-Eintrag
    const builtInPhrases = collectAllPhrases();
    const customPhrases = await getCustomPhrases(manifest);
    const allPhrases = [...builtInPhrases, ...customPhrases];
    const original = allPhrases.find(p => p.phrase.speech === originalSpeech);

    if (!original) {
      return NextResponse.json({ error: 'Spruch nicht gefunden' }, { status: 404 });
    }

    // Aktualisiere oder erstelle Manifest-Eintrag
    const existing = manifest[originalSpeech] || {};
    manifest[originalSpeech] = {
      text: original.phrase.text,
      speech: speech,
      category: original.category,
      m1: existing.m1,
      m2: existing.m2,
      f1: existing.f1,
      f2: existing.f2,
      m: existing.m,
      f: existing.f,
      custom: existing.custom,
    };

    await saveManifest(manifest);

    return NextResponse.json({ success: true, speech, entry: manifest[originalSpeech] });
  } catch (error) {
    console.error('Failed to save TTS text:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fehler beim Speichern' },
      { status: 500 }
    );
  }
}

// PUT: Neuen benutzerdefinierten Spruch hinzufügen
export async function PUT(request: NextRequest) {
  try {
    const { text, speech, category } = await request.json();

    if (!text || !speech || !category) {
      return NextResponse.json(
        { error: 'text, speech und category sind erforderlich' },
        { status: 400 }
      );
    }

    const manifest = await loadManifest();

    // Prüfen ob Spruch bereits existiert
    if (manifest[speech]) {
      return NextResponse.json(
        { error: 'Ein Spruch mit diesem TTS-Text existiert bereits' },
        { status: 409 }
      );
    }

    // Auch in built-in Sprüchen prüfen
    const builtIn = collectAllPhrases();
    if (builtIn.some(p => p.phrase.speech === speech)) {
      return NextResponse.json(
        { error: 'Ein Spruch mit diesem TTS-Text existiert bereits (built-in)' },
        { status: 409 }
      );
    }

    // Neuen Spruch hinzufügen
    manifest[speech] = {
      text,
      speech,
      category,
      custom: true,
    };

    await saveManifest(manifest);

    return NextResponse.json({ success: true, entry: manifest[speech] });
  } catch (error) {
    console.error('Failed to add phrase:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fehler beim Hinzufügen' },
      { status: 500 }
    );
  }
}

// DELETE: Benutzerdefinierten Spruch löschen
export async function DELETE(request: NextRequest) {
  try {
    const { speech } = await request.json();

    if (!speech) {
      return NextResponse.json({ error: 'speech ist erforderlich' }, { status: 400 });
    }

    const manifest = await loadManifest();

    if (!manifest[speech]) {
      return NextResponse.json({ error: 'Spruch nicht gefunden' }, { status: 404 });
    }

    if (!manifest[speech].custom) {
      return NextResponse.json(
        { error: 'Nur benutzerdefinierte Sprüche können gelöscht werden' },
        { status: 403 }
      );
    }

    delete manifest[speech];
    await saveManifest(manifest);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete phrase:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fehler beim Löschen' },
      { status: 500 }
    );
  }
}
