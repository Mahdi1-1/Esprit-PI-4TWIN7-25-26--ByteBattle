import { Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('returns ok when redis is ready', async () => {
    const getJobCountsMock = jest.fn().mockResolvedValue({
      wait: 1,
      active: 2,
      completed: 3,
      failed: 0,
      delayed: 0,
    });
    const queueMock = {
      client: Promise.resolve({ status: 'ready' }),
      getJobCounts: getJobCountsMock,
    } as unknown as Queue;

    const controller = new HealthController(queueMock);

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.redis).toBe('connected');
    expect(result.queue).toEqual({
      wait: 1,
      active: 2,
      completed: 3,
      failed: 0,
      delayed: 0,
    });
  });

  it('returns ok with disconnected redis when queue client is not ready', async () => {
    const queueMock = {
      client: Promise.resolve({ status: 'connecting' }),
      getJobCounts: jest.fn().mockResolvedValue({}),
    } as unknown as Queue;

    const controller = new HealthController(queueMock);

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.redis).toBe('disconnected');
  });

  it('returns error when queue check fails', async () => {
    const getJobCountsMock = jest
      .fn()
      .mockRejectedValue(new Error('redis down'));
    const queueMock = {
      client: Promise.resolve({ status: 'ready' }),
      getJobCounts: getJobCountsMock,
    } as unknown as Queue;

    const controller = new HealthController(queueMock);

    const result = await controller.check();

    expect(result.status).toBe('error');
    expect(result.error).toBe('redis down');
  });

  it('normalizes non-Error failures', async () => {
    const queueMock = {
      client: Promise.resolve({ status: 'ready' }),
      getJobCounts: jest.fn().mockRejectedValue('redis unavailable'),
    } as unknown as Queue;

    const controller = new HealthController(queueMock);

    const result = await controller.check();

    expect(result.status).toBe('error');
    expect(result.error).toBe('Unknown error');
  });
});
