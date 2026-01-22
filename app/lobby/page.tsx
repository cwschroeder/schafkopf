'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore, loadPlayerFromStorage } from '@/lib/store';
import { getPusherClient, EVENTS, lobbyChannel, subscribeToChannel, unsubscribeFromChannel } from '@/lib/pusher';
import { Raum } from '@/lib/schafkopf/types';
import { apiUrl } from '@/lib/api';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ConnectionIndicator } from '@/components/ConnectionIndicator';
import UserMenu from '@/components/auth/UserMenu';
import LinkLegacyPrompt from '@/components/auth/LinkLegacyPrompt';
import InstallPWA from '@/components/InstallPWA';
import { hapticTap } from '@/lib/haptics';

export default function Lobby() {
  const router = useRouter();
  const { data: session } = useSession();
  const { playerId, playerName, setPlayer, rooms, setRooms, addRoom, updateRoom, removeRoom, setCurrentRoom } = useGameStore();

  const [newRoomName, setNewRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [linkPromptDismissed, setLinkPromptDismissed] = useState(false);

  // Prüfen ob LinkLegacyPrompt angezeigt werden soll
  const showLinkPrompt = session && playerId?.startsWith('p_') && !linkPromptDismissed &&
    !localStorage.getItem(`schafkopf-link-dismissed-${playerId}`) &&
    !localStorage.getItem(`schafkopf-link-done-${playerId}`);

  // Spieler laden
  useEffect(() => {
    const stored = loadPlayerFromStorage();
    if (stored) {
      setPlayer(stored.id, stored.name);
    } else {
      router.push('/');
    }
  }, [setPlayer, router]);

  // Räume laden
  useEffect(() => {
    fetch(apiUrl('/api/rooms'))
      .then(res => res.json())
      .then(data => setRooms(data))
      .catch(console.error);
  }, [setRooms]);

  // Socket.IO abonnieren
  useEffect(() => {
    if (!playerId || !playerName) return;

    const socket = getPusherClient(playerId, playerName);
    if (!socket) {
      console.warn('Socket nicht verfügbar - Polling-Fallback für Lobby');
      // Polling-Fallback
      const interval = setInterval(() => {
        fetch(apiUrl('/api/rooms'))
          .then(res => res.json())
          .then(data => { if (Array.isArray(data)) setRooms(data); })
          .catch(() => {});
      }, 2000);
      return () => clearInterval(interval);
    }

    // Channel abonnieren
    const channel = lobbyChannel();
    subscribeToChannel(socket, channel, playerId, playerName);

    // Event-Handler registrieren
    const handleRoomCreated = (room: Raum) => addRoom(room);
    const handleRoomUpdated = (room: Raum) => updateRoom(room);
    const handleRoomDeleted = ({ roomId }: { roomId: string }) => removeRoom(roomId);

    socket.on(EVENTS.ROOM_CREATED, handleRoomCreated);
    socket.on(EVENTS.ROOM_UPDATED, handleRoomUpdated);
    socket.on(EVENTS.ROOM_DELETED, handleRoomDeleted);

    return () => {
      socket.off(EVENTS.ROOM_CREATED, handleRoomCreated);
      socket.off(EVENTS.ROOM_UPDATED, handleRoomUpdated);
      socket.off(EVENTS.ROOM_DELETED, handleRoomDeleted);
      unsubscribeFromChannel(socket, channel);
    };
  }, [playerId, playerName, addRoom, updateRoom, removeRoom, setRooms]);

  // Raum erstellen
  const createRoom = async () => {
    if (!playerName) return;

    setIsCreating(true);
    try {
      const res = await fetch(apiUrl('/api/rooms'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          roomName: newRoomName || `${playerName}s Tisch`,
          playerId,
          playerName,
        }),
      });

      const { room } = await res.json();
      setCurrentRoom(room);
      router.push(`/game/${room.id}`);
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Raum beitreten
  const joinRoom = async (roomId: string) => {
    if (!playerName) return;

    try {
      const res = await fetch(apiUrl('/api/rooms'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          roomId,
          playerId,
          playerName,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        return error || 'Raum nicht gefunden';
      }

      const { room } = await res.json();
      setCurrentRoom(room);
      router.push(`/game/${room.id}`);
      return null;
    } catch (error) {
      console.error('Fehler beim Beitreten:', error);
      return 'Verbindungsfehler';
    }
  };

  // Mit Code beitreten
  const joinByCode = async () => {
    if (!joinCode.trim()) return;

    setJoinError('');
    const code = joinCode.trim().toUpperCase();
    const error = await joinRoom(code);

    if (error) {
      setJoinError(error);
    }
  };

  if (!playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Laden...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 safe-area-top">
      {/* Verbindungs-Indikator */}
      <ConnectionIndicator />

      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-400">Lobby</h1>
            <p className="text-gray-400 text-sm">
              Hallo, {session?.user?.name || playerName}!
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/wissen"
              onClick={() => hapticTap()}
              className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
              title="Wissen rund ums Schafkopf"
            >
              📚
            </Link>
            <Link
              href="/leaderboard"
              onClick={() => hapticTap()}
              className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
              title="Leaderboard"
            >
              🏆
            </Link>
            <UserMenu />
            <button
              onClick={() => router.push('/')}
              className="btn btn-secondary text-sm"
            >
              Zurück
            </button>
          </div>
        </div>

        {/* Link Legacy Prompt */}
        {showLinkPrompt && playerId && (
          <LinkLegacyPrompt
            legacyPlayerId={playerId}
            onLinked={() => setLinkPromptDismissed(true)}
            onDismiss={() => setLinkPromptDismissed(true)}
          />
        )}

        {/* Neuen Raum erstellen */}
        {showCreateForm ? (
          <div className="bg-gray-800 rounded-xl p-4 space-y-3">
            <h2 className="font-semibold">Neuen Tisch erstellen</h2>
            <input
              type="text"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              placeholder={`${playerName}s Tisch`}
              className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600
                         focus:border-amber-500 outline-none text-white"
              maxLength={30}
            />
            <div className="flex gap-2">
              <button
                onClick={createRoom}
                disabled={isCreating}
                className="btn btn-primary flex-1"
              >
                {isCreating ? 'Erstelle...' : 'Erstellen'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full btn btn-primary py-3"
          >
            + Neuen Tisch erstellen
          </button>
        )}

        {/* Mit Code beitreten */}
        {showJoinForm ? (
          <div className="bg-gray-800 rounded-xl p-4 space-y-3">
            <h2 className="font-semibold">Mit Code beitreten</h2>
            <input
              type="text"
              value={joinCode}
              onChange={e => {
                setJoinCode(e.target.value.toUpperCase());
                setJoinError('');
              }}
              placeholder="Raum-Code eingeben (z.B. ABC123)"
              className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600
                         focus:border-amber-500 outline-none text-white font-mono text-center text-lg tracking-widest"
              maxLength={8}
              onKeyDown={e => e.key === 'Enter' && joinByCode()}
            />
            {joinError && (
              <p className="text-red-400 text-sm text-center">{joinError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={joinByCode}
                disabled={!joinCode.trim()}
                className="btn btn-primary flex-1"
              >
                Beitreten
              </button>
              <button
                onClick={() => {
                  setShowJoinForm(false);
                  setJoinCode('');
                  setJoinError('');
                }}
                className="btn btn-secondary"
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowJoinForm(true)}
            className="w-full btn btn-secondary py-3"
          >
            🔗 Mit Code beitreten
          </button>
        )}

        {/* Raumliste */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-300">Offene Tische</h2>

          {rooms.length === 0 ? (
            <div className="bg-gray-800/50 rounded-xl p-8 text-center text-gray-400">
              <p>Keine offenen Tische vorhanden</p>
              <p className="text-sm mt-2">Erstelle einen neuen Tisch!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rooms.map(room => {
                const isMyRoom = room.spieler.some(s => s.id === playerId);
                return (
                  <RoomCard
                    key={room.id}
                    room={room}
                    playerId={playerId}
                    playerName={playerName || ''}
                    onJoin={async () => {
                      if (isMyRoom) {
                        // Bereits im Raum -> direkt zum Spiel
                        setCurrentRoom(room);
                        router.push(`/game/${room.id}`);
                      } else {
                        const error = await joinRoom(room.id);
                        if (error) alert(error);
                      }
                    }}
                    isMyRoom={isMyRoom}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Spielregeln */}
        <div className="bg-gray-800/30 rounded-lg p-4 text-xs text-gray-500">
          <p>
            Kurzes Blatt (24 Karten) • Sauspiel 10 Ct • Solo 20 Ct •
            Fehlende Spieler werden durch KI ersetzt
          </p>
        </div>

        {/* PWA Install Button */}
        <div className="flex justify-center">
          <InstallPWA />
        </div>
      </div>
    </main>
  );
}

function RoomCard({
  room,
  playerId,
  playerName,
  onJoin,
  isMyRoom,
}: {
  room: Raum;
  playerId: string;
  playerName: string;
  onJoin: () => void;
  isMyRoom: boolean;
}) {
  const spielerCount = room.spieler.length;
  const isFull = spielerCount >= 4;
  const isCreator = room.ersteller === playerId;
  // Auch löschen erlauben wenn der Raumname den Spielernamen enthält (für alte Räume)
  const canDelete = isCreator || room.name.includes(playerName);

  const deleteRoom = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Raum wirklich löschen?')) return;

    try {
      await fetch(apiUrl('/api/rooms'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', roomId: room.id, playerId, playerName }),
      });
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
      <div>
        <h3 className="font-semibold">{room.name}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>
            {spielerCount}/4 Spieler
          </span>
          {room.spieler.map(s => (
            <span
              key={s.id}
              className={`w-2 h-2 rounded-full ${s.ready ? 'bg-green-400' : 'bg-gray-500'}`}
              title={s.name}
            />
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {room.spieler.map(s => s.name).join(', ')}
        </div>
      </div>

      <div className="flex gap-2">
        {canDelete && (
          <button
            onClick={deleteRoom}
            className="btn text-sm bg-red-800 hover:bg-red-700 text-white px-2"
            title="Raum löschen"
          >
            🗑️
          </button>
        )}
        <button
          onClick={onJoin}
          disabled={isFull && !isMyRoom}
          className={`btn ${isMyRoom ? 'btn-secondary' : 'btn-primary'} ${
            isFull && !isMyRoom ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isMyRoom ? 'Zurück' : isFull ? 'Voll' : 'Beitreten'}
        </button>
      </div>
    </div>
  );
}
