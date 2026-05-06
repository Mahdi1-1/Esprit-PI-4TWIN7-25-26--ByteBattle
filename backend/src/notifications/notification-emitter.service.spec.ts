import { Test, TestingModule } from "@nestjs/testing";
import { NotificationEmitterService } from "./notification-emitter.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsGateway } from "./notifications.gateway";
import { NotificationPreferenceService } from "./notification-preference.service";

const DEFAULT_PREFS = {
  hackathon: true,
  duel: true,
  discussion: true,
  submission: true,
  canvas: true,
  achievement: true,
  system: true,
  inApp: true,
  email: false,
  push: false,
  quietStart: null,
  quietEnd: null,
};

const mockPrisma = {
  notification: {
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
};

const mockGateway = {
  emitToUser: jest.fn(),
  emitBroadcast: jest.fn(),
};

const mockPreferenceService = {
  getOrDefault: jest.fn(),
};

describe("NotificationEmitterService", () => {
  let service: NotificationEmitterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationEmitterService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsGateway, useValue: mockGateway },
        {
          provide: NotificationPreferenceService,
          useValue: mockPreferenceService,
        },
      ],
    }).compile();

    service = module.get<NotificationEmitterService>(
      NotificationEmitterService,
    );
    jest.clearAllMocks();
  });

  const baseDto = {
    userId: "user-1",
    type: "discussion_reply",
    category: "discussion",
    priority: "high",
    title: "New Reply",
    message: "Someone replied to your post",
    entityId: "entity-1",
    senderId: "user-2",
    senderName: "Alice",
  };

  describe("emit()", () => {
    it("should create a Notification document in DB and push via WebSocket", async () => {
      mockPreferenceService.getOrDefault.mockResolvedValue(DEFAULT_PREFS);
      mockPrisma.notification.findFirst.mockResolvedValue(null);
      const createdNotif = {
        id: "notif-1",
        ...baseDto,
        recipientId: "user-1",
        isRead: false,
        isArchived: false,
        readAt: null,
        createdAt: new Date(),
      };
      mockPrisma.notification.create.mockResolvedValue(createdNotif);

      await service.emit(baseDto);

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
      expect(mockGateway.emitToUser).toHaveBeenCalledWith(
        "user-1",
        "notification:new",
        expect.objectContaining({ type: "discussion_reply" }),
      );
    });

    it("should skip self-notification (senderId === userId)", async () => {
      await service.emit({ ...baseDto, userId: "user-2", senderId: "user-2" });
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });

    it("should skip when category is disabled in preferences (non-critical)", async () => {
      mockPreferenceService.getOrDefault.mockResolvedValue({
        ...DEFAULT_PREFS,
        discussion: false,
      });
      await service.emit({ ...baseDto, priority: "high" });
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });

    it("should NOT skip when category disabled but priority is critical", async () => {
      mockPreferenceService.getOrDefault.mockResolvedValue({
        ...DEFAULT_PREFS,
        discussion: false,
      });
      mockPrisma.notification.findFirst.mockResolvedValue(null);
      const createdNotif = {
        id: "notif-1",
        ...baseDto,
        recipientId: "user-1",
        isRead: false,
        isArchived: false,
        readAt: null,
        createdAt: new Date(),
      };
      mockPrisma.notification.create.mockResolvedValue(createdNotif);
      await service.emit({ ...baseDto, priority: "critical" });
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    });

    it("should skip when duplicate notification within 5s", async () => {
      mockPreferenceService.getOrDefault.mockResolvedValue(DEFAULT_PREFS);
      mockPrisma.notification.findFirst.mockResolvedValue({
        id: "existing-notif",
      });
      await service.emit(baseDto);
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });

    it("should persist but NOT push during quiet hours (non-critical)", async () => {
      // Set quiet hours covering all 24 hours (00:00–23:59)
      mockPreferenceService.getOrDefault.mockResolvedValue({
        ...DEFAULT_PREFS,
        quietStart: "00:00",
        quietEnd: "23:59",
      });
      mockPrisma.notification.findFirst.mockResolvedValue(null);
      const createdNotif = {
        id: "notif-1",
        ...baseDto,
        recipientId: "user-1",
        isRead: false,
        isArchived: false,
        readAt: null,
        createdAt: new Date(),
      };
      mockPrisma.notification.create.mockResolvedValue(createdNotif);

      await service.emit({ ...baseDto, priority: "medium" });

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
      expect(mockGateway.emitToUser).not.toHaveBeenCalled();
    });

    it("should push despite quiet hours when priority is critical", async () => {
      mockPreferenceService.getOrDefault.mockResolvedValue({
        ...DEFAULT_PREFS,
        quietStart: "00:00",
        quietEnd: "23:59",
      });
      mockPrisma.notification.findFirst.mockResolvedValue(null);
      const createdNotif = {
        id: "notif-1",
        ...baseDto,
        recipientId: "user-1",
        isRead: false,
        isArchived: false,
        readAt: null,
        createdAt: new Date(),
      };
      mockPrisma.notification.create.mockResolvedValue(createdNotif);

      await service.emit({ ...baseDto, priority: "critical" });

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
      expect(mockGateway.emitToUser).toHaveBeenCalledTimes(1);
    });
  });

  describe("emitBroadcast()", () => {
    it("should create one notification per active user and emit broadcast WebSocket", async () => {
      const users = [{ id: "u1" }, { id: "u2" }, { id: "u3" }];
      mockPrisma.user.findMany.mockResolvedValue(users);
      mockPrisma.notification.createMany.mockResolvedValue({ count: 3 });

      await service.emitBroadcast({
        type: "system_announcement",
        category: "system",
        priority: "high",
        title: "Announcement",
        message: "Hello everyone",
      });

      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ recipientId: "u1" }),
          ]),
        }),
      );
      expect(mockGateway.emitBroadcast).toHaveBeenCalledWith(
        "notification:new",
        expect.any(Object),
      );
    });

    it("should do nothing when no active users", async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      await service.emitBroadcast({
        type: "system_announcement",
        category: "system",
        priority: "high",
        title: "X",
        message: "Y",
      });
      expect(mockPrisma.notification.createMany).not.toHaveBeenCalled();
    });
  });
});
