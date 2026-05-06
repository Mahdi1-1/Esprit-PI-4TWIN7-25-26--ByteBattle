import { Test, TestingModule } from "@nestjs/testing";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { HackathonsService } from "./hackathons.service";
import { PrismaService } from "../prisma/prisma.service";
import { HackathonAuditService } from "./hackathon-audit.service";
import { NotificationEmitterService } from "../notifications/notification-emitter.service";

// ────────────────────────────────────────────────────────
// T142 — Unit tests for lifecycle state machine
// ────────────────────────────────────────────────────────

const makeHackathon = (overrides: any = {}) => ({
  id: "h1",
  title: "Test Hackathon",
  status: "draft",
  startTime: new Date("2025-01-01T10:00:00Z"),
  endTime: new Date("2025-01-01T15:00:00Z"),
  challengeIds: ["c1", "c2"],
  teamPolicy: { minSize: 1, maxSize: 3 },
  joinCode: "ABC123",
  scope: "public",
  createdById: "admin1",
  ...overrides,
});

describe("HackathonsService — Lifecycle State Machine", () => {
  let service: HackathonsService;
  let prismaMock: any;
  let auditMock: any;

  beforeEach(async () => {
    prismaMock = {
      hackathon: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      hackathonTeam: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    auditMock = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HackathonsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: HackathonAuditService, useValue: auditMock },
        { provide: NotificationEmitterService, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<HackathonsService>(HackathonsService);
  });

  // ─── Valid Transitions ────────────────────────────────

  describe("Valid transitions", () => {
    const validTransitions = [
      { from: "draft", to: "lobby" },
      { from: "lobby", to: "draft" },
      { from: "lobby", to: "checkin" },
      { from: "lobby", to: "cancelled" },
      { from: "checkin", to: "active" },
      { from: "checkin", to: "cancelled" },
      { from: "active", to: "frozen" },
      { from: "active", to: "ended" },
      { from: "frozen", to: "active" },
      { from: "frozen", to: "ended" },
      { from: "ended", to: "archived" },
    ];

    for (const { from, to } of validTransitions) {
      it(`should allow transition from '${from}' to '${to}'`, async () => {
        const hackathon = makeHackathon({ status: from });
        prismaMock.hackathon.findUnique.mockResolvedValue(hackathon);
        prismaMock.hackathon.update.mockResolvedValue({
          ...hackathon,
          status: to,
        });

        // Extra: lobby→draft needs 0 teams
        if (from === "lobby" && to === "draft") {
          prismaMock.hackathonTeam.count.mockResolvedValue(0);
        }

        // Extra: checkin→active needs ≥1 checked-in team
        if (to === "active") {
          prismaMock.hackathonTeam.count.mockResolvedValue(1);
        }

        const result = await service.transitionStatus("h1", to, "admin1");
        expect(result.status).toBe(to);
        expect(auditMock.log).toHaveBeenCalledWith(
          "h1",
          "admin1",
          "lifecycle_change",
          expect.objectContaining({ from, to }),
        );
      });
    }
  });

  // ─── Invalid Transitions ──────────────────────────────

  describe("Invalid transitions", () => {
    const invalidTransitions = [
      { from: "draft", to: "active" },
      { from: "draft", to: "checkin" },
      { from: "draft", to: "ended" },
      { from: "draft", to: "frozen" },
      { from: "draft", to: "archived" },
      { from: "lobby", to: "active" },
      { from: "lobby", to: "ended" },
      { from: "lobby", to: "frozen" },
      { from: "checkin", to: "draft" },
      { from: "checkin", to: "lobby" },
      { from: "checkin", to: "frozen" },
      { from: "checkin", to: "ended" },
      { from: "active", to: "draft" },
      { from: "active", to: "lobby" },
      { from: "active", to: "checkin" },
      { from: "active", to: "archived" },
      { from: "frozen", to: "draft" },
      { from: "frozen", to: "lobby" },
      { from: "frozen", to: "checkin" },
      { from: "ended", to: "active" },
      { from: "ended", to: "draft" },
      { from: "ended", to: "frozen" },
      { from: "archived", to: "draft" },
      { from: "archived", to: "active" },
    ];

    for (const { from, to } of invalidTransitions) {
      it(`should reject transition from '${from}' to '${to}'`, async () => {
        const hackathon = makeHackathon({ status: from });
        prismaMock.hackathon.findUnique.mockResolvedValue(hackathon);

        await expect(
          service.transitionStatus("h1", to, "admin1"),
        ).rejects.toThrow(BadRequestException);
      });
    }
  });

  // ─── Extra Guards ─────────────────────────────────────

  describe("Extra transition guards", () => {
    it("should reject lobby→draft if teams exist", async () => {
      const hackathon = makeHackathon({ status: "lobby" });
      prismaMock.hackathon.findUnique.mockResolvedValue(hackathon);
      prismaMock.hackathonTeam.count.mockResolvedValue(3); // teams exist

      await expect(
        service.transitionStatus("h1", "draft", "admin1"),
      ).rejects.toThrow(/Cannot unpublish/);
    });

    it("should reject checkin→active if no checked-in teams", async () => {
      const hackathon = makeHackathon({ status: "checkin" });
      prismaMock.hackathon.findUnique.mockResolvedValue(hackathon);
      prismaMock.hackathonTeam.count.mockResolvedValue(0);

      await expect(
        service.transitionStatus("h1", "active", "admin1"),
      ).rejects.toThrow(/no teams have checked in/);
    });
  });

  // ─── Cancel ───────────────────────────────────────────

  describe("cancelHackathon", () => {
    it("should hard-delete draft hackathons", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(
        makeHackathon({ status: "draft" }),
      );
      prismaMock.hackathon.delete.mockResolvedValue(undefined);

      const result = await service.cancelHackathon(
        "h1",
        "admin1",
        "No longer needed",
      );
      expect(result).toEqual({ deleted: true });
      expect(prismaMock.hackathon.delete).toHaveBeenCalledWith({
        where: { id: "h1" },
      });
    });

    it("should soft-cancel lobby hackathons", async () => {
      const hackathon = makeHackathon({ status: "lobby" });
      prismaMock.hackathon.findUnique.mockResolvedValue(hackathon);
      prismaMock.hackathon.update.mockResolvedValue({
        ...hackathon,
        status: "cancelled",
      });
      prismaMock.hackathonTeam.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.cancelHackathon("h1", "admin1", "Cancelled");
      expect((result as any).status).toBe("cancelled");
      expect(prismaMock.hackathonTeam.deleteMany).toHaveBeenCalled();
      expect(auditMock.log).toHaveBeenCalledWith("h1", "admin1", "cancel", {
        reason: "Cancelled",
      });
    });

    it("should reject cancellation of active hackathons", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(
        makeHackathon({ status: "active" }),
      );

      await expect(
        service.cancelHackathon("h1", "admin1", "reason"),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should reject cancellation of frozen hackathons", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(
        makeHackathon({ status: "frozen" }),
      );

      await expect(
        service.cancelHackathon("h1", "admin1", "reason"),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Delete ───────────────────────────────────────────

  describe("deleteHackathon", () => {
    it("should hard-delete draft hackathon", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(
        makeHackathon({ status: "draft" }),
      );
      prismaMock.hackathon.delete.mockResolvedValue(undefined);

      const result = await service.deleteHackathon("h1", "admin1");
      expect(result).toEqual({ deleted: true });
    });

    it("should cancel lobby hackathon on delete", async () => {
      const hackathon = makeHackathon({ status: "lobby" });
      prismaMock.hackathon.findUnique.mockResolvedValue(hackathon);
      prismaMock.hackathon.update.mockResolvedValue({
        ...hackathon,
        status: "cancelled",
      });
      prismaMock.hackathonTeam.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.deleteHackathon("h1", "admin1");
      expect((result as any).status).toBe("cancelled");
    });

    it("should forbid delete of active hackathon", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(
        makeHackathon({ status: "active" }),
      );

      await expect(service.deleteHackathon("h1", "admin1")).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should archive ended hackathon on delete", async () => {
      const hackathon = makeHackathon({ status: "ended" });
      prismaMock.hackathon.findUnique.mockResolvedValue(hackathon);
      prismaMock.hackathon.update.mockResolvedValue({
        ...hackathon,
        status: "archived",
      });

      const result = await service.deleteHackathon("h1", "admin1");
      expect((result as any).status).toBe("archived");
    });
  });

  // ─── Edit Guards ──────────────────────────────────────

  describe("update (edit guards)", () => {
    it("should allow edits in draft status", async () => {
      const hackathon = makeHackathon({ status: "draft" });
      prismaMock.hackathon.findUnique.mockResolvedValue(hackathon);
      prismaMock.hackathon.update.mockResolvedValue({
        ...hackathon,
        title: "Updated",
      });

      const result = await service.update("h1", { title: "Updated" } as any);
      expect(result.title).toBe("Updated");
    });

    it("should allow edits in lobby status", async () => {
      const hackathon = makeHackathon({ status: "lobby" });
      prismaMock.hackathon.findUnique.mockResolvedValue(hackathon);
      prismaMock.hackathon.update.mockResolvedValue({
        ...hackathon,
        title: "Updated",
      });

      const result = await service.update("h1", { title: "Updated" } as any);
      expect(result.title).toBe("Updated");
    });

    it("should reject edits when active", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(
        makeHackathon({ status: "active" }),
      );

      await expect(
        service.update("h1", { title: "Updated" } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject edits when ended", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(
        makeHackathon({ status: "ended" }),
      );

      await expect(
        service.update("h1", { title: "Updated" } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Not Found ────────────────────────────────────────

  describe("Not found", () => {
    it("should throw NotFoundException when hackathon not found", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(null);

      await expect(
        service.transitionStatus("h999", "lobby", "admin1"),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
