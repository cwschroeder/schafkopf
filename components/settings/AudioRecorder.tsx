'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  VOICE_PRESETS,
  VoicePreset,
  processAudioWithEffects,
  audioBufferToWav,
  getPlaybackRateForPitch,
} from '@/lib/audio-effects';

interface AudioRecorderProps {
  phrase: {
    text: string;
    speech: string;
    originalSpeech: string;
  };
  onClose: () => void;
  onSaved: () => void;
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function AudioRecorder({ phrase, onClose, onSaved }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<VoicePreset>(VOICE_PRESETS[0]);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gender, setGender] = useState<'m' | 'f'>('m');
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (processedUrl) URL.revokeObjectURL(processedUrl);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioUrl, processedUrl]);

  // Wellenform zeichnen
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyzer = analyzerRef.current;
    if (!canvas || !analyzer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyzer.getByteTimeDomainData(dataArray);

    ctx.fillStyle = 'rgb(20, 40, 30)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(245, 158, 11)';
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    if (isRecording) {
      animationRef.current = requestAnimationFrame(drawWaveform);
    }
  }, [isRecording]);

  // Aufnahme starten
  const startRecording = async () => {
    setError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setProcessedBlob(null);
    setProcessedUrl(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Audio-Kontext für Visualisierung
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      source.connect(analyzer);
      analyzerRef.current = analyzer;

      // MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stream stoppen
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Wellenform-Animation starten
      drawWaveform();
    } catch (err) {
      console.error('Microphone error:', err);
      if ((err as Error).name === 'NotAllowedError') {
        setPermissionDenied(true);
        setError('Mikrofonzugriff verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.');
      } else {
        setError('Fehler beim Zugriff auf das Mikrofon.');
      }
    }
  };

  // Aufnahme stoppen
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  };

  // Effekt anwenden
  const applyEffect = async () => {
    if (!audioBlob) return;

    setProcessing(true);
    setError(null);

    try {
      // WebM zu AudioBuffer konvertieren
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Effekt anwenden
      const processedBuffer = await processAudioWithEffects(audioBuffer, selectedPreset);

      // Zu WAV konvertieren
      const wavBlob = audioBufferToWav(processedBuffer);
      setProcessedBlob(wavBlob);

      if (processedUrl) URL.revokeObjectURL(processedUrl);
      const url = URL.createObjectURL(wavBlob);
      setProcessedUrl(url);

      await audioContext.close();
    } catch (err) {
      console.error('Effect error:', err);
      setError('Fehler beim Anwenden des Effekts.');
    } finally {
      setProcessing(false);
    }
  };

  // Effekt bei Preset-Änderung automatisch anwenden
  useEffect(() => {
    if (audioBlob) {
      applyEffect();
    }
  }, [selectedPreset, audioBlob]);

  // Upload
  const handleUpload = async () => {
    const blobToUpload = processedBlob || audioBlob;
    if (!blobToUpload) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', blobToUpload);
      formData.append('speech', phrase.originalSpeech);
      formData.append('gender', gender);

      const res = await fetch(`${BASE_PATH}/api/audio/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload fehlgeschlagen');
      }

      onSaved();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  // Audio abspielen mit Pitch-Preview (ohne Server-Verarbeitung)
  const playPreview = () => {
    const url = processedUrl || audioUrl;
    if (url) {
      const audio = new Audio(url);
      if (!processedUrl && selectedPreset.pitchShift !== 0) {
        // Einfache Pitch-Vorschau über Playback-Rate
        audio.playbackRate = getPlaybackRateForPitch(selectedPreset.pitchShift);
      }
      audio.play();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-green-800 to-green-900 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-green-600">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-amber-400">Eigene Aufnahme</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Spruch-Anzeige */}
        <div className="bg-green-950/50 rounded-lg p-3 mb-4">
          <p className="text-amber-200 font-medium">{phrase.text}</p>
          <p className="text-green-300 text-sm mt-1">{phrase.speech}</p>
        </div>

        {/* Wellenform */}
        <div className="mb-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={80}
            className="w-full rounded-lg bg-green-950"
          />
        </div>

        {/* Fehler */}
        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 mb-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Aufnahme-Buttons */}
        {!audioBlob ? (
          <div className="flex justify-center mb-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={permissionDenied}
                className="w-16 h-16 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 rounded-full flex items-center justify-center text-2xl transition-colors"
                title="Aufnahme starten"
              >
                <span className="w-6 h-6 bg-white rounded-full" />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-2xl animate-pulse transition-colors"
                title="Aufnahme stoppen"
              >
                <span className="w-6 h-6 bg-white rounded" />
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Playback & Neu aufnehmen */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={playPreview}
                disabled={processing}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 px-4 py-2 rounded font-semibold transition-colors"
              >
                {processing ? 'Verarbeite...' : 'Abspielen'}
              </button>
              <button
                onClick={() => {
                  setAudioBlob(null);
                  setAudioUrl(null);
                  setProcessedBlob(null);
                  setProcessedUrl(null);
                }}
                className="px-4 py-2 rounded border border-green-600 hover:bg-green-700 transition-colors"
              >
                Neu aufnehmen
              </button>
            </div>

            {/* Effekt-Auswahl */}
            <div className="mb-4">
              <label className="block text-sm text-green-300 mb-2">
                Stimm-Effekt
              </label>
              <select
                value={selectedPreset.name}
                onChange={(e) => {
                  const preset = VOICE_PRESETS.find(p => p.name === e.target.value);
                  if (preset) setSelectedPreset(preset);
                }}
                className="w-full bg-green-900/50 border border-green-600 rounded px-3 py-2 text-white"
              >
                {VOICE_PRESETS.map(preset => (
                  <option key={preset.name} value={preset.name}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Geschlecht-Auswahl */}
            <div className="mb-4">
              <label className="block text-sm text-green-300 mb-2">
                Speichern als
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setGender('m')}
                  className={`flex-1 py-2 rounded font-semibold transition-colors ${
                    gender === 'm'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-900/50 border border-green-600 text-green-300'
                  }`}
                >
                  Männlich (M)
                </button>
                <button
                  onClick={() => setGender('f')}
                  className={`flex-1 py-2 rounded font-semibold transition-colors ${
                    gender === 'f'
                      ? 'bg-pink-600 text-white'
                      : 'bg-green-900/50 border border-green-600 text-green-300'
                  }`}
                >
                  Weiblich (F)
                </button>
              </div>
            </div>

            {/* Upload-Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || processing}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              {uploading ? 'Wird hochgeladen...' : 'Speichern'}
            </button>
          </>
        )}

        {/* Hinweis */}
        <p className="text-center text-green-400 text-xs mt-4">
          Die Aufnahme wird nach dem Speichern zu MP3 konvertiert.
        </p>
      </div>
    </div>
  );
}
