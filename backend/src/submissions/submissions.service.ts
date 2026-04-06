import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { RunCodeDto } from './dto/create-submission.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    private aiService: AiService,
  ) { }

  async create(userId: string, dto: any) {
    // Check challenge exists
    const challengeId = dto.challengeId || dto.problemId;

    if (!challengeId) throw new NotFoundException('Challenge ID not provided');

    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const submission = await this.prisma.submission.create({
      data: {
        userId,
        challengeId: challengeId,
        kind: dto.kind as any,
        context: dto.context || 'solo',
        language: dto.language,
        code: dto.code,
        canvasJson: dto.canvasJson,
        snapshotUrl: dto.snapshotUrl,
        verdict: 'queued',
        score: 0,
      },
    });

    // For code submissions, enqueue for background execution
    if (dto.kind === 'CODE' && dto.code) {
      const tests = challenge.tests as { input: string; expectedOutput: string }[] || [];
      
      // If no test cases defined, return a default pass immediately
      if (tests.length === 0) {
        this.logger.warn(`Challenge ${challenge.id} has no test cases — auto-accepting submission`);
        return this.prisma.submission.update({
          where: { id: submission.id },
          data: {
            verdict: 'AC',
            score: 100,
            testsPassed: 0,
            testsTotal: 0,
            timeMs: 0,
            memMb: 0,
          },
        });
      }

      const jobId = await this.queueService.addCodeExecutionJob({
        submissionId: submission.id,
        userId,
        challengeId: challenge.id,
        code: dto.code,
        language: dto.language || 'javascript',
        tests,
        context: dto.context || 'solo',
        duelId: dto.duelId,
      });

      return this.prisma.submission.update({
        where: { id: submission.id },
        data: { jobId },
      });
    }

    return submission;
  }

  /**
   * Run user code without creating a submission (the "Run" button).
   * Executes in the Docker sandbox against all test cases.
   */
  async runCode(userId: string, dto: RunCodeDto) {
    this.logger.log(`User ${userId} running code — lang=${dto.language}`);

    // Fetch challenge to get test cases
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: dto.challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const tests = challenge.tests as { input: string; expectedOutput: string }[] || [];

    if (tests.length === 0) {
      this.logger.warn(`Challenge ${challenge.id} has no test cases`);
      return {
        passed: 0,
        total: 0,
        results: [],
        verdict: 'No tests available',
        totalTimeMs: 0,
        maxMemMb: 0,
      };
    }

    // Use evaluateOnly to run against all tests
    const result = await this.queueService.addEvaluateCodeJob({
      userId,
      language: dto.language,
      code: dto.code,
      tests,
    });

    return result;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    userId?: string;
    challengeId?: string;
    verdict?: string;
    kind?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.challengeId) where.challengeId = query.challengeId;
    if (query.verdict) where.verdict = query.verdict;
    if (query.kind) where.kind = query.kind;

    const [submissions, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          challenge: {
            select: { id: true, title: true, kind: true, difficulty: true },
          },
          user: { select: { id: true, username: true } },
        },
      }),
      this.prisma.submission.count({ where }),
    ]);

    return { data: submissions, total, page, limit };
  }

  async findOne(id: string, requesterId?: string, requesterRole?: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        challenge: true,
        user: { select: { id: true, username: true } },
        aiReview: true,
      },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    // Ownership check: only the owner or admin can view the full submission
    if (requesterId && requesterRole !== 'admin' && submission.userId !== requesterId) {
      throw new ForbiddenException('You can only view your own submissions');
    }

    return submission;
  }

  async generateAiReview(submissionId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { challenge: true, aiReview: true },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    if (submission.aiReview) {
      return submission.aiReview;
    }

    if (!submission.code || !submission.challenge) {
      throw new Error('Code or challenge not found');
    }

    try {
      const startTime = Date.now();
      const review = await this.aiService.reviewCode({
        code: submission.code,
        language: submission.language || 'javascript',
        challengeTitle: submission.challenge.title,
        challengeDescription: submission.challenge.descriptionMd || '',
      });
      const latencyMs = Date.now() - startTime;

      const aiReview = await this.prisma.aIReview.create({
        data: {
          submissionId: submission.id,
          score: review.score,
          summary: review.summary,
          strengths: review.strengths,
          improvements: review.improvements,
          bugs: review.bugs,
          suggestions: review.suggestions,
          complexity: review.complexity,
          readability: review.readability,
          bestPractices: review.bestPractices,
          latencyMs,
        },
      });

      return aiReview;
    } catch (error) {
      this.logger.error('Failed to generate AI review:', error);
      throw error;
    }
  }

  async getUserHistory(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      kind?: string;
      verdict?: string;
    },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.kind) where.kind = query.kind;
    if (query.verdict) where.verdict = query.verdict;

    const [submissions, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          challenge: {
            select: { id: true, title: true, kind: true, difficulty: true },
          },
        },
      }),
      this.prisma.submission.count({ where }),
    ]);

    return { data: submissions, total, page, limit };
  }
}
