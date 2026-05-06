import { Test, TestingModule } from "@nestjs/testing";
import { DuelsService } from "./duels.service";
import { PrismaService } from "../prisma/prisma.service";
import { QueueService } from "../queue/queue.service";
import { ConfigService } from "@nestjs/config";
import { AiService } from "../ai/ai.service";
import { NotificationEmitterService } from "../notifications/notification-emitter.service";
import { NotificationsGateway } from "../notifications/notifications.gateway";
import { BadgeEngineService } from "../badges/badge-engine.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

// Mock Redis
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    zadd: jest.fn(),
    pipeline: jest.fn().mockReturnValue({
      zadd: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }),
  }));
});

jest.mock("../duels/duel-stats.util", () => ({
  computeDuelStats: jest.fn().mockResolvedValue({
    duelsWon: 3,
    duelsLost: 1,
    duelsTotal: 4,
    winRate: 75,
  }),
  computeDuelStatsBatch: jest.fn().mockResolvedValue(new Map()),
}));

const mockPrisma = {
  duel: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  challenge: { findFirst: jest.fn() },
  user: { findUnique: jest.fn(), update: jest.fn() },
  $transaction: jest.fn(),
};

const mockQueue = { addEvaluateCodeJob: jest.fn() };
const mockConfig = {
  get: jest.fn().mockImplementation((key: string, fallback?: any) => {
    if (key === "REDIS_ENABLED") return "false"; // disable Redis for unit tests
    return fallback;
  }),
};
const mockAi = { reviewCode: jest.fn() };
const mockNotifEmitter = { emit: jest.fn().mockResolvedValue(undefined) };
const mockGateway = { getOnlineUserCount: jest.fn().mockReturnValue(5) };
const mockBadgeEngine = {
  onDuelFinished: jest.fn().mockResolvedValue(undefined),
  checkUserLevelBadges: jest.fn().mockResolvedValue(undefined),
};

const mockChallenge = {
  id: "chal-1",
  title: "Two Sum",
  descriptionMd: "##",
  difficulty: "easy",
  kind: "CODE",
  tests: [{ input: "1", expectedOutput: "2" }],
  duelTimeLimit: 1800,
  hints: [],
  allowedLanguages: ["python3"],
};

describe("DuelsService (Redis disabled)", () => {
  let service: DuelsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DuelsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QueueService, useValue: mockQueue },
        { provide: ConfigService, useValue: mockConfig },
        { provide: AiService, useValue: mockAi },
        { provide: NotificationEmitterService, useValue: mockNotifEmitter },
        { provide: NotificationsGateway, useValue: mockGateway },
        { provide: BadgeEngineService, useValue: mockBadgeEngine },
      ],
    }).compile();

    service = module.get<DuelsService>(DuelsService);
    jest.clearAllMocks();
  });

  // ─── createOrJoinDuel ─────────────────────────────────────────────────────────

  describe("createOrJoinDuel()", () => {
    it("should return existing waiting duel if user already has one", async () => {
      const existingDuel = {
        id: "duel-existing",
        status: "waiting",
        player1Id: "user-1",
      };
      mockPrisma.duel.findFirst.mockResolvedValueOnce(existingDuel); // findMyWaitingDuel

      const result = await service.createOrJoinDuel("user-1", "easy");

      expect(result).toEqual(existingDuel);
    });

    it("should join an available duel when one exists", async () => {
      mockPrisma.duel.findFirst
        .mockResolvedValueOnce(null) // no own waiting duel
        .mockResolvedValueOnce({ id: "available-duel", status: "waiting" }); // findAvailableDuel

      // spy joinDuel
      const joinSpy = jest
        .spyOn(service, "joinDuel")
        .mockResolvedValue({ id: "available-duel" } as any);

      await service.createOrJoinDuel("user-1", "easy");

      expect(joinSpy).toHaveBeenCalledWith("available-duel", "user-1");
    });

    it("should create a new duel when no available duels exist", async () => {
      mockPrisma.duel.findFirst
        .mockResolvedValueOnce(null) // no own waiting
        .mockResolvedValueOnce(null) // no available
        .mockResolvedValueOnce(null); // no older waiting (race check)

      const createSpy = jest
        .spyOn(service, "createDuel")
        .mockResolvedValue({ id: "new-duel" } as any);

      await service.createOrJoinDuel("user-1", "easy");

      expect(createSpy).toHaveBeenCalledWith("user-1", "easy");
    });
  });

  // ─── joinDuel ─────────────────────────────────────────────────────────────────

  describe("joinDuel()", () => {
    it("should throw NotFoundException when duel not found", async () => {
      mockPrisma.duel.findUnique.mockResolvedValue(null);
      await expect(service.joinDuel("bad-id", "user-2")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException when duel is not waiting", async () => {
      mockPrisma.duel.findUnique.mockResolvedValue({
        id: "duel-1",
        status: "active",
        player1Id: "user-1",
        player1: { id: "user-1", username: "alice" },
        challenge: mockChallenge,
      });
      await expect(service.joinDuel("duel-1", "user-2")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when player tries to join their own duel", async () => {
      mockPrisma.duel.findUnique.mockResolvedValue({
        id: "duel-1",
        status: "waiting",
        player1Id: "user-1",
        player1: { id: "user-1", username: "alice" },
        challenge: mockChallenge,
      });
      await expect(service.joinDuel("duel-1", "user-1")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── findAvailableDuel ────────────────────────────────────────────────────────

  describe("findAvailableDuel()", () => {
    it("should call prisma with correct filters excluding current user", async () => {
      mockPrisma.duel.findFirst.mockResolvedValue(null);

      await service.findAvailableDuel("easy", "user-1");

      expect(mockPrisma.duel.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "waiting",
            difficulty: "easy",
            player1Id: { not: "user-1" },
          }),
        }),
      );
    });
  });

  // ─── getQueueStats ────────────────────────────────────────────────────────────

  describe("getQueueStats()", () => {
    it("should return correct queue stats", async () => {
      mockPrisma.duel.count
        .mockResolvedValueOnce(3) // waiting
        .mockResolvedValueOnce(2); // active/ready
      mockGateway.getOnlineUserCount.mockReturnValue(10);

      const result = await service.getQueueStats();

      expect(result.waitingDuels).toBe(3);
      expect(result.activeDuels).toBe(2);
      expect(result.playersOnline).toBe(10);
      expect(result.estimatedWaitSeconds).toBeDefined();
    });
  });

  // ─── getUserDuels ─────────────────────────────────────────────────────────────

  describe("getUserDuels()", () => {
    it("should return paginated duels for a user", async () => {
      mockPrisma.duel.findMany.mockResolvedValue([{ id: "duel-1" }]);
      mockPrisma.duel.count.mockResolvedValue(1);

      const result = await service.getUserDuels("user-1", 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.duel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ player1Id: "user-1" }, { player2Id: "user-1" }],
            status: "completed",
          }),
          skip: 0,
          take: 20,
        }),
      );
    });
  });

  // ─── getUserStats ─────────────────────────────────────────────────────────────

  describe("getUserStats()", () => {
    it("should throw NotFoundException when user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getUserStats("unknown")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should return user stats with duel form", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        username: "alice",
        elo: 1400,
      });
      mockPrisma.duel.findMany.mockResolvedValue([
        { winnerId: "user-1" },
        { winnerId: "user-1" },
        { winnerId: "user-2" },
      ]);

      const result = await service.getUserStats("user-1");

      expect(result.recentForm).toBeDefined();
      expect(Array.isArray(result.recentForm)).toBe(true);
      expect(result.streak).toBeGreaterThanOrEqual(0);
    });
  });

  // ─── getDuelResult ────────────────────────────────────────────────────────────

  describe("getDuelResult()", () => {
    it("should throw NotFoundException when duel not found", async () => {
      mockPrisma.duel.findUnique.mockResolvedValue(null);
      await expect(service.getDuelResult("bad-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should return duel result", async () => {
      const duel = { id: "duel-1", status: "completed", winnerId: "user-1" };
      mockPrisma.duel.findUnique.mockResolvedValue(duel);

      const result = await service.getDuelResult("duel-1");

      expect(result.status).toBe("completed");
      expect(result.winnerId).toBe("user-1");
    });
  });
});
