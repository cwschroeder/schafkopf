/**
 * Audio-Effekte für Stimmverfremdung
 * Verwendet Web Audio API für Browser-basierte Effekte
 */

export interface VoicePreset {
  name: string;
  label: string;
  pitchShift: number;      // Halbtöne (-12 bis +12)
  reverbAmount: number;    // 0-1
  warmth: number;          // -10 bis +10 dB (lowshelf)
  compression: boolean;
}

export const VOICE_PRESETS: VoicePreset[] = [
  {
    name: 'original',
    label: 'Original',
    pitchShift: 0,
    reverbAmount: 0,
    warmth: 0,
    compression: false,
  },
  {
    name: 'maennlich',
    label: 'Männlich (tiefer)',
    pitchShift: -4,
    reverbAmount: 0.1,
    warmth: 3,
    compression: true,
  },
  {
    name: 'weiblich',
    label: 'Weiblich (höher)',
    pitchShift: 4,
    reverbAmount: 0.1,
    warmth: -2,
    compression: true,
  },
  {
    name: 'alter-bauer',
    label: 'Alter Bauer',
    pitchShift: -3,
    reverbAmount: 0.15,
    warmth: 5,
    compression: true,
  },
  {
    name: 'wirtin',
    label: 'Wirtin',
    pitchShift: 2,
    reverbAmount: 0.2,
    warmth: 2,
    compression: true,
  },
  {
    name: 'stammtisch',
    label: 'Stammtisch (Hall)',
    pitchShift: 0,
    reverbAmount: 0.4,
    warmth: 2,
    compression: true,
  },
];

/**
 * Einfache Impulsantwort für Hall-Effekt generieren
 */
function createReverbImpulse(
  audioContext: AudioContext | OfflineAudioContext,
  duration: number = 2,
  decay: number = 2
): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const impulse = audioContext.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      channelData[i] =
        (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }

  return impulse;
}

/**
 * Audio-Effekt-Kette erstellen
 */
export function createEffectChain(
  audioContext: AudioContext | OfflineAudioContext,
  preset: VoicePreset
): {
  input: AudioNode;
  output: AudioNode;
  setPlaybackRate?: (rate: number) => void;
} {
  // Für Pitch-Shifting verwenden wir playbackRate (einfach aber effektiv)
  // Komplexere Lösung wäre mit Tone.js oder SoundTouch.js

  const nodes: AudioNode[] = [];

  // Compressor für gleichmäßige Lautstärke
  if (preset.compression) {
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    nodes.push(compressor);
  }

  // Warmth (Low-Shelf EQ)
  if (preset.warmth !== 0) {
    const lowShelf = audioContext.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 300;
    lowShelf.gain.value = preset.warmth;
    nodes.push(lowShelf);
  }

  // Hall (Convolver)
  if (preset.reverbAmount > 0) {
    const convolver = audioContext.createConvolver();
    convolver.buffer = createReverbImpulse(
      audioContext,
      1.5,
      2 + preset.reverbAmount * 2
    );

    // Dry/Wet Mix
    const dryGain = audioContext.createGain();
    const wetGain = audioContext.createGain();
    dryGain.gain.value = 1 - preset.reverbAmount;
    wetGain.gain.value = preset.reverbAmount;

    // Mixer Node
    const mixer = audioContext.createGain();

    // Vorheriger Node oder Input
    const prevNode = nodes.length > 0 ? nodes[nodes.length - 1] : null;

    if (prevNode) {
      prevNode.connect(dryGain);
      prevNode.connect(convolver);
    }

    convolver.connect(wetGain);
    dryGain.connect(mixer);
    wetGain.connect(mixer);

    // Spezialfall: Reverb braucht parallele Verarbeitung
    return {
      input: nodes.length > 0 ? nodes[0] : dryGain,
      output: mixer,
    };
  }

  // Nodes verketten
  for (let i = 1; i < nodes.length; i++) {
    nodes[i - 1].connect(nodes[i]);
  }

  if (nodes.length === 0) {
    // Kein Effekt - direkter Durchgang
    const passthrough = audioContext.createGain();
    return { input: passthrough, output: passthrough };
  }

  return {
    input: nodes[0],
    output: nodes[nodes.length - 1],
  };
}

/**
 * AudioBuffer mit Effekten verarbeiten (offline)
 */
export async function processAudioWithEffects(
  audioBuffer: AudioBuffer,
  preset: VoicePreset
): Promise<AudioBuffer> {
  // Pitch-Shift durch Resampling
  const pitchFactor = Math.pow(2, preset.pitchShift / 12);
  const newLength = Math.round(audioBuffer.length / pitchFactor);

  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    newLength,
    audioBuffer.sampleRate
  );

  // Source mit Playback-Rate für Pitch
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.playbackRate.value = pitchFactor;

  // Effekt-Kette
  const { input, output } = createEffectChain(offlineContext, preset);

  source.connect(input);
  output.connect(offlineContext.destination);

  source.start(0);

  return offlineContext.startRendering();
}

/**
 * AudioBuffer zu WAV Blob konvertieren
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // WAV Header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferLength - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Audio-Daten
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Berechnet Playback-Rate für Pitch-Shift
 * Kann mit einem AudioBufferSourceNode verwendet werden
 */
export function getPlaybackRateForPitch(semitones: number): number {
  return Math.pow(2, semitones / 12);
}
