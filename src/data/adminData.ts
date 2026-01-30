// Admin Backoffice Mock Data

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'MENTOR' | 'ENTERPRISE_MANAGER' | 'USER';
export type UserStatus = 'ACTIVE' | 'BANNED' | 'SUSPENDED' | 'LOCKED';
export type ProblemStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type Verdict = 'ACCEPTED' | 'WRONG_ANSWER' | 'TLE' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR' | 'MEMORY_LIMIT';
export type HackathonStatus = 'UPCOMING' | 'ONGOING' | 'FROZEN' | 'FINISHED';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'ESCALATED';
export type ServiceStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  level: number;
  elo: number;
  status: UserStatus;
  createdAt: Date;
  lastLogin?: Date;
  flags: {
    anticheat: number;
    reports: number;
  };
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
  status: ProblemStatus;
  languages: string[];
  updatedAt: Date;
  author: string;
  submissions: number;
  acceptanceRate: number;
}

export interface Submission {
  id: string;
  userId: string;
  username: string;
  problemId: string;
  problemTitle: string;
  verdict: Verdict;
  timeMs: number;
  memoryMb: number;
  language: string;
  createdAt: Date;
  code?: string;
}

export interface Hackathon {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  freezeDuration: number;
  status: HackathonStatus;
  teamsCount: number;
  problemsCount: number;
}

export interface Report {
  id: string;
  type: 'abuse' | 'spam' | 'plagiarism' | 'other';
  reporter: string;
  target: string;
  targetType: 'user' | 'submission' | 'design';
  reason: string;
  status: ReportStatus;
  createdAt: Date;
  assignedTo?: string;
}

export interface JobQueue {
  id: string;
  type: 'judge' | 'ai_review' | 'plagiarism_check' | 'export';
  status: 'pending' | 'active' | 'completed' | 'failed';
  payload: any;
  attempts: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface AuditLog {
  id: string;
  admin: string;
  action: string;
  entity: string;
  entityId: string;
  before?: any;
  after?: any;
  timestamp: Date;
  ip: string;
}

export interface SystemMetric {
  service: string;
  status: ServiceStatus;
  uptime: number;
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
}

// Mock Data
export const adminUsers: AdminUser[] = [
  {
    id: 'usr-001',
    email: 'aya@bytebattle.dev',
    username: 'AyaCode',
    role: 'USER',
    level: 42,
    elo: 1384,
    status: 'ACTIVE',
    createdAt: new Date('2023-06-15'),
    lastLogin: new Date('2024-01-29'),
    flags: { anticheat: 0, reports: 0 }
  },
  {
    id: 'usr-002',
    email: 'nova@team.dev',
    username: 'NovaTeam',
    role: 'USER',
    level: 28,
    elo: 1156,
    status: 'ACTIVE',
    createdAt: new Date('2023-08-20'),
    lastLogin: new Date('2024-01-28'),
    flags: { anticheat: 1, reports: 0 }
  },
  {
    id: 'usr-003',
    email: 'orion@team.dev',
    username: 'OrionTeam',
    role: 'USER',
    level: 35,
    elo: 1298,
    status: 'ACTIVE',
    createdAt: new Date('2023-07-10'),
    lastLogin: new Date('2024-01-30'),
    flags: { anticheat: 0, reports: 2 }
  },
  {
    id: 'usr-004',
    email: 'spam@user.com',
    username: 'SpamBot',
    role: 'USER',
    level: 1,
    elo: 800,
    status: 'BANNED',
    createdAt: new Date('2024-01-15'),
    flags: { anticheat: 0, reports: 15 }
  },
  {
    id: 'adm-001',
    email: 'admin@bytebattle.dev',
    username: 'SysAdmin',
    role: 'SUPER_ADMIN',
    level: 99,
    elo: 2000,
    status: 'ACTIVE',
    createdAt: new Date('2023-01-01'),
    lastLogin: new Date('2024-01-30'),
    flags: { anticheat: 0, reports: 0 }
  },
  {
    id: 'mod-001',
    email: 'mod@bytebattle.dev',
    username: 'ModTeam',
    role: 'MODERATOR',
    level: 55,
    elo: 1600,
    status: 'ACTIVE',
    createdAt: new Date('2023-03-15'),
    lastLogin: new Date('2024-01-29'),
    flags: { anticheat: 0, reports: 0 }
  }
];

export const problems: Problem[] = [
  {
    id: 'prob-001',
    title: 'Two Sum Arena',
    slug: 'two-sum-arena',
    difficulty: 'easy',
    tags: ['Array', 'Hash Table', 'Two Pointers'],
    timeLimit: 1000,
    memoryLimit: 256,
    status: 'PUBLISHED',
    languages: ['python', 'javascript', 'cpp', 'java'],
    updatedAt: new Date('2024-01-20'),
    author: 'SysAdmin',
    submissions: 1247,
    acceptanceRate: 68.5
  },
  {
    id: 'prob-002',
    title: 'Warp Gate Paths',
    slug: 'warp-gate-paths',
    difficulty: 'medium',
    tags: ['Graph', 'BFS', 'Dynamic Programming'],
    timeLimit: 2000,
    memoryLimit: 512,
    status: 'PUBLISHED',
    languages: ['python', 'javascript', 'cpp', 'java'],
    updatedAt: new Date('2024-01-25'),
    author: 'SysAdmin',
    submissions: 856,
    acceptanceRate: 42.3
  },
  {
    id: 'prob-003',
    title: 'Samurai Segments',
    slug: 'samurai-segments',
    difficulty: 'hard',
    tags: ['Segment Tree', 'Binary Search', 'Range Query'],
    timeLimit: 3000,
    memoryLimit: 1024,
    status: 'PUBLISHED',
    languages: ['cpp', 'java'],
    updatedAt: new Date('2024-01-28'),
    author: 'ModTeam',
    submissions: 234,
    acceptanceRate: 18.9
  },
  {
    id: 'prob-004',
    title: 'Pixel Perfect Sort',
    slug: 'pixel-perfect-sort',
    difficulty: 'medium',
    tags: ['Sorting', 'Counting Sort', 'Radix Sort'],
    timeLimit: 1500,
    memoryLimit: 512,
    status: 'DRAFT',
    languages: ['python', 'javascript', 'cpp'],
    updatedAt: new Date('2024-01-29'),
    author: 'SysAdmin',
    submissions: 0,
    acceptanceRate: 0
  }
];

export const submissions: Submission[] = [
  {
    id: 'sub-001',
    userId: 'usr-001',
    username: 'AyaCode',
    problemId: 'prob-001',
    problemTitle: 'Two Sum Arena',
    verdict: 'ACCEPTED',
    timeMs: 45,
    memoryMb: 38.2,
    language: 'python',
    createdAt: new Date('2024-01-29T14:23:00'),
    code: 'def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        if target - num in seen:\n            return [seen[target - num], i]\n        seen[num] = i'
  },
  {
    id: 'sub-002',
    userId: 'usr-002',
    username: 'NovaTeam',
    problemId: 'prob-002',
    problemTitle: 'Warp Gate Paths',
    verdict: 'WRONG_ANSWER',
    timeMs: 1234,
    memoryMb: 156.8,
    language: 'javascript',
    createdAt: new Date('2024-01-29T15:45:00')
  },
  {
    id: 'sub-003',
    userId: 'usr-003',
    username: 'OrionTeam',
    problemId: 'prob-003',
    problemTitle: 'Samurai Segments',
    verdict: 'TLE',
    timeMs: 3000,
    memoryMb: 512.0,
    language: 'cpp',
    createdAt: new Date('2024-01-29T16:12:00')
  },
  {
    id: 'sub-004',
    userId: 'usr-001',
    username: 'AyaCode',
    problemId: 'prob-001',
    problemTitle: 'Two Sum Arena',
    verdict: 'COMPILATION_ERROR',
    timeMs: 0,
    memoryMb: 0,
    language: 'cpp',
    createdAt: new Date('2024-01-28T10:20:00')
  }
];

export const hackathons: Hackathon[] = [
  {
    id: 'hack-001',
    title: 'Winter CodeFest 2026',
    startDate: new Date('2026-02-15T10:00:00'),
    endDate: new Date('2026-02-15T15:00:00'),
    freezeDuration: 60,
    status: 'UPCOMING',
    teamsCount: 0,
    problemsCount: 10
  },
  {
    id: 'hack-002',
    title: 'Spring Showdown 2024',
    startDate: new Date('2024-01-20T09:00:00'),
    endDate: new Date('2024-01-20T18:00:00'),
    freezeDuration: 60,
    status: 'FINISHED',
    teamsCount: 45,
    problemsCount: 12
  }
];

export const reports: Report[] = [
  {
    id: 'rep-001',
    type: 'plagiarism',
    reporter: 'ModTeam',
    target: 'NovaTeam',
    targetType: 'submission',
    reason: 'Code suspiciously similar to public GitHub solution',
    status: 'PENDING',
    createdAt: new Date('2024-01-29T10:00:00')
  },
  {
    id: 'rep-002',
    type: 'abuse',
    reporter: 'AyaCode',
    target: 'SpamBot',
    targetType: 'user',
    reason: 'Spamming chat with promotional links',
    status: 'RESOLVED',
    createdAt: new Date('2024-01-28T14:30:00'),
    assignedTo: 'ModTeam'
  }
];

export const jobQueue: JobQueue[] = [
  {
    id: 'job-001',
    type: 'judge',
    status: 'active',
    payload: { submissionId: 'sub-001', problemId: 'prob-001' },
    attempts: 1,
    createdAt: new Date('2024-01-30T10:00:00')
  },
  {
    id: 'job-002',
    type: 'judge',
    status: 'pending',
    payload: { submissionId: 'sub-002', problemId: 'prob-002' },
    attempts: 0,
    createdAt: new Date('2024-01-30T10:01:00')
  },
  {
    id: 'job-003',
    type: 'plagiarism_check',
    status: 'failed',
    payload: { submissionId: 'sub-003' },
    attempts: 3,
    createdAt: new Date('2024-01-30T09:45:00'),
    error: 'MOSS API timeout'
  },
  {
    id: 'job-004',
    type: 'ai_review',
    status: 'completed',
    payload: { submissionId: 'sub-001', problemId: 'prob-001' },
    attempts: 1,
    createdAt: new Date('2024-01-30T09:30:00'),
    completedAt: new Date('2024-01-30T09:32:00')
  }
];

export const auditLogs: AuditLog[] = [
  {
    id: 'audit-001',
    admin: 'SysAdmin',
    action: 'PROBLEM_PUBLISH',
    entity: 'Problem',
    entityId: 'prob-001',
    before: { status: 'DRAFT' },
    after: { status: 'PUBLISHED' },
    timestamp: new Date('2024-01-29T08:00:00'),
    ip: '192.168.1.100'
  },
  {
    id: 'audit-002',
    admin: 'ModTeam',
    action: 'USER_BAN',
    entity: 'User',
    entityId: 'usr-004',
    before: { status: 'ACTIVE' },
    after: { status: 'BANNED' },
    timestamp: new Date('2024-01-29T12:30:00'),
    ip: '192.168.1.101'
  }
];

export const systemMetrics: SystemMetric[] = [
  {
    service: 'API',
    status: 'HEALTHY',
    uptime: 99.9,
    responseTime: 45,
    errorRate: 0.1,
    lastCheck: new Date('2024-01-30T10:00:00')
  },
  {
    service: 'Redis',
    status: 'HEALTHY',
    uptime: 99.8,
    responseTime: 2,
    errorRate: 0,
    lastCheck: new Date('2024-01-30T10:00:00')
  },
  {
    service: 'MongoDB',
    status: 'HEALTHY',
    uptime: 99.95,
    responseTime: 12,
    errorRate: 0.05,
    lastCheck: new Date('2024-01-30T10:00:00')
  },
  {
    service: 'Judge',
    status: 'DEGRADED',
    uptime: 98.5,
    responseTime: 234,
    errorRate: 1.5,
    lastCheck: new Date('2024-01-30T10:00:00')
  },
  {
    service: 'AI Service',
    status: 'HEALTHY',
    uptime: 99.2,
    responseTime: 1200,
    errorRate: 0.8,
    lastCheck: new Date('2024-01-30T10:00:00')
  }
];

export const dashboardKPIs = {
  submissions24h: 1247,
  submissions7d: 8934,
  avgJudgeTime: 234,
  queuePending: 12,
  queueFailed: 3,
  verdictRatio: {
    ACCEPTED: 42.3,
    WRONG_ANSWER: 28.5,
    TLE: 15.2,
    RUNTIME_ERROR: 8.4,
    COMPILATION_ERROR: 5.6
  },
  activeDuels: 8,
  activeHackathons: 2
};
