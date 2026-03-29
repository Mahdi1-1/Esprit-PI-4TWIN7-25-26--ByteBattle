import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, QueueEvents, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { forwardRef, Inject } from '@nestjs/common';
import { CodeExecutionJob } from './interfaces/code-execution-job.interface';
import { SubmissionsGateway } from '../submissions/submissions.gateway';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  public queueEvents: QueueEvents;

  constructor(
    @InjectQueue('code-execution') private readonly codeExecutionQueue: Queue,
    private configService: ConfigService,
    @Inject(forwardRef(() => SubmissionsGateway))
    private submissionsGateway: SubmissionsGateway,
  ) {}

  async onModuleInit() {
    this.queueEvents = new QueueEvents('code-execution', {
      connection: {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD', ''),
      },
    });

    this.queueEvents.on('active', async ({ jobId }) => {
      const job = await this.codeExecutionQueue.getJob(jobId);
      if (job && job.name === 'execute-code') {
        this.submissionsGateway.emitSubmissionStatus(job.data.userId, {
          submissionId: job.data.submissionId,
          status: 'executing',
        });
      }
    });

    this.queueEvents.on('completed', async ({ jobId, returnvalue }) => {
      const job = await this.codeExecutionQueue.getJob(jobId);
      if (job && job.name === 'execute-code') {
        this.submissionsGateway.emitSubmissionStatus(job.data.userId, {
          submissionId: job.data.submissionId,
          status: 'completed',
          result: returnvalue,
        });
      }
    });

    this.queueEvents.on('failed', async ({ jobId, failedReason }) => {
      const job = await this.codeExecutionQueue.getJob(jobId);
      if (job && job.name === 'execute-code') {
        this.submissionsGateway.emitSubmissionStatus(job.data.userId, {
          submissionId: job.data.submissionId,
          status: 'error',
          error: failedReason,
        });
      }
    });
  }

  async onModuleDestroy() {
    await this.queueEvents.close();
  }

  async addCodeExecutionJob(jobData: CodeExecutionJob): Promise<string> {
    const isDuel = jobData.context === 'duel';
    
    const job = await this.codeExecutionQueue.add(
      'execute-code', 
      jobData, 
      {
        priority: isDuel ? 1 : 2, // 1 is higher priority in BullMQ
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      }
    );
    
    this.logger.log(`Enqueued code execution job ${job.id} for submission ${jobData.submissionId} (Priority: ${isDuel ? 'High' : 'Normal'})`);
    
    // Emit queued status immediately
    this.submissionsGateway.emitSubmissionStatus(jobData.userId, {
      submissionId: jobData.submissionId,
      status: 'queued',
      jobId: job.id,
    });

    return job.id!;
  }

  async addRunCodeJob(jobData: any): Promise<any> {
    const job = await this.codeExecutionQueue.add(
      'run-code', 
      jobData, 
      {
        priority: 1, // High priority for synchronous interactive runs
        attempts: 1,
        removeOnComplete: true,
      }
    );
    this.logger.log(`Waiting for run-code job ${job.id} to finish synchronously`);
    // wait until the job finishes
    const returnValue = await job.waitUntilFinished(this.queueEvents);
    return returnValue;
  }

  async addEvaluateCodeJob(jobData: any): Promise<any> {
    const job = await this.codeExecutionQueue.add(
      'evaluate-code',
      jobData,
      {
        priority: 1, // High priority for synchronous duels evaluation
        attempts: 1,
        removeOnComplete: true,
      }
    );
    this.logger.log(`Waiting for evaluate-code job ${job.id} to finish synchronously`);
    const returnValue = await job.waitUntilFinished(this.queueEvents);
    return returnValue;
  }
}
