import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JudgeService } from './judge.service';
import { ConfigService } from '@nestjs/config';

@Processor('code-execution', { 
  concurrency: process.env.JUDGE_WORKER_CONCURRENCY ? parseInt(process.env.JUDGE_WORKER_CONCURRENCY) : 5 
})
export class JudgeProcessor extends WorkerHost {
  private readonly logger = new Logger(JudgeProcessor.name);

  constructor(
    private readonly judgeService: JudgeService,
    private configService: ConfigService,
  ) {
    super();
    this.logger.log(`Started JudgeProcessor with concurrency ${this.configService.get('JUDGE_WORKER_CONCURRENCY', 5)}`);
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
    
    try {
      if (job.name === 'execute-code') {
        const { submissionId, language, code, tests } = job.data;
        return await this.judgeService.executeAndEvaluate(submissionId, language, code, tests);
      } else if (job.name === 'run-code') {
        const { language, code } = job.data;
        return await this.judgeService.runCode(language, code);
      } else if (job.name === 'evaluate-code') {
        const { language, code, tests } = job.data;
        return await this.judgeService.evaluateOnly(language, code, tests);
      } else {
        throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
