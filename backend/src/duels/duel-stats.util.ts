import { PrismaService } from '../prisma/prisma.service';

export interface DuelStats {
  duelsTotal: number;
  duelsWon: number;
  duelsLost: number;
  winRate: number;
}

/**
 * Calculate duel stats dynamically from relations instead of
 * relying on denormalized counters.
 *
 * duelsTotal = count(duelsAsPlayer1) + count(duelsAsPlayer2)  (completed only)
 * duelsWon   = count(wonDuels)                                (completed only)
 * duelsLost  = duelsTotal - duelsWon
 */
export async function computeDuelStats(
  prisma: PrismaService,
  userId: string,
): Promise<DuelStats> {
  const [asP1, asP2, won] = await Promise.all([
    prisma.duel.count({
      where: { player1Id: userId, status: 'completed' },
    }),
    prisma.duel.count({
      where: { player2Id: userId, status: 'completed' },
    }),
    prisma.duel.count({
      where: { winnerId: userId, status: 'completed' },
    }),
  ]);

  const duelsTotal = asP1 + asP2;
  const duelsWon = won;
  const duelsLost = duelsTotal - duelsWon;
  const played = duelsWon + duelsLost;
  const winRate = played > 0 ? Number(((duelsWon / played) * 100).toFixed(1)) : 0;

  return { duelsTotal, duelsWon, duelsLost, winRate };
}

/**
 * Batch-compute duel stats for multiple users at once (e.g. leaderboard).
 * Returns a Map<userId, DuelStats>.
 */
export async function computeDuelStatsBatch(
  prisma: PrismaService,
  userIds: string[],
): Promise<Map<string, DuelStats>> {
  if (userIds.length === 0) return new Map();

  // One query to get all completed duels involving these users
  const duels = await prisma.duel.findMany({
    where: {
      status: 'completed',
      OR: [
        { player1Id: { in: userIds } },
        { player2Id: { in: userIds } },
      ],
    },
    select: {
      player1Id: true,
      player2Id: true,
      winnerId: true,
    },
  });

  const statsMap = new Map<string, DuelStats>();
  for (const id of userIds) {
    statsMap.set(id, { duelsTotal: 0, duelsWon: 0, duelsLost: 0, winRate: 0 });
  }

  for (const d of duels) {
    // Player 1
    const s1 = statsMap.get(d.player1Id);
    if (s1) {
      s1.duelsTotal++;
      if (d.winnerId === d.player1Id) s1.duelsWon++;
      else if (d.winnerId) s1.duelsLost++;
    }
    // Player 2
    if (d.player2Id) {
      const s2 = statsMap.get(d.player2Id);
      if (s2) {
        s2.duelsTotal++;
        if (d.winnerId === d.player2Id) s2.duelsWon++;
        else if (d.winnerId) s2.duelsLost++;
      }
    }
  }

  // Compute win rates
  for (const s of statsMap.values()) {
    const played = s.duelsWon + s.duelsLost;
    s.winRate = played > 0 ? Number(((s.duelsWon / played) * 100).toFixed(1)) : 0;
  }

  return statsMap;
}
