export type LevelType = 
  | 'fill-blank'
  | 'error-correction'
  | 'unscramble-affirmative'
  | 'unscramble-negative'
  | 'unscramble-interrogative'
  | 'time-expression'
  | 'complex-challenge';

export interface PuzzlePiece {
  id: string;
  text: string;
  type?: 'subject' | 'auxiliary' | 'verb-ing' | 'object' | 'punctuation' | 'time' | 'filler';
}

export interface LevelData {
  id: number;
  levelNumber: number;
  title: string;
  category: string;
  prompt: string;
  instruction: string;
  type: LevelType;
  // For fill-blank and time-expression: sentence template with {blank}
  sentenceTemplate?: string;
  options?: PuzzlePiece[];
  correctOptionId?: string;
  correctAnswerText?: string;
  // For error correction
  sentenceWords?: Array<{ id: string; text: string; isError?: boolean }>;
  errorWordId?: string;
  errorCorrectionOptions?: PuzzlePiece[];
  correctCorrectionId?: string;
  // For unscramble tasks
  availablePieces?: PuzzlePiece[];
  correctSequence?: string[]; // IDs or texts in correct order
  // Grammar tip shown in review
  grammarRule: string;
  explanation: string;
}

export interface PlayerAnswer {
  levelNumber: number;
  answeredAt: number;
  isCorrect: boolean;
  scoreEarned: number;
  timeSpentSeconds: number;
  studentAnswer: string;
  correctAnswer: string;
}

export interface Player {
  id: string;
  name: string;
  registeredAt: number;
  score: number;
  currentLevel: number; // 1 to 10, or 11 when finished
  isFinished: boolean;
  answers: PlayerAnswer[];
  totalTimeSeconds: number;
  correctCount: number;
  incorrectCount: number;
  isHost?: boolean;
}

export type GameStatus = 'waiting' | 'in-progress' | 'completed';

export interface RoomState {
  roomId: string;
  status: GameStatus;
  startedAt?: number;
  maxPlayers: number;
  players: Record<string, Player>;
  levelCount: number;
  levelTimeLimitSeconds: number;
}

export type ClientMessage =
  | { type: 'join'; roomId: string; playerName?: string; playerId?: string; isTeacher?: boolean }
  | { type: 'start_game'; roomId: string }
  | { type: 'submit_answer'; roomId: string; playerId: string; levelNumber: number; isCorrect: boolean; timeSpentSeconds: number; studentAnswer: string; correctAnswer: string }
  | { type: 'reset_room'; roomId: string }
  | { type: 'kick_player'; roomId: string; playerId: string };

export type ServerMessage =
  | { type: 'room_state'; state: RoomState }
  | { type: 'player_registered'; player: Player }
  | { type: 'game_started'; startedAt: number }
  | { type: 'player_updated'; player: Player }
  | { type: 'room_reset'; state: RoomState }
  | { type: 'error'; message: string };
