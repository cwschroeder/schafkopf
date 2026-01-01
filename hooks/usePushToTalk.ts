'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UsePushToTalkOptions {
  roomId: string;
  playerId: string;
  playerName: string;
  maxDuration?: number; // Max Aufnahmedauer in Sekunden (default: 5)
  onVoiceReceived?: (senderId: string, senderName: string) => void;
}

interface UsePushToTalkReturn {
  isRecording: boolean;
  isSending: boolean;
  isSupported: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  error: string | null;
}

// Audio aus Base64 abspielen
export function playBase64Audio(base64: string, mimeType: string = 'audio/webm'): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(`data:${mimeType};base64,${base64}`);
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Audio playback failed'));
      audio.play().catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}

export function usePushToTalk(options: UsePushToTalkOptions): UsePushToTalkReturn {
  const { roomId, playerId, playerName, maxDuration = 5, onVoiceReceived } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Browser-Support prüfen
  useEffect(() => {
    const supported = typeof window !== 'undefined' &&
      'mediaDevices' in navigator &&
      'getUserMedia' in navigator.mediaDevices &&
      'MediaRecorder' in window;
    setIsSupported(supported);
  }, []);

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Audio an Server senden
  const sendVoiceMessage = useCallback(async (audioBlob: Blob) => {
    if (audioBlob.size === 0) {
      console.warn('[Voice] Leere Aufnahme, wird nicht gesendet');
      return;
    }

    // Zu kleine Aufnahmen ignorieren (< 0.5 Sekunden ~ 5KB)
    if (audioBlob.size < 5000) {
      console.warn('[Voice] Aufnahme zu kurz, wird nicht gesendet');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Blob zu Base64 konvertieren
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      const response = await fetch('/schafkopf/api/game/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          playerId,
          playerName,
          audioBase64: base64,
          mimeType: audioBlob.type || 'audio/webm',
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Senden fehlgeschlagen');
      }

      console.log('[Voice] Nachricht gesendet');
    } catch (e) {
      console.error('[Voice] Sendefehler:', e);
      setError(e instanceof Error ? e.message : 'Senden fehlgeschlagen');
    } finally {
      setIsSending(false);
    }
  }, [roomId, playerId, playerName]);

  // Aufnahme starten
  const startRecording = useCallback(async () => {
    if (!isSupported || isRecording) return;

    setError(null);
    audioChunksRef.current = [];

    try {
      // Mikrofon-Zugriff anfordern
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // MediaRecorder mit passendem Format erstellen
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 64000, // Niedrige Bitrate für kleine Dateien
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        sendVoiceMessage(audioBlob);

        // Stream stoppen
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Aufnahme starten
      mediaRecorder.start(100); // Chunks alle 100ms
      setIsRecording(true);

      // Auto-Stop nach maxDuration
      timeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          console.log('[Voice] Max-Dauer erreicht, stoppe automatisch');
          stopRecording();
        }
      }, maxDuration * 1000);

      console.log('[Voice] Aufnahme gestartet');
    } catch (e) {
      console.error('[Voice] Aufnahmefehler:', e);
      if (e instanceof Error && e.name === 'NotAllowedError') {
        setError('Mikrofon-Zugriff verweigert');
      } else {
        setError('Mikrofon nicht verfügbar');
      }
    }
  }, [isSupported, isRecording, maxDuration, sendVoiceMessage]);

  // Aufnahme stoppen
  const stopRecording = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      console.log('[Voice] Aufnahme gestoppt');
    }

    setIsRecording(false);
  }, []);

  return {
    isRecording,
    isSending,
    isSupported,
    startRecording,
    stopRecording,
    error,
  };
}
