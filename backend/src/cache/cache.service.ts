import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly logger = new Logger(CacheService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD', ''),
    });

    this.redis.on('error', (err) => {
      // Don't log spam if offline, just log once (handled by reconnect strategies usually but keep simple here)
      this.logger.error('Redis connection error in CacheService', err);
    });
  }

  onModuleDestroy() {
    this.redis.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      this.logger.error(`Error retrieving cache for key ${key}`, err);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const data = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, data);
      } else {
        await this.redis.set(key, data);
      }
    } catch (err) {
      this.logger.error(`Error setting cache for key ${key}`, err);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.error(`Error deleting cache for key ${key}`, err);
    }
  }

  async deleteByPattern(pattern: string): Promise<void> {
      try {
        const stream = this.redis.scanStream({
            match: pattern,
            count: 100
        });

        stream.on('data', async (keys) => {
            if (keys.length) {
                const pipeline = this.redis.pipeline();
                keys.forEach((key: string) => pipeline.del(key));
                await pipeline.exec();
            }
        });
      } catch (err) {
          this.logger.error(`Error deleting keys by pattern ${pattern}`, err);
      }
  }
}
