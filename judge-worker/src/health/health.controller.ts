import { Controller, Get, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    @InjectQueue('code-execution') private readonly executionQueue: Queue,
  ) {}

  @Get()
  async check() {
    try {
      const isRedisReady = await this.executionQueue.client.then(c => c.status === 'ready');
      const counts = await this.executionQueue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed');

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        redis: isRedisReady ? 'connected' : 'disconnected',
        queue: counts,
      };
    } catch (error: any) {
      this.logger.error('Health check failed', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
