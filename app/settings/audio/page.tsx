'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AudioRecorder from '@/components/settings/AudioRecorder';

// Admin-Email für Audio-Verwaltung
const ADMIN_EMAIL = 'christian.w.schroeder@gmail.com';

// BasePath für API-Aufrufe
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

type VoiceKey = 'm1' | 'm2' | 'f1' | 'f2';

interface Phrase {
  text: string;
  speech: string;
  originalSpeech: string;
  category: string;
  // 4 Stimmen
  audioM1: string | null;
  audioM2: string | null;
  audioF1: string | null;
  audioF2: string | null;
  hasAudioM1: boolean;
  hasAudioM2: boolean;
  hasAudioF1: boolean;
  hasAudioF2: boolean;
  // Legacy (Abwärtskompatibilität)
  audioM: string | null;
  audioF: string | null;
  hasAudioM: boolean;
  hasAudioF: boolean;
  custom?: boolean;
}

// Voice-Key Labels
const VOICE_LABELS: Record<VoiceKey, { label: string; color: string }> = {
  m1: { label: 'M1', color: 'green' },
  m2: { label: 'M2', color: 'emerald' },
  f1: { label: 'F1', color: 'pink' },
  f2: { label: 'F2', color: 'purple' },
};

interface PhrasesResponse {
  total: number;
  withAudio: number;
  phrases: Phrase[];
  grouped: Record<string, Phrase[]>;
}

// Kategorie-Labels
const CATEGORY_LABELS: Record<string, string> = {
  'ansage-sauspiel-eichel': 'Sauspiel Eichel',
  'ansage-sauspiel-gras': 'Sauspiel Gras',
  'ansage-sauspiel-schellen': 'Sauspiel Schellen',
  'ansage-solo-eichel': 'Solo Eichel',
  'ansage-solo-gras': 'Solo Gras',
  'ansage-solo-herz': 'Solo Herz',
  'ansage-solo-schellen': 'Solo Schellen',
  'ansage-wenz': 'Wenz',
  'ansage-geier': 'Geier',
  'ansage-weiter': 'Weiter/Passen',
  'stich-gewonnen': 'Stich gewonnen',
  'stich-verloren': 'Stich verloren',
  'spiel-start': 'Spielstart',
  'spiel-gewonnen': 'Spiel gewonnen',
  'spiel-verloren': 'Spiel verloren',
  'du-gesagt': 'Du (Kontra)',
  're-gesagt': 'Re',
  'legen-ja': 'Legen Ja',
  'legen-nein': 'Legen Nein',
  'allgemein': 'Allgemein',
  'unter': 'Unter-Kommentare',
  // Mitspieler-Reaktionen
  'mitspieler-auffordern': 'Mitspieler: Aufforderung Stechen',
  'mitspieler-verpasst': 'Mitspieler: Verpasstes Stechen',
  'mitspieler-serie': 'Mitspieler: Stich-Serie',
  'mitspieler-verschenkt': 'Mitspieler: Stich verschenkt',
  'mitspieler-partner': 'Mitspieler: Partner gefunden',
};

export default function AudioSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<PhrasesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [editedSpeech, setEditedSpeech] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedVoice, setSelectedVoice] = useState<VoiceKey>('m1');
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [savingTTS, setSavingTTS] = useState<Record<string, boolean>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showNewPhraseForm, setShowNewPhraseForm] = useState(false);
  const [newPhrase, setNewPhrase] = useState({ text: '', speech: '', category: 'stich-gewonnen' });
  const [addingPhrase, setAddingPhrase] = useState(false);
  const [recordingPhrase, setRecordingPhrase] = useState<Phrase | null>(null);

  // Nur Admin darf diese Seite sehen
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  // Redirect wenn nicht Admin
  useEffect(() => {
    if (status === 'authenticated' && !isAdmin) {
      router.push('/settings');
    }
  }, [status, isAdmin, router]);

  // Daten laden
  useEffect(() => {
    loadPhrases();
  }, []);

  async function loadPhrases() {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_PATH}/api/audio/phrases`);
      if (!res.ok) throw new Error('Fehler beim Laden');
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  // Audio abspielen
  function playAudio(url: string) {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    // Füge BASE_PATH hinzu wenn es eine relative URL ist
    const fullUrl = url.startsWith('data:') || url.startsWith('http') ? url : `${BASE_PATH}${url}`;
    const audio = new Audio(fullUrl);
    audioRef.current = audio;
    audio.play();
  }

  // Audio generieren
  async function generateAudio(phrase: Phrase, voiceKey: VoiceKey) {
    const key = `${phrase.originalSpeech}-${voiceKey}`;
    setGenerating(prev => ({ ...prev, [key]: true }));

    try {
      const speechText = editedSpeech[phrase.originalSpeech] || phrase.speech;

      const res = await fetch(`${BASE_PATH}/api/audio/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: speechText, voiceKey }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Generierung fehlgeschlagen');
      }

      const result = await res.json();

      // Vorschau abspielen
      playAudio(result.audio);

      // Manifest aktualisieren
      await fetch(`${BASE_PATH}/api/audio/phrases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalSpeech: phrase.originalSpeech,
          speech: speechText,
          voiceKey,
          audioFile: result.filename,
        }),
      });

      // Daten neu laden
      await loadPhrases();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fehler bei Generierung');
    } finally {
      setGenerating(prev => ({ ...prev, [key]: false }));
    }
  }

  // TTS-Text speichern
  async function saveTTSText(phrase: Phrase) {
    const speechText = editedSpeech[phrase.originalSpeech];
    if (!speechText || speechText === phrase.speech) {
      return; // Nichts zu speichern
    }

    setSavingTTS(prev => ({ ...prev, [phrase.originalSpeech]: true }));

    try {
      const res = await fetch(`${BASE_PATH}/api/audio/phrases`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalSpeech: phrase.originalSpeech,
          speech: speechText,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Speichern fehlgeschlagen');
      }

      // Daten neu laden
      await loadPhrases();
      // Edited state für diesen Eintrag löschen (ist jetzt gespeichert)
      setEditedSpeech(prev => {
        const next = { ...prev };
        delete next[phrase.originalSpeech];
        return next;
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fehler beim Speichern');
    } finally {
      setSavingTTS(prev => ({ ...prev, [phrase.originalSpeech]: false }));
    }
  }

  // Alle fehlenden Audio-Dateien generieren
  async function generateAllMissing() {
    if (!data) return;

    const missing = data.phrases.filter(p => {
      const voice = selectedVoice;
      return voice === 'echo' ? !p.hasAudioM : !p.hasAudioF;
    });

    if (missing.length === 0) {
      alert('Alle Audio-Dateien sind bereits vorhanden!');
      return;
    }

    if (!confirm(`${missing.length} Audio-Dateien generieren? (Kosten: ~$${(missing.length * 0.0001).toFixed(3)})`)) {
      return;
    }

    setBulkGenerating(true);

    for (let i = 0; i < missing.length; i++) {
      const phrase = missing[i];
      try {
        await generateAudio(phrase, selectedVoice);
        // Kurze Pause zwischen Requests
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.error('Failed to generate:', phrase.text, e);
      }
    }

    setBulkGenerating(false);
    await loadPhrases();
  }

  // Neuen Spruch hinzufügen
  async function addNewPhrase() {
    if (!newPhrase.text.trim() || !newPhrase.speech.trim()) {
      alert('Bitte Text und TTS-Text eingeben');
      return;
    }

    setAddingPhrase(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/audio/phrases`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhrase),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Hinzufügen');
      }

      // Reset und Daten neu laden
      setNewPhrase({ text: '', speech: '', category: newPhrase.category });
      setShowNewPhraseForm(false);
      await loadPhrases();

      // Kategorie expandieren
      setExpandedCategories(prev => new Set([...prev, newPhrase.category]));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fehler beim Hinzufügen');
    } finally {
      setAddingPhrase(false);
    }
  }

  // Spruch löschen
  async function deletePhrase(speech: string) {
    if (!confirm('Spruch wirklich löschen?')) return;

    try {
      const res = await fetch(`${BASE_PATH}/api/audio/phrases`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speech }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Fehler beim Löschen');
      }

      await loadPhrases();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fehler beim Löschen');
    }
  }

  // Kategorie expandieren/kollabieren
  function toggleCategory(cat: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }

  // Warten auf Auth-Check
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-950 flex items-center justify-center">
        <div className="text-white text-xl">Lade...</div>
      </div>
    );
  }

  // Nicht eingeloggt oder kein Admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-950 flex items-center justify-center">
        <div className="text-red-400 text-xl">Kein Zugriff</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-950 flex items-center justify-center">
        <div className="text-white text-xl">Lade Sprüche...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-950 flex items-center justify-center">
        <div className="text-red-400 text-xl">Fehler: {error}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-green-900 to-green-950 text-white overflow-y-auto">
      <div className="p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/" className="text-amber-400 hover:underline text-sm">&larr; Zurück</Link>
            <h1 className="text-2xl font-bold mt-1">Audio-Einstellungen</h1>
            <p className="text-green-300 text-sm">
              {data?.withAudio || 0} / {data?.total || 0} Sprüche mit Audio
            </p>
          </div>

          {/* Stimmen-Auswahl & Bulk-Generate */}
          <div className="flex items-center gap-3">
            <select
              value={selectedVoice}
              onChange={e => setSelectedVoice(e.target.value as 'echo' | 'nova')}
              className="bg-green-800 border border-green-600 rounded px-3 py-2 text-sm"
            >
              <option value="echo">Echo (männlich)</option>
              <option value="nova">Nova (weiblich)</option>
            </select>

            <button
              onClick={generateAllMissing}
              disabled={bulkGenerating}
              className="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 px-4 py-2 rounded font-semibold text-sm transition-colors"
            >
              {bulkGenerating ? 'Generiere...' : 'Fehlende generieren'}
            </button>
          </div>
        </div>

        {/* Neuer Spruch hinzufügen */}
        {showNewPhraseForm ? (
          <div className="bg-green-800/70 rounded-lg p-4 mb-4 border border-green-600">
            <h3 className="font-semibold mb-3">Neuen Spruch hinzufügen</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-green-300 mb-1">Anzeige-Text</label>
                <input
                  type="text"
                  value={newPhrase.text}
                  onChange={e => setNewPhrase(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="z.B. Des is ja a Wahnsinn!"
                  className="w-full bg-green-900/50 border border-green-600 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-green-300 mb-1">TTS-Text (Aussprache)</label>
                <input
                  type="text"
                  value={newPhrase.speech}
                  onChange={e => setNewPhrase(prev => ({ ...prev, speech: e.target.value }))}
                  placeholder="z.B. Des is ja a Wahnsinn!"
                  className="w-full bg-green-900/50 border border-green-600 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-green-300 mb-1">Kategorie</label>
                <select
                  value={newPhrase.category}
                  onChange={e => setNewPhrase(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-green-900/50 border border-green-600 rounded px-3 py-2 text-white"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={addNewPhrase}
                  disabled={addingPhrase}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 px-4 py-2 rounded font-semibold transition-colors"
                >
                  {addingPhrase ? 'Füge hinzu...' : 'Hinzufügen'}
                </button>
                <button
                  onClick={() => setShowNewPhraseForm(false)}
                  className="px-4 py-2 rounded border border-green-600 hover:bg-green-700 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNewPhraseForm(true)}
            className="w-full bg-green-700 hover:bg-green-600 px-4 py-3 rounded-lg font-semibold mb-4 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span> Neuen Spruch hinzufügen
          </button>
        )}

        {/* Kategorien */}
        <div className="space-y-4">
          {data?.grouped && Object.entries(data.grouped).map(([category, phrases]) => {
            const isExpanded = expandedCategories.has(category);
            const hasAllAudio = phrases.every(p => selectedVoice === 'echo' ? p.hasAudioM : p.hasAudioF);
            const audioCount = phrases.filter(p => selectedVoice === 'echo' ? p.hasAudioM : p.hasAudioF).length;

            return (
              <div key={category} className="bg-green-800/50 rounded-lg overflow-hidden">
                {/* Kategorie-Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-green-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                    <span className="font-semibold">{CATEGORY_LABELS[category] || category}</span>
                    <span className="text-sm text-green-300">
                      ({audioCount}/{phrases.length})
                    </span>
                  </div>
                  {hasAllAudio && <span className="text-green-400">✓</span>}
                </button>

                {/* Sprüche-Liste */}
                {isExpanded && (
                  <div className="border-t border-green-700">
                    {phrases.map((phrase) => {
                      const keyM = `${phrase.originalSpeech}-echo`;
                      const keyF = `${phrase.originalSpeech}-nova`;
                      const isGeneratingM = generating[keyM];
                      const isGeneratingF = generating[keyF];
                      const currentSpeech = editedSpeech[phrase.originalSpeech] ?? phrase.speech;
                      const isEdited = currentSpeech !== phrase.originalSpeech;

                      return (
                        <div
                          key={phrase.originalSpeech}
                          className="px-4 py-3 border-b border-green-700/50 last:border-b-0"
                        >
                          {/* Text-Anzeige */}
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-amber-200 font-medium">{phrase.text}</span>
                                {phrase.custom && (
                                  <span className="text-xs bg-blue-600/50 px-1.5 py-0.5 rounded">custom</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="text"
                                  value={currentSpeech}
                                  onChange={e => setEditedSpeech(prev => ({
                                    ...prev,
                                    [phrase.originalSpeech]: e.target.value,
                                  }))}
                                  className="flex-1 bg-green-900/50 border border-green-600 rounded px-2 py-1 text-sm text-white placeholder-green-400"
                                  placeholder="TTS-Text..."
                                />
                                {isEdited && (
                                  <span className="text-xs text-amber-400">bearbeitet</span>
                                )}
                              </div>
                            </div>

                            {/* Audio-Buttons */}
                            <div className="flex items-center gap-2">
                              {/* Männlich */}
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-xs text-green-400">M</span>
                                <div className="flex gap-1">
                                  {phrase.hasAudioM && (
                                    <button
                                      onClick={() => playAudio(`/audio/${phrase.audioM}`)}
                                      className="w-8 h-8 bg-green-600 hover:bg-green-500 rounded flex items-center justify-center"
                                      title="Abspielen"
                                    >
                                      ▶
                                    </button>
                                  )}
                                  <button
                                    onClick={() => generateAudio(phrase, 'echo')}
                                    disabled={isGeneratingM}
                                    className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                                      isGeneratingM
                                        ? 'bg-gray-600 animate-pulse'
                                        : phrase.hasAudioM
                                        ? 'bg-amber-700 hover:bg-amber-600'
                                        : 'bg-amber-600 hover:bg-amber-500'
                                    }`}
                                    title={phrase.hasAudioM ? 'Neu generieren' : 'Generieren'}
                                  >
                                    {isGeneratingM ? '...' : phrase.hasAudioM ? '↻' : '+'}
                                  </button>
                                </div>
                              </div>

                              {/* Weiblich */}
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-xs text-pink-400">F</span>
                                <div className="flex gap-1">
                                  {phrase.hasAudioF && (
                                    <button
                                      onClick={() => playAudio(`/audio/${phrase.audioF}`)}
                                      className="w-8 h-8 bg-pink-600 hover:bg-pink-500 rounded flex items-center justify-center"
                                      title="Abspielen"
                                    >
                                      ▶
                                    </button>
                                  )}
                                  <button
                                    onClick={() => generateAudio(phrase, 'nova')}
                                    disabled={isGeneratingF}
                                    className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                                      isGeneratingF
                                        ? 'bg-gray-600 animate-pulse'
                                        : phrase.hasAudioF
                                        ? 'bg-pink-700 hover:bg-pink-600'
                                        : 'bg-pink-600 hover:bg-pink-500'
                                    }`}
                                    title={phrase.hasAudioF ? 'Neu generieren' : 'Generieren'}
                                  >
                                    {isGeneratingF ? '...' : phrase.hasAudioF ? '↻' : '+'}
                                  </button>
                                </div>
                              </div>

                              {/* Aufnahme-Button */}
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-xs text-amber-400">Rec</span>
                                <button
                                  onClick={() => setRecordingPhrase(phrase)}
                                  className="w-8 h-8 bg-amber-800 hover:bg-amber-700 rounded flex items-center justify-center transition-colors"
                                  title="Eigene Aufnahme"
                                >
                                  🎤
                                </button>
                              </div>

                              {/* Löschen-Button für Custom-Sprüche */}
                              {phrase.custom && (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs text-red-400">×</span>
                                  <button
                                    onClick={() => deletePhrase(phrase.originalSpeech)}
                                    className="w-8 h-8 bg-red-700 hover:bg-red-600 rounded flex items-center justify-center transition-colors"
                                    title="Spruch löschen"
                                  >
                                    🗑
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>

      {/* Audio-Recorder Modal */}
      {recordingPhrase && (
        <AudioRecorder
          phrase={recordingPhrase}
          onClose={() => setRecordingPhrase(null)}
          onSaved={() => {
            loadPhrases();
            setRecordingPhrase(null);
          }}
        />
      )}
    </div>
  );
}
