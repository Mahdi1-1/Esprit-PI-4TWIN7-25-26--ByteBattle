import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";
import { CacheService } from "../cache/cache.service";
import { IntelligenceService } from "../intelligence/intelligence.service";
import { computeDuelStats } from "../duels/duel-stats.util";
import * as fs from "fs";
import * as bcrypt from "bcryptjs";
import sharp from "sharp";

jest.mock("sharp", () => {
  const mockSharpInstance = {
    resize: jest.fn(() => mockSharpInstance),
    webp: jest.fn(() => mockSharpInstance),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from("image")),
  };
  const mockSharpFn = jest.fn(() => mockSharpInstance);
  return {
    __esModule: true,
    default: mockSharpFn,
  };
});

jest.mock("../duels/duel-stats.util");

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe("UsersService", () => {
  let service: UsersService;

  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    submission: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    discussion: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    comment: {
      count: jest.fn(),
    },
    duel: {
      findMany: jest.fn(),
    },
    challenge: {
      findMany: jest.fn(),
    },
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockIntelligence = {
    getProfile: jest.fn(),
  };

  const baseUser = {
    id: "user-1",
    email: "user@example.com",
    username: "alice",
    firstName: "Alice",
    lastName: "Doe",
    passwordHash: "hashed",
    isOAuthUser: false,
    status: "active",
    role: "user",
    profileImage: null,
    bio: "bio",
    level: 3,
    xp: 220,
    elo: 1200,
    tokensLeft: 3,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    lastLogin: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
        { provide: IntelligenceService, useValue: mockIntelligence },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("findAll", () => {
    it("returns paginated users", async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: "user-1" }]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.findAll(2, 5);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
      expect(result).toEqual({
        data: [{ id: "user-1" }],
        total: 1,
        page: 2,
        limit: 5,
      });
    });
  });

  describe("findOne", () => {
    it("returns cached profile when available", async () => {
      mockCache.get.mockResolvedValue({ id: "user-1" });

      const result = await service.findOne("user-1");

      expect(result).toEqual({ id: "user-1" });
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("throws when user is missing", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("returns profile without passwordHash and caches it", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        _count: { submissions: 1, discussions: 2 },
      });

      const result = await service.findOne("user-1");

      expect(result).not.toHaveProperty("passwordHash");
      expect(mockCache.set).toHaveBeenCalledWith(
        "user:profile:user-1",
        expect.any(Object),
        3600,
      );
    });
  });

  describe("update", () => {
    it("throws when user is missing", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update("user-1", { firstName: "X" } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("updates and clears cache", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);
      mockPrisma.user.update.mockResolvedValue({
        ...baseUser,
        firstName: "New",
      });

      const result = await service.update("user-1", {
        firstName: "New",
      } as any);

      expect(result.firstName).toBe("New");
      expect(result).not.toHaveProperty("passwordHash");
      expect(mockCache.del).toHaveBeenCalledWith("user:profile:user-1");
    });
  });

  describe("updateRole", () => {
    it("rejects invalid role", async () => {
      await expect(
        service.updateRole("user-1", "owner"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("updates role when valid", async () => {
      mockPrisma.user.update.mockResolvedValue({ id: "user-1", role: "admin" });

      await service.updateRole("user-1", "admin");

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { role: "admin" } }),
      );
    });
  });

  describe("updateStatus", () => {
    it("rejects invalid status", async () => {
      await expect(
        service.updateStatus("user-1", "paused"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("updates status when valid", async () => {
      mockPrisma.user.update.mockResolvedValue({
        id: "user-1",
        status: "banned",
      });

      await service.updateStatus("user-1", "banned");

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "banned" } }),
      );
    });
  });

  describe("getHistory", () => {
    it("returns paginated history", async () => {
      mockPrisma.submission.findMany.mockResolvedValue([{ id: "sub-1" }]);
      mockPrisma.submission.count.mockResolvedValue(1);

      const result = await service.getHistory("user-1", 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe("uploadProfilePhoto", () => {
    it("rejects invalid file types", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);

      await expect(
        service.uploadProfilePhoto("user-1", {
          mimetype: "text/plain",
          size: 100,
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects oversized files", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);

      await expect(
        service.uploadProfilePhoto("user-1", {
          mimetype: "image/png",
          size: 6 * 1024 * 1024,
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("stores resized profile photo", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        profileImage: "old.webp",
      });
      jest.spyOn(fs, "existsSync").mockReturnValue(false);
      mockPrisma.user.update.mockResolvedValue({
        ...baseUser,
        profileImage: "data:image/webp;base64,image",
      });

      const result = await service.uploadProfilePhoto("user-1", {
        mimetype: "image/png",
        size: 1000,
        buffer: Buffer.from("img"),
      } as any);

      expect(sharp).toHaveBeenCalled();
      expect(result.profileImage).toContain("data:image/webp;base64");
      expect(mockCache.del).toHaveBeenCalledWith("user:profile:user-1");
    });
  });

  describe("deleteProfilePhoto", () => {
    it("throws when user missing", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteProfilePhoto("user-1")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("removes local file and clears profile", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        profileImage: "avatar.webp",
      });
      jest.spyOn(fs, "existsSync").mockReturnValue(true);
      const unlinkSpy = jest
        .spyOn(fs, "unlinkSync")
        .mockImplementation(() => undefined);

      await service.deleteProfilePhoto("user-1");

      expect(unlinkSpy).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { profileImage: null } }),
      );
    });
  });

  describe("changePassword", () => {
    it("rejects OAuth users", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        isOAuthUser: true,
      });

      await expect(
        service.changePassword("user-1", {
          currentPassword: "a",
          newPassword: "b",
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects invalid password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword("user-1", {
          currentPassword: "a",
          newPassword: "b",
        } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("updates password on success", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue("new-hash");

      await service.changePassword("user-1", {
        currentPassword: "a",
        newPassword: "b",
      } as any);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { passwordHash: "new-hash" } }),
      );
    });
  });

  describe("changeEmail", () => {
    it("rejects OAuth users", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        isOAuthUser: true,
      });

      await expect(
        service.changeEmail("user-1", {
          currentPassword: "a",
          newEmail: "new@example.com",
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects invalid password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changeEmail("user-1", {
          currentPassword: "a",
          newEmail: "new@example.com",
        } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects email conflicts", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(baseUser)
        .mockResolvedValueOnce({ id: "other" });

      await expect(
        service.changeEmail("user-1", {
          currentPassword: "a",
          newEmail: "new@example.com",
        } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("updates email on success", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(baseUser)
        .mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValue({
        ...baseUser,
        email: "new@example.com",
      });

      const result = await service.changeEmail("user-1", {
        currentPassword: "a",
        newEmail: "new@example.com",
      } as any);

      expect(result.email).toBe("new@example.com");
      expect(result).not.toHaveProperty("passwordHash");
    });
  });

  describe("getProfileStats", () => {
    it("returns cached stats when available", async () => {
      mockCache.get.mockResolvedValue({ cached: true });

      const result = await service.getProfileStats("user-1");

      expect(result).toEqual({ cached: true });
    });

    it("computes stats and caches them", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);
      mockPrisma.submission.groupBy.mockResolvedValue([{ challengeId: "c1" }]);
      mockPrisma.discussion.count.mockResolvedValue(2);
      mockPrisma.comment.count.mockResolvedValue(1);
      mockPrisma.user.count.mockResolvedValue(0); // 0 users with elo > baseUser.elo
      (computeDuelStats as jest.Mock).mockResolvedValue({
        duelsWon: 2,
        duelsLost: 1,
        duelsTotal: 3,
        winRate: 66.6,
      });

      const result = await service.getProfileStats("user-1");

      expect(result.challengesSolved).toBe(1);
      expect(result.leaderboardPosition).toBe(1);
      expect(mockCache.set).toHaveBeenCalledWith(
        "user:stats:user-1",
        expect.any(Object),
        120,
      );
    });
  });

  describe("getIntelligenceProfile", () => {
    it("returns profile with mapped recommendations", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);
      mockPrisma.submission.findFirst.mockResolvedValue({
        challenge: {
          id: "c1",
          title: "Two Sum",
          difficulty: "easy",
          tags: ["array"],
        },
        timeMs: 60000,
        testsTotal: 3,
        code: "print('hi')",
      });
      mockPrisma.challenge.findMany.mockResolvedValue([
        {
          id: "c1",
          title: "Two Sum",
          difficulty: "easy",
          tags: ["array"],
          kind: "CODE",
          category: "general",
          createdAt: new Date(),
        },
      ]);
      mockIntelligence.getProfile.mockResolvedValue({
        weakest_tags: ["array"],
        recommended_challenges: [{ challenge_name: "Two Sum", score: 0.9 }],
      });

      const result = await service.getIntelligenceProfile("user-1");

      expect(result.recommended_challenges).toHaveLength(1);
      expect(result).toHaveProperty("current_skills");
    });

    it("returns fallback profile when intelligence fails", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);
      mockPrisma.submission.findFirst.mockResolvedValue(null);
      mockIntelligence.getProfile.mockRejectedValue(new Error("boom"));

      const result = await service.getIntelligenceProfile("user-1");

      expect(result.fallback).toBe(true);
    });
  });

  describe("deleteAccount", () => {
    it("rejects invalid password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.deleteAccount("user-1", { currentPassword: "bad" } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("deletes user and profile image", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        profileImage: "avatar.webp",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(fs, "existsSync").mockReturnValue(true);
      const unlinkSpy = jest
        .spyOn(fs, "unlinkSync")
        .mockImplementation(() => undefined);

      const result = await service.deleteAccount("user-1", {
        currentPassword: "ok",
      } as any);

      expect(unlinkSpy).toHaveBeenCalled();
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: "user-1" },
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe("getRecentActivity", () => {
    it("merges and sorts recent events", async () => {
      mockPrisma.submission.findMany.mockResolvedValue([
        {
          challenge: { title: "Two Sum", difficulty: "easy" },
          language: "python",
          createdAt: new Date("2024-01-10T00:00:00Z"),
        },
      ]);
      mockPrisma.duel.findMany.mockResolvedValue([
        {
          winnerId: "user-1",
          player1Id: "user-1",
          player2: { username: "bob" },
          player1: { username: "alice" },
          createdAt: new Date("2024-01-09T00:00:00Z"),
          endedAt: new Date("2024-01-09T01:00:00Z"),
        },
      ]);
      mockPrisma.discussion.findMany.mockResolvedValue([
        {
          id: "d1",
          title: "Post",
          createdAt: new Date("2024-01-08T00:00:00Z"),
        },
      ]);

      const events = await service.getRecentActivity("user-1", 5);

      expect(events[0].type).toBe("solved");
      expect(events).toHaveLength(3);
    });
  });

  describe("getPublicProfile", () => {
    it("returns cached public profile", async () => {
      mockCache.get.mockResolvedValue({ id: "user-1", cached: true });

      const result = await service.getPublicProfile("alice");

      expect(result).toEqual({ id: "user-1", cached: true });
    });

    it("throws when public user not found", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.getPublicProfile("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("maps earned badges and caches", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: "user-1",
        username: "alice",
        profileImage: null,
        bio: "bio",
        level: 1,
        xp: 10,
        elo: 900,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        _count: { submissions: 1, discussions: 2 },
        earnedBadges: [
          {
            badge: {
              key: "first",
              name: "First",
              ruleText: "First badge",
              iconUrl: "icon.png",
              rarity: "common",
            },
            earnedAt: new Date("2024-01-02T00:00:00Z"),
          },
        ],
      });

      const result = await service.getPublicProfile("alice");

      expect(result.badges).toHaveLength(1);
      expect(mockCache.set).toHaveBeenCalled();
    });
  });

  describe("getPublicStats", () => {
    it("resolves username then returns stats", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: "user-1" });
      const statsSpy = jest
        .spyOn(service, "getProfileStats")
        .mockResolvedValue({ elo: 1000 } as any);

      const result = await service.getPublicStats("alice");

      expect(result.elo).toBe(1000);
      expect(statsSpy).toHaveBeenCalledWith("user-1");
    });
  });

  describe("getPublicActivity", () => {
    it("resolves username then returns activity", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: "user-1" });
      const activitySpy = jest
        .spyOn(service, "getRecentActivity")
        .mockResolvedValue([{ type: "solved" }] as any);

      const result = await service.getPublicActivity("alice", 3);

      expect(result).toHaveLength(1);
      expect(activitySpy).toHaveBeenCalledWith("user-1", 3);
    });
  });

  describe("searchByUsername", () => {
    it("returns empty array for short queries", async () => {
      const result = await service.searchByUsername("a", 5);
      expect(result).toEqual([]);
    });

    it("caches search results", async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: "user-1" }]);

      const result = await service.searchByUsername("al", 5);

      expect(result).toHaveLength(1);
      expect(mockCache.set).toHaveBeenCalled();
    });
  });
});
