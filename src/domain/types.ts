export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type PlayChannel = 'shared-screen' | 'personal-device';
export type GameMode = 'keypad' | 'tug-of-war' | 'solo';
export type SessionStatus = 'setup' | 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished' | 'cancelled';

export interface MathQuestion {
  id: string;
  prompt: string;             // 예: "28 + 17 = ?"
  num1: number;
  num2: number;
  answer: number;
  choices?: number[];         // 객관식 모드(줄다리기 등)에서 사용
  operation: Operation;
  difficulty: Difficulty;
  grade?: number;
  unitId?: string;
  explanation?: string;
}

export interface Player {
  id: string;
  displayName: string;
  seatIndex: number;
  colorKey: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  currentStreak: number;
  maxStreak: number;
  connectionStatus?: 'local' | 'connected' | 'reconnecting' | 'disconnected' | 'removed';
}

export interface GameSettings {
  /** 접속/진행 방식: 1차는 shared-screen 고정 */
  playChannel: PlayChannel;
  /** 게임 규칙/미니게임: keypad | tug-of-war | solo */
  gameMode: GameMode;
  grade: number; // 0 = 전학년 종합, 1~6 = 1~6학년
  semester?: 1 | 2;
  unitId?: string;
  operations: Operation[];
  difficulty: Difficulty;
  questionCount: number;
  timeLimitSeconds: number; // 문제당 시간(키패드/줄다리기) 또는 총 시간(솔로)
  playerCount: number;
  pointsPerCorrectAnswer: number;
  streakBonus: boolean;
}

export interface GameSession {
  id: string;
  status: SessionStatus;
  settings: GameSettings;
  players: Player[];
  questions: MathQuestion[];
  currentQuestionIndex: number;
  startedAt?: string;
  finishedAt?: string;
  roomCode?: string;
}

export interface BattleRecord {
  id: string;
  createdAt: string;
  playChannel: PlayChannel;
  gameMode: GameMode;
  settings: GameSettings;
  players: Player[];
  winnerPlayerIds: string[];
  durationSeconds: number;
}
