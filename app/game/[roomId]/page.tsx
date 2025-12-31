'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useGameStore, loadPlayerFromStorage } from '@/lib/store';
import { getPusherClient, EVENTS, roomChannel } from '@/lib/pusher';
import { SpielState, Raum, Ansage, Farbe, SpielErgebnis } from '@/lib/schafkopf/types';
import Table from '@/components/Table';
import DealingAnimation from '@/components/DealingAnimation';
import GameLegen from '@/components/GameLegen';
import GameAnnounce from '@/components/GameAnnounce';
import ScoreBoard from '@/components/ScoreBoard';
import { useBavarianSpeech } from '@/hooks/useBavarianSpeech';

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  const {
    playerId,
    playerName,
    setPlayer,
    currentRoom,
    setCurrentRoom,
    gameState,
    setGameState,
    selectedCard,
    setSelectedCard,
  } = useGameStore();

  const [waitingRoom, setWaitingRoom] = useState<Raum | null>(null);
  const [ergebnis, setErgebnis] = useState<SpielErgebnis | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showDealingAnimation, setShowDealingAnimation] = useState(false);
  const [lastGameId, setLastGameId] = useState<string | null>(null);
  const [preSelectedCard, setPreSelectedCard] = useState<string | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<{ text: string; playerId: string } | null>(null);

  // Bayerische Sprachausgabe
  const { speakAnsage, speakStichGewonnen } = useBavarianSpeech();

  // Animation bei neuem Spiel zeigen
  useEffect(() => {
    if (!gameState) return;

    // Eindeutige ID für dieses Spiel (ändert sich bei neuer Runde)
    const currentGameId = `${gameState.id}-${gameState.stichNummer}-${gameState.legenEntscheidungen.length}`;

    // Wenn frisches Spiel und noch nicht für dieses Spiel animiert
    if (
      gameState.phase === 'legen' &&
      gameState.stichNummer === 0 &&
      gameState.legenEntscheidungen.length === 0 &&
      lastGameId !== currentGameId
    ) {
      setShowDealingAnimation(true);
      setLastGameId(currentGameId);
    }
  }, [gameState, lastGameId]);

  // Spieler laden
  useEffect(() => {
    const stored = loadPlayerFromStorage();
    if (stored) {
      setPlayer(stored.id, stored.name);
    } else {
      router.push('/');
    }
  }, [setPlayer, router]);

  // Raum-Daten laden
  useEffect(() => {
    if (!playerId) return;

    // Raum-Info laden (direkt per ID)
    fetch(`/api/rooms?roomId=${roomId}`)
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then((room: Raum | null) => {
        if (room) {
          setWaitingRoom(room);
          setCurrentRoom(room);
        }
      })
      .catch(console.error);

    // Spielzustand laden (falls Spiel bereits läuft)
    // 404 ist normal wenn Spiel noch nicht gestartet
    fetch(`/api/game?roomId=${roomId}&playerId=${playerId}`)
      .then(res => res.ok ? res.json() : null)
      .then(state => { if (state) setGameState(state); })
      .catch(() => { /* Spiel existiert noch nicht */ });
  }, [playerId, roomId, setCurrentRoom, setGameState]);

  // Pusher abonnieren
  useEffect(() => {
    if (!playerId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(roomChannel(roomId));

    // Raum-Events
    channel.bind(EVENTS.PLAYER_JOINED, ({ room }: { room: Raum }) => {
      setWaitingRoom(room);
    });

    channel.bind(EVENTS.PLAYER_LEFT, ({ room }: { room: Raum }) => {
      setWaitingRoom(room);
    });

    channel.bind(EVENTS.PLAYER_READY, ({ room }: { room: Raum }) => {
      setWaitingRoom(room);
    });

    channel.bind(EVENTS.ROOM_UPDATED, (room: Raum) => {
      setWaitingRoom(room);
    });

    channel.bind(EVENTS.GAME_STARTING, ({ gameState }: { gameState: SpielState }) => {
      setGameState(gameState);
      setErgebnis(null);
    });

    // Spiel-Events
    channel.bind(EVENTS.GAME_STATE, (state: Partial<SpielState>) => {
      // Fetch full state für eigene Karten
      fetch(`/api/game?roomId=${roomId}&playerId=${playerId}`)
        .then(res => res.json())
        .then(fullState => setGameState(fullState))
        .catch(console.error);
    });

    channel.bind(EVENTS.LEGEN, () => {
      // State neu laden nach Legen-Entscheidung
      fetch(`/api/game?roomId=${roomId}&playerId=${playerId}`)
        .then(res => res.json())
        .then(state => setGameState(state))
        .catch(console.error);
    });

    channel.bind(EVENTS.STICH_ENDE, ({ gewinner }: { gewinner: string }) => {
      // Bot-Spruch wenn Bot gewinnt
      fetch(`/api/game?roomId=${roomId}&playerId=${playerId}`)
        .then(res => res.json())
        .then(state => {
          const gewinnerSpieler = state.spieler.find((s: { id: string }) => s.id === gewinner);
          if (gewinnerSpieler?.isBot) {
            const text = speakStichGewonnen();
            setSpeechBubble({ text, playerId: gewinner });
            setTimeout(() => setSpeechBubble(null), 2500);
          }
        });

      // Collect-Animation starten
      setIsCollecting(true);

      // Nach Animation: State laden und nächsten Stich triggern
      setTimeout(async () => {
        setIsCollecting(false);

        const res = await fetch(`/api/game?roomId=${roomId}&playerId=${playerId}`);
        const state = await res.json();
        setGameState(state);

        // Wenn noch im stich-ende: nächsten Stich starten
        if (state.phase === 'stich-ende') {
          await fetch('/api/game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'naechsterStich', roomId, playerId }),
          });
        }
      }, 2000);
    });

    channel.bind(EVENTS.RUNDE_ENDE, ({ ergebnis }: { ergebnis: SpielErgebnis }) => {
      console.log('[Client] RUNDE_ENDE Event empfangen:', ergebnis);
      setErgebnis(ergebnis);
    });

    // Bot-Events
    channel.bind(EVENTS.BOT_ACTION, (data: { botId: string; action: string; ansage?: string; gesuchteAss?: string }) => {
      // Sprachausgabe bei Ansagen
      if (data.action === 'ansage' && data.ansage) {
        const text = speakAnsage(data.ansage, data.gesuchteAss);
        setSpeechBubble({ text, playerId: data.botId });
        setTimeout(() => setSpeechBubble(null), 2500);
      }

      // State neu laden nach Bot-Aktion
      fetch(`/api/game?roomId=${roomId}&playerId=${playerId}`)
        .then(res => res.json())
        .then(state => setGameState(state))
        .catch(console.error);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(roomChannel(roomId));
    };
  }, [playerId, roomId, setGameState, speakAnsage, speakStichGewonnen]);

  // Raum verlassen
  const leaveRoom = async () => {
    await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'leave', roomId, playerId }),
    });
    setGameState(null);
    setCurrentRoom(null);
    router.push('/lobby');
  };

  // Ready-Status setzen
  const toggleReady = async () => {
    const newReady = !isReady;
    setIsReady(newReady);
    await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ready', roomId, playerId, ready: newReady }),
    });
  };

  // Bots hinzufügen
  const addBots = async () => {
    await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addBots', roomId }),
    });
  };

  // Spiel starten
  const startGame = async () => {
    await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', roomId }),
    });
  };

  // Legen-Entscheidung
  const handleLegen = async (willLegen: boolean) => {
    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'legen', roomId, playerId, willLegen }),
    });
  };

  // Ansage machen
  const handleAnsage = async (ansage: Ansage, gesuchteAss?: Farbe) => {
    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ansage', roomId, playerId, ansage, gesuchteAss }),
    });
  };

  // Karte spielen
  const handleCardPlay = useCallback(async (karteId: string) => {
    setSelectedCard(null);
    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'spielzug', roomId, playerId, karteId }),
    });
  }, [roomId, playerId, setSelectedCard]);

  // Auto-Play: Wenn ich am Zug bin und eine Karte vorausgewählt habe
  useEffect(() => {
    if (!gameState || !playerId || !preSelectedCard) return;

    const myIndex = gameState.spieler.findIndex(s => s.id === playerId);
    const isMyTurn = gameState.aktuellerSpieler === myIndex && gameState.phase === 'spielen';

    if (isMyTurn) {
      // Kurze Verzögerung für bessere UX
      const timer = setTimeout(() => {
        handleCardPlay(preSelectedCard);
        setPreSelectedCard(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [gameState, playerId, preSelectedCard, handleCardPlay]);

  // Vorauswahl zurücksetzen bei neuem Stich
  useEffect(() => {
    if (gameState?.aktuellerStich.karten.length === 0) {
      setPreSelectedCard(null);
    }
  }, [gameState?.aktuellerStich.karten.length]);

  // Neue Runde
  const handleNeueRunde = async () => {
    console.log('[Client] Neue Runde starten...');
    setErgebnis(null);
    setIsCollecting(false);
    setSelectedCard(null);
    setPreSelectedCard(null);

    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'neueRunde', roomId, playerId }),
      });

      if (res.ok) {
        console.log('[Client] Neue Runde API erfolgreich');
        // State direkt laden falls Pusher-Event nicht kommt
        const stateRes = await fetch(`/api/game?roomId=${roomId}&playerId=${playerId}`);
        const newState = await stateRes.json();
        console.log('[Client] Neuer State geladen:', newState.phase);
        setGameState(newState);
      } else {
        console.error('[Client] Neue Runde fehlgeschlagen:', await res.text());
      }
    } catch (error) {
      console.error('[Client] Fehler bei neuer Runde:', error);
    }
  };

  if (!playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Laden...</div>
      </div>
    );
  }

  // Warte-Lobby anzeigen wenn Spiel noch nicht gestartet
  if (!gameState && waitingRoom) {
    const myPlayer = waitingRoom.spieler.find(s => s.id === playerId);
    const isCreator = waitingRoom.ersteller === playerId;
    const allReady = waitingRoom.spieler.every(s => s.ready);
    const canStart = waitingRoom.spieler.length === 4 && allReady;

    return (
      <main className="min-h-screen p-4">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-amber-400">{waitingRoom.name}</h1>
            <button onClick={leaveRoom} className="btn btn-secondary text-sm">
              Verlassen
            </button>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 space-y-4">
            <h2 className="font-semibold">
              Spieler ({waitingRoom.spieler.length}/4)
            </h2>

            <div className="space-y-2">
              {waitingRoom.spieler.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{i + 1}.</span>
                    <span>{s.name}</span>
                    {s.isBot && <span className="text-xs text-gray-400">🤖</span>}
                    {s.id === waitingRoom.ersteller && (
                      <span className="text-xs text-amber-400">👑</span>
                    )}
                  </div>
                  <span
                    className={`text-sm ${s.ready ? 'text-green-400' : 'text-gray-500'}`}
                  >
                    {s.ready ? 'Bereit' : 'Wartet...'}
                  </span>
                </div>
              ))}

              {/* Leere Plätze */}
              {Array.from({ length: 4 - waitingRoom.spieler.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center justify-center bg-gray-700/50 rounded-lg px-4 py-2 text-gray-500 border-2 border-dashed border-gray-600"
                >
                  Leer
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {myPlayer && !myPlayer.ready && (
              <button onClick={toggleReady} className="btn btn-primary w-full py-3">
                Bereit
              </button>
            )}

            {myPlayer?.ready && (
              <button
                onClick={toggleReady}
                className="btn btn-secondary w-full"
              >
                Doch nicht bereit
              </button>
            )}

            {isCreator && waitingRoom.spieler.length < 4 && (
              <button onClick={addBots} className="btn btn-secondary w-full">
                Mit Bots auffüllen
              </button>
            )}

            {isCreator && canStart && (
              <button onClick={startGame} className="btn btn-primary w-full py-3">
                Spiel starten!
              </button>
            )}
          </div>

          <p className="text-center text-gray-500 text-sm">
            Raum-Code: <span className="font-mono text-amber-400">{roomId}</span>
          </p>
        </div>
      </main>
    );
  }

  // Spiel läuft
  if (gameState) {
    const myIndex = gameState.spieler.findIndex(s => s.id === playerId);
    const mySpieler = gameState.spieler[myIndex];
    const isMyTurnToAnnounce =
      gameState.phase === 'ansagen' && gameState.aktuellerAnsager === myIndex;
    const shouldShowLegen =
      gameState.phase === 'legen' &&
      !gameState.legenEntscheidungen.includes(playerId) &&
      !showDealingAnimation;

    // Animation nur bei frischem Spiel zeigen
    const shouldShowAnimation =
      showDealingAnimation &&
      gameState.phase === 'legen' &&
      gameState.legenEntscheidungen.length === 0;

    // Spieler-Positionen relativ zu mir
    const getRelativePosition = (offset: number): 'bottom' | 'right' | 'top' | 'left' => {
      const positions: ('bottom' | 'right' | 'top' | 'left')[] = ['bottom', 'right', 'top', 'left'];
      return positions[offset];
    };

    const playerPositions = [0, 1, 2, 3].map(offset => ({
      position: getRelativePosition(offset),
      name: gameState.spieler[(myIndex + offset) % 4].name,
    }));

    return (
      <main className="min-h-screen p-2 sm:p-4 flex flex-col">
        {/* Spieltisch */}
        <div className="flex-1 flex items-center justify-center relative">
          <Table
            state={gameState}
            myPlayerId={playerId}
            selectedCard={selectedCard}
            preSelectedCard={preSelectedCard}
            onCardSelect={setSelectedCard}
            onCardPreSelect={setPreSelectedCard}
            onCardPlay={handleCardPlay}
            isCollecting={isCollecting}
            speechBubble={speechBubble}
          />

          {/* Austeil-Animation */}
          {shouldShowAnimation && (
            <DealingAnimation
              playerPositions={playerPositions}
              onComplete={() => setShowDealingAnimation(false)}
            />
          )}
        </div>

        {/* Legen-Dialog - oben positioniert */}
        {shouldShowLegen && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
            <GameLegen onLegen={handleLegen} kartenAnzahl={3} />
          </div>
        )}

        {/* Ansage-Dialog - oben positioniert damit Karten sichtbar bleiben */}
        {isMyTurnToAnnounce && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
            <GameAnnounce
              hand={mySpieler.hand}
              onAnsage={handleAnsage}
              bisherigeHoechsteAnsage={gameState.gespielteAnsage}
            />
          </div>
        )}

        {/* Ergebnis-Overlay */}
        {ergebnis && (
          <ScoreBoard
            ergebnis={ergebnis}
            spieler={gameState.spieler}
            spielmacherId={gameState.spielmacher!}
            partnerId={gameState.partner}
            onNeueRunde={handleNeueRunde}
            onBeenden={leaveRoom}
          />
        )}

        {/* Karte spielen Button (wenn ausgewählt und am Zug) */}
        {selectedCard && gameState.phase === 'spielen' && gameState.aktuellerSpieler === myIndex && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2">
            <button
              onClick={() => handleCardPlay(selectedCard)}
              className="btn btn-primary px-6 py-2 text-base shadow-lg animate-pulse"
            >
              ▶ Spielen
            </button>
          </div>
        )}

        {/* Verlassen-Button */}
        <button
          onClick={leaveRoom}
          className="fixed top-2 right-2 btn btn-secondary text-xs opacity-50 hover:opacity-100"
        >
          Verlassen
        </button>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">Laden...</div>
    </div>
  );
}
