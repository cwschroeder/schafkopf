// TTS Client - Spielt statisch gehostete Audio-Dateien ab

// BasePath für Produktion
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface AudioManifestEntry {
  text: string;
  speech: string;
  // 4 Stimmen
  m1?: string;
  m2?: string;
  f1?: string;
  f2?: string;
  // Legacy
  m?: string;
  f?: string;
  category: string;
}

interface AudioManifest {
  [speech: string]: AudioManifestEntry;
}

let manifest: AudioManifest | null = null;
let manifestLoading: Promise<void> | null = null;
let audioQueue: { url: string; resolve: () => void }[] = [];
let isPlaying = false;
let currentAudio: HTMLAudioElement | null = null;

// Manifest laden
async function loadManifest(): Promise<AudioManifest> {
  if (manifest) return manifest;

  if (manifestLoading) {
    await manifestLoading;
    return manifest!;
  }

  manifestLoading = (async () => {
    try {
      const res = await fetch(`${BASE_PATH}/audio/manifest.json`);
      if (res.ok) {
        manifest = await res.json();
      } else {
        console.warn('Audio manifest not found');
        manifest = {};
      }
    } catch (e) {
      console.warn('Failed to load audio manifest:', e);
      manifest = {};
    }
  })();

  await manifestLoading;
  return manifest!;
}

// Audio abspielen (mit Queue für sequenzielles Abspielen)
function playAudioFile(url: string): Promise<void> {
  return new Promise((resolve) => {
    audioQueue.push({ url, resolve });
    processQueue();
  });
}

function processQueue() {
  if (isPlaying || audioQueue.length === 0) return;

  isPlaying = true;
  const { url, resolve } = audioQueue.shift()!;

  const audio = new Audio(url);
  currentAudio = audio;

  audio.onended = () => {
    isPlaying = false;
    currentAudio = null;
    resolve();
    processQueue();
  };

  audio.onerror = () => {
    console.warn('Failed to play audio:', url);
    isPlaying = false;
    currentAudio = null;
    resolve();
    processQueue();
  };

  audio.play().catch(() => {
    isPlaying = false;
    currentAudio = null;
    resolve();
    processQueue();
  });
}

// Aktuelles Audio stoppen
export function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  audioQueue = [];
  isPlaying = false;
}

// Voice-Typen
export type VoiceKey = 'm1' | 'm2' | 'f1' | 'f2' | 'm' | 'f';

// Standard-Stimme (kann vom Spieler gesetzt werden)
let defaultVoice: VoiceKey = 'm1';

export function setDefaultVoice(voice: VoiceKey) {
  defaultVoice = voice;
}

export function getDefaultVoice(): VoiceKey {
  return defaultVoice;
}

/**
 * Audio-Datei für Voice-Key ermitteln (mit Fallback-Kette)
 */
function getAudioFileForVoice(entry: AudioManifestEntry, voice: VoiceKey): string | null {
  // Direkt prüfen
  if (voice === 'm1' && (entry.m1 || entry.m)) return entry.m1 || entry.m || null;
  if (voice === 'm2' && entry.m2) return entry.m2;
  if (voice === 'f1' && (entry.f1 || entry.f)) return entry.f1 || entry.f || null;
  if (voice === 'f2' && entry.f2) return entry.f2;

  // Legacy-Mapping
  if (voice === 'm') return entry.m1 || entry.m || null;
  if (voice === 'f') return entry.f1 || entry.f || null;

  // Fallback-Kette: m1 -> m2 -> f1 -> f2 -> m -> f
  const fallbackOrder: (keyof AudioManifestEntry)[] = ['m1', 'm2', 'f1', 'f2', 'm', 'f'];
  for (const key of fallbackOrder) {
    if (entry[key] && typeof entry[key] === 'string') {
      return entry[key] as string;
    }
  }

  return null;
}

/**
 * Spielt einen bayerischen Spruch ab
 * @param speech Der TTS-Text (z.B. "Wennz!")
 * @param voice Optional: 'm1', 'm2', 'f1', 'f2' oder Legacy 'm', 'f'
 */
export async function playBavarianAudio(
  speech: string,
  voice: VoiceKey = defaultVoice
): Promise<void> {
  try {
    const m = await loadManifest();

    const entry = m[speech];
    if (!entry) {
      console.warn('No audio entry for:', speech);
      return;
    }

    const filename = getAudioFileForVoice(entry, voice);
    if (!filename) {
      console.warn(`No audio for voice "${voice}":`, speech);
      return;
    }

    await playAudioFile(`${BASE_PATH}/audio/${filename}`);
  } catch (e) {
    console.warn('Failed to play bavarian audio:', e);
  }
}

/**
 * Prüft ob Audio für einen Spruch verfügbar ist
 */
export async function hasAudio(speech: string, voice?: VoiceKey): Promise<boolean> {
  const m = await loadManifest();
  const entry = m[speech];
  if (!entry) return false;

  if (voice) {
    return !!getAudioFileForVoice(entry, voice);
  }

  // Irgendeine Stimme vorhanden?
  return !!(entry.m1 || entry.m2 || entry.f1 || entry.f2 || entry.m || entry.f);
}

/**
 * Lädt das Manifest neu (z.B. nach Generierung neuer Audio-Dateien)
 */
export async function reloadManifest(): Promise<void> {
  manifest = null;
  manifestLoading = null;
  await loadManifest();
}

/**
 * Initialisiert Audio für Mobile (muss bei User-Interaktion aufgerufen werden)
 */
export function initAudio(): void {
  // Leises Audio abspielen um iOS Audio-Context zu aktivieren
  const audio = new Audio();
  audio.volume = 0.01;
  audio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAgAAABQAWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFj/////////////////////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//MUwAAL+AJQBQAAACAGIDgIAgCAAAgP//MUwDAQKAZIIRgAAAgCAMQgIAAAA=';
  audio.play().catch(() => {});
}

/**
 * Spielt Base64-kodiertes Audio ab (für Push-to-Talk Voice Messages)
 * Nutzt die gleiche Queue wie andere Audio-Dateien
 */
export function playBase64Audio(base64: string, mimeType: string = 'audio/webm'): Promise<void> {
  const dataUrl = `data:${mimeType};base64,${base64}`;
  return playAudioFile(dataUrl);
}
