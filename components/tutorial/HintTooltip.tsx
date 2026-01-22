'use client';

import { OptimalPlayResult } from '@/lib/tutorial/types';
import Card from '@/components/Card';

interface HintTooltipProps {
  analysis: OptimalPlayResult;
  isVisible: boolean;
  onToggle: () => void;
}

export default function HintTooltip({ analysis, isVisible, onToggle }: HintTooltipProps) {
  return (
    <div className="fixed top-16 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`mb-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          isVisible
            ? 'bg-green-600 text-white'
            : 'bg-amber-900/80 text-amber-200 border border-amber-700'
        }`}
      >
        {isVisible ? '💡 Tipp ausblenden' : '💡 Tipp zeigen'}
      </button>

      {/* Hint Panel */}
      {isVisible && (
        <div
          className="rounded-xl p-4 max-w-xs animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.95) 0%, rgba(22,163,74,0.95) 100%)',
            border: '2px solid rgba(255,255,255,0.3)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          {/* Situation */}
          <p className="text-green-100 text-sm mb-3">{analysis.situation}</p>

          {/* Optimale Karte */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="ring-2 ring-white rounded-lg">
                <Card karte={analysis.optimalCard} size="sm" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm mb-1">Optimale Karte</p>
              <ul className="text-green-100 text-xs space-y-1">
                {analysis.reasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span>•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Alternativen */}
          {analysis.allOptions.length > 1 && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-green-100 text-xs mb-2">Andere Optionen:</p>
              <div className="flex gap-1 flex-wrap">
                {analysis.allOptions.slice(1, 4).map((option, i) => (
                  <div
                    key={i}
                    className="opacity-60"
                    title={option.reasons.join(', ')}
                  >
                    <Card karte={option.card} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Feedback nach einem Zug
export function PlayFeedback({
  wasOptimal,
  feedback,
  optimalCard,
  playedCard,
  onClose,
}: {
  wasOptimal: boolean;
  feedback: string;
  optimalCard: { farbe: string; wert: string };
  playedCard: { farbe: string; wert: string };
  onClose: () => void;
}) {
  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-50 rounded-xl p-4 animate-slide-up"
      style={{
        background: wasOptimal
          ? 'linear-gradient(135deg, rgba(34,197,94,0.95) 0%, rgba(22,163,74,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(217,119,6,0.95) 0%, rgba(180,83,9,0.95) 100%)',
        border: '2px solid rgba(255,255,255,0.2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{wasOptimal ? '✓' : '💡'}</span>
          <div>
            <p className="text-white font-semibold">{feedback}</p>
            {!wasOptimal && (
              <p className="text-white/80 text-sm">
                Besser wäre:{' '}
                <span className="font-medium">
                  {optimalCard.farbe}-{optimalCard.wert}
                </span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
