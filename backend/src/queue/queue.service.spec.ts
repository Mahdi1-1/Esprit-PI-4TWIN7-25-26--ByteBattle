import { QueueService } from "./queue.service";

type QueueEventHandler = (payload: any) => any;
const handlers = new Map<string, QueueEventHandler>();
let mockQueueEvents: { on: jest.Mock; close: jest.Mock };

jest.mock("bullmq", () => ({
  QueueEvents: jest.fn().mockImplementation(() => mockQueueEvents),
}));

describe("QueueService", () => {
  const mockQueue = {
    getJob: jest.fn(),
    add: jest.fn(),
  };
  const mockConfig = {
    get: jest.fn().mockImplementation((key: string, fallback?: any) => {
      if (key === "REDIS_HOST") return "redis";
      if (key === "REDIS_PORT") return 6379;
      if (key === "REDIS_PASSWORD") return "";
      return fallback;
    }),
  };
  const mockGateway = {
    emitSubmissionStatus: jest.fn(),
  };
  const mockBadgeEngine = {
    onSubmissionAccepted: jest.fn().mockResolvedValue(undefined),
    checkUserLevelBadges: jest.fn().mockResolvedValue(undefined),
  };

  let service: QueueService;

  beforeEach(() => {
    handlers.clear();
    mockQueueEvents = {
      on: jest.fn((event: string, handler: QueueEventHandler) => {
        handlers.set(event, handler);
        return mockQueueEvents;
      }),
      close: jest.fn(),
    } as any;

    service = new QueueService(
      mockQueue as any,
      mockConfig as any,
      mockGateway as any,
      mockBadgeEngine as any,
    );

    jest.clearAllMocks();
  });

  it("emits executing status on active jobs", async () => {
    mockQueue.getJob.mockResolvedValue({
      name: "execute-code",
      data: { userId: "u1", submissionId: "s1" },
    });

    await service.onModuleInit();

    const activeHandler = handlers.get("active");
    await activeHandler!({ jobId: "job-1" });

    expect(mockGateway.emitSubmissionStatus).toHaveBeenCalledWith("u1", {
      submissionId: "s1",
      status: "executing",
    });
  });

  it("emits completed status and triggers badges", async () => {
    mockQueue.getJob.mockResolvedValue({
      name: "execute-code",
      data: {
        userId: "u1",
        submissionId: "s1",
        challengeId: "c1",
        language: "ts",
        context: "practice",
      },
    });

    await service.onModuleInit();

    const completedHandler = handlers.get("completed");
    await completedHandler!({
      jobId: "job-1",
      returnvalue: JSON.stringify({ verdict: "AC", totalTimeMs: 123 }),
    });

    expect(mockGateway.emitSubmissionStatus).toHaveBeenCalledWith("u1", {
      submissionId: "s1",
      status: "completed",
      result: { verdict: "AC", totalTimeMs: 123 },
    });
    expect(mockBadgeEngine.onSubmissionAccepted).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ challengeId: "c1", language: "ts" }),
    );
    expect(mockBadgeEngine.checkUserLevelBadges).toHaveBeenCalledWith("u1");
  });

  it("emits error status on failed jobs", async () => {
    mockQueue.getJob.mockResolvedValue({
      name: "execute-code",
      data: { userId: "u1", submissionId: "s1" },
    });

    await service.onModuleInit();

    const failedHandler = handlers.get("failed");
    await failedHandler!({ jobId: "job-1", failedReason: "boom" });

    expect(mockGateway.emitSubmissionStatus).toHaveBeenCalledWith("u1", {
      submissionId: "s1",
      status: "error",
      error: "boom",
    });
  });

  it("adds code execution job with correct priority", async () => {
    mockQueue.add.mockResolvedValue({ id: "job-1" });

    const jobId = await service.addCodeExecutionJob({
      userId: "u1",
      submissionId: "s1",
      challengeId: "c1",
      language: "ts",
      context: "duel",
    } as any);

    expect(mockQueue.add).toHaveBeenCalledWith(
      "execute-code",
      expect.any(Object),
      expect.objectContaining({ priority: 1, attempts: 3 }),
    );
    expect(mockGateway.emitSubmissionStatus).toHaveBeenCalledWith("u1", {
      submissionId: "s1",
      status: "queued",
      jobId: "job-1",
    });
    expect(jobId).toBe("job-1");
  });

  it("waits for run-code jobs to finish", async () => {
    service.queueEvents = { name: "events" } as any;
    const waitUntilFinished = jest.fn().mockResolvedValue({ ok: true });
    mockQueue.add.mockResolvedValue({ id: "job-2", waitUntilFinished });

    const result = await service.addRunCodeJob({ code: "print(1)" });

    expect(mockQueue.add).toHaveBeenCalledWith(
      "run-code",
      { code: "print(1)" },
      expect.objectContaining({ priority: 1, attempts: 1 }),
    );
    expect(waitUntilFinished).toHaveBeenCalledWith(service.queueEvents);
    expect(result).toEqual({ ok: true });
  });

  it("waits for evaluate-code jobs to finish", async () => {
    service.queueEvents = { name: "events" } as any;
    const waitUntilFinished = jest.fn().mockResolvedValue({ ok: true });
    mockQueue.add.mockResolvedValue({ id: "job-3", waitUntilFinished });

    const result = await service.addEvaluateCodeJob({ duelId: "d1" });

    expect(mockQueue.add).toHaveBeenCalledWith(
      "evaluate-code",
      { duelId: "d1" },
      expect.objectContaining({ priority: 1, attempts: 1 }),
    );
    expect(waitUntilFinished).toHaveBeenCalledWith(service.queueEvents);
    expect(result).toEqual({ ok: true });
  });

  it("closes queue events on module destroy", async () => {
    await service.onModuleInit();
    await service.onModuleDestroy();

    expect(mockQueueEvents.close).toHaveBeenCalled();
  });
});
