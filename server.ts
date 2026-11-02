import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomState, Player, ServerMessage, ClientMessage } from './src/types/game';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MAX_PLAYERS = 23;
const LEVEL_COUNT = 10;
const LEVEL_TIME_LIMIT = 20;

// In-memory server-authoritative rooms
const rooms: Record<string, RoomState> = {};

// Connected SSE clients by roomId
const sseClients: Record<string, Set<Response>> = {};

// Helper to get or initialize a room
function getRoom(roomId: string = 'classroom'): RoomState {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      roomId,
      status: 'waiting',
      maxPlayers: MAX_PLAYERS,
      players: {},
      levelCount: LEVEL_COUNT,
      levelTimeLimitSeconds: LEVEL_TIME_LIMIT,
    };
  }
  return rooms[roomId];
}

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// WebSocket clients mapped to roomId
const wsClients = new Map<WebSocket, { roomId: string; playerId?: string }>();

function broadcast(roomId: string, message: ServerMessage) {
  const payload = JSON.stringify(message);

  // 1. Broadcast via WebSocket
  for (const [ws, meta] of wsClients.entries()) {
    if (meta.roomId === roomId && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }

  // 2. Broadcast via Server-Sent Events (SSE)
  const roomSse = sseClients[roomId];
  if (roomSse) {
    for (const res of roomSse) {
      try {
        res.write(`data: ${payload}\n\n`);
      } catch {
        // Handled in disconnect
      }
    }
  }
}

// REST API Endpoints
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: Date.now() });
});

// Get current room state
app.get('/api/game/state', (req: Request, res: Response) => {
  const roomId = (req.query.roomId as string) || 'classroom';
  const room = getRoom(roomId);
  res.json({ state: room });
});

// Register a player
app.post('/api/game/register', (req: Request, res: Response) => {
  const { roomId = 'classroom', name, isHost = false } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Player name is required.' });
  }

  const cleanName = name.trim();
  const room = getRoom(roomId);

  // Check 23 player limit
  const currentCount = Object.keys(room.players).length;
  if (currentCount >= MAX_PLAYERS) {
    return res.status(400).json({
      error: `Room is full! The maximum capacity of ${MAX_PLAYERS} players has been reached.`,
    });
  }

  // Check for duplicate names (case-insensitive)
  const isDuplicate = Object.values(room.players).some(
    (p) => p.name.toLowerCase() === cleanName.toLowerCase()
  );

  if (isDuplicate) {
    return res.status(400).json({
      error: `The name "${cleanName}" is already registered. Please choose a different name.`,
    });
  }

  // Generate unique ID
  const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
  const player: Player = {
    id: playerId,
    name: cleanName,
    registeredAt: Date.now(),
    score: 0,
    currentLevel: 1,
    isFinished: false,
    answers: [],
    totalTimeSeconds: 0,
    correctCount: 0,
    incorrectCount: 0,
    isHost: Boolean(isHost),
  };

  room.players[playerId] = player;

  broadcast(roomId, {
    type: 'player_registered',
    player,
  });

  broadcast(roomId, {
    type: 'room_state',
    state: room,
  });

  return res.json({ success: true, player, state: room });
});

// Start the game (authorized by teacher/admin)
app.post('/api/game/start', (req: Request, res: Response) => {
  const { roomId = 'classroom' } = req.body;
  const room = getRoom(roomId);

  if (room.status === 'in-progress') {
    return res.json({ success: true, message: 'Game already in progress', state: room });
  }

  room.status = 'in-progress';
  room.startedAt = Date.now();

  broadcast(roomId, {
    type: 'game_started',
    startedAt: room.startedAt,
  });

  broadcast(roomId, {
    type: 'room_state',
    state: room,
  });

  return res.json({ success: true, state: room });
});

// Submit answer for a level
app.post('/api/game/submit-answer', (req: Request, res: Response) => {
  const {
    roomId = 'classroom',
    playerId,
    levelNumber,
    isCorrect,
    timeSpentSeconds = 0,
    studentAnswer = '',
    correctAnswer = '',
  } = req.body;

  const room = getRoom(roomId);
  const player = room.players[playerId];

  if (!player) {
    return res.status(404).json({ error: 'Player not found in this room.' });
  }

  // Guard against answering the same level twice
  const alreadyAnswered = player.answers.some((a) => a.levelNumber === levelNumber);
  if (alreadyAnswered) {
    return res.status(400).json({ error: 'Level already submitted.' });
  }

  const scoreEarned = isCorrect ? 100 : 0;
  player.score += scoreEarned;
  if (isCorrect) {
    player.correctCount += 1;
  } else {
    player.incorrectCount += 1;
  }
  player.totalTimeSeconds = Number((player.totalTimeSeconds + timeSpentSeconds).toFixed(1));

  player.answers.push({
    levelNumber,
    answeredAt: Date.now(),
    isCorrect,
    scoreEarned,
    timeSpentSeconds,
    studentAnswer,
    correctAnswer,
  });

  // Advance level
  if (player.currentLevel < LEVEL_COUNT) {
    player.currentLevel += 1;
  } else {
    player.currentLevel = LEVEL_COUNT + 1;
    player.isFinished = true;
  }

  // Check if all players finished
  const allFinished = Object.values(room.players).length > 0 &&
    Object.values(room.players).every((p) => p.isFinished);
  if (allFinished) {
    room.status = 'completed';
  }

  broadcast(roomId, {
    type: 'player_updated',
    player,
  });

  broadcast(roomId, {
    type: 'room_state',
    state: room,
  });

  return res.json({ success: true, player, state: room });
});

// Reset room
app.post('/api/game/reset', (req: Request, res: Response) => {
  const { roomId = 'classroom' } = req.body;
  rooms[roomId] = {
    roomId,
    status: 'waiting',
    maxPlayers: MAX_PLAYERS,
    players: {},
    levelCount: LEVEL_COUNT,
    levelTimeLimitSeconds: LEVEL_TIME_LIMIT,
  };

  broadcast(roomId, {
    type: 'room_reset',
    state: rooms[roomId],
  });

  return res.json({ success: true, state: rooms[roomId] });
});

// Seed classroom with realistic mock players (up to 23) for testing and demonstration
app.post('/api/game/seed-demo', (req: Request, res: Response) => {
  const { roomId = 'classroom', targetCount = 20 } = req.body;
  const room = getRoom(roomId);

  const demoNames = [
    'Mateo Silva', 'Sofia Rodriguez', 'Lucas Gomez', 'Valentina Perez',
    'Santiago Morales', 'Isabella Torres', 'Sebastian Ramirez', 'Camila Diaz',
    'Alejandro Castro', 'Mariana Vargas', 'Gabriel Rios', 'Lucia Mendoza',
    'Daniel Herrera', 'Emma Jimenez', 'Nicolas Romero', 'Elena Ortiz',
    'Diego Castillo', 'Paula Navarro', 'Andres Delgado', 'Clara Reyes',
    'Julian Gutierrez', 'Valeria Flores', 'Martin Aguilar'
  ];

  const countToAdd = Math.min(targetCount, MAX_PLAYERS - Object.keys(room.players).length);
  const existingNames = new Set(Object.values(room.players).map((p) => p.name.toLowerCase()));

  let added = 0;
  for (const name of demoNames) {
    if (added >= countToAdd) break;
    if (existingNames.has(name.toLowerCase())) continue;

    const id = 'demo_' + Math.random().toString(36).substring(2, 8);
    const scoreRoll = Math.floor(Math.random() * 5) + 6; // 600 - 1000
    const correctCount = scoreRoll;
    const incorrectCount = 10 - correctCount;
    const score = correctCount * 100;
    const totalTime = Number((70 + Math.random() * 85).toFixed(1));

    room.players[id] = {
      id,
      name,
      registeredAt: Date.now() - Math.floor(Math.random() * 60000),
      score,
      currentLevel: LEVEL_COUNT + 1,
      isFinished: true,
      answers: [],
      totalTimeSeconds: totalTime,
      correctCount,
      incorrectCount,
      isHost: false,
    };
    existingNames.add(name.toLowerCase());
    added++;
  }

  broadcast(roomId, {
    type: 'room_state',
    state: room,
  });

  return res.json({ success: true, added, count: Object.keys(room.players).length, state: room });
});

// SSE endpoint for reliable live updates
app.get('/api/game/events', (req: Request, res: Response) => {
  const roomId = (req.query.roomId as string) || 'classroom';
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients[roomId]) {
    sseClients[roomId] = new Set();
  }
  sseClients[roomId].add(res);

  // Send initial room state
  const room = getRoom(roomId);
  res.write(`data: ${JSON.stringify({ type: 'room_state', state: room })}\n\n`);

  req.on('close', () => {
    sseClients[roomId]?.delete(res);
  });
});

// WebSocket upgrade handling
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  if (url.pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

wss.on('connection', (ws: WebSocket, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const roomId = url.searchParams.get('roomId') || 'classroom';
  const playerId = url.searchParams.get('playerId') || undefined;

  wsClients.set(ws, { roomId, playerId });

  // Send initial state on connect
  const room = getRoom(roomId);
  ws.send(JSON.stringify({ type: 'room_state', state: room }));

  ws.on('message', (data) => {
    try {
      const msg: ClientMessage = JSON.parse(data.toString());
      if (msg.type === 'join') {
        const meta = wsClients.get(ws);
        if (meta) {
          meta.roomId = msg.roomId || roomId;
          meta.playerId = msg.playerId;
        }
        ws.send(JSON.stringify({ type: 'room_state', state: getRoom(meta?.roomId || roomId) }));
      }
    } catch {
      // Ignore invalid JSON
    }
  });

  ws.on('close', () => {
    wsClients.delete(ws);
  });
});

// Initialize dev or prod middleware
async function setupApp() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Past Continuous Game] Server running on http://0.0.0.0:${PORT}`);
  });
}

setupApp().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
