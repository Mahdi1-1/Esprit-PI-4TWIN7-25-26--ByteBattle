import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { SubmitCodeDto, RunCodeDto } from './dto/submission.dto';

@Injectable()
export class HackathonSubmissionService {
  private readonly logger = new Logger(HackathonSubmissionService.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  // ────────────────────────────────────────────────────────
  // T030 — Submit code during hackathon
  // ────────────────────────────────────────────────────────

  async submitCode(
    hackathonId: string,
    teamId: string,
    userId: string,
    dto: SubmitCodeDto,
  ) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    if (!['active', 'frozen'].includes(hackathon.status)) {
      throw new BadRequestException('Submissions only allowed during active or frozen phases');
    }

    const team = await this.prisma.hackathonTeam.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    if (team.isDisqualified) {
      throw new BadRequestException('Your team has been disqualified');
    }

    // Q7: Block re-submission to already-solved problems (READ-ONLY once AC)
    const existingAC = await this.prisma.hackathonSubmission.findFirst({
      where: {
        hackathonId,
        teamId,
        challengeId: dto.challengeId,
        verdict: 'AC',
      },
    });
    if (existingAC) {
      throw new BadRequestException('This problem is already solved. No re-submissions allowed.');
    }

    // Q1: Enforce sequential problem order server-side
    const challengeIds = hackathon.challengeIds || [];
    const challengeIndex = challengeIds.indexOf(dto.challengeId);
    if (challengeIndex === -1) {
      throw new BadRequestException('Challenge is not part of this hackathon');
    }

    if (challengeIndex > 0) {
      // Check that all preceding challenges are solved (have AC verdict)
      const precedingIds = challengeIds.slice(0, challengeIndex);
      const solvedPreceding = await this.prisma.hackathonSubmission.findMany({
        where: {
          hackathonId,
          teamId,
          challengeId: { in: precedingIds },
          verdict: 'AC',
        },
        distinct: ['challengeId'],
        select: { challengeId: true },
      });
      const solvedSet = new Set(solvedPreceding.map((s) => s.challengeId));
      const allPrecedingSolved = precedingIds.every((cId) => solvedSet.has(cId));
      if (!allPrecedingSolved) {
        throw new BadRequestException('You must solve the previous problems first before submitting to this one.');
      }
    }

    // Rate limit: 1 submission per problem per minute per team (Decision #19)
    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const recentSubmission = await this.prisma.hackathonSubmission.findFirst({
      where: {
        hackathonId,
        teamId,
        challengeId: dto.challengeId,
        submittedAt: { gte: oneMinuteAgo },
      },
      orderBy: { submittedAt: 'desc' },
    });

    if (recentSubmission) {
      const retryAfter = Math.ceil(
        (new Date(recentSubmission.submittedAt).getTime() + 60_000 - Date.now()) / 1000,
      );
      throw new BadRequestException(
        `Rate limited. Please wait ${retryAfter} seconds before submitting again for this problem.`,
      );
    }

    // Compute attempt number
    const previousAttempts = await this.prisma.hackathonSubmission.count({
      where: { hackathonId, teamId, challengeId: dto.challengeId },
    });
    const attemptNumber = previousAttempts + 1;

    // Fetch challenge test cases
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: dto.challengeId },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const tests = (challenge.tests as { input: string; expectedOutput: string }[]) || [];

    // Create submission record
    const submission = await this.prisma.hackathonSubmission.create({
      data: {
        hackathonId,
        teamId,
        challengeId: dto.challengeId,
        userId,
        code: dto.code,
        language: dto.language,
        verdict: 'queued',
        testsPassed: 0,
        testsTotal: tests.length,
        attemptNumber,
        penaltyMinutes: 0,
      },
    });

    // Enqueue for judge-worker
    if (tests.length === 0) {
      this.logger.warn(`Challenge ${challenge.id} has no test cases — auto-accepting`);
      return this.prisma.hackathonSubmission.update({
        where: { id: submission.id },
        data: { verdict: 'AC', testsPassed: 0, testsTotal: 0, timeMs: 0, memMb: 0 },
      });
    }

    const jobId = await this.queueService.addCodeExecutionJob({
      submissionId: submission.id,
      userId,
      challengeId: dto.challengeId,
      code: dto.code,
      language: dto.language,
      tests,
      context: 'hackathon',
      hackathonId,
      hackathonTeamId: teamId,
    });

    return this.prisma.hackathonSubmission.update({
      where: { id: submission.id },
      data: { jobId },
    });
  }

  // ────────────────────────────────────────────────────────
  // T031 — Run code without creating a submission
  // ────────────────────────────────────────────────────────

  async runCode(hackathonId: string, userId: string, dto: RunCodeDto) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    if (!['active', 'frozen'].includes(hackathon.status)) {
      throw new BadRequestException('Run is only allowed during active or frozen phases');
    }

    const challenge = await this.prisma.challenge.findUnique({
      where: { id: dto.challengeId },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const tests = (challenge.tests as { input: string; expectedOutput: string }[]) || [];

    if (tests.length === 0) {
      return { passed: 0, total: 0, results: [], verdict: 'No tests available' };
    }

    return this.queueService.addEvaluateCodeJob({
      userId,
      language: dto.language,
      code: dto.code,
      tests,
    });
  }

  // ────────────────────────────────────────────────────────
  // T032 — Handle verdict callback from judge-worker
  // ────────────────────────────────────────────────────────

  async handleVerdict(
    submissionId: string,
    verdict: string,
    testsPassed: number,
    testsTotal: number,
    timeMs: number,
    memMb: number,
  ) {
    const submission = await this.prisma.hackathonSubmission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) return;

    const isAccepted = verdict === 'AC';

    // Compute penalty if AC
    let penaltyMinutes = 0;
    if (isAccepted) {
      const hackathon = await this.prisma.hackathon.findUnique({
        where: { id: submission.hackathonId },
      });
      if (hackathon) {
        const startTime = new Date(hackathon.startTime).getTime();
        const acTime = Date.now();
        penaltyMinutes = Math.floor((acTime - startTime) / 60_000);

        // Add 20 minutes penalty per wrong attempt
        const wrongAttempts = await this.prisma.hackathonSubmission.count({
          where: {
            hackathonId: submission.hackathonId,
            teamId: submission.teamId,
            challengeId: submission.challengeId,
            verdict: { not: 'AC' },
            id: { not: submissionId },
          },
        });
        penaltyMinutes += wrongAttempts * 20;
      }
    }

    // Check first blood
    let isFirstBlood = false;
    if (isAccepted) {
      const priorAC = await this.prisma.hackathonSubmission.findFirst({
        where: {
          hackathonId: submission.hackathonId,
          challengeId: submission.challengeId,
          verdict: 'AC',
          id: { not: submissionId },
        },
      });
      isFirstBlood = !priorAC;
    }

    // Update submission
    const updated = await this.prisma.hackathonSubmission.update({
      where: { id: submissionId },
      data: {
        verdict,
        testsPassed,
        testsTotal,
        timeMs,
        memMb,
        penaltyMinutes,
        isFirstBlood,
      },
    });

    // Update team scoreboard aggregates if AC
    if (isAccepted) {
      // Count distinct solved challenges for this team
      const solvedChallenges = await this.prisma.hackathonSubmission.findMany({
        where: {
          hackathonId: submission.hackathonId,
          teamId: submission.teamId,
          verdict: 'AC',
        },
        distinct: ['challengeId'],
        select: { challengeId: true },
      });

      // Compute total penalty: sum of penalties of earliest AC per challenge
      let totalPenalty = 0;
      for (const { challengeId } of solvedChallenges) {
        const earliestAC = await this.prisma.hackathonSubmission.findFirst({
          where: {
            hackathonId: submission.hackathonId,
            teamId: submission.teamId,
            challengeId,
            verdict: 'AC',
          },
          orderBy: { submittedAt: 'asc' },
        });
        if (earliestAC) totalPenalty += earliestAC.penaltyMinutes;
      }

      await this.prisma.hackathonTeam.update({
        where: { id: submission.teamId },
        data: {
          solvedCount: solvedChallenges.length,
          penaltyTime: totalPenalty,
          score: solvedChallenges.length * 1000 - totalPenalty,
        },
      });
    }

    return updated;
  }

  // ────────────────────────────────────────────────────────
  // T062/T063 — Rejudge
  // ────────────────────────────────────────────────────────

  async rejudgeProblem(hackathonId: string, challengeId: string) {
    const submissions = await this.prisma.hackathonSubmission.findMany({
      where: { hackathonId, challengeId },
    });

    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const tests = (challenge.tests as { input: string; expectedOutput: string }[]) || [];

    for (const sub of submissions) {
      await this.prisma.hackathonSubmission.update({
        where: { id: sub.id },
        data: { verdict: 'rejudging' },
      });

      await this.queueService.addCodeExecutionJob({
        submissionId: sub.id,
        userId: sub.userId,
        challengeId,
        code: sub.code,
        language: sub.language,
        tests,
        context: 'hackathon',
        hackathonId,
        hackathonTeamId: sub.teamId,
        isRejudge: true,
      });
    }

    return { rejudgedCount: submissions.length };
  }

  async rejudgeTeam(hackathonId: string, teamId: string) {
    const submissions = await this.prisma.hackathonSubmission.findMany({
      where: { hackathonId, teamId },
    });

    for (const sub of submissions) {
      const challenge = await this.prisma.challenge.findUnique({
        where: { id: sub.challengeId },
      });
      if (!challenge) continue;

      const tests = (challenge.tests as { input: string; expectedOutput: string }[]) || [];

      await this.prisma.hackathonSubmission.update({
        where: { id: sub.id },
        data: { verdict: 'rejudging' },
      });

      await this.queueService.addCodeExecutionJob({
        submissionId: sub.id,
        userId: sub.userId,
        challengeId: sub.challengeId,
        code: sub.code,
        language: sub.language,
        tests,
        context: 'hackathon',
        hackathonId,
        hackathonTeamId: teamId,
        isRejudge: true,
      });
    }

    return { rejudgedCount: submissions.length };
  }

  // ────────────────────────────────────────────────────────
  // Query helpers
  // ────────────────────────────────────────────────────────

  async getTeamSubmissions(hackathonId: string, teamId: string, challengeId?: string) {
    const where: any = { hackathonId, teamId };
    if (challengeId) where.challengeId = challengeId;

    return this.prisma.hackathonSubmission.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
    });
  }
}
