import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockPrisma = {
  notification: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
};

const mockGateway = {
  emitToUser: jest.fn(),
  emitBroadcast: jest.fn(),
};

const mockNotif = {
  id: 'notif-1',
  recipientId: 'user-1',
  type: 'discussion_reply',
  category: 'discussion',
  isRead: false,
  isArchived: false,
  createdAt: new Date(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  // ─── getAll ──────────────────────────────────────────────────────────────────

  describe('getAll()', () => {
    it('should return paginated notifications for user', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([mockNotif]);
      mockPrisma.notification.count.mockResolvedValue(1);

      const result = await service.getAll('user-1', { page: 1, limit: 20 });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ recipientId: 'user-1', isArchived: false }),
          skip: 0,
          take: 20,
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should apply category filter when provided', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await service.getAll('user-1', { category: 'hackathon' });

      const where = mockPrisma.notification.findMany.mock.calls[0][0].where;
      expect(where.category).toBe('hackathon');
    });

    it('should filter unread-only when unreadOnly is true', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await service.getAll('user-1', { unreadOnly: true });

      const where = mockPrisma.notification.findMany.mock.calls[0][0].where;
      expect(where.isRead).toBe(false);
    });

    it('should correctly compute hasMore flag', async () => {
      // page 1, limit 5, total 10 → hasMore = true
      mockPrisma.notification.findMany.mockResolvedValue(Array(5).fill(mockNotif));
      mockPrisma.notification.count.mockResolvedValue(10);

      const result = await service.getAll('user-1', { page: 1, limit: 5 });
      expect(result.hasMore).toBe(true);
    });

    it('should return hasMore=false on last page', async () => {
      mockPrisma.notification.findMany.mockResolvedValue(Array(3).fill(mockNotif));
      mockPrisma.notification.count.mockResolvedValue(8);

      const result = await service.getAll('user-1', { page: 2, limit: 5 });
      // skip=5, data.length=3, total=8 → 5+3=8 < 8 is false
      expect(result.hasMore).toBe(false);
    });
  });

  // ─── getUnreadCount ───────────────────────────────────────────────────────────

  describe('getUnreadCount()', () => {
    it('should return correct unread count', async () => {
      mockPrisma.notification.count.mockResolvedValue(7);

      const result = await service.getUnreadCount('user-1');

      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { recipientId: 'user-1', isRead: false, isArchived: false },
      });
      expect(result).toEqual({ count: 7 });
    });
  });

  // ─── markRead ─────────────────────────────────────────────────────────────────

  describe('markRead()', () => {
    it('should throw NotFoundException when notification not found', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.markRead('notif-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when notification belongs to another user', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({ ...mockNotif, recipientId: 'user-2' });

      await expect(service.markRead('notif-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should mark notification as read and set readAt', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(mockNotif);
      mockPrisma.notification.update.mockResolvedValue({ ...mockNotif, isRead: true });

      const result = await service.markRead('notif-1', 'user-1');

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true, readAt: expect.any(Date) },
      });
      expect(result.isRead).toBe(true);
    });
  });

  // ─── markAllRead ─────────────────────────────────────────────────────────────

  describe('markAllRead()', () => {
    it('should mark all unread notifications as read for user', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllRead('user-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { recipientId: 'user-1', isRead: false, isArchived: false },
        data: { isRead: true, readAt: expect.any(Date) },
      });
      expect(result).toEqual({ updated: 5 });
    });
  });

  // ─── archive ─────────────────────────────────────────────────────────────────

  describe('archive()', () => {
    it('should throw NotFoundException when notification not found', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.archive('notif-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when notification belongs to another user', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({ ...mockNotif, recipientId: 'user-2' });

      await expect(service.archive('notif-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should set isArchived to true', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(mockNotif);
      mockPrisma.notification.update.mockResolvedValue({ ...mockNotif, isArchived: true });

      const result = await service.archive('notif-1', 'user-1');

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isArchived: true },
      });
      expect(result.isArchived).toBe(true);
    });
  });

  // ─── bulkMarkRead ─────────────────────────────────────────────────────────────

  describe('bulkMarkRead()', () => {
    it('should bulk update notifications owned by user', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.bulkMarkRead(['n1', 'n2', 'n3'], 'user-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['n1', 'n2', 'n3'] }, recipientId: 'user-1' },
        data: { isRead: true, readAt: expect.any(Date) },
      });
      expect(result).toEqual({ updated: 3 });
    });
  });

  // ─── bulkArchive ─────────────────────────────────────────────────────────────

  describe('bulkArchive()', () => {
    it('should bulk archive notifications owned by user', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkArchive(['n1', 'n2'], 'user-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['n1', 'n2'] }, recipientId: 'user-1' },
        data: { isArchived: true },
      });
      expect(result).toEqual({ updated: 2 });
    });
  });

  // ─── delete ──────────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('should throw NotFoundException when notification not found', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.delete('notif-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when notification belongs to another user', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({ ...mockNotif, recipientId: 'user-2' });

      await expect(service.delete('notif-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should delete notification and return { deleted: true }', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(mockNotif);
      mockPrisma.notification.delete.mockResolvedValue(mockNotif);

      const result = await service.delete('notif-1', 'user-1');

      expect(mockPrisma.notification.delete).toHaveBeenCalledWith({ where: { id: 'notif-1' } });
      expect(result).toEqual({ deleted: true });
    });
  });
});
