import { Injectable, Logger } from '@nestjs/common';
import {
  SandboxService,
  EvaluationResult,
  ExecutionResult,
} from '../sandbox/sandbox.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JudgeService {
  private readonly logger = new Logger(JudgeService.name);

  constructor(
    private readonly sandbox: SandboxService,
    private readonly prisma: PrismaService,
  ) {}

  async executeAndEvaluate(
    submissionId: string,
    language: string,
    code: string,
    tests: { input: string; expectedOutput: string }[],
  ): Promise<EvaluationResult> {
    this.logger.log(`Executing code for submission ${submissionId}`);

    const evaluation = await this.sandbox.evaluateAgainstTests(
      language,
      code,
      tests,
    );

    const score =
      evaluation.verdict === 'AC'
        ? 100
        : Math.round((evaluation.passed / evaluation.total) * 100);

    await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        verdict: evaluation.verdict,
        score,
        testsPassed: evaluation.passed,
        testsTotal: evaluation.total,
        timeMs: evaluation.totalTimeMs,
        memMb: evaluation.maxMemMb,
      },
    });

    this.logger.log(
      `Submission ${submissionId} finished with verdict ${evaluation.verdict} (Score: ${score})`,
    );

    return evaluation;
  }

  async runCode(language: string, code: string): Promise<ExecutionResult> {
    this.logger.log(`Running code interactively (language: ${language})`);
    return this.sandbox.executeCode(language, code, '');
  }

  async evaluateOnly(
    language: string,
    code: string,
    tests: { input: string; expectedOutput: string }[],
  ): Promise<EvaluationResult> {
    this.logger.log(
      `Evaluating code interactively against tests (language: ${language})`,
    );
    return this.sandbox.evaluateAgainstTests(language, code, tests);
  }
}
