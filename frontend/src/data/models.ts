// Unified Data Models - 18 Entities

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'MODERATOR' | 'MENTOR' | 'ENTERPRISE_MANAGER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';
export type ThemeId = 'cyber_arena' | 'space_ops' | 'samurai_dojo' | 'pixel_arcade' | 'mythic_rpg' | 'sports_arena';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type Language = 'PYTHON' | 'JAVASCRIPT' | 'CPP' | 'JAVA';
export type Verdict = 'ACCEPTED' | 'WRONG_ANSWER' | 'TLE' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR';
export type BattleStatus = 'QUEUED' | 'ONGOING' | 'FINISHED' | 'CANCELLED';
export type HackathonStatus = 'UPCOMING' | 'ONGOING' | 'FROZEN' | 'FINISHED';
export type CanvasCategory = 'LOGICAL' | 'PHYSICAL' | 'SECURITY' | 'DATAFLOW';
export type BadgeRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type ReportType = 'ABUSE' | 'SPAM' | 'PLAGIARISM';
export type ReportStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
export type JobType = 'RUN_SUBMISSION' | 'GENERATE_PROBLEM' | 'PLAGIARISM_CHECK' | 'AI_HINT' | 'AI_REVIEW';
export type JobStatus = 'PENDING' | 'ACTIVE' | 'FAILED' | 'DONE';
export type Environment = 'DEV' | 'STAGING' | 'PROD';

// (1) Account
export interface Account {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  level: number;
  xp: number;
  elo: number;
  activeThemeId: ThemeId;
  unlockedThemeIds: ThemeId[];
  createdAt: Date;
  lastLoginAt?: Date;
}

// (2) Session
export interface Session {
  id: string;
  accountId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  deviceInfo?: string;
  createdAt: Date;
}

// (3) Problem
export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: string[];
  statementMd: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: {
    timeLimitMs: number;
    memoryLimitMb: number;
  };
  allowedLanguages: Language[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

// (4) TestCaseAsset
export interface TestCaseAsset {
  id: string;
  problemId: string;
  type: 'PUBLIC' | 'HIDDEN';
  storageType: 'INLINE' | 'ZIP_URL';
  input?: string;
  output?: string;
  zipUrl?: string;
  createdAt: Date;
}

// (5) Submission
export interface Submission {
  id: string;
  accountId: string;
  problemId: string;
  language: Language;
  code: string;
  verdict: Verdict;
  timeMs: number;
  memMb: number;
  testsPassed: number;
  testsTotal: number;
  stdout?: string;
  stderr?: string;
  createdAt: Date;
}

// (6) Battle (Duel 1v1)
export interface Battle {
  id: string;
  status: BattleStatus;
  problemId: string;
  playerAId: string;
  playerBId: string;
  winnerId?: string;
  eloDeltaA?: number;
  eloDeltaB?: number;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
}

// (7) Hackathon
export interface Hackathon {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  status: HackathonStatus;
  freezeAt?: Date;
  rulesMd: string;
  problemIds: string[];
  createdAt: Date;
}

// (8) Team
export interface Team {
  id: string;
  hackathonId: string;
  name: string;
  logoUrl?: string;
  members: Array<{
    accountId: string;
    role: 'CAPTAIN' | 'MEMBER';
  }>;
  solvedCount: number;
  penaltyTime: number;
  score: number;
  createdAt: Date;
}

// (9) HackathonSubmission
export interface HackathonSubmission {
  id: string;
  hackathonId: string;
  teamId: string;
  problemId: string;
  attemptNumber: number;
  status: 'ACCEPTED' | 'REJECTED';
  penaltyAdded: number;
  createdAt: Date;
}

// (10) CanvasChallenge
export interface CanvasChallenge {
  id: string;
  title: string;
  category: CanvasCategory;
  difficulty: Difficulty;
  timeLimitSec: number;
  briefMd: string;
  deliverables: string[];
  rubric: Array<{
    criterion: string;
    points: number;
  }>;
  assets: Array<{
    name: string;
    url: string;
  }>;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: Date;
}

// (11) CanvasSubmission
export interface CanvasSubmission {
  id: string;
  accountId: string;
  challengeId: string;
  snapshotUrl: string;
  canvasJson: string;
  score: number;
  aiFeedbackSummary: string;
  createdAt: Date;
}

// (12) Badge
export interface Badge {
  id: string;
  name: string;
  rarity: BadgeRarity;
  ruleText: string;
  iconUrl: string;
}

// (13) Report
export interface Report {
  id: string;
  type: ReportType;
  targetType: 'ACCOUNT' | 'PROBLEM' | 'SUBMISSION' | 'CANVAS_SUBMISSION';
  targetId: string;
  reporterId: string;
  status: ReportStatus;
  reason: string;
  createdAt: Date;
}

// (14) AuditLog
export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: string;
  afterJson?: string;
  ip: string;
  createdAt: Date;
}

// (15) Job
export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  payloadJson: string;
  error?: string;
  attempts: number;
  createdAt: Date;
  completedAt?: Date;
}

// (16) AISetting
export interface AISetting {
  id: string;
  modelName: string;
  rateLimitPerUser: number;
  promptHintTemplate: string;
  promptReviewTemplate: string;
  promptGenerateTemplate: string;
}

// (17) FeatureFlag
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  environment: Environment;
}

// (18) EnterpriseChallenge
export interface EnterpriseChallenge {
  id: string;
  companyName: string;
  title: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  candidateAccountIds: string[];
  createdAt: Date;
}
