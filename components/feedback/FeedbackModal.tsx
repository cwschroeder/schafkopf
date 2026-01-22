'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useGameStore } from '@/lib/store';
import { hapticTap, hapticSuccess, hapticError } from '@/lib/haptics';
import { apiUrl } from '@/lib/api';
import { collectFeedbackContext } from '@/lib/feedback/context-collector';
import ScreenshotCapture from './ScreenshotCapture';
import type { FeedbackCategory, FeedbackContext } from '@/lib/feedback/types';

interface FeedbackModalProps {
  onClose: () => void;
}

type Step = 'type' | 'form' | 'screenshot' | 'context' | 'success';

const CATEGORY_INFO: Record<
  FeedbackCategory,
  { icon: string; label: string; description: string }
> = {
  bug: {
    icon: '🐛',
    label: 'Bug melden',
    description: 'Etwas funktioniert nicht wie erwartet',
  },
  feature: {
    icon: '💡',
    label: 'Wunsch',
    description: 'Neue Funktion oder Verbesserung vorschlagen',
  },
  question: {
    icon: '❓',
    label: 'Frage',
    description: 'Frage zum Spiel oder den Regeln',
  },
  other: {
    icon: '💬',
    label: 'Sonstiges',
    description: 'Allgemeines Feedback',
  },
};

interface ScreenshotInfo {
  id: string;
  previewUrl: string;
}

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const { data: session } = useSession();
  const { playerId, playerName } = useGameStore();

  const [step, setStep] = useState<Step>('type');
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshots, setScreenshots] = useState<ScreenshotInfo[]>([]);
  const [context, setContext] = useState<FeedbackContext | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Context beim Öffnen sammeln
  useEffect(() => {
    collectFeedbackContext().then(setContext);
  }, []);

  const handleCategorySelect = (cat: FeedbackCategory) => {
    hapticTap();
    setCategory(cat);
    setStep('form');
  };

  const handleBack = () => {
    hapticTap();
    if (step === 'form') setStep('type');
    else if (step === 'screenshot') setStep('form');
    else if (step === 'context') setStep('screenshot');
  };

  const handleNext = () => {
    hapticTap();
    if (step === 'form') {
      if (!title.trim() || title.trim().length < 3) {
        setError('Bitte gib einen Titel ein (mind. 3 Zeichen)');
        return;
      }
      if (!description.trim() || description.trim().length < 10) {
        setError('Bitte beschreibe das Problem genauer (mind. 10 Zeichen)');
        return;
      }
      setError(null);
      // Bei Bugs Screenshot anbieten, bei anderen direkt zum Context
      if (category === 'bug') {
        setStep('screenshot');
      } else {
        setStep('context');
      }
    }
  };

  const handleScreenshotCapture = (screenshotId: string, previewUrl: string) => {
    setScreenshots((prev) => [...prev, { id: screenshotId, previewUrl }]);
    setStep('context');
  };

  const handleSkipScreenshot = () => {
    hapticTap();
    setStep('context');
  };

  const removeScreenshot = (index: number) => {
    hapticTap();
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    hapticTap();
    setIsSubmitting(true);
    setError(null);

    try {
      const userId = session?.user?.id || playerId;
      const userName = session?.user?.name || playerName;

      if (!userId || !userName) {
        throw new Error('Bitte melde dich an oder gib einen Namen ein');
      }

      const res = await fetch(apiUrl('/api/feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          screenshotIds: screenshots.map((s) => s.id),
          userId,
          userName,
          context,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Senden');
      }

      hapticSuccess();
      setStep('success');
    } catch (err) {
      hapticError();
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'type':
        return 'Feedback geben';
      case 'form':
        return category ? CATEGORY_INFO[category].label : 'Feedback';
      case 'screenshot':
        return 'Screenshot';
      case 'context':
        return 'Überprüfen';
      case 'success':
        return 'Danke!';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 feedback-modal">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #1a2e23 0%, #0f1f17 100%)',
          border: '1px solid rgba(45, 212, 191, 0.2)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-inherit">
          <div className="flex items-center gap-2">
            {step !== 'type' && step !== 'success' && (
              <button
                onClick={handleBack}
                className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-semibold text-white">{getStepTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Step 1: Category Selection */}
          {step === 'type' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400 mb-4">
                Was möchtest du uns mitteilen?
              </p>
              {(Object.entries(CATEGORY_INFO) as [FeedbackCategory, typeof CATEGORY_INFO.bug][]).map(
                ([cat, info]) => (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className="w-full p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, rgba(20, 184, 166, 0.05) 100%)',
                      border: '1px solid rgba(45, 212, 191, 0.2)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <div className="font-medium text-white">{info.label}</div>
                        <div className="text-sm text-gray-400">{info.description}</div>
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>
          )}

          {/* Step 2: Form */}
          {step === 'form' && (
            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Kurze Beschreibung *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    category === 'bug'
                      ? 'z.B. "Karte kann nicht gespielt werden"'
                      : 'z.B. "Dunkelmodus hinzufügen"'
                  }
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Details *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    category === 'bug'
                      ? 'Beschreibe was passiert ist und was du erwartet hättest...'
                      : 'Beschreibe deinen Vorschlag oder deine Frage...'
                  }
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50 resize-none"
                  maxLength={2000}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {description.length}/2000
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full py-3 rounded-xl font-medium text-white transition-all active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                }}
              >
                Weiter
              </button>
            </div>
          )}

          {/* Step 3: Screenshot (nur bei Bugs) */}
          {step === 'screenshot' && (
            <ScreenshotCapture
              onCapture={handleScreenshotCapture}
              onCancel={handleSkipScreenshot}
            />
          )}

          {/* Step 4: Context Review */}
          {step === 'context' && (
            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  Dein Feedback
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Typ:</span>{' '}
                    <span className="text-white">
                      {category && CATEGORY_INFO[category].label}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Titel:</span>{' '}
                    <span className="text-white">{title}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Beschreibung:</span>
                    <p className="text-white mt-1 whitespace-pre-wrap line-clamp-3">{description}</p>
                  </div>
                </div>
              </div>

              {/* Screenshots */}
              {screenshots.length > 0 && (
                <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">
                    Screenshots ({screenshots.length})
                  </h3>
                  <div className="flex gap-2 overflow-x-auto">
                    {screenshots.map((ss, idx) => (
                      <div key={ss.id} className="relative flex-shrink-0">
                        <img
                          src={ss.previewUrl}
                          alt={`Screenshot ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-white/10"
                        />
                        <button
                          onClick={() => removeScreenshot(idx)}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  Technische Infos (automatisch gesammelt)
                </h3>
                <div className="space-y-1 text-xs text-gray-400 font-mono">
                  <div>Version: {context?.appVersion}</div>
                  <div>Browser: {context?.userAgent?.slice(0, 50)}...</div>
                  <div>Bildschirm: {context?.screenSize}</div>
                  {context?.roomId && <div>Raum: {context.roomId}</div>}
                  {context?.consoleErrors && context.consoleErrors.length > 0 && (
                    <div className="text-red-400">
                      Fehler: {context.consoleErrors.length} erfasst
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Diese Infos helfen uns, das Problem besser zu verstehen und zu beheben.
              </p>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-medium text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Wird gesendet...
                  </span>
                ) : (
                  'Feedback absenden'
                )}
              </button>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Vielen Dank!
              </h3>
              <p className="text-gray-400 mb-6">
                Dein Feedback wurde erfolgreich eingereicht. Wir werden es prüfen und
                dich benachrichtigen, wenn es umgesetzt wurde.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-medium text-white transition-all active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                }}
              >
                Schließen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
