import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RedisLeaderboardService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis | null = null;
  private readonly logger = new Logger(RedisLeaderboardService.name);
  private readonly ELO_KEY = 'leaderboard:elo';
  private readonly redisEnabled: boolean;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.redisEnabled = this.configService.get<string>('REDIS_ENABLED', 'true') !== 'false';
    if (!this.redisEnabled) {
      this.logger.warn('Redis leaderboard is disabled. Fast leaderboard features will be unavailable.');
    }
  }

  async onModuleInit() {
    if (!this.redisEnabled) {
      return;
    }

    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD', ''),
      maxRetriesPerRequest: null,
    });

    this.redis.on('error', (err) => {
      this.logger.error('Redis connection error in Leaderboard', err);
    });

    try {
      const count = await this.redis.zcard(this.ELO_KEY);
      if (count === 0) {
        this.logger.log('Redis Leaderboard is empty, hydrating from database...');
        await this.hydrateLeaderboard();
      }
    } catch (err) {
      this.logger.error('Unable to initialize Redis leaderboard', err);
      this.redis = null;
    }
  }

  onModuleDestroy() {
    this.redis?.quit();
  }

  /**
   * Hydrates the ZSET entirely from MongoDB
   */
  async hydrateLeaderboard() {
    if (!this.redis) {
      this.logger.warn('Skipping leaderboard hydration because Redis is unavailable.');
      return;
    }

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
    if (!this.redis) {
      this.logger.warn(`Skipping Redis leaderboard update for user ${userId} because Redis is unavailable.`);
      return;
    }

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
    if (!this.redis) {
      this.logger.warn('Redis is unavailable. Returning empty top users list.');
      return [];
    }

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
    if (!this.redis) {
      this.logger.warn(`Failed to get rank for ${userId} because Redis is unavailable.`);
      return null;
    }

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
