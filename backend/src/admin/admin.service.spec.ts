import { Test, TestingModule } from "@nestjs/testing";
import { AdminService } from "./admin.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationEmitterService } from "../notifications/notification-emitter.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  submission: { count: jest.fn(), groupBy: jest.fn() },
  challenge: { count: jest.fn() },
  discussion: { count: jest.fn() },
  duel: { count: jest.fn() },
  hackathon: { count: jest.fn() },
  hackathonTeam: { count: jest.fn() },
  hackathonSubmission: { count: jest.fn() },
  comment: { count: jest.fn() },
  notification: { count: jest.fn() },
  badge: { count: jest.fn() },
  userBadge: { count: jest.fn() },
  company: { count: jest.fn() },
  companyMembership: { count: jest.fn() },
  aIReview: { count: jest.fn() },
  interview: { count: jest.fn() },
  interviewSession: { count: jest.fn() },
  report: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  revision: { count: jest.fn() },
  discussionRevision: { count: jest.fn() },
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  adminAuditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $runCommandRaw: jest.fn(),
};

const mockNotificationEmitter = {
  notifyUser: jest.fn(),
  notifyMultipleUsers: jest.fn(),
  broadcast: jest.fn(),
};

describe("AdminService", () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: NotificationEmitterService,
          useValue: mockNotificationEmitter,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  // ─── changeUserRole ───────────────────────────────────────────────────────────

  describe("changeUserRole()", () => {
    it("should throw BadRequestException when admin demotes themselves", async () => {
      await expect(
        service.changeUserRole("admin-1", "admin-1", "user"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException when target user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changeUserRole("admin-1", "user-2", "moderator"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should update role and create audit log", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-2",
        username: "bob",
        role: "user",
      });
      mockPrisma.user.update.mockResolvedValue({
        id: "user-2",
        username: "bob",
        role: "moderator",
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await service.changeUserRole(
        "admin-1",
        "user-2",
        "moderator",
      );

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { role: "moderator" } }),
      );
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: "USER_ROLE_CHANGED" }),
        }),
      );
      expect(result.role).toBe("moderator");
    });

    it("should allow admin to promote another user to admin", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-2",
        username: "bob",
        role: "user",
      });
      mockPrisma.user.update.mockResolvedValue({ id: "user-2", role: "admin" });
      mockPrisma.auditLog.create.mockResolvedValue({});

      await service.changeUserRole("admin-1", "user-2", "admin");

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { role: "admin" } }),
      );
    });
  });

  // ─── getReports ───────────────────────────────────────────────────────────────

  describe("getReports()", () => {
    it("should return paginated reports", async () => {
      mockPrisma.report.findMany.mockResolvedValue([{ id: "rep-1" }]);
      mockPrisma.report.count.mockResolvedValue(1);

      const result = await service.getReports({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should filter by status when provided", async () => {
      mockPrisma.report.findMany.mockResolvedValue([]);
      mockPrisma.report.count.mockResolvedValue(0);

      await service.getReports({ status: "open" });

      const where = mockPrisma.report.findMany.mock.calls[0][0].where;
      expect(where.status).toBe("open");
    });
  });

  // ─── updateReportStatus ───────────────────────────────────────────────────────

  describe("updateReportStatus()", () => {
    it("should throw NotFoundException when report not found", async () => {
      mockPrisma.report.findUnique.mockResolvedValue(null);

      await expect(
        service.updateReportStatus("rep-1", { status: "resolved" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should update report status", async () => {
      mockPrisma.report.findUnique.mockResolvedValue({
        id: "rep-1",
        status: "open",
      });
      mockPrisma.report.update.mockResolvedValue({
        id: "rep-1",
        status: "resolved",
      });

      await service.updateReportStatus("rep-1", { status: "resolved" });

      expect(mockPrisma.report.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "resolved" }),
        }),
      );
    });
  });

  // ─── getDashboardStats ────────────────────────────────────────────────────────

  describe("getDashboardStats()", () => {
    it("should return stats object without crashing", async () => {
      // All count calls return 0 by default
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.submission.count.mockResolvedValue(0);
      mockPrisma.challenge.count.mockResolvedValue(0);
      mockPrisma.discussion.count.mockResolvedValue(0);
      mockPrisma.duel.count.mockResolvedValue(0);
      mockPrisma.hackathon.count.mockResolvedValue(0);
      mockPrisma.hackathonTeam.count.mockResolvedValue(0);
      mockPrisma.hackathonSubmission.count.mockResolvedValue(0);
      mockPrisma.comment.count.mockResolvedValue(0);
      mockPrisma.notification.count.mockResolvedValue(0);
      mockPrisma.badge.count.mockResolvedValue(0);
      mockPrisma.userBadge.count.mockResolvedValue(0);
      mockPrisma.company.count.mockResolvedValue(0);
      mockPrisma.companyMembership.count.mockResolvedValue(0);
      mockPrisma.aIReview.count.mockResolvedValue(0);
      mockPrisma.interview.count.mockResolvedValue(0);
      mockPrisma.interviewSession.count.mockResolvedValue(0);
      mockPrisma.submission.groupBy.mockResolvedValue([]);
      mockPrisma.user.aggregate.mockResolvedValue({
        _avg: { level: null, xp: null, elo: null },
      });
      mockPrisma.report.count.mockResolvedValue(0);
      mockPrisma.revision.count.mockResolvedValue(0);
      mockPrisma.discussionRevision.count.mockResolvedValue(0);
      (mockPrisma.auditLog as any).findMany.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getDashboardStats();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("users");
    });
  });
});
