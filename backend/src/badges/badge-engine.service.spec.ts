import { Test, TestingModule } from '@nestjs/testing';
import { BadgeEngineService, BADGE_CATALOGUE } from './badge-engine.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  badge: { 
    findMany: jest.fn(), 
    upsert: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  userBadge: { 
    findUnique: jest.fn(), 
    create: jest.fn(), 
    findMany: jest.fn() 
  },
  submission: { findMany: jest.fn(), count: jest.fn() },
  duel: { findMany: jest.fn(), count: jest.fn() },
  discussion: { count: jest.fn() },
  comment: { count: jest.fn() },
  user: { findUnique: jest.fn() },
};

const mockBadge = (key: string) => ({ id: `badge-${key}`, key, name: key });

describe('BadgeEngineService', () => {
  let service: BadgeEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeEngineService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BadgeEngineService>(BadgeEngineService);
    jest.clearAllMocks();
    // Default: user has no badges yet
    mockPrisma.userBadge.findUnique.mockResolvedValue(null);
    mockPrisma.userBadge.create.mockResolvedValue({});
    mockPrisma.badge.findMany.mockResolvedValue([]);
    mockPrisma.badge.findFirst.mockResolvedValue(null);
    mockPrisma.badge.create.mockResolvedValue({});
    mockPrisma.badge.update.mockResolvedValue({});
    mockPrisma.badge.findUnique.mockResolvedValue(mockBadge('test'));
    mockPrisma.duel.findMany.mockResolvedValue([]);
    mockPrisma.duel.count.mockResolvedValue(0);
    mockPrisma.submission.count.mockResolvedValue(0);
    mockPrisma.discussion.count.mockResolvedValue(0);
    mockPrisma.comment.count.mockResolvedValue(0);
    mockPrisma.user.findUnique.mockResolvedValue(null);
  });

  // ─── seedBadges ──────────────────────────────────────────────────────────────

  describe('seedBadges()', () => {
    it('should upsert all badges from the catalogue', async () => {
      mockPrisma.badge.findFirst.mockResolvedValue(null);
      mockPrisma.badge.create.mockResolvedValue({});

      await service.seedBadges();

      expect(mockPrisma.badge.findFirst).toHaveBeenCalled();
      expect(mockPrisma.badge.create).toHaveBeenCalledTimes(BADGE_CATALOGUE.length);
    });
  });

  // ─── getUserBadges ────────────────────────────────────────────────────────────

  describe('getUserBadges()', () => {
    it('should return empty array when user has no badges', async () => {
      mockPrisma.userBadge.findMany.mockResolvedValue([]);

      const result = await service.getUserBadges('user-1');

      expect(result).toEqual([]);
    });

    it('should return badges with badge details', async () => {
      mockPrisma.userBadge.findMany.mockResolvedValue([
        { badge: { key: 'first_blood', name: 'First Blood' }, earnedAt: new Date() },
      ]);

      const result = await service.getUserBadges('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].badge.key).toBe('first_blood');
    });
  });

  // ─── onSubmissionAccepted ─────────────────────────────────────────────────────

  describe('onSubmissionAccepted()', () => {
    const submission = {
      id: 'sub-1',
      challengeId: 'chal-1',
      language: 'python3',
      timeMs: 50,
      createdAt: new Date(),
    };

    it('should award first_blood on very first AC submission', async () => {
      mockPrisma.submission.findMany.mockResolvedValue([
        { challengeId: 'chal-1', language: 'python3', timeMs: 50, challenge: { difficulty: 'easy' } },
      ]);
      mockPrisma.submission.count.mockResolvedValueOnce(1); // challengeAcCount
      mockPrisma.submission.count.mockResolvedValueOnce(0); // thisChallengePrevAc
      
      mockPrisma.badge.findUnique.mockResolvedValue(mockBadge('first_blood'));
      mockPrisma.userBadge.findUnique.mockResolvedValue(null); // not yet earned

      const awarded = await service.onSubmissionAccepted('user-1', submission);

      expect(awarded).toContain('first_blood');
      expect(mockPrisma.userBadge.create).toHaveBeenCalled();
    });

    it('should award speed_demon when timeMs < 100', async () => {
      mockPrisma.submission.findMany.mockResolvedValue([
        { challengeId: 'chal-1', language: 'python3', timeMs: 50, challenge: { difficulty: 'easy' } },
      ]);
      mockPrisma.submission.count.mockResolvedValue(5);

      mockPrisma.badge.findUnique.mockResolvedValue(mockBadge('speed_demon'));
      mockPrisma.userBadge.findUnique.mockResolvedValue(null);

      const awarded = await service.onSubmissionAccepted('user-1', { ...submission, timeMs: 50 });

      expect(awarded).toContain('speed_demon');
    });

    it('should NOT award speed_demon when timeMs >= 100', async () => {
      mockPrisma.submission.findMany.mockResolvedValue([
        { challengeId: 'chal-1', language: 'python3', timeMs: 200, challenge: { difficulty: 'easy' } },
      ]);
      mockPrisma.submission.count.mockResolvedValue(5);
      mockPrisma.badge.findMany.mockResolvedValue([]);

      const awarded = await service.onSubmissionAccepted('user-1', { ...submission, timeMs: 200 });

      // speed_demon should not be in awarded
      expect(awarded).not.toContain('speed_demon');
    });

    it('should award polyglot when AC in 4+ distinct languages', async () => {
      mockPrisma.submission.findMany.mockResolvedValue([
        { challengeId: 'c1', language: 'python3', timeMs: 100, challenge: { difficulty: 'easy' } },
        { challengeId: 'c2', language: 'javascript', timeMs: 100, challenge: { difficulty: 'easy' } },
        { challengeId: 'c3', language: 'cpp', timeMs: 100, challenge: { difficulty: 'easy' } },
        { challengeId: 'c4', language: 'java', timeMs: 100, challenge: { difficulty: 'easy' } },
      ]);
      mockPrisma.submission.count.mockResolvedValue(10);
      
      mockPrisma.badge.findUnique.mockResolvedValue(mockBadge('polyglot'));
      mockPrisma.userBadge.findUnique.mockResolvedValue(null);

      const awarded = await service.onSubmissionAccepted('user-1', submission);

      expect(awarded).toContain('polyglot');
    });
  });

  // ─── onDuelFinished ───────────────────────────────────────────────────────────

  describe('onDuelFinished()', () => {
    it('should award duel_debut on first duel', async () => {
      mockPrisma.duel.count.mockResolvedValueOnce(1); // totalDuels
      mockPrisma.duel.count.mockResolvedValueOnce(0); // totalWins
      mockPrisma.badge.findUnique.mockResolvedValue(mockBadge('duel_debut'));
      mockPrisma.userBadge.findUnique.mockResolvedValue(null);

      const awarded = await service.onDuelFinished('user-1', true, 1400);

      expect(awarded.length).toBeGreaterThan(0);
    });

    it('should award duel_winner on first duel win', async () => {
      mockPrisma.duel.count.mockResolvedValueOnce(5); // totalDuels
      mockPrisma.duel.count.mockResolvedValueOnce(1); // totalWins (first win)
      mockPrisma.duel.findMany.mockResolvedValue([{ winnerId: 'user-1' }]);
      mockPrisma.badge.findUnique.mockResolvedValue(mockBadge('duel_winner'));
      mockPrisma.userBadge.findUnique.mockResolvedValue(null);

      const awarded = await service.onDuelFinished('user-1', true, 1400);

      expect(awarded).toContain('duel_winner');
    });

    it('should award elo_bronze when elo >= 1400', async () => {
      mockPrisma.duel.count.mockResolvedValueOnce(10); // totalDuels
      mockPrisma.duel.count.mockResolvedValueOnce(5); // totalWins
      mockPrisma.duel.findMany.mockResolvedValue([]);
      mockPrisma.badge.findUnique.mockResolvedValue(mockBadge('elo_bronze'));
      mockPrisma.userBadge.findUnique.mockResolvedValue(null);

      const awarded = await service.onDuelFinished('user-1', false, 1450);

      expect(awarded).toContain('elo_bronze');
    });
  });

  // ─── checkUserLevelBadges ─────────────────────────────────────────────────────

  describe('checkUserLevelBadges()', () => {
    it('should award level_5 badge when user reaches level 5', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', level: 5, xp: 1200 });
      mockPrisma.badge.findUnique.mockResolvedValue(mockBadge('level_5'));
      mockPrisma.userBadge.findUnique.mockResolvedValue(null);

      const awarded = await service.checkUserLevelBadges('user-1');

      expect(awarded).toContain('level_5');
    });

    it('should not crash when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.checkUserLevelBadges('nonexistent')).resolves.not.toThrow();
    });
  });
});
