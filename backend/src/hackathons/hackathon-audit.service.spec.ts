import { Test, TestingModule } from "@nestjs/testing";
import { HackathonAuditService } from "./hackathon-audit.service";
import { PrismaService } from "../prisma/prisma.service";

const mockPrisma = {
  hackathonAuditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe("HackathonAuditService", () => {
  let service: HackathonAuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HackathonAuditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<HackathonAuditService>(HackathonAuditService);
    jest.clearAllMocks();
  });

  describe("log()", () => {
    it("should create an audit log entry", async () => {
      mockPrisma.hackathonAuditLog.create.mockResolvedValue({ id: "log-1" });

      await service.log("hack-1", "admin-1", "STATUS_CHANGED", {
        from: "lobby",
        to: "active",
      });

      expect(mockPrisma.hackathonAuditLog.create).toHaveBeenCalledWith({
        data: {
          hackathonId: "hack-1",
          actorId: "admin-1",
          action: "STATUS_CHANGED",
          details: { from: "lobby", to: "active" },
        },
      });
    });

    it("should log with undefined details when none provided", async () => {
      mockPrisma.hackathonAuditLog.create.mockResolvedValue({});

      await service.log("hack-1", "admin-1", "TEAM_DISQUALIFIED");

      expect(mockPrisma.hackathonAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ details: undefined }),
      });
    });
  });

  describe("getAuditLog()", () => {
    it("should return paginated audit logs", async () => {
      mockPrisma.hackathonAuditLog.findMany.mockResolvedValue([
        { id: "log-1" },
      ]);
      mockPrisma.hackathonAuditLog.count.mockResolvedValue(1);

      const result = await service.getAuditLog("hack-1");

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it("should filter by action when provided", async () => {
      mockPrisma.hackathonAuditLog.findMany.mockResolvedValue([]);
      mockPrisma.hackathonAuditLog.count.mockResolvedValue(0);

      await service.getAuditLog("hack-1", { action: "STATUS_CHANGED" });

      const where =
        mockPrisma.hackathonAuditLog.findMany.mock.calls[0][0].where;
      expect(where.action).toBe("STATUS_CHANGED");
    });

    it("should paginate correctly", async () => {
      mockPrisma.hackathonAuditLog.findMany.mockResolvedValue([]);
      mockPrisma.hackathonAuditLog.count.mockResolvedValue(50);

      const result = await service.getAuditLog("hack-1", {
        page: 3,
        limit: 10,
      });

      expect(mockPrisma.hackathonAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.page).toBe(3);
    });
  });
});
