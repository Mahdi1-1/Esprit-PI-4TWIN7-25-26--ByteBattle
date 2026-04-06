import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationPreferenceService } from './notification-preference.service';

const mockNotificationsService = {
  getAll: jest.fn(),
  getUnreadCount: jest.fn(),
  markRead: jest.fn(),
  markAllRead: jest.fn(),
  archive: jest.fn(),
  bulkMarkRead: jest.fn(),
  bulkArchive: jest.fn(),
  delete: jest.fn(),
};

const mockPreferenceService = {
  getOrDefault: jest.fn(),
  upsert: jest.fn(),
};

const mockReq = { user: { id: 'user-1' } };

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: NotificationPreferenceService, useValue: mockPreferenceService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should call notificationsService.getAll with userId and query', async () => {
      const query = { page: 1, limit: 20 };
      const expected = { data: [], total: 0, page: 1, limit: 20, hasMore: false };
      mockNotificationsService.getAll.mockResolvedValue(expected);

      const result = await controller.getAll(mockReq as any, query as any);

      expect(mockNotificationsService.getAll).toHaveBeenCalledWith('user-1', query);
      expect(result).toEqual(expected);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for user', async () => {
      mockNotificationsService.getUnreadCount.mockResolvedValue({ count: 5 });

      const result = await controller.getUnreadCount(mockReq as any);

      expect(mockNotificationsService.getUnreadCount).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ count: 5 });
    });
  });

  describe('getPreferences', () => {
    it('should return preferences (or defaults) for user', async () => {
      const prefs = { hackathon: true, duel: true, discussion: true };
      mockPreferenceService.getOrDefault.mockResolvedValue(prefs);

      const result = await controller.getPreferences(mockReq as any);

      expect(mockPreferenceService.getOrDefault).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(prefs);
    });
  });

  describe('updatePreferences', () => {
    it('should upsert preferences for user', async () => {
      const dto = { hackathon: false, quietStart: '22:00', quietEnd: '08:00' };
      const updated = { ...dto, userId: 'user-1' };
      mockPreferenceService.upsert.mockResolvedValue(updated);

      const result = await controller.updatePreferences(mockReq as any, dto as any);

      expect(mockPreferenceService.upsert).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(updated);
    });
  });

  describe('markAllRead', () => {
    it('should mark all notifications as read for user', async () => {
      mockNotificationsService.markAllRead.mockResolvedValue({ count: 3 });

      const result = await controller.markAllRead(mockReq as any);

      expect(mockNotificationsService.markAllRead).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ count: 3 });
    });
  });

  describe('bulkMarkRead', () => {
    it('should bulk mark specified notifications as read', async () => {
      const dto = { ids: ['n-1', 'n-2'] };
      mockNotificationsService.bulkMarkRead.mockResolvedValue({ count: 2 });

      const result = await controller.bulkMarkRead(mockReq as any, dto);

      expect(mockNotificationsService.bulkMarkRead).toHaveBeenCalledWith(['n-1', 'n-2'], 'user-1');
      expect(result).toEqual({ count: 2 });
    });
  });

  describe('bulkArchive', () => {
    it('should bulk archive specified notifications', async () => {
      const dto = { ids: ['n-1', 'n-2'] };
      mockNotificationsService.bulkArchive.mockResolvedValue({ count: 2 });

      const result = await controller.bulkArchive(mockReq as any, dto);

      expect(mockNotificationsService.bulkArchive).toHaveBeenCalledWith(['n-1', 'n-2'], 'user-1');
      expect(result).toEqual({ count: 2 });
    });
  });

  describe('markRead', () => {
    it('should mark a single notification as read', async () => {
      mockNotificationsService.markRead.mockResolvedValue({ id: 'n-1', isRead: true });

      const result = await controller.markRead('n-1', mockReq as any);

      expect(mockNotificationsService.markRead).toHaveBeenCalledWith('n-1', 'user-1');
      expect(result).toEqual({ id: 'n-1', isRead: true });
    });
  });

  describe('archive', () => {
    it('should archive a single notification', async () => {
      mockNotificationsService.archive.mockResolvedValue({ id: 'n-1', isArchived: true });

      const result = await controller.archive('n-1', mockReq as any);

      expect(mockNotificationsService.archive).toHaveBeenCalledWith('n-1', 'user-1');
      expect(result).toEqual({ id: 'n-1', isArchived: true });
    });
  });

  describe('delete', () => {
    it('should delete a notification', async () => {
      mockNotificationsService.delete.mockResolvedValue({ deleted: true });

      const result = await controller.delete('n-1', mockReq as any);

      expect(mockNotificationsService.delete).toHaveBeenCalledWith('n-1', 'user-1');
      expect(result).toEqual({ deleted: true });
    });
  });
});
