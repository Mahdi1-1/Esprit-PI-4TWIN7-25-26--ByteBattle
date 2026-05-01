// Admin panel types — aligned with backend Prisma schema

import type {
  UserRole,
  UserStatus,
  ChallengeStatus,
  HackathonStatus,
  Difficulty,
} from './models';

// Re-export for convenience
export type { UserRole, UserStatus, ChallengeStatus, HackathonStatus };

// ─── Verdict & ServiceStatus (free-form strings in backend) ──
export type Verdict = string;
export type ServiceStatus = string;

// ─── Types ───────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status: UserStatus;
  level: number;
  elo: number;
  xp: number;
  tokensLeft: number;
  isPremium: boolean;
  joinedAt: string;
  lastActive: string;
  submissions?: number;
}

export interface Report {
  id: string;
  type: string;
  targetType: string;
  targetId: string;
  reporterId: string;
  reason: string;
  status: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown> | null;
  ip?: string | null;
  createdAt: string;
}

export interface Submission {
  id: string;
  userId: string;
  username?: string;
  challengeId: string;
  problemTitle?: string;
  kind: 'CODE' | 'CANVAS';
  language?: string | null;
  code?: string | null;
  verdict?: string | null;
  score: number;
  testsPassed?: number | null;
  testsTotal?: number | null;
  timeMs?: number | null;
  memoryMb?: number | null;
  createdAt: string;
}

export interface Problem {
  id: string;
  title: string;
  slug?: string;
  kind: 'CODE' | 'CANVAS';
  difficulty: Difficulty;
  category: string;
  tags: string[];
  acceptanceRate?: number;
  submissions?: number;
  timeLimit?: number;
  memoryLimit?: number;
  status: ChallengeStatus;
  createdAt: string;
}

export interface JobQueue {
  id: string;
  type: string;
  status: string;
  submissionId: string;
  attempts: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: any;
}

export interface SystemMetric {
  service: string;
  status: string;
  uptime: number;
  responseTime: number;
  errorRate: number;
  lastCheck: string;
}

export interface DashboardKPIs {
  submissions24h: number;
  submissions7d: number;
  avgJudgeTime: number;
  queuePending: number;
  queueFailed: number;
  activeDuels: number;
  activeHackathons: number;
  verdictRatio: Record<string, number>;
}
