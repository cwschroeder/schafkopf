'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useGameStore, loadPlayerFromStorage } from '@/lib/store';
import { getPusherClient, EVENTS, roomChannel, subscribeToChannel, unsubscribeFromChannel } from '@/lib/pusher';
import { SpielState, Raum, Ansage, Farbe, SpielErgebnis } from '@/lib/schafkopf/types';
import Table from '@/components/Table';
import DealingAnimation from '@/components/DealingAnimation';
import GameLegen from '@/components/GameLegen';
import GameAnnounce from '@/components/GameAnnounce';
import ScoreBoard from '@/components/ScoreBoard';
import { VoiceButton } from '@/components/VoiceButton';
import { ConnectionIndicator } from '@/components/ConnectionIndicator';
import { useBavarianSpeech } from '@/hooks/useBavarianSpeech';
import { playBase64Audio } from '@/lib/tts-client';
import { apiUrl } from '@/lib/api';
import { hapticTap, hapticMedium, hapticAnsage, hapticGewonnen, hapticVerloren } from '@/lib/haptics';
import {
  checkMitspielerReaktionNachStich,
  checkPartnerGefunden,
  checkAufforderungStechen,
  resetStichHistorie,
  MitspielerReaktion,
} from '@/lib/mitspieler-reaktionen';
import { AUGEN } from '@/lib/schafkopf/cards';
import FeedbackButton from '@/components/feedback/FeedbackButton';

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const hintsEnabled = searchParams.get('hints') === 'true';

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
  const [notInGame, setNotInGame] = useState(false); // Spieler ist nicht in diesem Spiel
  const [linkCopied, setLinkCopied] = useState(false); // Feedback für Link kopiert
  const skipErgebnisReloadRef = useRef(false); // Verhindert Reload nach "Neue Runde" bis neues RUNDE_ENDE

  // Bayerische Sprachausgabe
  const {
    speakAnsage,
    speakStichGewonnen,
    speakMitspielerReaktion,
    speakKartenKommentar,
    speakLegen,
    speakAusIs,
    ensureAudioReady
  } = useBavarianSpeech();

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

  // Ergebnis aus GameState laden wenn vorhanden (für späte Joiner)
  useEffect(() => {
    if (!gameState) return;

    // Skip-Flag zurücksetzen wenn neues Spiel begonnen hat (nicht mehr runde-ende)
    if (gameState.phase !== 'runde-ende' && skipErgebnisReloadRef.current) {
      console.log('[Client] Neues Spiel erkannt, Skip-Flag zurückgesetzt');
      skipErgebnisReloadRef.current = false;
    }

    if (gameState.phase === 'runde-ende' && gameState.ergebnis && !ergebnis) {
      // Prüfen ob wir gerade "Neue Runde" geklickt haben
      if (skipErgebnisReloadRef.current) {
        console.log('[Client] Ergebnis-Reload übersprungen (Neue Runde in Bearbeitung)');
        return;
      }
      console.log('[Client] Ergebnis aus GameState geladen:', gameState.ergebnis);
      setErgebnis(gameState.ergebnis);
    }
  }, [gameState, ergebnis]);

  // Animation-Flag zurücksetzen wenn Animation nicht mehr gezeigt werden sollte
  // (z.B. nach State-Sync wenn schon Entscheidungen getroffen wurden)
  useEffect(() => {
    if (!gameState || !showDealingAnimation) return;

    // Wenn wir in einer Phase sind wo Animation nicht mehr passt, zurücksetzen
    const shouldClearAnimation =
      gameState.phase !== 'legen' ||
      gameState.legenEntscheidungen.length > 0;

    if (shouldClearAnimation) {
      console.log('[Animation] Resetting animation flag - past animation point');
      setShowDealingAnimation(false);
    }
  }, [gameState, showDealingAnimation]);

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
        .then(async res => {
          if (res.ok) return res.json();
          // 403 = Spieler nicht in diesem Spiel
          if (res.status === 403) {
            const data = await res.json();
            if (data.code === 'PLAYER_NOT_IN_GAME') {
              setNotInGame(true);
            }
          }
          return null;
        })
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
          } else if (gameRes.status === 403) {
            setNotInGame(true);
          }
        } catch {}
      }, 1000);
      return () => clearInterval(interval);
    }

    // Channel abonnieren
    const channel = roomChannel(roomId);
    subscribeToChannel(socket, channel, playerId, playerName);

    // Reconnect-Handler: Nach Verbindungsverlust State synchronisieren
    const handleReconnect = async () => {
      console.log('[Socket] Reconnected - synchronisiere State...');
      // Channel neu abonnieren
      subscribeToChannel(socket, channel, playerId, playerName);

      // Aktuellen Game-State vom Server holen
      try {
        const gameRes = await fetch(apiUrl(`/api/game?roomId=${roomId}&playerId=${playerId}`));
        if (gameRes.ok) {
          const state = await gameRes.json();
          if (state && state.phase) {
            console.log('[Socket] Game-State synchronisiert:', state.phase);
            setGameState(state);
          }
        }
      } catch (e) {
        console.warn('[Socket] State-Sync fehlgeschlagen:', e);
      }

      // Raum-State auch aktualisieren
      try {
        const roomRes = await fetch(apiUrl(`/api/rooms?roomId=${roomId}`));
        if (roomRes.ok) {
          const room = await roomRes.json();
          setWaitingRoom(room);
          setCurrentRoom(room);
        }
      } catch {}
    };

    socket.on('connect', handleReconnect);

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

    // Debug: Prüfe empfangenen State auf versteckte Karten
    const debugCheckState = (state: SpielState, source: string) => {
      const mySpieler = state.spieler.find((s: { id: string }) => s.id === playerId);
      if (mySpieler) {
        const hiddenCards = mySpieler.hand.filter((k: { id: string }) => k.id === 'hidden');
        if (hiddenCards.length > 0) {
          console.error(`[${source}] BUG: Eigene Karten sind versteckt!`, {
            playerId,
            hiddenCount: hiddenCards.length,
            allCardIds: mySpieler.hand.map((k: { id: string }) => k.id),
            phase: state.phase,
          });
        }
      }
    };

    // Spiel-Events Handler
    const handleGameState = () => {
      fetch(apiUrl(`/api/game?roomId=${roomId}&playerId=${playerId}`))
        .then(res => res.json())
        .then(fullState => {
          debugCheckState(fullState, 'handleGameState');
          setGameState(fullState);
        })
        .catch(console.error);
    };

    const handleLegen = () => {
      fetch(apiUrl(`/api/game?roomId=${roomId}&playerId=${playerId}`))
        .then(res => res.json())
        .then(state => {
          debugCheckState(state, 'handleLegen');
          setGameState(state);
        })
        .catch(console.error);
    };

    const handleAnsage = () => {
      fetch(apiUrl(`/api/game?roomId=${roomId}&playerId=${playerId}`))
        .then(res => res.json())
        .then(state => {
          debugCheckState(state, 'handleAnsage');
          setGameState(state);
        })
        .catch(console.error);
    };

    const handleKarteGespielt = (data?: {
      spielerId?: string;
      karte?: { farbe: string; wert: string };
      mitspielerReaktion?: { sprecherId: string; sprecherName: string; text: string; speech: string };
    }) => {
      fetch(apiUrl(`/api/game?roomId=${roomId}&playerId=${playerId}`))
        .then(res => res.json())
        .then(state => {
          debugCheckState(state, 'handleKarteGespielt');
          setGameState(state);

          // Prüfe: Verpasst Stechen Reaktion vom Server?
          if (data?.mitspielerReaktion) {
            const { sprecherId, sprecherName, text, speech } = data.mitspielerReaktion;
            // Reaktion abspielen mit Bot-Stimme
            speakMitspielerReaktion({
              situation: 'verpasst-stechen',
              sprecherId,
              sprecherName,
              phrase: { text, speech },
            });
            setSpeechBubble({ text, playerId: sprecherId });
            setTimeout(() => setSpeechBubble(null), 6000);
            return; // Keine weitere Reaktion in diesem Zug
          }

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
              // Bot-Name für Bot-spezifische Stimme übergeben
              const text = speakStichGewonnen(gewinnerSpieler.name);
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
      // Skip-Flag zurücksetzen damit dieses neue Ergebnis angezeigt wird
      skipErgebnisReloadRef.current = false;
      setErgebnis(e);

      // "Aus is!" Spruch abspielen (zufällig ein Bot sagt es)
      if (gameState) {
        const bots = gameState.spieler.filter(s => s.isBot);
        if (bots.length > 0) {
          const randomBot = bots[Math.floor(Math.random() * bots.length)];
          // Kurze Verzögerung damit es nach dem letzten Stich kommt
          setTimeout(() => {
            const text = speakAusIs(randomBot.name);
            setSpeechBubble({ text, playerId: randomBot.id });
            setTimeout(() => setSpeechBubble(null), 5000);
          }, 1000);
        }
      }
    };

    const handleBotAction = (data: { botId: string; botName?: string; action: string; ansage?: string; gesuchteAss?: string; karteId?: string; willLegen?: boolean }) => {
      // Ansage
      if (data.action === 'ansage' && data.ansage) {
        // Nur bei echten Ansagen Audio abspielen (nicht bei "weiter"/Passen)
        if (data.ansage !== 'weiter') {
          const text = speakAnsage(data.ansage, data.gesuchteAss, data.botName);
          setSpeechBubble({ text, playerId: data.botId });
          setTimeout(() => setSpeechBubble(null), 6000);
        }
      }

      // Legen (Verdoppeln)
      if (data.action === 'legen' && data.willLegen !== undefined) {
        const text = speakLegen(data.willLegen, data.botName);
        setSpeechBubble({ text, playerId: data.botId });
        setTimeout(() => setSpeechBubble(null), 4000);
      }

      // Spielzug (Karte spielen) - manchmal kommentieren
      if (data.action === 'spielzug' && data.karteId) {
        const [farbe, wert] = data.karteId.split('-');
        const text = speakKartenKommentar(farbe, wert, data.botName);
        if (text) {
          setSpeechBubble({ text, playerId: data.botId });
          setTimeout(() => setSpeechBubble(null), 4000);
        }
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
      socket.off('connect', handleReconnect);
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
  }, [playerId, playerName, roomId, setGameState, setWaitingRoom, setCurrentRoom, speakAnsage, speakStichGewonnen, speakMitspielerReaktion, speakKartenKommentar, speakLegen, speakAusIs, gameState]);

  // Periodischer State-Sync falls keine Push-Events kommen
  useEffect(() => {
    if (!playerId || !roomId) return;

    let lastEventTime = Date.now();
    const SYNC_INTERVAL = 10000; // 10 Sekunden
    const STALE_THRESHOLD = 15000; // Sync wenn 15s kein Event kam

    // Event-Listener um lastEventTime zu aktualisieren
    const socket = getPusherClient();
    const updateLastEvent = () => {
      lastEventTime = Date.now();
    };

    // Bei jedem relevanten Event Zeit aktualisieren
    if (socket) {
      socket.onAny(updateLastEvent);
    }

    // Periodisch prüfen ob State stale ist
    const interval = setInterval(async () => {
      const timeSinceLastEvent = Date.now() - lastEventTime;
      if (timeSinceLastEvent > STALE_THRESHOLD) {
        console.log('[Sync] Keine Events seit', Math.round(timeSinceLastEvent / 1000), 's - hole aktuellen State');

        // Game-State holen
        try {
          const gameRes = await fetch(apiUrl(`/api/game?roomId=${roomId}&playerId=${playerId}`));
          if (gameRes.ok) {
            const state = await gameRes.json();
            if (state && state.phase) {
              console.log('[Sync] GameState geladen - Phase:', state.phase, 'LegenEntscheidungen:', state.legenEntscheidungen?.length || 0);
              setGameState(state);
            }
          }
        } catch {}

        // Room-State holen
        try {
          const roomRes = await fetch(apiUrl(`/api/rooms?roomId=${roomId}`));
          if (roomRes.ok) {
            const room = await roomRes.json();
            if (room && room.id) {
              setWaitingRoom(room);
              setCurrentRoom(room);
            }
          }
        } catch {}

        lastEventTime = Date.now(); // Reset nach Sync
      }
    }, SYNC_INTERVAL);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.offAny(updateLastEvent);
      }
    };
  }, [playerId, roomId, setGameState, setWaitingRoom, setCurrentRoom]);

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
    hapticTap(); // Haptisches Feedback
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
    hapticAnsage(); // Haptisches Feedback
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
    if (isLoading) return; // Verhindere Doppelklicks
    hapticMedium(); // Haptisches Feedback
    setIsLoading(true);
    ensureAudioReady();
    setSelectedCard(null);
    setPreSelectedCard(null);
    fetch(apiUrl('/api/game'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'spielzug', roomId, playerId, karteId }),
    }).finally(() => {
      reloadGameState();
      setIsLoading(false);
    });
  }, [roomId, playerId, setSelectedCard, ensureAudioReady, isLoading]);

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
    // Reload des alten Ergebnisses verhindern bis neues Spiel startet
    skipErgebnisReloadRef.current = true;
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <div className="text-lg text-amber-200">Verbinde...</div>
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

  // Spieler nicht in diesem Spiel (z.B. Practice-Raum eines anderen Spielers)
  if (notInGame) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-xl text-amber-400">Kein Zugriff</div>
        <p className="text-gray-400 text-center">
          Du bist nicht Teil dieses Spiels.
          {waitingRoom && waitingRoom.spieler.length >= 4 && (
            <span className="block mt-1">Der Tisch ist bereits voll.</span>
          )}
        </p>
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
      <main className="min-h-screen p-4 safe-area-top">
        {/* Verbindungs-Indikator */}
        <ConnectionIndicator />

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
        className="h-dvh max-h-dvh p-0 flex flex-col overflow-hidden safe-area-top"
        style={{ touchAction: 'manipulation' }}
      >
        {/* Header mit Exit-Button - z-[60] damit über Modalen (z-50) */}
        <div className="flex justify-between items-center px-2 py-1 z-[60] relative">
          <ConnectionIndicator />
          <div className="flex items-center gap-2">
            <FeedbackButton variant="header" />
            <button
              onClick={leaveRoom}
              className="text-xs px-2 py-2 rounded bg-gray-800/90 text-gray-300 hover:text-white hover:bg-red-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <span className="sm:hidden">✕</span>
              <span className="hidden sm:inline">✕ Verlassen</span>
            </button>
          </div>
        </div>

        {/* Spieltisch - füllt verfügbaren Platz, z-[41] damit Karten über Bottom-Sheet-Backdrop (z-40) sichtbar */}
        <div className="flex-1 min-h-0 flex items-center justify-center relative p-1 z-[41]">
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
            hintsEnabled={hintsEnabled}
          />

          {/* Austeil-Animation */}
          {shouldShowAnimation && (
            <DealingAnimation
              playerPositions={playerPositions}
              onComplete={() => setShowDealingAnimation(false)}
            />
          )}
        </div>

        {/* Legen-Dialog - Bottom Sheet */}
        {shouldShowLegen && (
          <GameLegen
            onLegen={handleLegen}
            kartenAnzahl={3}
            karten={mySpieler?.hand.slice(0, 3)}
            hintsEnabled={hintsEnabled}
            spieler={gameState.spieler}
            legenEntscheidungen={gameState.legenEntscheidungen || []}
            myPlayerId={playerId}
          />
        )}

        {/* Ansage-Dialog - Bottom Sheet */}
        {isMyTurnToAnnounce && (
          <GameAnnounce
            hand={mySpieler.hand}
            onAnsage={handleAnsage}
            bisherigeHoechsteAnsage={gameState.gespielteAnsage}
            bisherigeAnsagen={
              // Sammle bisherige Ansagen von allen Spielern die schon angesagt haben
              gameState.spieler
                .filter(s => s.hatAngesagt && s.ansage)
                .map(s => ({ position: s.position, ansage: s.ansage! }))
            }
            hintsEnabled={hintsEnabled}
            spieler={gameState.spieler}
          />
        )}

        {/* Ergebnis-Overlay */}
        {ergebnis && (
          <ScoreBoard
            ergebnis={ergebnis}
            spieler={gameState.spieler}
            playerId={playerId}
            playerName={playerName || undefined}
            onNeueRunde={handleNeueRunde}
            onBeenden={leaveRoom}
          />
        )}

        {/* Karte spielen Button (wenn ausgewählt und am Zug) */}
        {selectedCard && gameState.phase === 'spielen' && gameState.aktuellerSpieler === myIndex && (
          <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-30">
            <button
              onClick={() => handleCardPlay(selectedCard)}
              className="btn btn-primary px-8 py-3 text-lg font-bold shadow-xl animate-pulse min-w-[120px]"
              style={{
                boxShadow: '0 4px 20px rgba(212,175,55,0.5), 0 0 40px rgba(212,175,55,0.3)',
              }}
            >
              Spielen
            </button>
          </div>
        )}

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
