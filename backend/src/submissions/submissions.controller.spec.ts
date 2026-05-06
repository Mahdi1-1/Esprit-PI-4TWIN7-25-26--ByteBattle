import { Test, TestingModule } from "@nestjs/testing";
import { SubmissionsController } from "./submissions.controller";
import { SubmissionsService } from "./submissions.service";

const mockSubmissionsService = {
  create: jest.fn(),
  runCode: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  generateAiReview: jest.fn(),
  getUserHistory: jest.fn(),
  saveDraft: jest.fn(),
  findDraft: jest.fn(),
  deleteDraft: jest.fn(),
};

describe("SubmissionsController", () => {
  let controller: SubmissionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionsController],
      providers: [
        { provide: SubmissionsService, useValue: mockSubmissionsService },
      ],
    }).compile();

    controller = module.get<SubmissionsController>(SubmissionsController);
    jest.clearAllMocks();
  });

  describe("submitCode()", () => {
    it("should call submissionsService.create with userId and dto", async () => {
      const dto = {
        challengeId: "c1",
        kind: "CODE",
        language: "python3",
        code: "print(1)",
      };
      mockSubmissionsService.create.mockResolvedValue({
        id: "sub-1",
        verdict: "queued",
      });

      const result = await controller.submitCode("user-1", dto as any);

      expect(mockSubmissionsService.create).toHaveBeenCalledWith("user-1", dto);
      expect(result.verdict).toBe("queued");
    });
  });

  describe("runCode()", () => {
    it("should call submissionsService.runCode with userId and dto", async () => {
      const dto = { challengeId: "c1", language: "python3", code: "print(1)" };
      mockSubmissionsService.runCode.mockResolvedValue({
        verdict: "AC",
        passed: 1,
        total: 1,
      });

      const result = await controller.runCode("user-1", dto as any);

      expect(mockSubmissionsService.runCode).toHaveBeenCalledWith(
        "user-1",
        dto,
      );
      expect(result.verdict).toBe("AC");
    });
  });

  describe("getMyHistory()", () => {
    it("should call getUserHistory with userId and pagination", async () => {
      mockSubmissionsService.getUserHistory.mockResolvedValue({
        data: [],
        total: 0,
      });
      await controller.getMyHistory("user-1", 2, 10, "CODE", "AC");
      expect(mockSubmissionsService.getUserHistory).toHaveBeenCalledWith(
        "user-1",
        { page: 2, limit: 10, kind: "CODE", verdict: "AC" },
      );
    });
  });

  describe("drafts()", () => {
    it("should save draft", async () => {
      mockSubmissionsService.saveDraft.mockResolvedValue({ id: "draft-1" });
      const result = await controller.saveDraft("user-1", {
        challengeId: "c1",
      } as any);
      expect(mockSubmissionsService.saveDraft).toHaveBeenCalledWith("user-1", {
        challengeId: "c1",
      });
      expect(result.id).toBe("draft-1");
    });

    it("should get draft", async () => {
      mockSubmissionsService.findDraft.mockResolvedValue({ id: "draft-1" });
      await controller.getDraft("user-1", "c1");
      expect(mockSubmissionsService.findDraft).toHaveBeenCalledWith(
        "user-1",
        "c1",
      );
    });

    it("should delete draft", async () => {
      mockSubmissionsService.deleteDraft.mockResolvedValue({ deleted: 1 });
      const result = await controller.deleteDraft("user-1", "c1");
      expect(mockSubmissionsService.deleteDraft).toHaveBeenCalledWith(
        "user-1",
        "c1",
      );
      expect(result.deleted).toBe(1);
    });
  });

  describe("getStatus()", () => {
    it("should map status from submission", async () => {
      mockSubmissionsService.findOne.mockResolvedValue({
        verdict: "AC",
        score: 100,
        timeMs: 10,
        memMb: 32,
        testsPassed: 3,
        testsTotal: 3,
      });

      const result = await controller.getStatus("sub-1", {
        id: "user-1",
        role: "user",
      });

      expect(result.status).toBe("AC");
      expect(result.testsTotal).toBe(3);
    });
  });

  describe("generateAiReview()", () => {
    it("should delegate to submissionsService", async () => {
      mockSubmissionsService.generateAiReview.mockResolvedValue({
        id: "review-1",
      });

      const result = await controller.generateAiReview("sub-1");

      expect(mockSubmissionsService.generateAiReview).toHaveBeenCalledWith(
        "sub-1",
      );
      expect(result.id).toBe("review-1");
    });
  });

  describe("findAll()", () => {
    it("should call findAll with filters", async () => {
      mockSubmissionsService.findAll.mockResolvedValue({ data: [], total: 0 });

      await controller.findAll(2, 25, "user-1", "c1", "AC");

      expect(mockSubmissionsService.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 25,
        userId: "user-1",
        challengeId: "c1",
        verdict: "AC",
      });
    });
  });
});
