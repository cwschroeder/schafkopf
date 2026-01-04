'use client';

import { useEffect, useCallback, useRef } from 'react';
import {
  speak,
  initSpeech,
  unlockAudio,
  getAnsageText,
  randomPhrase,
  STICH_GEWONNEN,
  STICH_VERLOREN,
  SPIEL_START,
  SPIEL_GEWONNEN,
  SPIEL_VERLOREN,
  DU_GESAGT,
  RE_GESAGT,
  BavarianPhrase,
} from '@/lib/bavarian-speech';
import { MitspielerReaktion } from '@/lib/mitspieler-reaktionen';

export function useBavarianSpeech() {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initSpeech();
      initialized.current = true;
    }
  }, []);

  // Unlock audio bei erster User-Interaktion
  const ensureAudioReady = useCallback(() => {
    unlockAudio();
  }, []);

  const speakAnsage = useCallback((ansage: string, gesuchteAss?: string, playerName?: string) => {
    const phrase = getAnsageText(ansage, gesuchteAss);
    speak(phrase.speech, 0.9, playerName);
    return phrase.text;
  }, []);

  const speakStichGewonnen = useCallback((playerName?: string) => {
    const phrase = randomPhrase(STICH_GEWONNEN);
    speak(phrase.speech, 0.9, playerName);
    return phrase.text;
  }, []);

  const speakStichVerloren = useCallback((playerName?: string) => {
    const phrase = randomPhrase(STICH_VERLOREN);
    speak(phrase.speech, 0.85, playerName);
    return phrase.text;
  }, []);

  const speakSpielStart = useCallback((playerName?: string) => {
    const phrase = randomPhrase(SPIEL_START);
    speak(phrase.speech, 0.9, playerName);
    return phrase.text;
  }, []);

  const speakSpielGewonnen = useCallback((playerName?: string) => {
    const phrase = randomPhrase(SPIEL_GEWONNEN);
    speak(phrase.speech, 1.1, playerName);
    return phrase.text;
  }, []);

  const speakSpielVerloren = useCallback((playerName?: string) => {
    const phrase = randomPhrase(SPIEL_VERLOREN);
    speak(phrase.speech, 0.8, playerName);
    return phrase.text;
  }, []);

  const speakDu = useCallback((playerName?: string) => {
    const phrase = randomPhrase(DU_GESAGT);
    speak(phrase.speech, 1.2, playerName);
    return phrase.text;
  }, []);

  const speakRe = useCallback((playerName?: string) => {
    const phrase = randomPhrase(RE_GESAGT);
    speak(phrase.speech, 1.2, playerName);
    return phrase.text;
  }, []);

  // Mitspieler-Reaktion abspielen
  const speakMitspielerReaktion = useCallback((reaktion: MitspielerReaktion) => {
    // Verwende den Namen des Sprechers für die richtige Stimme
    speak(reaktion.phrase.speech, 0.9, reaktion.sprecherName);
    return reaktion.phrase.text;
  }, []);

  // Beliebigen Spruch abspielen
  const speakPhrase = useCallback((phrase: BavarianPhrase, playerName?: string) => {
    speak(phrase.speech, 0.9, playerName);
    return phrase.text;
  }, []);

  return {
    speakAnsage,
    speakStichGewonnen,
    speakStichVerloren,
    speakSpielStart,
    speakSpielGewonnen,
    speakSpielVerloren,
    speakDu,
    speakRe,
    speakMitspielerReaktion,
    speakPhrase,
    ensureAudioReady, // Für Mobile-Audio-Unlock bei User-Interaktion
  };
}
