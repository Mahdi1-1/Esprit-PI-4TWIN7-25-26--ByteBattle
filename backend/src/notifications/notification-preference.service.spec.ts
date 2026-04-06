import { Test, TestingModule } from '@nestjs/testing';
import { NotificationPreferenceService } from './notification-preference.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  notificationPreference: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
};

describe('NotificationPreferenceService', () => {
  let service: NotificationPreferenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPreferenceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NotificationPreferenceService>(NotificationPreferenceService);
    jest.clearAllMocks();
  });

  describe('getOrDefault()', () => {
    it('should return defaults when no preference document exists', async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue(null);
      const result = await service.getOrDefault('user-1');
      expect(result.hackathon).toBe(true);
      expect(result.discussion).toBe(true);
      expect(result.email).toBe(false);
      expect(result.quietStart).toBeNull();
    });

    it('should return the stored preference when document exists', async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        hackathon: true, duel: false, discussion: true, submission: true,
        canvas: true, achievement: true, system: true,
        inApp: true, email: false, push: false,
        quietStart: '22:00', quietEnd: '08:00',
      });
      const result = await service.getOrDefault('user-1');
      expect(result.duel).toBe(false);
      expect(result.quietStart).toBe('22:00');
    });
  });

  describe('upsert()', () => {
    it('should call prisma upsert and return the result', async () => {
      const expected = { id: 'pref-1', userId: 'user-1', discussion: false };
      mockPrisma.notificationPreference.upsert.mockResolvedValue(expected);
      const result = await service.upsert('user-1', { discussion: false });
      expect(mockPrisma.notificationPreference.upsert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expected);
    });

    it('should handle partial updates (only changed fields)', async () => {
      mockPrisma.notificationPreference.upsert.mockResolvedValue({});
      await service.upsert('user-1', { hackathon: false });
      const callArgs = mockPrisma.notificationPreference.upsert.mock.calls[0][0];
      expect(callArgs.update).toEqual(expect.objectContaining({ hackathon: false }));
    });
  });
});
