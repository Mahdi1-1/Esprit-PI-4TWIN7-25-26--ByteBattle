import { computeDuelStats, computeDuelStatsBatch } from './duel-stats.util';

describe('duel-stats.util', () => {
  describe('computeDuelStats', () => {
    it('calculates totals, wins, losses, and win rate from duel counts', async () => {
      const prisma = {
        duel: {
          count: jest
            .fn()
            .mockResolvedValueOnce(3)
            .mockResolvedValueOnce(2)
            .mockResolvedValueOnce(4),
        },
      } as any;

      const result = await computeDuelStats(prisma, 'user-1');

      expect(prisma.duel.count).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        duelsTotal: 5,
        duelsWon: 4,
        duelsLost: 1,
        winRate: 80,
      });
    });

    it('returns zeroed stats when a user has no completed duels', async () => {
      const prisma = {
        duel: {
          count: jest.fn().mockResolvedValue(0),
        },
      } as any;

      const result = await computeDuelStats(prisma, 'user-2');

      expect(result).toEqual({
        duelsTotal: 0,
        duelsWon: 0,
        duelsLost: 0,
        winRate: 0,
      });
    });
  });

  describe('computeDuelStatsBatch', () => {
    it('aggregates stats for multiple users in one pass', async () => {
      const prisma = {
        duel: {
          findMany: jest.fn().mockResolvedValue([
            { player1Id: 'u1', player2Id: 'u2', winnerId: 'u1' },
            { player1Id: 'u2', player2Id: 'u3', winnerId: 'u3' },
            { player1Id: 'u1', player2Id: 'u3', winnerId: null },
          ]),
        },
      } as any;

      const result = await computeDuelStatsBatch(prisma, ['u1', 'u2', 'u3']);

      expect(prisma.duel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'completed' }),
          select: { player1Id: true, player2Id: true, winnerId: true },
        }),
      );
      expect(result.get('u1')).toEqual({ duelsTotal: 2, duelsWon: 1, duelsLost: 0, winRate: 100 });
      expect(result.get('u2')).toEqual({ duelsTotal: 2, duelsWon: 0, duelsLost: 2, winRate: 0 });
      expect(result.get('u3')).toEqual({ duelsTotal: 2, duelsWon: 1, duelsLost: 0, winRate: 100 });
    });

    it('returns an empty map when no user ids are provided', async () => {
      const prisma = {
        duel: {
          findMany: jest.fn(),
        },
      } as any;

      const result = await computeDuelStatsBatch(prisma, []);

      expect(prisma.duel.findMany).not.toHaveBeenCalled();
      expect(result.size).toBe(0);
    });
  });
});