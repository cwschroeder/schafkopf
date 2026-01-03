'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    // Prüfe ob bereits installiert (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Prüfe ob iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // beforeinstallprompt Event abfangen (Android/Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Prüfe ob App installiert wurde
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSHint(true);
      return;
    }

    if (!deferredPrompt) return;

    // Installation-Dialog anzeigen
    await deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // Bereits installiert - nichts anzeigen
  if (isInstalled) {
    return null;
  }

  // Weder iOS noch Install-Prompt verfügbar
  if (!isIOS && !deferredPrompt) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        App installieren
      </button>

      {/* iOS Hinweis Modal */}
      {showIOSHint && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowIOSHint(false)}
        >
          <div
            className="rounded-2xl p-6 max-w-sm w-full"
            style={{
              background: 'linear-gradient(135deg, #3e2723 0%, #4e342e 100%)',
              border: '2px solid rgba(139,90,43,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-amber-200 mb-4">
              App auf iPhone installieren
            </h3>
            <div className="space-y-3 text-amber-100">
              <p className="flex items-start gap-2">
                <span className="text-2xl">1.</span>
                <span>Tippe unten auf das <strong>Teilen-Symbol</strong> (Quadrat mit Pfeil)</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-2xl">2.</span>
                <span>Scrolle und wähle <strong>"Zum Home-Bildschirm"</strong></span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-2xl">3.</span>
                <span>Tippe auf <strong>"Hinzufügen"</strong></span>
              </p>
            </div>
            <button
              onClick={() => setShowIOSHint(false)}
              className="mt-6 w-full py-2 rounded-lg font-bold"
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
                color: '#1a1a1a',
              }}
            >
              Verstanden
            </button>
          </div>
        </div>
      )}
    </>
  );
}
