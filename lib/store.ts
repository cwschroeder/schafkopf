// Client-seitiger Zustand mit Zustand

import { create } from 'zustand';
import { SpielState, Raum } from './schafkopf/types';
import type { UserAccount } from './auth/types';

// Authenticated user info from session
interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  settings?: UserAccount['settings'];
}

interface GameStore {
  // Auth State
  authUser: AuthUser | null;
  isAuthenticated: boolean;
  setAuthUser: (user: AuthUser | null) => void;
  clearAuthUser: () => void;

  // Spieler-Info (for anonymous play)
  playerId: string | null;
  playerName: string | null;
  setPlayer: (id: string, name: string) => void;

  // Lobby
  rooms: Raum[];
  setRooms: (rooms: Raum[]) => void;
  addRoom: (room: Raum) => void;
  updateRoom: (room: Raum) => void;
  removeRoom: (roomId: string) => void;

  // Aktueller Raum
  currentRoom: Raum | null;
  setCurrentRoom: (room: Raum | null) => void;

  // Spielzustand
  gameState: SpielState | null;
  setGameState: (state: SpielState | null) => void;

  // UI State
  selectedCard: string | null;
  setSelectedCard: (cardId: string | null) => void;

  showAnnounceDialog: boolean;
  setShowAnnounceDialog: (show: boolean) => void;

  lastStich: SpielState['aktuellerStich'] | null;
  setLastStich: (stich: SpielState['aktuellerStich'] | null) => void;

  // Nachrichten/Events
  messages: { type: string; text: string; timestamp: number }[];
  addMessage: (type: string, text: string) => void;
  clearMessages: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Auth State
  authUser: null,
  isAuthenticated: false,
  setAuthUser: (user) => set({ authUser: user, isAuthenticated: user !== null }),
  clearAuthUser: () => set({ authUser: null, isAuthenticated: false }),

  // Spieler-Info (for anonymous play)
  playerId: null,
  playerName: null,
  setPlayer: (id, name) => set({ playerId: id, playerName: name }),

  // Lobby
  rooms: [],
  setRooms: (rooms) => set({ rooms }),
  addRoom: (room) => set((state) => ({ rooms: [...state.rooms, room] })),
  updateRoom: (room) =>
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === room.id ? room : r)),
    })),
  removeRoom: (roomId) =>
    set((state) => ({
      rooms: state.rooms.filter((r) => r.id !== roomId),
    })),

  // Aktueller Raum
  currentRoom: null,
  setCurrentRoom: (room) => set({ currentRoom: room }),

  // Spielzustand
  gameState: null,
  setGameState: (state) => set({ gameState: state }),

  // UI State
  selectedCard: null,
  setSelectedCard: (cardId) => set({ selectedCard: cardId }),

  showAnnounceDialog: false,
  setShowAnnounceDialog: (show) => set({ showAnnounceDialog: show }),

  lastStich: null,
  setLastStich: (stich) => set({ lastStich: stich }),

  // Nachrichten
  messages: [],
  addMessage: (type, text) =>
    set((state) => ({
      messages: [
        ...state.messages.slice(-50), // Max 50 Nachrichten
        { type, text, timestamp: Date.now() },
      ],
    })),
  clearMessages: () => set({ messages: [] }),
}));

// Persistenz für Spielername
export function loadPlayerFromStorage(): { id: string; name: string } | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('schafkopf-player');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export function savePlayerToStorage(id: string, name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('schafkopf-player', JSON.stringify({ id, name }));
}
