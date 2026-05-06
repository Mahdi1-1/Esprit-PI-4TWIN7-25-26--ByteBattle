import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { SubmissionsService } from "./submissions.service";
import { PrismaService } from "../prisma/prisma.service";
import { QueueService } from "../queue/queue.service";
import { AiService } from "../ai/ai.service";

describe("SubmissionsService", () => {
  let service: SubmissionsService;

  const mockPrisma = {
    challenge: {
      findUnique: jest.fn(),
    },
    submission: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    aIReview: {
      create: jest.fn(),
    },
  };

  const mockQueue = {
    addCodeExecutionJob: jest.fn(),
    addEvaluateCodeJob: jest.fn(),
  };

  const mockAi = {
    reviewCode: jest.fn(),
  };

  const baseChallenge = {
    id: "c1",
    title: "Two Sum",
    descriptionMd: "desc",
    tests: [{ input: "1", expectedOutput: "2" }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QueueService, useValue: mockQueue },
        { provide: AiService, useValue: mockAi },
      ],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("throws when challengeId is missing", async () => {
      await expect(service.create("user-1", { kind: "CODE" })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("throws when challenge is not found", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(null);

      await expect(
        service.create("user-1", { challengeId: "c1" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("auto-accepts when no tests are defined", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue({
        ...baseChallenge,
        tests: [],
      });
      mockPrisma.submission.create.mockResolvedValue({ id: "s1" });
      mockPrisma.submission.update.mockResolvedValue({ id: "s1", verdict: "AC" });

      const result = await service.create("user-1", {
        challengeId: "c1",
        kind: "CODE",
        code: "print(1)",
        language: "python",
      });

      expect(mockQueue.addCodeExecutionJob).not.toHaveBeenCalled();
      expect(result.verdict).toBe("AC");
    });

    it("enqueues code execution when tests exist", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(baseChallenge);
      mockPrisma.submission.create.mockResolvedValue({ id: "s1" });
      mockQueue.addCodeExecutionJob.mockResolvedValue("job-1");
      mockPrisma.submission.update.mockResolvedValue({ id: "s1", jobId: "job-1" });

      const result = await service.create("user-1", {
        challengeId: "c1",
        kind: "CODE",
        code: "print(1)",
        language: "python",
      });

      expect(mockQueue.addCodeExecutionJob).toHaveBeenCalledWith(
        expect.objectContaining({ submissionId: "s1" }),
      );
      expect(result.jobId).toBe("job-1");
    });

    it("returns submission for non-code kinds", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(baseChallenge);
      mockPrisma.submission.create.mockResolvedValue({ id: "s1", kind: "CANVAS" });

      const result = await service.create("user-1", {
        challengeId: "c1",
        kind: "CANVAS",
      });

      expect(result.kind).toBe("CANVAS");
      expect(mockQueue.addCodeExecutionJob).not.toHaveBeenCalled();
    });
  });

  describe("runCode", () => {
    it("throws when challenge missing", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(null);

      await expect(
        service.runCode("user-1", { challengeId: "c1" } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("returns empty result when no tests", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue({
        ...baseChallenge,
        tests: [],
      });

      const result = await service.runCode("user-1", {
        challengeId: "c1",
        code: "print(1)",
        language: "python",
      });

      expect(result.total).toBe(0);
      expect(mockQueue.addEvaluateCodeJob).not.toHaveBeenCalled();
    });

    it("delegates to evaluate-code job when tests exist", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(baseChallenge);
      mockQueue.addEvaluateCodeJob.mockResolvedValue({ verdict: "AC" });

      const result = await service.runCode("user-1", {
        challengeId: "c1",
        code: "print(1)",
        language: "python",
      });

      expect(mockQueue.addEvaluateCodeJob).toHaveBeenCalled();
      expect(result.verdict).toBe("AC");
    });
  });

  describe("saveDraft", () => {
    it("throws when challengeId missing", async () => {
      await expect(service.saveDraft("user-1", {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("updates existing draft", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(baseChallenge);
      mockPrisma.submission.findFirst.mockResolvedValue({ id: "draft-1" });
      mockPrisma.submission.update.mockResolvedValue({ id: "draft-1" });

      const result = await service.saveDraft("user-1", { challengeId: "c1" });

      expect(mockPrisma.submission.update).toHaveBeenCalled();
      expect(result.id).toBe("draft-1");
    });

    it("creates a new draft when none exists", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(baseChallenge);
      mockPrisma.submission.findFirst.mockResolvedValue(null);
      mockPrisma.submission.create.mockResolvedValue({ id: "draft-2" });

      const result = await service.saveDraft("user-1", { challengeId: "c1" });

      expect(mockPrisma.submission.create).toHaveBeenCalled();
      expect(result.id).toBe("draft-2");
    });
  });

  describe("findDraft/deleteDraft", () => {
    it("returns draft when found", async () => {
      mockPrisma.submission.findFirst.mockResolvedValue({ id: "draft-1" });

      const result = await service.findDraft("user-1", "c1");

      expect(result?.id).toBe("draft-1");
    });

    it("returns deleted:0 when no draft", async () => {
      mockPrisma.submission.findFirst.mockResolvedValue(null);

      const result = await service.deleteDraft("user-1", "c1");

      expect(result).toEqual({ deleted: 0 });
    });

    it("deletes draft when present", async () => {
      mockPrisma.submission.findFirst.mockResolvedValue({ id: "draft-1" });

      const result = await service.deleteDraft("user-1", "c1");

      expect(mockPrisma.submission.delete).toHaveBeenCalledWith({
        where: { id: "draft-1" },
      });
      expect(result).toEqual({ deleted: 1 });
    });
  });

  describe("findAll", () => {
    it("filters by query params", async () => {
      mockPrisma.submission.findMany.mockResolvedValue([]);
      mockPrisma.submission.count.mockResolvedValue(0);

      await service.findAll({
        page: 2,
        limit: 5,
        userId: "u1",
        challengeId: "c1",
        verdict: "AC",
        kind: "CODE",
      });

      expect(mockPrisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "u1",
            challengeId: "c1",
            verdict: "AC",
            kind: "CODE",
          }),
          skip: 5,
          take: 5,
        }),
      );
    });
  });

  describe("findOne", () => {
    it("throws when missing", async () => {
      mockPrisma.submission.findUnique.mockResolvedValue(null);

      await expect(service.findOne("s1", "u1", "user")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("forbids access for non-owner", async () => {
      mockPrisma.submission.findUnique.mockResolvedValue({
        id: "s1",
        userId: "owner",
      });

      await expect(service.findOne("s1", "u1", "user")).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it("allows admin access", async () => {
      mockPrisma.submission.findUnique.mockResolvedValue({
        id: "s1",
        userId: "owner",
      });

      const result = await service.findOne("s1", "admin", "admin");

      expect(result.id).toBe("s1");
    });
  });

  describe("generateAiReview", () => {
    it("throws when submission missing", async () => {
      mockPrisma.submission.findUnique.mockResolvedValue(null);

      await expect(service.generateAiReview("s1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("returns existing ai review when present", async () => {
      mockPrisma.submission.findUnique.mockResolvedValue({
        id: "s1",
        aiReview: { id: "r1" },
      });

      const result = await service.generateAiReview("s1");

      expect(result).toEqual({ id: "r1" });
    });

    it("creates ai review when missing", async () => {
      mockPrisma.submission.findUnique.mockResolvedValue({
        id: "s1",
        code: "print(1)",
        language: "python",
        challenge: { title: "Two Sum", descriptionMd: "desc" },
        aiReview: null,
      });
      mockAi.reviewCode.mockResolvedValue({
        score: 90,
        summary: "Good",
        strengths: [],
        improvements: [],
        bugs: [],
        suggestions: [],
        complexity: "O(n)",
        readability: "good",
        bestPractices: [],
      });
      mockPrisma.aIReview.create.mockResolvedValue({ id: "r1" });

      const result = await service.generateAiReview("s1");

      expect(mockAi.reviewCode).toHaveBeenCalled();
      expect(mockPrisma.aIReview.create).toHaveBeenCalled();
      expect(result.id).toBe("r1");
    });
  });

  describe("getUserHistory", () => {
    it("filters by kind and verdict", async () => {
      mockPrisma.submission.findMany.mockResolvedValue([]);
      mockPrisma.submission.count.mockResolvedValue(0);

      await service.getUserHistory("u1", { kind: "CODE", verdict: "AC" });

      expect(mockPrisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: "u1", kind: "CODE", verdict: "AC" }),
        }),
      );
    });
  });
});
