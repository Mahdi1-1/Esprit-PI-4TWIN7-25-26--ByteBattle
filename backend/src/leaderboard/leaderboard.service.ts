import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeDuelStats, computeDuelStatsBatch } from '../duels/duel-stats.util';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getGlobal(query: { page?: number; limit?: number; sort?: string; language?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    if (query.language) {
      const duels = await this.prisma.duel.findMany({
        where: {
          status: 'completed',
          OR: [
            { player1Language: query.language },
            { player2Language: query.language }
          ]
        },
        select: {
          player1Id: true,
          player2Id: true,
          winnerId: true,
          player1Language: true,
          player2Language: true,
        }
      });
      
      const statsMap = new Map<string, { id: string, username: string, profileImage: string|null, elo: number, xp: number, level: number, duelsWon: number, duelsLost: number, duelsTotal: number }>();
      
      const userIds = new Set<string>();
      duels.forEach(d => {
        if (d.player1Language === query.language) userIds.add(d.player1Id);
        if (d.player2Language === query.language) userIds.add(d.player2Id);
      });
      
      if (userIds.size > 0) {
        const usersInfo = await this.prisma.user.findMany({
          where: { id: { in: Array.from(userIds) } },
          select: { id: true, username: true, profileImage: true, elo: true, xp: true, level: true }
        });
        
        usersInfo.forEach(u => {
          statsMap.set(u.id, { ...u, duelsWon: 0, duelsLost: 0, duelsTotal: 0 });
        });
        
        duels.forEach(d => {
          if (d.player1Language === query.language) {
            const stats = statsMap.get(d.player1Id);
            if (stats) {
              stats.duelsTotal++;
              if (d.winnerId === d.player1Id) stats.duelsWon++;
              else if (d.winnerId === d.player2Id) stats.duelsLost++;
            }
          }
          if (d.player2Language === query.language) {
            const stats = statsMap.get(d.player2Id);
            if (stats) {
              stats.duelsTotal++;
              if (d.winnerId === d.player2Id) stats.duelsWon++;
              else if (d.winnerId === d.player1Id) stats.duelsLost++;
            }
          }
        });
      }
      
      let processedUsers = Array.from(statsMap.values()).map(u => {
        const played = u.duelsWon + u.duelsLost;
        const winRate = played > 0 ? (u.duelsWon / played) * 100 : 0.0;
        return {
          ...u,
          winRate: Number(winRate.toFixed(1))
        };
      });
      
      if (query.sort === 'winRate') {
        processedUsers.sort((a, b) => {
          if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          return b.duelsTotal - a.duelsTotal;
        });
      } else if (query.sort === 'xp') {
        processedUsers.sort((a, b) => b.xp - a.xp);
      } else if (query.sort === 'level') {
        processedUsers.sort((a, b) => b.level - a.level);
      } else {
        processedUsers.sort((a, b) => b.elo - a.elo);
      }
      
      const total = processedUsers.length;
      processedUsers = processedUsers.slice(skip, skip + limit);
      const ranked = processedUsers.map((u, i) => ({ ...u, rank: skip + i + 1 }));
      return { data: ranked, total, page, limit };
    }

    let orderBy: any = undefined;
    if (query.sort === 'elo' || !query.sort) orderBy = { elo: 'desc' };
    if (query.sort === 'xp') orderBy = { xp: 'desc' };
    if (query.sort === 'level') orderBy = { level: 'desc' };

    const isDbSort = query.sort !== 'winRate';

    const [allUsers, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { status: 'active' },
        ...(isDbSort ? { skip, take: limit, orderBy } : {}),
        select: {
          id: true,
          username: true,
          profileImage: true,
          level: true,
          xp: true,
          elo: true,
          _count: { select: { submissions: true } },
        },
      }),
      this.prisma.user.count({ where: { status: 'active' } }),
    ]);

    // Compute duel stats dynamically for all fetched users
    const duelStatsMap = await computeDuelStatsBatch(this.prisma, allUsers.map(u => u.id));

    let processedUsers = allUsers.map((u) => {
      const ds = duelStatsMap.get(u.id) || { duelsWon: 0, duelsLost: 0, duelsTotal: 0, winRate: 0 };
      return {
        ...u,
        duelsWon: ds.duelsWon,
        duelsLost: ds.duelsLost,
        duelsTotal: ds.duelsTotal,
        winRate: ds.winRate,
      };
    });

    if (!isDbSort) {
      processedUsers.sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return (b.duelsTotal || 0) - (a.duelsTotal || 0);
      });
      processedUsers = processedUsers.slice(skip, skip + limit);
    }

    const ranked = processedUsers.map((u, i) => ({ ...u, rank: skip + i + 1 }));

    return { data: ranked, total, page, limit };
  }

  async getAvailableLanguages() {
    const p1 = await this.prisma.duel.findMany({
      where: { status: 'completed', player1Language: { not: null } },
      distinct: ['player1Language'],
      select: { player1Language: true }
    });
    const p2 = await this.prisma.duel.findMany({
      where: { status: 'completed', player2Language: { not: null } },
      distinct: ['player2Language'],
      select: { player2Language: true }
    });
    
    // Some basic normalization in case case matches diverge
    const langs = new Set([
      ...p1.map(d => d.player1Language?.toLowerCase()).filter(Boolean),
      ...p2.map(d => d.player2Language?.toLowerCase()).filter(Boolean)
    ]);
    return { languages: Array.from(langs).sort() };
  }

  async getUserRank(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        username: true,
        profileImage: true,
        elo: true, 
        xp: true, 
        level: true,
      },
    });
    if (!user) return null;

    const rankByElo = await this.prisma.user.count({
      where: { status: 'active', elo: { gt: user.elo } },
    });

    // Calculate duel stats dynamically
    const ds = await computeDuelStats(this.prisma, userId);

    return {
      rank: rankByElo + 1,
      eloRank: rankByElo + 1,
      username: user.username,
      profileImage: user.profileImage,
      elo: user.elo,
      xp: user.xp,
      level: user.level,
      duelsWon: ds.duelsWon,
      duelsLost: ds.duelsLost,
      duelsTotal: ds.duelsTotal,
      winRate: ds.winRate,
    };
  }

  async getUserStats(userId: string) {
    const [submissionCount, acceptedCount, discussions] = await Promise.all([
      this.prisma.submission.count({ where: { userId } }),
      this.prisma.submission.count({ where: { userId, verdict: 'AC' } }),
      this.prisma.discussion.count({ where: { authorId: userId } }),
    ]);

    // Unique solved challenges
    const solvedChallenges = await this.prisma.submission.findMany({
      where: { userId, verdict: 'AC' },
      select: { challengeId: true },
      distinct: ['challengeId'],
    });

    return {
      totalSubmissions: submissionCount,
      accepted: acceptedCount,
      solvedChallenges: solvedChallenges.length,
      discussions,
      acceptRate: submissionCount > 0 ? Math.round((acceptedCount / submissionCount) * 100) : 0,
    };
  }
}
