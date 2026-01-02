'use client';

import { useConnectionStatus } from '@/hooks/useConnectionStatus';

/**
 * Zeigt einen Banner wenn die WebSocket-Verbindung unterbrochen ist
 */
export function ConnectionIndicator() {
  const status = useConnectionStatus();

  // Nur anzeigen wenn nicht verbunden
  if (status === 'connected') {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] text-white text-center py-2 text-sm font-medium animate-pulse"
      style={{
        background: status === 'disconnected'
          ? 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)'
          : 'linear-gradient(90deg, #d97706 0%, #b45309 100%)',
      }}
    >
      {status === 'disconnected' && (
        <>
          <span className="mr-2">⚠️</span>
          Verbindung unterbrochen...
        </>
      )}
      {status === 'reconnecting' && (
        <>
          <span className="mr-2">🔄</span>
          Verbinde neu...
        </>
      )}
    </div>
  );
}
