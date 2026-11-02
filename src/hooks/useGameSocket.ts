import { useState, useEffect, useRef, useCallback } from 'react';
import { RoomState, Player, ServerMessage } from '../types/game';

interface UseGameSocketProps {
  roomId?: string;
  initialPlayerId?: string | null;
}

export function useGameSocket({ roomId = 'classroom', initialPlayerId = null }: UseGameSocketProps = {}) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(() => {
    if (initialPlayerId) return initialPlayerId;
    try {
      return localStorage.getItem('pc_puzzle_player_id') || null;
    } catch {
      return null;
    }
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  // Helper to fetch latest state via REST
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/game/state?roomId=${encodeURIComponent(roomId)}`);
      if (res.ok) {
        const data = await res.json();
        setRoomState(data.state);
        setIsConnected(true);
      }
    } catch (err) {
      console.warn('REST state fetch failed:', err);
    }
  }, [roomId]);

  // Connect via WebSocket with SSE fallback
  useEffect(() => {
    fetchState();

    // Determine WS protocol based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?roomId=${encodeURIComponent(roomId)}${
      playerId ? `&playerId=${encodeURIComponent(playerId)}` : ''
    }`;

    let isUnmounted = false;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmounted) return;
        setIsConnected(true);
        ws.send(JSON.stringify({ type: 'join', roomId, playerId: playerId || undefined }));
      };

      ws.onmessage = (event) => {
        if (isUnmounted) return;
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          if (msg.type === 'room_state' || msg.type === 'room_reset') {
            setRoomState(msg.state);
          } else if (msg.type === 'player_registered' || msg.type === 'player_updated') {
            setRoomState((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                players: {
                  ...prev.players,
                  [msg.player.id]: msg.player,
                },
              };
            });
          } else if (msg.type === 'game_started') {
            setRoomState((prev) => (prev ? { ...prev, status: 'in-progress', startedAt: msg.startedAt } : null));
          } else if (msg.type === 'error') {
            setErrorMsg(msg.message);
          }
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      ws.onerror = () => {
        // Fallback to SSE if WS encounters issue
        if (!sseRef.current && !isUnmounted) {
          initSSE();
        }
      };

      ws.onclose = () => {
        if (!isUnmounted && !sseRef.current) {
          initSSE();
        }
      };
    } catch {
      initSSE();
    }

    function initSSE() {
      try {
        const sse = new EventSource(`/api/game/events?roomId=${encodeURIComponent(roomId)}`);
        sseRef.current = sse;

        sse.onmessage = (e) => {
          if (isUnmounted) return;
          try {
            const msg: ServerMessage = JSON.parse(e.data);
            if (msg.type === 'room_state' || msg.type === 'room_reset') {
              setRoomState(msg.state);
            } else if (msg.type === 'player_registered' || msg.type === 'player_updated') {
              setRoomState((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  players: {
                    ...prev.players,
                    [msg.player.id]: msg.player,
                  },
                };
              });
            } else if (msg.type === 'game_started') {
              setRoomState((prev) => (prev ? { ...prev, status: 'in-progress', startedAt: msg.startedAt } : null));
            }
          } catch {
            // Ignore
          }
        };

        sse.onopen = () => {
          if (!isUnmounted) setIsConnected(true);
        };
      } catch (err) {
        console.warn('SSE fallback failed, relying on REST polling', err);
      }
    }

    // Secondary heartbeat polling every 4 seconds to guarantee state alignment
    const pollId = window.setInterval(fetchState, 4000);
    pollIntervalRef.current = pollId;

    return () => {
      isUnmounted = true;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (sseRef.current) {
        sseRef.current.close();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [roomId, playerId, fetchState]);

  // Current player from roomState
  const currentPlayer: Player | null =
    playerId && roomState?.players ? roomState.players[playerId] || null : null;

  // Register player action
  const registerPlayer = async (name: string, isHost: boolean = false) => {
    setErrorMsg(null);
    try {
      const res = await fetch('/api/game/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, name, isHost }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to register.');
        return { success: false, error: data.error };
      }

      setPlayerId(data.player.id);
      try {
        localStorage.setItem('pc_puzzle_player_id', data.player.id);
      } catch {
        // Storage might be restricted
      }
      setRoomState(data.state);
      return { success: true, player: data.player };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error.';
      setErrorMsg(msg);
      return { success: false, error: msg };
    }
  };

  // Start game action
  const startGame = async () => {
    try {
      const res = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      const data = await res.json();
      if (data.state) {
        setRoomState(data.state);
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to start' };
    }
  };

  // Submit level answer
  const submitAnswer = async (payload: {
    levelNumber: number;
    isCorrect: boolean;
    timeSpentSeconds: number;
    studentAnswer: string;
    correctAnswer: string;
  }) => {
    if (!playerId) return;
    try {
      const res = await fetch('/api/game/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          playerId,
          ...payload,
        }),
      });
      const data = await res.json();
      if (data.state) {
        setRoomState(data.state);
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  // Reset room action
  const resetRoom = async () => {
    try {
      const res = await fetch('/api/game/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      const data = await res.json();
      if (data.state) {
        setRoomState(data.state);
      }
    } catch (err) {
      console.error('Failed to reset room:', err);
    }
  };

  // Seed demo players (for testing up to 23 students in real-time)
  const seedDemoPlayers = async (targetCount: number = 22) => {
    try {
      const res = await fetch('/api/game/seed-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, targetCount }),
      });
      const data = await res.json();
      if (data.state) {
        setRoomState(data.state);
      }
    } catch (err) {
      console.error('Failed to seed demo players:', err);
    }
  };

  const logoutLocalPlayer = () => {
    try {
      localStorage.removeItem('pc_puzzle_player_id');
    } catch {
      // Ignore
    }
    setPlayerId(null);
  };

  return {
    roomState,
    currentPlayer,
    playerId,
    isConnected,
    errorMsg,
    setErrorMsg,
    registerPlayer,
    startGame,
    submitAnswer,
    resetRoom,
    seedDemoPlayers,
    logoutLocalPlayer,
    refreshState: fetchState,
  };
}
