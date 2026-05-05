import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns ok when redis is ready', async () => {
    const queueMock = {
      client: Promise.resolve({ status: 'ready' }),
      getJobCounts: jest.fn().mockResolvedValue({
        wait: 1,
        active: 2,
        completed: 3,
        failed: 0,
        delayed: 0,
      }),
    } as any;

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

  it('returns error when queue check fails', async () => {
    const queueMock = {
      client: Promise.resolve({ status: 'ready' }),
      getJobCounts: jest.fn().mockRejectedValue(new Error('redis down')),
    } as any;

    const controller = new HealthController(queueMock);

    const result = await controller.check();

    expect(result.status).toBe('error');
    expect(result.error).toBe('redis down');
  });
});
