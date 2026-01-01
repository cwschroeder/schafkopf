'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useGameStore, loadPlayerFromStorage } from '@/lib/store';
import { getPusherClient, EVENTS, roomChannel, subscribeToChannel, unsubscribeFromChannel } from '@/lib/pusher';
import { SpielState, Raum, Ansage, Farbe, SpielErgebnis } from '@/lib/schafkopf/types';
import Table from '@/components/Table';
import DealingAnimation from '@/components/DealingAnimation';
import GameLegen from '@/components/GameLegen';
import GameAnnounce from '@/components/GameAnnounce';
import ScoreBoard from '@/components/ScoreBoard';
import { VoiceButton } from '@/components/VoiceButton';
import { useBavarianSpeech } from '@/hooks/useBavarianSpeech';
import { playBase64Audio } from '@/lib/tts-client';
import { apiUrl } from '@/lib/api';
import {
  checkMitspielerReaktionNachStich,
  checkPartnerGefunden,
  checkAufforderungStechen,
  resetStichHistorie,
  MitspielerReaktion,
} from '@/lib/mitspieler-reaktionen';
import { AUGEN } from '@/lib/schafkopf/cards';

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
  const [isLoading, setIsLoading] = useState(false); // Für sofortiges Button-Feedback
  const [roomNotFound, setRoomNotFound] = useState(false); // Raum existiert nicht
  const [linkCopied, setLinkCopied] = useState(false); // Feedback für Link kopiert

  // Bayerische Sprachausgabe
  const { speakAnsage, speakStichGewonnen, speakMitspielerReaktion, ensureAudioReady } = useBavarianSpeech();

  // Helper: Trigger Bots wenn ein Bot dran ist (wichtig bei Page Reload)
  const triggerBotsIfNeeded = useCallback(async (state: SpielState) => {
    if (!state) return;

    // Prüfen ob ein Bot in der aktuellen Phase aktiv sein sollte
    const phase = state.phase;
    const aktuellerSpielerIndex = state.aktuellerSpieler;
    const aktuellerSpieler = state.spieler[aktuellerSpielerIndex];

    // Bot ist dran?
    const botIstDran = aktuellerSpieler?.isBot;

    // In Phasen wo Bots agieren sollten
    if ((phase === 'legen' || phase === 'ansagen' || phase === 'spielen') && botIstDran) {
      console.log('[GamePage] Bot ist dran, trigger Bots API...', { phase, bot: aktuellerSpieler?.name });
      try {
        await fetch(apiUrl('/api/game'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'triggerBots', roomId }),
        });
      } catch (e) {
        console.warn('[GamePage] triggerBots fehlgeschlagen:', e);
      }
    }
  }, [roomId]);

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

    let roomFound = false;
    let gameFound = false;

    // Beide Requests parallel starten
    Promise.all([
      // Raum-Info laden (direkt per ID)
      fetch(apiUrl(`/api/rooms?roomId=${roomId}`))
        .then(res => {
          if (res.ok) return res.json();
          return null;
        })
        .then((room: Raum | null) => {
          if (room) {
            roomFound = true;
            setWaitingRoom(room);
            setCurrentRoom(room);
          }
        })
        .catch(console.error),

      // Spielzustand laden (falls Spiel bereits läuft)
      fetch(apiUrl(`/api/game?roomId=${roomId}&playerId=${playerId}`))
        .then(res => res.ok ? res.json() : null)
        .then(state => {
          if (state) {
            gameFound = true;
            setGameState(state);
            // Wenn ein Bot dran ist, triggerBots aufrufen (wichtig bei Page Reload)
            triggerBotsIfNeeded(state);
          }
        })
        .catch(() => { /* Spiel existiert noch nicht */ })
    ]).then(() => {
      // Nach beiden Requests: Wenn weder Raum noch Spiel gefunden, zur Lobby
      if (!roomFound && !gameFound) {
        console.warn('[GamePage] Raum/Spiel nicht gefunden, redirect zur Lobby');
        setRoomNotFound(true);
      }
    });
  }, [playerId, roomId, setCurrentRoom, setGameState, triggerBotsIfNeeded]);

  // Socket.IO abonnieren
  useEffect(() => {
    if (!playerId || !playerName) return;

    const socket = getPusherClient(playerId, playerName);
    if (!socket) {
      console.warn('Socket nicht verfügbar - Polling-Fallback aktiv');
      // Polling-Fallback wenn kein Socket - jede Sekunde
      const interval = setInterval(async () => {
        // Raum-State laden (für Waiting Room)
        try {
          const roomRes = await fetch(apiUrl(`/api/rooms?roomId=${roomId}`));
          if (roomRes.ok) {
            const room = await roomRes.json();
            setWaitingRoom(room);
            setCurrentRoom(room);
          }
        } catch {}
        // Game-State laden (für laufendes Spiel)
        try {
          const gameRes = await fetch(apiUrl(`/api/game?roomId=${roomId}&playerId=${playerId}`));
          if (gameRes.ok) {
            const state = await gameRes.json();
            setGameState(state);
          }
        } catch {}
      }, 1000);
      return () => clearInterval(interval);
    }

    // Channel abonnieren
    const channel = roomChannel(roomId);
    subscribeToChannel(socket, channel, playerId, playerName);

    // Raum-Events Handler
    const handlePlayerJoined = ({ room }: { room: Raum }) => setWaitingRoom(room);
    const handlePlayerLeft = ({ room }: { room: Raum }) => setWaitingRoom(room);
    const handlePlayerReady = ({ room }: { room: Raum }) => setWaitingRoom(room);
    const handleRoomUpdated = (room: Raum) => setWaitingRoom(room);
    const handleGameStarting = ({ gameState: gs }: { gameState: SpielState }) => {
      setGameState(gs);
      setErgebnis(null);
      // Stich-Historie für Mitspieler-Reaktionen zurücksetzen
      resetStichHistorie();
    };

    // Spiel-Events Handler
    const handleGameState = () => {
      fetch(apiUrl(`/api/game?roomId=${roomId}&playerId=${playerId}`))
        .then(res => res.json())
        .then(fullState => setGameState(fullState))
        .catch(console.error);
    };

    const handleLegen = () => {
      fetch(apiUrl(`/api/game?roomId=${roomId}&playerId=${playerId}`))
        .then(res => res.json())
        .then(state => setGameState(state))
        .catch(console.error);
    };

    const handleAnsage = () => {
      fetch(apiUrl(`/api/game?roomId=${roomId}&playerId=${playerId}`))
        .then(res => res.json())
        .then(state => setGameState(state))
        .catch(console.error);
    };

    const handleKarteGespielt = (data?: { spielerId?: string; karte?: { farbe: string; wert: string } }) => {
      fetch(apiUrl(`/api/game?roomId=${roomId}&playerId=${playerId}`))
        .then(res => res.json())
        .then(state => {
          setGameState(state);

          // Prüfe: Partner gefunden? (bei Sauspiel, wenn gesuchte Sau gespielt wird)
          if (data?.karte && data?.spielerId && state.gespielteAnsage === 'sauspiel') {
            const reaktion = checkPartnerGefunden(state, data.karte as any, data.spielerId);
            if (reaktion) {
              const text = speakMitspielerReaktion(reaktion);
              setSpeechBubble({ text, playerId: reaktion.sprecherId });
              setTimeout(() => setSpeechBubble(null), 6000);
            }
          }

          // Prüfe: Aufforderung zum Stechen? (wenn 3 Karten im Stich)
          if (state.aktuellerStich.karten.length === 3) {
            const reaktion = checkAufforderungStechen(state);
            if (reaktion) {
              const text = speakMitspielerReaktion(reaktion);
              setSpeechBubble({ text, playerId: reaktion.sprecherId });
              setTimeout(() => setSpeechBubble(null), 4000); // Kürzer, da bald Stich-Ende
            }
          }
        })
        .catch(console.error);
    };

    const handleStichEnde = ({ gewinner, stichAugen }: { gewinner: string; stichAugen?: number }) => {
      // Bot-Spruch wenn Bot gewinnt
      fetch(apiUrl(`/api/game?roomId=${roomId}&playerId=${playerId}`))
        .then(res => res.json())
        .then(state => {
          // Berechne Stich-Augen falls nicht übergeben
          const augen = stichAugen ?? state.aktuellerStich.karten.reduce(
            (sum: number, k: { karte: { wert: keyof typeof AUGEN } }) => sum + AUGEN[k.karte.wert],
            0
          );

          // Erst prüfen: Mitspieler-Reaktion?
          const mitspielerReaktion = checkMitspielerReaktionNachStich(state, gewinner, augen);
          if (mitspielerReaktion) {
            const text = speakMitspielerReaktion(mitspielerReaktion);
            setSpeechBubble({ text, playerId: mitspielerReaktion.sprecherId });
            setTimeout(() => setSpeechBubble(null), 6000);
          } else {
            // Fallback: Gewinner-Bot spricht wenn Bot gewinnt
            const gewinnerSpieler = state.spieler.find((s: { id: string }) => s.id === gewinner);
            if (gewinnerSpieler?.isBot) {
              const text = speakStichGewonnen();
              setSpeechBubble({ text, playerId: gewinner });
              setTimeout(() => setSpeechBubble(null), 6000);
            }
          }
        });

      // Kurze Pause damit man alle 4 Karten sehen kann, dann Collect-Animation
      setTimeout(() => {
        setIsCollecting(true);
      }, 1200);

      // Nach Animation: State laden und nächsten Stich triggern
      setTimeout(async () => {
        setIsCollecting(false);

        const res = await fetch(apiUrl(`/api/game?roomId=${roomId}&playerId=${playerId}`));
        const state = await res.json();
        setGameState(state);

        // Wenn noch im stich-ende: nächsten Stich starten
        if (state.phase === 'stich-ende') {
          await fetch(apiUrl('/api/game'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'naechsterStich', roomId, playerId }),
          });
        }
      }, 3200);
    };

    const handleRundeEnde = ({ ergebnis: e }: { ergebnis: SpielErgebnis }) => {
      console.log('[Client] RUNDE_ENDE Event empfangen:', e);
      setErgebnis(e);
    };

    const handleBotAction = (data: { botId: string; action: string; ansage?: string; gesuchteAss?: string }) => {
      if (data.action === 'ansage' && data.ansage) {
        const text = speakAnsage(data.ansage, data.gesuchteAss);
        setSpeechBubble({ text, playerId: data.botId });
        setTimeout(() => setSpeechBubble(null), 6000);
      }

      fetch(apiUrl(`/api/game?roomId=${roomId}&playerId=${playerId}`))
        .then(res => res.json())
        .then(state => setGameState(state))
        .catch(console.error);
    };

    // Voice Message Handler (Push-to-Talk)
    const handleVoiceMessage = (data: { playerId: string; playerName: string; audioBase64: string; mimeType: string }) => {
      // Eigene Nachrichten nicht abspielen
      if (data.playerId === playerId) return;

      // Sprechblase anzeigen
      setSpeechBubble({ text: '🎤', playerId: data.playerId });

      // Audio abspielen
      playBase64Audio(data.audioBase64, data.mimeType)
        .catch(err => console.warn('[Voice] Playback error:', err))
        .finally(() => {
          // Sprechblase nach Audio-Ende ausblenden
          setTimeout(() => setSpeechBubble(null), 500);
        });
    };

    // Events registrieren
    socket.on(EVENTS.PLAYER_JOINED, handlePlayerJoined);
    socket.on(EVENTS.PLAYER_LEFT, handlePlayerLeft);
    socket.on(EVENTS.PLAYER_READY, handlePlayerReady);
    socket.on(EVENTS.ROOM_UPDATED, handleRoomUpdated);
    socket.on(EVENTS.GAME_STARTING, handleGameStarting);
    socket.on(EVENTS.GAME_STATE, handleGameState);
    socket.on(EVENTS.LEGEN, handleLegen);
    socket.on(EVENTS.ANSAGE, handleAnsage);
    socket.on(EVENTS.KARTE_GESPIELT, handleKarteGespielt);
    socket.on(EVENTS.STICH_ENDE, handleStichEnde);
    socket.on(EVENTS.RUNDE_ENDE, handleRundeEnde);
    socket.on(EVENTS.BOT_ACTION, handleBotAction);
    socket.on(EVENTS.VOICE_MESSAGE, handleVoiceMessage);

    return () => {
      socket.off(EVENTS.PLAYER_JOINED, handlePlayerJoined);
      socket.off(EVENTS.PLAYER_LEFT, handlePlayerLeft);
      socket.off(EVENTS.PLAYER_READY, handlePlayerReady);
      socket.off(EVENTS.ROOM_UPDATED, handleRoomUpdated);
      socket.off(EVENTS.GAME_STARTING, handleGameStarting);
      socket.off(EVENTS.GAME_STATE, handleGameState);
      socket.off(EVENTS.LEGEN, handleLegen);
      socket.off(EVENTS.ANSAGE, handleAnsage);
      socket.off(EVENTS.KARTE_GESPIELT, handleKarteGespielt);
      socket.off(EVENTS.STICH_ENDE, handleStichEnde);
      socket.off(EVENTS.RUNDE_ENDE, handleRundeEnde);
      socket.off(EVENTS.BOT_ACTION, handleBotAction);
      socket.off(EVENTS.VOICE_MESSAGE, handleVoiceMessage);
      unsubscribeFromChannel(socket, channel);
    };
  }, [playerId, playerName, roomId, setGameState, setWaitingRoom, setCurrentRoom, speakAnsage, speakStichGewonnen, speakMitspielerReaktion]);

  // Raum verlassen
  const leaveRoom = async () => {
    await fetch(apiUrl('/api/rooms'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'leave', roomId, playerId }),
    });
    setGameState(null);
    setCurrentRoom(null);
    router.push('/lobby');
  };

  // Raum-State neu laden
  const reloadRoomState = async () => {
    const res = await fetch(apiUrl(`/api/rooms?roomId=${roomId}`));
    if (res.ok) {
      const room = await res.json();
      setWaitingRoom(room);
      setCurrentRoom(room);
    }
  };

  // Game-State neu laden
  const reloadGameState = async () => {
    const res = await fetch(apiUrl(`/api/game?roomId=${roomId}&playerId=${playerId}`));
    if (res.ok) {
      const state = await res.json();
      setGameState(state);
    }
  };

  // Ready-Status setzen
  const toggleReady = async () => {
    const newReady = !isReady;
    setIsReady(newReady);
    await fetch(apiUrl('/api/rooms'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ready', roomId, playerId, ready: newReady }),
    });
    await reloadRoomState();
  };

  // Bots hinzufügen
  const addBots = async () => {
    await fetch(apiUrl('/api/rooms'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addBots', roomId }),
    });
    await reloadRoomState();
  };

  // Raum löschen (nur Ersteller)
  const deleteRoom = async () => {
    if (!confirm('Raum wirklich löschen?')) return;

    try {
      await fetch(apiUrl('/api/rooms'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', roomId, playerId }),
      });
      router.push('/lobby');
    } catch (e) {
      console.error('Löschen fehlgeschlagen:', e);
    }
  };

  // Einladungslink teilen/kopieren
  const shareInviteLink = async () => {
    const url = window.location.href;
    const title = waitingRoom?.name || 'Schafkopf';
    const text = `Komm zum Schafkopf-Tisch "${title}"!`;

    // Web Share API (Mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        // User cancelled or error - fall through to clipboard
      }
    }

    // Fallback: Clipboard
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (e) {
      // Fallback: Prompt
      prompt('Link kopieren:', url);
    }
  };

  // Spiel starten
  const startGame = async () => {
    fetch(apiUrl('/api/rooms'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', roomId }),
    }).then(() => reloadGameState());
  };

  // Legen-Entscheidung
  const handleLegen = (willLegen: boolean) => {
    if (isLoading) return;
    setIsLoading(true);
    ensureAudioReady();
    fetch(apiUrl('/api/game'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'legen', roomId, playerId, willLegen }),
    }).finally(() => {
      reloadGameState();
      setIsLoading(false);
    });
  };

  // Ansage machen
  const handleAnsage = (ansage: Ansage, gesuchteAss?: Farbe) => {
    if (isLoading) return;
    setIsLoading(true);
    ensureAudioReady();
    fetch(apiUrl('/api/game'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ansage', roomId, playerId, ansage, gesuchteAss }),
    }).finally(() => {
      reloadGameState();
      setIsLoading(false);
    });
  };

  // Karte spielen
  const handleCardPlay = useCallback((karteId: string) => {
    ensureAudioReady();
    setSelectedCard(null);
    setPreSelectedCard(null);
    fetch(apiUrl('/api/game'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'spielzug', roomId, playerId, karteId }),
    }).then(() => reloadGameState());
  }, [roomId, playerId, setSelectedCard, ensureAudioReady]);

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

  // Vorauswahl zurücksetzen nur wenn Karte nicht mehr auf der Hand ist
  // (ermöglicht Premove auch beim Ausspielen)
  useEffect(() => {
    if (!gameState || !preSelectedCard) return;
    const myIndex = gameState.spieler.findIndex(s => s.id === playerId);
    const mySpieler = gameState.spieler[myIndex];
    if (mySpieler && !mySpieler.hand.some(k => k.id === preSelectedCard)) {
      setPreSelectedCard(null);
    }
  }, [gameState, playerId, preSelectedCard]);

  // Neue Runde
  const handleNeueRunde = async () => {
    console.log('[Client] Neue Runde starten...');
    setErgebnis(null);
    setIsCollecting(false);
    setSelectedCard(null);
    setPreSelectedCard(null);
    // Stich-Historie für Mitspieler-Reaktionen zurücksetzen
    resetStichHistorie();

    try {
      const res = await fetch(apiUrl('/api/game'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'neueRunde', roomId, playerId }),
      });

      if (res.ok) {
        console.log('[Client] Neue Runde API erfolgreich');
        // State direkt laden falls Pusher-Event nicht kommt
        const stateRes = await fetch(apiUrl(`/api/game?roomId=${roomId}&playerId=${playerId}`));
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

  // Raum existiert nicht mehr
  if (roomNotFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-xl text-red-400">Spiel nicht gefunden</div>
        <p className="text-gray-400">Der Raum existiert nicht mehr.</p>
        <button
          onClick={() => router.push('/lobby')}
          className="btn btn-primary"
        >
          Zurück zur Lobby
        </button>
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
            <div className="flex gap-2">
              {isCreator && (
                <button onClick={deleteRoom} className="btn text-sm bg-red-800 hover:bg-red-700 text-white">
                  🗑️
                </button>
              )}
              {myPlayer ? (
                <button onClick={leaveRoom} className="btn btn-secondary text-sm">
                  Verlassen
                </button>
              ) : (
                <button onClick={() => router.push('/lobby')} className="btn btn-secondary text-sm">
                  Zur Lobby
                </button>
              )}
            </div>
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
            {/* Beitreten-Button für Besucher die noch nicht im Raum sind */}
            {!myPlayer && waitingRoom.spieler.length < 4 && (
              <button
                onClick={async () => {
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
                    if (res.ok) {
                      const { room } = await res.json();
                      setWaitingRoom(room);
                      setCurrentRoom(room);
                    }
                  } catch (e) {
                    console.error('Beitreten fehlgeschlagen:', e);
                  }
                }}
                className="btn btn-primary w-full py-3"
              >
                Beitreten
              </button>
            )}

            {/* Raum ist voll - Besucher kann nicht beitreten */}
            {!myPlayer && waitingRoom.spieler.length >= 4 && (
              <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 text-center">
                <p className="text-red-300">Dieser Tisch ist bereits voll</p>
                <button
                  onClick={() => router.push('/lobby')}
                  className="btn btn-secondary mt-2"
                >
                  Zur Lobby
                </button>
              </div>
            )}

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

            {/* Einladungs-Button */}
            <button
              onClick={shareInviteLink}
              className="btn btn-secondary w-full flex items-center justify-center gap-2"
            >
              {linkCopied ? (
                <>✓ Link kopiert!</>
              ) : (
                <>📤 Einladen</>
              )}
            </button>

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
      <main
        className="h-dvh max-h-dvh p-0 flex flex-col overflow-hidden"
        style={{ touchAction: 'manipulation' }}
      >
        {/* Spieltisch - füllt verfügbaren Platz */}
        <div className="flex-1 min-h-0 flex items-center justify-center relative p-1">
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
            playerId={playerId}
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

        {/* Push-to-Talk Button */}
        <VoiceButton
          roomId={roomId}
          playerId={playerId}
          playerName={playerName || 'Spieler'}
        />
      </main>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">Laden...</div>
    </div>
  );
}
