import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RedisLeaderboardService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly logger = new Logger(RedisLeaderboardService.name);
  private readonly ELO_KEY = 'leaderboard:elo';

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD', ''),
    });

    this.redis.on('error', (err) => {
      this.logger.error('Redis connection error in Leaderboard', err);
    });

    // Check if leaderboard is empty, if so, hydrate it
    const count = await this.redis.zcard(this.ELO_KEY);
    if (count === 0) {
      this.logger.log('Redis Leaderboard is empty, hydrating from database...');
      await this.hydrateLeaderboard();
    }
  }

  onModuleDestroy() {
    this.redis.quit();
  }

  /**
   * Hydrates the ZSET entirely from MongoDB
   */
  async hydrateLeaderboard() {
    try {
      const users = await this.prisma.user.findMany({
        where: { status: 'active' },
        select: { id: true, elo: true },
      });

      if (users.length === 0) return;

      const pipeline = this.redis.pipeline();
      for (const user of users) {
        pipeline.zadd(this.ELO_KEY, user.elo, user.id);
      }
      
      await pipeline.exec();
      this.logger.log(`Hydrated ${users.length} users into Redis leaderboard.`);
    } catch (err) {
      this.logger.error('Failed to hydrate leaderboard', err);
    }
  }

  /**
   * Updates a user's ELO in the Redis ZSET.
   */
  async updateUserElo(userId: string, elo: number) {
    try {
      await this.redis.zadd(this.ELO_KEY, elo, userId);
    } catch (err) {
      this.logger.error(`Failed to update user ${userId} elo in Redis`, err);
    }
  }

  /**
   * Retrieves the top N users from the Redis ZSET (fast path).
   * Note: This only gets their IDs and ELOs.
   * A true implementation would then fetch the basic user data from Cache or DB.
   */
  async getTopUsers(limit: number = 50) {
    try {
      // zrevrange with WITHSCORES returns [id, elo, id, elo...]
      const results = await this.redis.zrevrange(this.ELO_KEY, 0, limit - 1, 'WITHSCORES');
      
      const parsedResults: { id: string; elo: number }[] = [];
      for (let i = 0; i < results.length; i += 2) {
        parsedResults.push({
          id: results[i],
          elo: parseFloat(results[i + 1]),
        });
      }

      if (parsedResults.length === 0) return [];

      // Fetch basic profile info from Mongo (or cache)
      // Maintaining order is important
      const userIds = parsedResults.map(u => u.id);
      const usersInfo = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true, profileImage: true, level: true, xp: true }
      });

      const userMap = new Map(usersInfo.map(u => [u.id, u]));

      return parsedResults.map((pr, index) => {
        const u = userMap.get(pr.id) as any;
        if (!u) return null;

        return {
          id: pr.id,
          username: u.username,
          profileImage: u.profileImage,
          level: u.level,
          xp: u.xp,
          elo: pr.elo,
          rank: index + 1,
        }
      }).filter(Boolean);
    } catch (err) {
      this.logger.error('Failed to get top users from Redis', err);
      return [];
    }
  }

  /**
   * Fast lookup of exactly one user's rank.
   */
  async getUserRank(userId: string) {
    try {
      // zrevrank is 0-indexed rank
      const rank = await this.redis.zrevrank(this.ELO_KEY, userId);
      return rank !== null ? rank + 1 : null;
    } catch (err) {
      this.logger.error(`Failed to get rank for ${userId} from Redis`, err);
      return null;
    }
  }
}
