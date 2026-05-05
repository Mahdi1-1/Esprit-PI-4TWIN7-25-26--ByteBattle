import { Controller, Get, Header, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('metrics')
export class MetricsController {
  private readonly logger = new Logger(MetricsController.name);

  constructor(
    @InjectQueue('code-execution') private readonly executionQueue: Queue,
  ) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    const memory = process.memoryUsage();
    const now = Date.now();
    let counts = {
      wait: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };

    try {
      counts = await this.executionQueue.getJobCounts(
        'wait',
        'active',
        'completed',
        'failed',
        'delayed',
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Unable to read BullMQ metrics: ${message}`);
    }

    return [
      '# HELP bytebattle_judge_up Judge worker process availability',
      '# TYPE bytebattle_judge_up gauge',
      'bytebattle_judge_up 1',
      '# HELP bytebattle_judge_uptime_seconds Judge worker uptime in seconds',
      '# TYPE bytebattle_judge_uptime_seconds gauge',
      `bytebattle_judge_uptime_seconds ${process.uptime()}`,
      '# HELP bytebattle_judge_queue_waiting Number of waiting jobs',
      '# TYPE bytebattle_judge_queue_waiting gauge',
      `bytebattle_judge_queue_waiting ${counts.wait ?? 0}`,
      '# HELP bytebattle_judge_queue_active Number of active jobs',
      '# TYPE bytebattle_judge_queue_active gauge',
      `bytebattle_judge_queue_active ${counts.active ?? 0}`,
      '# HELP bytebattle_judge_queue_completed Number of completed jobs',
      '# TYPE bytebattle_judge_queue_completed gauge',
      `bytebattle_judge_queue_completed ${counts.completed ?? 0}`,
      '# HELP bytebattle_judge_queue_failed Number of failed jobs',
      '# TYPE bytebattle_judge_queue_failed gauge',
      `bytebattle_judge_queue_failed ${counts.failed ?? 0}`,
      '# HELP bytebattle_judge_queue_delayed Number of delayed jobs',
      '# TYPE bytebattle_judge_queue_delayed gauge',
      `bytebattle_judge_queue_delayed ${counts.delayed ?? 0}`,
      '# HELP process_resident_memory_bytes Resident memory size in bytes',
      '# TYPE process_resident_memory_bytes gauge',
      `process_resident_memory_bytes ${memory.rss}`,
      '# HELP process_heap_used_bytes V8 heap used in bytes',
      '# TYPE process_heap_used_bytes gauge',
      `process_heap_used_bytes ${memory.heapUsed}`,
      '# HELP process_start_time_milliseconds Process start time since unix epoch in milliseconds',
      '# TYPE process_start_time_milliseconds gauge',
      `process_start_time_milliseconds ${now - Math.round(process.uptime() * 1000)}`,
      '',
    ].join('\n');
  }
}
