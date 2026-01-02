'use client';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[#1a241e]">
      <div className="text-6xl mb-4">🃏</div>
      <h1 className="text-2xl font-bold mb-4 text-amber-100">
        Keine Verbindung
      </h1>
      <p className="text-amber-200/80 mb-6 max-w-sm">
        Schafkopf Online benötigt eine Internetverbindung zum Spielen.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
