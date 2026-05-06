import { Test, TestingModule } from "@nestjs/testing";
import { ChallengesService } from "./challenges.service";
import { PrismaService } from "../prisma/prisma.service";
import { AiService } from "../ai/ai.service";
import { CacheService } from "../cache/cache.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

const mockPrisma = {
  challenge: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  companyMembership: {
    findFirst: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockCache = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

const mockAiService = {
  generateChallengeDraft: jest.fn(),
};

const baseChallenge = {
  id: "chal-1",
  title: "Two Sum",
  kind: "CODE",
  difficulty: "easy",
  tags: ["array"],
  status: "published",
  category: "general",
  descriptionMd: "## Description",
  tests: [
    { input: "1 2", expectedOutput: "3", isHidden: false },
    { input: "5 5", expectedOutput: "10", isHidden: true },
  ],
  allowedLanguages: ["python3", "javascript"],
  constraints: {},
  hints: ["Think about hash maps"],
  examples: [],
  createdAt: new Date(),
  _count: { submissions: 42 },
};

describe("ChallengesService", () => {
  let service: ChallengesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<ChallengesService>(ChallengesService);
    jest.clearAllMocks();
    // Default: cache miss
    mockCache.get.mockResolvedValue(null);
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe("create()", () => {
    it("should create a challenge with correct data", async () => {
      mockPrisma.challenge.create.mockResolvedValue(baseChallenge);

      const dto = {
        title: "Two Sum",
        kind: "CODE",
        difficulty: "easy",
        tags: ["array"],
        statementMd: "## Description",
        allowedLanguages: ["python3"],
        tests: [{ input: "1 2", expectedOutput: "3", isHidden: false }],
      };

      const result = await service.create(dto);

      expect(mockPrisma.challenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Two Sum",
            descriptionMd: "## Description",
          }),
        }),
      );
      expect(result.id).toBe("chal-1");
    });

    it("should map statementMd to descriptionMd", async () => {
      mockPrisma.challenge.create.mockResolvedValue(baseChallenge);
      await service.create({ title: "T", statementMd: "stmt text" });

      const callData = mockPrisma.challenge.create.mock.calls[0][0].data;
      expect(callData.descriptionMd).toBe("stmt text");
    });

    it("should use empty string for descriptionMd when none provided", async () => {
      mockPrisma.challenge.create.mockResolvedValue(baseChallenge);
      await service.create({ title: "T" });

      const callData = mockPrisma.challenge.create.mock.calls[0][0].data;
      expect(callData.descriptionMd).toBe("");
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe("findAll()", () => {
    it("should return paginated challenges with default filter (published)", async () => {
      mockPrisma.challenge.findMany.mockResolvedValue([baseChallenge]);
      mockPrisma.challenge.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(mockPrisma.challenge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "published" }),
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it("should apply kind and difficulty filters", async () => {
      mockPrisma.challenge.findMany.mockResolvedValue([]);
      mockPrisma.challenge.count.mockResolvedValue(0);

      await service.findAll({ kind: "CODE", difficulty: "hard" });

      const where = mockPrisma.challenge.findMany.mock.calls[0][0].where;
      expect(where.kind).toBe("CODE");
      expect(where.difficulty).toBe("hard");
    });

    it("should apply tag filter when tags param provided", async () => {
      mockPrisma.challenge.findMany.mockResolvedValue([]);
      mockPrisma.challenge.count.mockResolvedValue(0);

      await service.findAll({ tags: "array,dp" });

      const where = mockPrisma.challenge.findMany.mock.calls[0][0].where;
      expect(where.tags).toEqual({ hasSome: ["array", "dp"] });
    });

    it("should apply search filter on title and tags", async () => {
      mockPrisma.challenge.findMany.mockResolvedValue([]);
      mockPrisma.challenge.count.mockResolvedValue(0);

      await service.findAll({ search: "sum" });

      const where = mockPrisma.challenge.findMany.mock.calls[0][0].where;
      expect(where.OR).toBeDefined();
    });

    it("should paginate correctly with page and limit", async () => {
      mockPrisma.challenge.findMany.mockResolvedValue([]);
      mockPrisma.challenge.count.mockResolvedValue(50);

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(mockPrisma.challenge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe("findOne()", () => {
    it("should return challenge from cache if cached", async () => {
      const cached = { ...baseChallenge, fromCache: true };
      mockCache.get.mockResolvedValue(cached);

      const result = await service.findOne("chal-1");

      expect(result).toEqual(cached);
      expect(mockPrisma.challenge.findUnique).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException when challenge not found", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(null);

      await expect(service.findOne("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should filter hidden tests for public endpoint", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(baseChallenge);

      const result = await service.findOne("chal-1");

      expect(result.tests.every((t: any) => !t.isHidden)).toBe(true);
      expect(result.tests).toHaveLength(1);
    });

    it("should cache the result after fetching from DB", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(baseChallenge);

      await service.findOne("chal-1");

      expect(mockCache.set).toHaveBeenCalledWith(
        "challenge:public:chal-1",
        expect.any(Object),
        3600,
      );
    });
  });

  // ─── findOneAdmin ─────────────────────────────────────────────────────────────

  describe("findOneAdmin()", () => {
    it("should return all tests (including hidden) for admin", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(baseChallenge);

      const result = await service.findOneAdmin("chal-1");

      expect(result.tests).toHaveLength(2);
    });

    it("should throw NotFoundException when challenge not found", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(null);

      await expect(service.findOneAdmin("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe("update()", () => {
    it("should throw NotFoundException when challenge not found", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(null);

      await expect(
        service.update("nonexistent", { title: "New" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should map statementMd to descriptionMd in update", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(baseChallenge);
      mockPrisma.challenge.update.mockResolvedValue({
        ...baseChallenge,
        descriptionMd: "updated",
      });

      await service.update("chal-1", { statementMd: "updated" });

      const updateData = mockPrisma.challenge.update.mock.calls[0][0].data;
      expect(updateData.descriptionMd).toBe("updated");
      expect(updateData.statementMd).toBeUndefined();
    });

    it("should map briefMd to descriptionMd in update", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(baseChallenge);
      mockPrisma.challenge.update.mockResolvedValue(baseChallenge);

      await service.update("chal-1", { briefMd: "canvas brief" });

      const updateData = mockPrisma.challenge.update.mock.calls[0][0].data;
      expect(updateData.descriptionMd).toBe("canvas brief");
      expect(updateData.briefMd).toBeUndefined();
    });

    it("should invalidate both public and admin cache after update", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(baseChallenge);
      mockPrisma.challenge.update.mockResolvedValue(baseChallenge);

      await service.update("chal-1", { title: "Updated" });

      expect(mockCache.del).toHaveBeenCalledWith("challenge:public:chal-1");
      expect(mockCache.del).toHaveBeenCalledWith("challenge:admin:chal-1");
    });

    it("should normalize test cases during update", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(baseChallenge);
      mockPrisma.challenge.update.mockResolvedValue(baseChallenge);

      await service.update("chal-1", {
        tests: [{ input: 1, expectedOutput: 2, isHidden: "false" }],
      });

      const updateData = mockPrisma.challenge.update.mock.calls[0][0].data;
      expect(updateData.tests[0].input).toBe("1");
      expect(updateData.tests[0].expectedOutput).toBe("2");
      expect(typeof updateData.tests[0].isHidden).toBe("boolean");
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────────

  describe("remove()", () => {
    it("should throw NotFoundException when challenge not found", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(null);

      await expect(service.remove("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should delete challenge and invalidate cache", async () => {
      mockPrisma.challenge.findUnique.mockResolvedValue(baseChallenge);
      mockPrisma.challenge.delete.mockResolvedValue(baseChallenge);

      await service.remove("chal-1");

      expect(mockPrisma.challenge.delete).toHaveBeenCalledWith({
        where: { id: "chal-1" },
      });
      expect(mockCache.del).toHaveBeenCalledWith("challenge:public:chal-1");
      expect(mockCache.del).toHaveBeenCalledWith("challenge:admin:chal-1");
    });
  });

  // ─── generateDraftForUser ─────────────────────────────────────────────────────

  describe("generateDraftForUser()", () => {
    it("should throw NotFoundException when user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.generateDraftForUser("user-1", "Build a sorting algo"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when non-premium user has insufficient tokens", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        isPremium: false,
        tokensLeft: 3,
      });

      await expect(
        service.generateDraftForUser("user-1", "Build a sorting algo"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should deduct 5 tokens for non-premium users", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        isPremium: false,
        tokensLeft: 10,
      });
      mockAiService.generateChallengeDraft.mockResolvedValue({
        title: "Sorting",
        tests: [],
      });
      mockPrisma.user.update.mockResolvedValue({});

      await service.generateDraftForUser("user-1", "Sorting", "CODE");

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { tokensLeft: { decrement: 5 } },
        }),
      );
    });

    it("should NOT deduct tokens for premium users", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        isPremium: true,
        tokensLeft: 0,
      });
      mockAiService.generateChallengeDraft.mockResolvedValue({
        title: "Sorting",
        tests: [],
      });

      await service.generateDraftForUser("user-1", "Sorting", "CODE");

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ─── createCompanyChallenge ───────────────────────────────────────────────────

  describe("createCompanyChallenge()", () => {
    const dto = {
      companyId: "company-1",
      title: "Company Test",
      visibility: "employees_only" as const,
    };

    it("should throw BadRequestException when user has no recruiter/owner membership", async () => {
      mockPrisma.companyMembership.findFirst.mockResolvedValue(null);

      await expect(
        service.createCompanyChallenge("user-1", dto),
      ).rejects.toThrow(BadRequestException);
    });

    it("should create challenge with draft status for employees_only visibility", async () => {
      mockPrisma.companyMembership.findFirst.mockResolvedValue({
        id: "m-1",
        role: "recruiter",
      });
      mockPrisma.challenge.create.mockResolvedValue({
        ...baseChallenge,
        status: "draft",
      });

      const result = await service.createCompanyChallenge("user-1", dto);

      const createData = mockPrisma.challenge.create.mock.calls[0][0].data;
      expect(createData.status).toBe("draft");
      expect(result.status).toBe("draft");
    });

    it("should create challenge with published status for public visibility", async () => {
      mockPrisma.companyMembership.findFirst.mockResolvedValue({
        id: "m-1",
        role: "owner",
      });
      mockPrisma.challenge.create.mockResolvedValue({
        ...baseChallenge,
        status: "published",
      });

      await service.createCompanyChallenge("user-1", {
        ...dto,
        visibility: "public",
      });

      const createData = mockPrisma.challenge.create.mock.calls[0][0].data;
      expect(createData.status).toBe("published");
    });
  });
});
