import { Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { MetricsController } from './metrics.controller';
import { MetricsModule } from './metrics.module';

describe('MetricsController', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns queue metrics when counts are available', async () => {
    const getJobCountsMock = jest.fn().mockResolvedValue({
      wait: 1,
      active: 2,
      completed: 3,
      failed: 4,
      delayed: 5,
    });
    const queueMock = {
      getJobCounts: getJobCountsMock,
    } as unknown as Queue;

    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      rss: 11,
      heapUsed: 22,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0,
    });
    jest.spyOn(process, 'uptime').mockReturnValue(10);
    jest.spyOn(Date, 'now').mockReturnValue(10000);

    const controller = new MetricsController(queueMock);
    const output = await controller.getMetrics();

    expect(getJobCountsMock).toHaveBeenCalledWith(
      'wait',
      'active',
      'completed',
      'failed',
      'delayed',
    );
    expect(output).toContain('bytebattle_judge_queue_waiting 1');
    expect(output).toContain('bytebattle_judge_queue_active 2');
    expect(output).toContain('bytebattle_judge_queue_completed 3');
    expect(output).toContain('bytebattle_judge_queue_failed 4');
    expect(output).toContain('bytebattle_judge_queue_delayed 5');
    expect(output).toContain('process_resident_memory_bytes 11');
    expect(output).toContain('process_heap_used_bytes 22');
    expect(output).toContain('process_start_time_milliseconds 0');
  });

  it('logs a warning and uses zeros when queue metrics fail', async () => {
    const getJobCountsMock = jest.fn().mockRejectedValue(new Error('boom'));
    const queueMock = {
      getJobCounts: getJobCountsMock,
    } as unknown as Queue;
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      rss: 1,
      heapUsed: 2,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0,
    });
    jest.spyOn(process, 'uptime').mockReturnValue(1);
    jest.spyOn(Date, 'now').mockReturnValue(1000);

    const controller = new MetricsController(queueMock);
    const output = await controller.getMetrics();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unable to read BullMQ metrics'),
    );
    expect(output).toContain('bytebattle_judge_queue_waiting 0');
    expect(output).toContain('bytebattle_judge_queue_active 0');
    expect(output).toContain('bytebattle_judge_queue_completed 0');
    expect(output).toContain('bytebattle_judge_queue_failed 0');
    expect(output).toContain('bytebattle_judge_queue_delayed 0');
  });

  it('defaults missing queue count fields to zero', async () => {
    const queueMock = {
      getJobCounts: jest.fn().mockResolvedValue({ completed: 7 }),
    } as unknown as Queue;

    jest.spyOn(process, 'memoryUsage').mockReturnValue({
      rss: 1,
      heapUsed: 2,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0,
    });
    jest.spyOn(process, 'uptime').mockReturnValue(1);
    jest.spyOn(Date, 'now').mockReturnValue(1000);

    const controller = new MetricsController(queueMock);
    const output = await controller.getMetrics();

    expect(output).toContain('bytebattle_judge_queue_waiting 0');
    expect(output).toContain('bytebattle_judge_queue_active 0');
    expect(output).toContain('bytebattle_judge_queue_completed 7');
    expect(output).toContain('bytebattle_judge_queue_failed 0');
    expect(output).toContain('bytebattle_judge_queue_delayed 0');
  });

  it('logs unknown queue metric failures safely', async () => {
    const queueMock = {
      getJobCounts: jest.fn().mockRejectedValue('boom'),
    } as unknown as Queue;
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    const controller = new MetricsController(queueMock);
    await controller.getMetrics();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown error'),
    );
  });

  it('exposes MetricsModule', () => {
    expect(MetricsModule).toBeDefined();
  });
});
