'use client';

import { useEffect, useCallback, useRef } from 'react';
import {
  speak,
  initSpeech,
  getAnsageText,
  randomPhrase,
  STICH_GEWONNEN,
  STICH_VERLOREN,
  SPIEL_START,
  SPIEL_GEWONNEN,
  SPIEL_VERLOREN,
  DU_GESAGT,
  RE_GESAGT,
} from '@/lib/bavarian-speech';

export function useBavarianSpeech() {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initSpeech();
      initialized.current = true;
    }
  }, []);

  const speakAnsage = useCallback((ansage: string, gesuchteAss?: string) => {
    const phrase = getAnsageText(ansage, gesuchteAss);
    speak(phrase.speech);
    return phrase.text;
  }, []);

  const speakStichGewonnen = useCallback(() => {
    const phrase = randomPhrase(STICH_GEWONNEN);
    speak(phrase.speech);
    return phrase.text;
  }, []);

  const speakStichVerloren = useCallback(() => {
    const phrase = randomPhrase(STICH_VERLOREN);
    speak(phrase.speech, 0.85);
    return phrase.text;
  }, []);

  const speakSpielStart = useCallback(() => {
    const phrase = randomPhrase(SPIEL_START);
    speak(phrase.speech);
    return phrase.text;
  }, []);

  const speakSpielGewonnen = useCallback(() => {
    const phrase = randomPhrase(SPIEL_GEWONNEN);
    speak(phrase.speech, 1.1);
    return phrase.text;
  }, []);

  const speakSpielVerloren = useCallback(() => {
    const phrase = randomPhrase(SPIEL_VERLOREN);
    speak(phrase.speech, 0.8);
    return phrase.text;
  }, []);

  const speakDu = useCallback(() => {
    speak(DU_GESAGT.speech, 1.2);
    return DU_GESAGT.text;
  }, []);

  const speakRe = useCallback(() => {
    speak(RE_GESAGT.speech, 1.2);
    return RE_GESAGT.text;
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
  };
}
