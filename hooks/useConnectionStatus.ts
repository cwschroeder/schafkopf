'use client';

import { useState, useEffect } from 'react';
import { ConnectionStatus, onConnectionChange } from '@/lib/pusher';

/**
 * Hook für den aktuellen Socket-Verbindungsstatus
 * Zeigt an ob connected, disconnected oder reconnecting
 */
export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>('connected');

  useEffect(() => {
    // Listener registrieren und bei Cleanup entfernen
    const unsubscribe = onConnectionChange(setStatus);
    return unsubscribe;
  }, []);

  return status;
}
