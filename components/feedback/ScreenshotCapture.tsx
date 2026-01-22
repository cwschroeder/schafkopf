'use client';

import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { hapticTap, hapticSuccess } from '@/lib/haptics';
import { apiUrl } from '@/lib/api';

interface ScreenshotCaptureProps {
  onCapture: (screenshotId: string, previewUrl: string) => void;
  onCancel: () => void;
}

export default function ScreenshotCapture({ onCapture, onCancel }: ScreenshotCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const captureScreen = useCallback(async () => {
    hapticTap();
    setIsCapturing(true);
    setError(null);

    try {
      // Kurze Verzögerung damit das Modal verschwindet
      await new Promise((r) => setTimeout(r, 100));

      // html2canvas Optionen
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: Math.min(window.devicePixelRatio, 2), // Max 2x für Performance
        logging: false,
        backgroundColor: '#1a241e', // Fallback-Hintergrund
        ignoreElements: (element) => {
          // Modal und Feedback-Button ignorieren
          return (
            element.classList.contains('feedback-modal') ||
            element.getAttribute('aria-label') === 'Feedback geben'
          );
        },
      });

      // Canvas zu Data-URL
      const dataUrl = canvas.toDataURL('image/png', 0.9);
      setPreview(dataUrl);
      hapticSuccess();
    } catch (err) {
      console.error('Screenshot-Fehler:', err);
      setError('Screenshot konnte nicht erstellt werden');
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const uploadScreenshot = useCallback(async () => {
    if (!preview) return;

    hapticTap();
    setIsUploading(true);
    setError(null);

    try {
      // Data-URL zu Blob konvertieren
      const response = await fetch(preview);
      const blob = await response.blob();

      // FormData erstellen
      const formData = new FormData();
      formData.append('file', blob, 'screenshot.png');

      // Upload
      const res = await fetch(apiUrl('/api/feedback/upload'), {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload fehlgeschlagen');
      }

      hapticSuccess();
      onCapture(data.screenshotId, preview);
    } catch (err) {
      console.error('Upload-Fehler:', err);
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setIsUploading(false);
    }
  }, [preview, onCapture]);

  const retake = () => {
    hapticTap();
    setPreview(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!preview ? (
        // Capture-Button
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-4">
            Erstelle einen Screenshot der aktuellen Ansicht
          </p>
          <button
            onClick={captureScreen}
            disabled={isCapturing}
            className="px-6 py-3 rounded-xl font-medium text-white transition-all active:scale-[0.98] disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            }}
          >
            {isCapturing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Erfasse...
              </span>
            ) : (
              <span className="flex items-center gap-2">
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
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
                Screenshot erstellen
              </span>
            )}
          </button>
          <button
            onClick={onCancel}
            className="block mx-auto mt-3 text-sm text-gray-400 hover:text-gray-300"
          >
            Überspringen
          </button>
        </div>
      ) : (
        // Preview
        <div>
          <p className="text-sm text-gray-400 mb-2">Vorschau:</p>
          <div className="relative rounded-lg overflow-hidden border border-white/10">
            <img
              src={preview}
              alt="Screenshot-Vorschau"
              className="w-full h-auto max-h-[200px] object-contain bg-black/20"
            />
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={retake}
              disabled={isUploading}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Neu aufnehmen
            </button>
            <button
              onClick={uploadScreenshot}
              disabled={isUploading}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              }}
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Lädt hoch...
                </span>
              ) : (
                'Verwenden'
              )}
            </button>
          </div>
          <button
            onClick={onCancel}
            className="block mx-auto mt-3 text-sm text-gray-400 hover:text-gray-300"
          >
            Ohne Screenshot fortfahren
          </button>
        </div>
      )}
    </div>
  );
}
