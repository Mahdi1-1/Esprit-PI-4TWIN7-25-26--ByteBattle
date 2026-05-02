import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JudgeService } from './judge.service';
import { ConfigService } from '@nestjs/config';

type JudgeTestCase = { input: string; expectedOutput: string };
type ExecuteCodeJobData = {
  submissionId: string;
  language: string;
  code: string;
  tests: JudgeTestCase[];
};
type RunCodeJobData = { language: string; code: string };
type EvaluateCodeJobData = {
  language: string;
  code: string;
  tests: JudgeTestCase[];
};
type JudgeJobData = ExecuteCodeJobData | RunCodeJobData | EvaluateCodeJobData;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isTestCase = (value: unknown): value is JudgeTestCase =>
  isObject(value) &&
  typeof value.input === 'string' &&
  typeof value.expectedOutput === 'string';

const isExecuteCodeJobData = (value: unknown): value is ExecuteCodeJobData =>
  isObject(value) &&
  typeof value.submissionId === 'string' &&
  typeof value.language === 'string' &&
  typeof value.code === 'string' &&
  Array.isArray(value.tests) &&
  value.tests.every(isTestCase);

const isRunCodeJobData = (value: unknown): value is RunCodeJobData =>
  isObject(value) &&
  typeof value.language === 'string' &&
  typeof value.code === 'string';

const isEvaluateCodeJobData = (value: unknown): value is EvaluateCodeJobData =>
  isObject(value) &&
  typeof value.language === 'string' &&
  typeof value.code === 'string' &&
  Array.isArray(value.tests) &&
  value.tests.every(isTestCase);

@Processor('code-execution', {
  concurrency: process.env.JUDGE_WORKER_CONCURRENCY
    ? parseInt(process.env.JUDGE_WORKER_CONCURRENCY, 10)
    : 5,
})
export class JudgeProcessor extends WorkerHost {
  private readonly logger = new Logger(JudgeProcessor.name);

  constructor(
    private readonly judgeService: JudgeService,
    private configService: ConfigService,
  ) {
    super();
    this.logger.log(
      `Started JudgeProcessor with concurrency ${this.configService.get('JUDGE_WORKER_CONCURRENCY', 5)}`,
    );
  }

  async process(job: Job<JudgeJobData, unknown, string>): Promise<unknown> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    try {
      if (job.name === 'execute-code') {
        const data = job.data;
        if (!isExecuteCodeJobData(data)) {
          throw new Error('Invalid execute-code payload');
        }
        return await this.judgeService.executeAndEvaluate(
          data.submissionId,
          data.language,
          data.code,
          data.tests,
        );
      }

      if (job.name === 'run-code') {
        const data = job.data;
        if (!isRunCodeJobData(data)) {
          throw new Error('Invalid run-code payload');
        }
        return await this.judgeService.runCode(data.language, data.code);
      }

      if (job.name === 'evaluate-code') {
        const data = job.data;
        if (!isEvaluateCodeJobData(data)) {
          throw new Error('Invalid evaluate-code payload');
        }
        return await this.judgeService.evaluateOnly(
          data.language,
          data.code,
          data.tests,
        );
      }

      throw new Error(`Unknown job type: ${job.name}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Job ${job.id} failed: ${message}`, stack);
      throw error;
    }
  }
}
