import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface ProblemStatus {
  status: 'solved' | 'attempted' | 'unattempted';
  time?: number; // minutes from start
  attempts: number;
  isFirstBlood: boolean;
}

export interface ScoreboardRow {
  rank: number;
  teamId: string;
  teamName: string;
  members: { userId: string; role: string }[];
  solved: number;
  penalty: number;
  problems: Record<string, ProblemStatus>;
}

export interface Scoreboard {
  hackathonId: string;
  title: string;
  status: string;
  challengeIds: string[];
  rows: ScoreboardRow[];
  isFrozen: boolean;
  generatedAt: string;
}

@Injectable()
export class HackathonScoreboardService {
  private readonly logger = new Logger(HackathonScoreboardService.name);
  private redis: Redis;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
    });
  }

  // ────────────────────────────────────────────────────────
  // T034/T035 — Compute live ICPC scoreboard
  // ────────────────────────────────────────────────────────

  async computeScoreboard(hackathonId: string): Promise<Scoreboard> {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    const teams = await this.prisma.hackathonTeam.findMany({
      where: { hackathonId, isDisqualified: false },
    });

    const submissions = await this.prisma.hackathonSubmission.findMany({
      where: { hackathonId },
      orderBy: { submittedAt: 'asc' },
    });

    const startTime = new Date(hackathon.startTime).getTime();
    const challengeIds = hackathon.challengeIds;

    const rows: ScoreboardRow[] = teams.map((team) => {
      const teamSubs = submissions.filter((s) => s.teamId === team.id);
      const problems: Record<string, ProblemStatus> = {};
      let solved = 0;
      let penalty = 0;

      for (const cId of challengeIds) {
        const challengeSubs = teamSubs.filter((s) => s.challengeId === cId);
        const acSub = challengeSubs.find((s) => s.verdict === 'AC');

        if (acSub) {
          const timeMins = Math.floor(
            (new Date(acSub.submittedAt).getTime() - startTime) / 60_000,
          );
          const wrongAttempts = challengeSubs.filter(
            (s) => s.verdict !== 'AC' && new Date(s.submittedAt) < new Date(acSub.submittedAt),
          ).length;

          problems[cId] = {
            status: 'solved',
            time: timeMins,
            attempts: wrongAttempts + 1,
            isFirstBlood: acSub.isFirstBlood,
          };

          solved++;
          penalty += timeMins + wrongAttempts * 20;
        } else if (challengeSubs.length > 0) {
          problems[cId] = {
            status: 'attempted',
            attempts: challengeSubs.length,
            isFirstBlood: false,
          };
        } else {
          problems[cId] = {
            status: 'unattempted',
            attempts: 0,
            isFirstBlood: false,
          };
        }
      }

      return {
        rank: 0,
        teamId: team.id,
        teamName: team.name,
        members: team.members,
        solved,
        penalty,
        problems,
      };
    });

    // Sort: solved DESC, penalty ASC
    rows.sort((a, b) => {
      if (b.solved !== a.solved) return b.solved - a.solved;
      return a.penalty - b.penalty;
    });

    // Assign ranks (same rank for ties)
    let rank = 1;
    for (let i = 0; i < rows.length; i++) {
      if (i > 0 && rows[i].solved === rows[i - 1].solved && rows[i].penalty === rows[i - 1].penalty) {
        rows[i].rank = rows[i - 1].rank;
      } else {
        rows[i].rank = rank;
      }
      rank = i + 2;
    }

    return {
      hackathonId,
      title: hackathon.title,
      status: hackathon.status,
      challengeIds,
      rows,
      isFrozen: hackathon.status === 'frozen',
      generatedAt: new Date().toISOString(),
    };
  }

  // ────────────────────────────────────────────────────────
  // T036 — Freeze: cache scoreboard to Redis
  // ────────────────────────────────────────────────────────

  async freezeScoreboard(hackathonId: string): Promise<void> {
    const scoreboard = await this.computeScoreboard(hackathonId);
    const key = `hackathon:scoreboard:frozen:${hackathonId}`;
    await this.redis.setex(key, 86400, JSON.stringify(scoreboard)); // 24h TTL
    this.logger.log(`Frozen scoreboard cached for hackathon ${hackathonId}`);
  }

  async getFrozenScoreboard(hackathonId: string): Promise<Scoreboard | null> {
    const key = `hackathon:scoreboard:frozen:${hackathonId}`;
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);
    return null;
  }

  // ────────────────────────────────────────────────────────
  // T037 — Get scoreboard (frozen or live based on role)
  // ────────────────────────────────────────────────────────

  async getScoreboard(hackathonId: string, isAdmin: boolean): Promise<Scoreboard> {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    // If frozen and not admin, return frozen snapshot
    if (hackathon.status === 'frozen' && !isAdmin) {
      const frozen = await this.getFrozenScoreboard(hackathonId);
      if (frozen) return frozen;
      // Fallback: compute using only pre-freeze submissions
      return this.computePreFreezeScoreboard(hackathonId);
    }

    return this.computeScoreboard(hackathonId);
  }

  /** Compute scoreboard using only submissions before freezeAt */
  private async computePreFreezeScoreboard(hackathonId: string): Promise<Scoreboard> {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon || !hackathon.freezeAt) {
      return this.computeScoreboard(hackathonId);
    }

    const teams = await this.prisma.hackathonTeam.findMany({
      where: { hackathonId, isDisqualified: false },
    });

    const submissions = await this.prisma.hackathonSubmission.findMany({
      where: {
        hackathonId,
        submittedAt: { lte: hackathon.freezeAt },
      },
      orderBy: { submittedAt: 'asc' },
    });

    const startTime = new Date(hackathon.startTime).getTime();
    const challengeIds = hackathon.challengeIds;

    const rows: ScoreboardRow[] = teams.map((team) => {
      const teamSubs = submissions.filter((s) => s.teamId === team.id);
      const problems: Record<string, ProblemStatus> = {};
      let solved = 0;
      let penalty = 0;

      for (const cId of challengeIds) {
        const challengeSubs = teamSubs.filter((s) => s.challengeId === cId);
        const acSub = challengeSubs.find((s) => s.verdict === 'AC');

        if (acSub) {
          const timeMins = Math.floor(
            (new Date(acSub.submittedAt).getTime() - startTime) / 60_000,
          );
          const wrongAttempts = challengeSubs.filter(
            (s) => s.verdict !== 'AC' && new Date(s.submittedAt) < new Date(acSub.submittedAt),
          ).length;

          problems[cId] = {
            status: 'solved',
            time: timeMins,
            attempts: wrongAttempts + 1,
            isFirstBlood: acSub.isFirstBlood,
          };
          solved++;
          penalty += timeMins + wrongAttempts * 20;
        } else if (challengeSubs.length > 0) {
          problems[cId] = { status: 'attempted', attempts: challengeSubs.length, isFirstBlood: false };
        } else {
          problems[cId] = { status: 'unattempted', attempts: 0, isFirstBlood: false };
        }
      }

      return { rank: 0, teamId: team.id, teamName: team.name, members: team.members, solved, penalty, problems };
    });

    rows.sort((a, b) => (b.solved !== a.solved ? b.solved - a.solved : a.penalty - b.penalty));
    let rank = 1;
    for (let i = 0; i < rows.length; i++) {
      if (i > 0 && rows[i].solved === rows[i - 1].solved && rows[i].penalty === rows[i - 1].penalty) {
        rows[i].rank = rows[i - 1].rank;
      } else {
        rows[i].rank = rank;
      }
      rank = i + 2;
    }

    return {
      hackathonId,
      title: hackathon.title,
      status: hackathon.status,
      challengeIds,
      rows,
      isFrozen: true,
      generatedAt: new Date().toISOString(),
    };
  }

  // ────────────────────────────────────────────────────────
  // T038 — Generate reveal animation sequence
  // ────────────────────────────────────────────────────────

  async generateRevealSequence(hackathonId: string) {
    // Get the frozen scoreboard (what participants saw)
    const frozen = await this.getFrozenScoreboard(hackathonId);
    if (!frozen) return { steps: [] };

    // Get the live scoreboard (actual results)
    const live = await this.computeScoreboard(hackathonId);

    // Generate reveal steps: starting from last place, resolve pending submissions
    const steps: Array<{
      teamId: string;
      teamName: string;
      challengeId: string;
      oldStatus: string;
      newStatus: string;
      newRank: number;
    }> = [];

    // Work from last place to first
    const frozenRows = [...frozen.rows].reverse();

    for (const frozenRow of frozenRows) {
      const liveRow = live.rows.find((r) => r.teamId === frozenRow.teamId);
      if (!liveRow) continue;

      for (const cId of frozen.challengeIds) {
        const frozenProblem = frozenRow.problems[cId];
        const liveProblem = liveRow.problems[cId];

        if (!frozenProblem || !liveProblem) continue;
        if (frozenProblem.status !== liveProblem.status) {
          steps.push({
            teamId: frozenRow.teamId,
            teamName: frozenRow.teamName,
            challengeId: cId,
            oldStatus: frozenProblem.status,
            newStatus: liveProblem.status,
            newRank: liveRow.rank,
          });
        }
      }
    }

    return { steps, finalScoreboard: live };
  }

  // ────────────────────────────────────────────────────────
  // T065 — Export results
  // ────────────────────────────────────────────────────────

  async exportResults(hackathonId: string, format: 'csv' | 'json') {
    const scoreboard = await this.computeScoreboard(hackathonId);

    if (format === 'json') {
      return scoreboard;
    }

    // CSV format
    const challengeLabels = scoreboard.challengeIds.map(
      (_, i) => String.fromCharCode(65 + i), // A, B, C...
    );

    const header = ['Rank', 'Team', 'Members', 'Solved', 'Penalty', ...challengeLabels].join(',');
    const rows = scoreboard.rows.map((r) => {
      const memberNames = r.members.map((m) => m.userId).join(';');
      const problemCols = scoreboard.challengeIds.map((cId) => {
        const p = r.problems[cId];
        if (p.status === 'solved') return `+${p.attempts > 1 ? p.attempts : ''}(${p.time})`;
        if (p.status === 'attempted') return `-${p.attempts}`;
        return '';
      });
      return [r.rank, `"${r.teamName}"`, `"${memberNames}"`, r.solved, r.penalty, ...problemCols].join(',');
    });

    return [header, ...rows].join('\n');
  }
}
