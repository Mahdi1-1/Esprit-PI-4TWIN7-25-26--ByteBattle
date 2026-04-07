export enum GameTheme {
  CYBER_ARENA = 'cyber',
  SPACE_OPS = 'space',
  SAMURAI_DOJO = 'dojo',
  PIXEL_ARCADE = 'pixel',
  MYTHIC_RPG = 'rpg',
  SPORTS_ARENA = 'sports'
}

export enum GameResult {
  VICTORY = 'victory',
  DEFEAT = 'defeat'
}

export interface PlayerStats {
  score: number;
  maxScore: number;
  testsPassed: number;
  totalTests: number;
  timeElapsed: number;        // en secondes
  maxTime: number;
  accuracy: number;           // 0-100
  streakBest: number;
  challengesCompleted: number;
  totalChallenges: number;
  rank: string;               // S, A, B, C, D, F
  xpGained: number;
  xpLost: number;
  level: number;
  levelProgress: number;      // 0-100
}

export interface OpponentInfo {
  name: string;
  avatar: string;
  score: number;
}

export interface EndGameData {
  result: GameResult;
  theme: GameTheme;
  player: PlayerStats;
  opponent?: OpponentInfo;
  matchId: string;
  timestamp: number;
}
