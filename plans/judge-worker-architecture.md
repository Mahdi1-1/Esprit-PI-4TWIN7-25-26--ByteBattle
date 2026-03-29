# ByteBattle Judge Worker Architecture Migration Plan

## 📋 Executive Summary

Migrating from **synchronous code execution** (Backend executes code directly) to **asynchronous queue-based architecture** (Backend → Redis Queue → Judge Worker → Docker).

### Current State
- Backend API executes code synchronously in Docker containers
- Leaderboard queries MongoDB directly (slow at scale)
- No caching layer
- WebSocket exists for duels but not for submission status

### Target State
- Backend API only sends jobs to Redis queue
- Separate Judge Worker service executes code
- Redis ZSET for ultra-fast leaderboard
- Redis cache for frequently accessed data
- Real-time WebSocket updates for submission status

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CURRENT ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend ──HTTP──► Backend API ──► Docker (sync execution)     │
│                          │                                       │
│                          ▼                                       │
│                     MongoDB (leaderboard queries)                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        TARGET ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend ──HTTP──► Backend API ──► Redis Queue                 │
│       │                    │              │                      │
│       │                    │              ▼                      │
│       │                    │        Judge Worker                 │
│       │                    │              │                      │
│       │                    │              ▼                      │
│       │                    │        Docker (async)               │
│       │                    │              │                      │
│       │◄──WebSocket────────┼──────────────┘                     │
│       │                    │                                     │
│       │                    ▼                                     │
│       │              Redis ZSET (leaderboard)                   │
│       │              Redis Cache (profiles, challenges)         │
│       │                    │                                     │
│       │                    ▼                                     │
│       │              MongoDB (persistent storage)               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Component 1: Redis Queue System

### Purpose
Decouple code submission from execution. Backend receives code, saves to DB, adds job to queue, responds immediately.

### Implementation

#### 1.1 Create BullMQ Queue Module

**File:** `backend/src/queue/queue.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { redisConfig } from '../config/redis.config';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: redisConfig,
    }),
    BullModule.registerQueue(
      { name: 'code-execution' },
      { name: 'leaderboard-update' },
    ),
  ],
  providers: [QueueService],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
```

#### 1.2 Queue Service

**File:** `backend/src/queue/queue.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface CodeExecutionJob {
  submissionId: string;
  userId: string;
  challengeId: string;
  code: string;
  language: string;
  tests: { input: string; expectedOutput: string }[];
  context: 'solo' | 'duel';
  duelId?: string;
}

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('code-execution') private codeQueue: Queue,
    @InjectQueue('leaderboard-update') private leaderboardQueue: Queue,
  ) {}

  async addCodeExecutionJob(job: CodeExecutionJob): Promise<string> {
    const added = await this.codeQueue.add('execute', job, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: 100, // Keep last 100 failed jobs for debugging
    });
    return added.id.toString();
  }

  async addLeaderboardUpdateJob(userId: string, eloChange: number) {
    await this.leaderboardQueue.add('update', { userId, eloChange });
  }

  async getJobStatus(jobId: string) {
    const job = await this.codeQueue.getJob(jobId);
    if (!job) return null;
    
    return {
      id: job.id,
      status: await job.getState(),
      progress: job.progress(),
      result: job.returnvalue,
      failedReason: job.failedReason,
    };
  }
}
```

#### 1.3 Modify Submissions Service

**File:** `backend/src/submissions/submissions.service.ts` (MODIFY)

```typescript
// BEFORE: Synchronous execution
async create(userId: string, dto: any) {
  // ... create submission ...
  if (dto.kind === 'CODE' && dto.code) {
    const result = await this.evaluateCode(submission.id, challenge, dto.code, dto.language);
    return result;
  }
  return submission;
}

// AFTER: Asynchronous queue
async create(userId: string, dto: any) {
  // ... create submission with status: 'queued' ...
  const submission = await this.prisma.submission.create({
    data: {
      userId,
      challengeId: challengeId,
      kind: dto.kind as any,
      context: dto.context || 'solo',
      language: dto.language,
      code: dto.code,
      verdict: 'queued', // Changed from 'pending'
      score: 0,
    },
  });

  // Add to queue instead of executing directly
  if (dto.kind === 'CODE' && dto.code) {
    const jobId = await this.queueService.addCodeExecutionJob({
      submissionId: submission.id,
      userId,
      challengeId,
      code: dto.code,
      language: dto.language || 'javascript',
      tests: challenge.tests || [],
      context: dto.context || 'solo',
      duelId: dto.duelId,
    });

    // Update submission with job ID
    await this.prisma.submission.update({
      where: { id: submission.id },
      data: { jobId },
    });

    // Notify frontend via WebSocket
    this.notificationsGateway.sendToUser(userId, 'submission_queued', {
      submissionId: submission.id,
      jobId,
      status: 'queued',
    });
  }

  return submission;
}

// NEW: Get submission status
async getSubmissionStatus(submissionId: string) {
  const submission = await this.prisma.submission.findUnique({
    where: { id: submissionId },
    select: { id: true, jobId: true, verdict: true, score: true },
  });

  if (!submission?.jobId) return submission;

  const jobStatus = await this.queueService.getJobStatus(submission.jobId);
  return {
    ...submission,
    queueStatus: jobStatus?.status,
    queueProgress: jobStatus?.progress,
  };
}
```

---

## 📦 Component 2: Judge Worker Service

### Purpose
Separate NestJS application that pulls jobs from Redis queue and executes code in Docker containers.

### Structure

```
judge-worker/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── judge/
│   │   ├── judge.module.ts
│   │   ├── judge.processor.ts    # BullMQ processor
│   │   └── judge.service.ts      # Code execution logic
│   ├── sandbox/
│   │   ├── sandbox.module.ts
│   │   └── sandbox.service.ts    # Docker execution (copy from backend)
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   └── notifications.service.ts  # WebSocket notifications
│   └── config/
│       └── redis.config.ts
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### Implementation

#### 2.1 Judge Processor (BullMQ Consumer)

**File:** `judge-worker/src/judge/judge.processor.ts`

```typescript
import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { JudgeService } from './judge.service';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('code-execution')
export class JudgeProcessor {
  private readonly logger = new Logger(JudgeProcessor.name);

  constructor(
    private judgeService: JudgeService,
    private notifications: NotificationsService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} for submission ${job.data.submissionId}`);
  }

  @Process('execute')
  async handleExecution(job: Job<CodeExecutionJob>) {
    const { submissionId, userId, code, language, tests, context, duelId } = job.data;

    this.logger.log(`Executing submission ${submissionId} (${language})`);

    // Notify frontend: execution started
    await this.notifications.sendToUser(userId, 'submission_executing', {
      submissionId,
      status: 'executing',
      progress: 0,
    });

    try {
      // Execute code against tests
      const result = await this.judgeService.executeAndEvaluate(
        code,
        language,
        tests,
        (progress: number) => {
          // Progress callback
          job.progress(progress);
          this.notifications.sendToUser(userId, 'submission_progress', {
            submissionId,
            progress,
          });
        },
      );

      // Update submission in database
      await this.judgeService.updateSubmission(submissionId, result);

      // Notify frontend: execution completed
      await this.notifications.sendToUser(userId, 'submission_completed', {
        submissionId,
        status: 'completed',
        verdict: result.verdict,
        score: result.score,
        testsPassed: result.passed,
        testsTotal: result.total,
        timeMs: result.totalTimeMs,
      });

      // If duel, update duel state
      if (context === 'duel' && duelId) {
        await this.judgeService.updateDuelState(duelId, userId, result);
      }

      return result;
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`);
      
      await this.notifications.sendToUser(userId, 'submission_failed', {
        submissionId,
        status: 'failed',
        error: error.message,
      });

      throw error; // BullMQ will retry
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed: ${result.verdict}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`);
  }
}
```

#### 2.2 Judge Service

**File:** `judge-worker/src/judge/judge.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SandboxService } from '../sandbox/sandbox.service';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export interface EvaluationResult {
  passed: number;
  total: number;
  verdict: string;
  score: number;
  totalTimeMs: number;
  maxMemMb: number;
  results: any[];
}

@Injectable()
export class JudgeService {
  private readonly logger = new Logger(JudgeService.name);
  private redis: Redis;

  constructor(
    private prisma: PrismaService,
    private sandbox: SandboxService,
    private config: ConfigService,
  ) {
    this.redis = new Redis({
      host: this.config.get('REDIS_HOST', 'localhost'),
      port: this.config.get('REDIS_PORT', 6379),
      password: this.config.get('REDIS_PASSWORD'),
    });
  }

  async executeAndEvaluate(
    code: string,
    language: string,
    tests: { input: string; expectedOutput: string }[],
    onProgress?: (progress: number) => void,
  ): Promise<EvaluationResult> {
    const evaluation = await this.sandbox.evaluateAgainstTests(
      language,
      code,
      tests,
      onProgress,
    );

    const score = evaluation.verdict === 'AC'
      ? 100
      : Math.round((evaluation.passed / evaluation.total) * 100);

    return {
      ...evaluation,
      score,
    };
  }

  async updateSubmission(submissionId: string, result: EvaluationResult) {
    await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        verdict: result.verdict,
        score: result.score,
        testsPassed: result.passed,
        testsTotal: result.total,
        timeMs: result.totalTimeMs,
        memMb: result.maxMemMb,
      },
    });

    this.logger.log(`Submission ${submissionId} updated: ${result.verdict} (${result.score})`);
  }

  async updateDuelState(duelId: string, playerId: string, result: EvaluationResult) {
    // Get duel state from Redis
    const stateKey = `duel:${duelId}`;
    const stateJson = await this.redis.get(stateKey);
    
    if (!stateJson) {
      this.logger.warn(`Duel state not found: ${duelId}`);
      return;
    }

    const state = JSON.parse(stateJson);
    const player = state.player1.id === playerId ? state.player1 : state.player2;

    player.testsPassed = result.passed;
    player.score = result.score;

    if (result.verdict === 'AC' && !player.finishedAt) {
      player.finishedAt = Date.now();
      player.executionTimeMs = result.totalTimeMs;
    }

    // Save updated state
    await this.redis.setex(stateKey, 7200, JSON.stringify(state));

    this.logger.log(`Duel ${duelId} state updated for player ${playerId}`);
  }
}
```

#### 2.3 Judge Worker Main

**File:** `judge-worker/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('JudgeWorker');
  
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  logger.log('🚀 Judge Worker started and listening for jobs...');
  
  // Keep the process running
  await app.init();
}

bootstrap();
```

---

## 📦 Component 3: Redis Leaderboard (ZSET)

### Purpose
Ultra-fast leaderboard queries using Redis sorted sets instead of MongoDB aggregation.

### Implementation

#### 3.1 Redis Leaderboard Service

**File:** `backend/src/leaderboard/redis-leaderboard.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RedisLeaderboardService {
  private readonly logger = new Logger(RedisLeaderboardService.name);
  private redis: Redis;
  
  private readonly LEADERBOARD_KEY = 'leaderboard:elo';
  private readonly LEADERBOARD_XP_KEY = 'leaderboard:xp';

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.redis = new Redis({
      host: this.config.get('REDIS_HOST', 'localhost'),
      port: this.config.get('REDIS_PORT', 6379),
      password: this.config.get('REDIS_PASSWORD'),
    });
  }

  /**
   * Update user's ELO in Redis sorted set
   */
  async updateElo(userId: string, elo: number) {
    await this.redis.zadd(this.LEADERBOARD_KEY, elo, userId);
    this.logger.debug(`Updated ELO for ${userId}: ${elo}`);
  }

  /**
   * Update user's XP in Redis sorted set
   */
  async updateXp(userId: string, xp: number) {
    await this.redis.zadd(this.LEADERBOARD_XP_KEY, xp, userId);
  }

  /**
   * Get top N players by ELO (ultra-fast)
   */
  async getTopByElo(limit: number = 50, offset: number = 0) {
    // ZREVRANGE returns members in descending order (highest score first)
    const userIds = await this.redis.zrevrange(
      this.LEADERBOARD_KEY,
      offset,
      offset + limit - 1,
    );

    if (userIds.length === 0) return [];

    // Get user details from MongoDB
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        profileImage: true,
        elo: true,
        xp: true,
        level: true,
        duelsWon: true,
        duelsLost: true,
        duelsTotal: true,
      },
    });

    // Maintain Redis order and add rank
    const userMap = new Map(users.map(u => [u.id, u]));
    return userIds.map((id, index) => ({
      rank: offset + index + 1,
      ...userMap.get(id),
    }));
  }

  /**
   * Get user's rank by ELO
   */
  async getUserRank(userId: string) {
    const rank = await this.redis.zrevrank(this.LEADERBOARD_KEY, userId);
    if (rank === null) return null;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        profileImage: true,
        elo: true,
        xp: true,
        level: true,
        duelsWon: true,
        duelsLost: true,
        duelsTotal: true,
      },
    });

    return {
      rank: rank + 1,
      ...user,
    };
  }

  /**
   * Initialize Redis leaderboard from MongoDB (run once on startup)
   */
  async initializeFromDatabase() {
    this.logger.log('Initializing Redis leaderboard from MongoDB...');
    
    const users = await this.prisma.user.findMany({
      where: { status: 'active' },
      select: { id: true, elo: true, xp: true },
    });

    const pipeline = this.redis.pipeline();
    
    for (const user of users) {
      pipeline.zadd(this.LEADERBOARD_KEY, user.elo, user.id);
      pipeline.zadd(this.LEADERBOARD_XP_KEY, user.xp, user.id);
    }

    await pipeline.exec();
    this.logger.log(`Initialized ${users.length} users in Redis leaderboard`);
  }

  /**
   * Get leaderboard statistics
   */
  async getStats() {
    const [totalPlayers, topPlayer] = await Promise.all([
      this.redis.zcard(this.LEADERBOARD_KEY),
      this.redis.zrevrange(this.LEADERBOARD_KEY, 0, 0, 'WITHSCORES'),
    ]);

    return {
      totalPlayers,
      topPlayer: topPlayer.length > 0 ? {
        userId: topPlayer[0],
        elo: parseInt(topPlayer[1]),
      } : null,
    };
  }
}
```

#### 3.2 Update Leaderboard Controller

**File:** `backend/src/leaderboard/leaderboard.controller.ts` (MODIFY)

```typescript
// Add new endpoint for Redis-based leaderboard
@Get('fast')
async getFastLeaderboard(
  @Query('page') page?: number,
  @Query('limit') limit?: number,
) {
  const offset = ((page || 1) - 1) * (limit || 50);
  const data = await this.redisLeaderboardService.getTopByElo(limit || 50, offset);
  return { data, page: page || 1, limit: limit || 50 };
}

@Get('rank/:userId')
async getUserRank(@Param('userId') userId: string) {
  return this.redisLeaderboardService.getUserRank(userId);
}
```

---

## 📦 Component 4: Redis Cache Layer

### Purpose
Cache frequently accessed data to reduce MongoDB queries.

### Implementation

#### 4.1 Cache Service

**File:** `backend/src/cache/cache.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;

  constructor(private config: ConfigService) {
    this.redis = new Redis({
      host: this.config.get('REDIS_HOST', 'localhost'),
      port: this.config.get('REDIS_PORT', 6379),
      password: this.config.get('REDIS_PASSWORD'),
    });
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    if (!cached) return null;
    
    try {
      return JSON.parse(cached) as T;
    } catch {
      return cached as T;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 300) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.redis.setex(key, ttlSeconds, serialized);
  }

  /**
   * Delete cached value
   */
  async delete(key: string) {
    await this.redis.del(key);
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Cache user profile
   */
  async cacheUserProfile(userId: string, profile: any) {
    await this.set(`user:profile:${userId}`, profile, 600); // 10 minutes
  }

  /**
   * Get cached user profile
   */
  async getUserProfile(userId: string) {
    return this.get(`user:profile:${userId}`);
  }

  /**
   * Cache challenge
   */
  async cacheChallenge(challengeId: string, challenge: any) {
    await this.set(`challenge:${challengeId}`, challenge, 3600); // 1 hour
  }

  /**
   * Get cached challenge
   */
  async getChallenge(challengeId: string) {
    return this.get(`challenge:${challengeId}`);
  }

  /**
   * Invalidate user cache
   */
  async invalidateUserCache(userId: string) {
    await this.deletePattern(`user:*:${userId}`);
  }

  /**
   * Invalidate challenge cache
   */
  async invalidateChallengeCache(challengeId: string) {
    await this.delete(`challenge:${challengeId}`);
  }
}
```

#### 4.2 Cache Module

**File:** `backend/src/cache/cache.module.ts`

```typescript
import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';

@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
```

---

## 📦 Component 5: WebSocket Real-time Updates

### Purpose
Provide real-time feedback to users about their submission status.

### Implementation

#### 5.1 Submissions Gateway

**File:** `backend/src/submissions/submissions.gateway.ts`

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/submissions',
})
export class SubmissionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SubmissionsGateway.name);
  private userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || 
                    client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const userId = payload.sub;
      
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Join user-specific room
      client.join(`user:${userId}`);

      this.logger.log(`User ${userId} connected (socket: ${client.id})`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
        this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
        break;
      }
    }
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Send message to all connected clients
   */
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  @SubscribeMessage('subscribe_submission')
  handleSubscribeSubmission(client: Socket, data: { submissionId: string }) {
    client.join(`submission:${data.submissionId}`);
    this.logger.log(`Socket ${client.id} subscribed to submission ${data.submissionId}`);
  }

  @SubscribeMessage('unsubscribe_submission')
  handleUnsubscribeSubmission(client: Socket, data: { submissionId: string }) {
    client.leave(`submission:${data.submissionId}`);
  }
}
```

---

## 🔄 Complete Flow Example

### User Submits Code in a Duel

```
1. Frontend → Backend API (HTTP POST /submissions)
   Body: { code: "print('hello')", language: "python", challengeId: "ch_123" }

2. Backend API:
   - Validates JWT token
   - Creates submission in MongoDB (status: "queued")
   - Adds job to Redis queue: code-execution
   - Returns: { submissionId: "sub_456", jobId: "job_789", status: "queued" }

3. Backend API → Frontend (WebSocket)
   Event: "submission_queued"
   Data: { submissionId: "sub_456", status: "queued" }

4. Judge Worker (pulls from Redis queue):
   - Receives job: { submissionId: "sub_456", code: "...", tests: [...] }
   - Sends WebSocket: "submission_executing"
   - Creates Docker container
   - Runs tests
   - Sends WebSocket: "submission_progress" (25%, 50%, 75%, 100%)
   - Destroys container
   - Updates MongoDB: { status: "completed", verdict: "AC", score: 100 }
   - Updates Redis leaderboard: ZADD leaderboard:elo 1850 user_123
   - Sends WebSocket: "submission_completed"

5. Frontend receives WebSocket events:
   - "submission_queued" → Show "In queue..."
   - "submission_executing" → Show "Running tests..."
   - "submission_progress" → Update progress bar
   - "submission_completed" → Show results
```

---

## 📁 File Structure

### Backend Changes

```
backend/src/
├── queue/
│   ├── queue.module.ts          (NEW)
│   ├── queue.service.ts         (NEW)
│   └── queue.processor.ts       (NEW - for leaderboard updates)
├── cache/
│   ├── cache.module.ts          (NEW)
│   └── cache.service.ts         (NEW)
├── submissions/
│   ├── submissions.module.ts    (MODIFY - add QueueModule)
│   ├── submissions.service.ts   (MODIFY - use queue instead of sync)
│   └── submissions.gateway.ts   (NEW - WebSocket for real-time updates)
├── leaderboard/
│   ├── leaderboard.module.ts    (MODIFY - add RedisLeaderboardService)
│   ├── leaderboard.service.ts   (KEEP - for complex queries)
│   └── redis-leaderboard.service.ts (NEW - fast Redis-based)
└── app.module.ts                (MODIFY - add CacheModule, QueueModule)
```

### New Judge Worker Service

```
judge-worker/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── judge/
│   │   ├── judge.module.ts
│   │   ├── judge.processor.ts
│   │   └── judge.service.ts
│   ├── sandbox/
│   │   ├── sandbox.module.ts
│   │   └── sandbox.service.ts
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   └── notifications.service.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   └── config/
│       └── redis.config.ts
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## 🚀 Implementation Steps

### Phase 1: Redis Infrastructure (Backend)
1. Create `queue/` module with BullMQ setup
2. Create `cache/` module with Redis cache service
3. Create `redis-leaderboard.service.ts` for fast leaderboard
4. Initialize Redis leaderboard from MongoDB on startup

### Phase 2: Judge Worker Service
1. Create new NestJS project: `judge-worker/`
2. Copy sandbox service from backend
3. Implement BullMQ processor for code execution
4. Implement WebSocket notifications
5. Add Prisma for database updates

### Phase 3: Backend Modifications
1. Modify `submissions.service.ts` to use queue
2. Create `submissions.gateway.ts` for WebSocket
3. Update `leaderboard.controller.ts` with fast endpoints
4. Add cache invalidation hooks

### Phase 4: Integration & Testing
1. Test queue-based submission flow
2. Test real-time WebSocket updates
3. Test leaderboard performance
4. Load testing with multiple concurrent submissions

---

## 📊 Performance Comparison

| Operation | Current (MongoDB) | Target (Redis) | Improvement |
|-----------|------------------|----------------|-------------|
| Get top 50 players | ~50-100ms | ~1-2ms | 50x faster |
| Get user rank | ~100-200ms | ~1-2ms | 100x faster |
| Update leaderboard | ~50ms | ~1ms | 50x faster |
| Code execution | Blocks request | Async (non-blocking) | ∞ |
| Concurrent submissions | Limited by server | Scales with workers | Scalable |

---

## 🔧 Environment Variables

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Judge Worker
JUDGE_WORKER_CONCURRENCY=5
JUDGE_WORKER_TIMEOUT_MS=30000

# Sandbox
SANDBOX_TIMEOUT_MS=10000
SANDBOX_MEMORY_LIMIT=128m
SANDBOX_CPU_LIMIT=0.5
```

---

## ✅ Success Criteria

1. ✅ Backend API responds immediately to code submissions (< 100ms)
2. ✅ Code execution happens asynchronously in Judge Worker
3. ✅ Real-time WebSocket updates show submission progress
4. ✅ Leaderboard queries complete in < 5ms
5. ✅ System handles 100+ concurrent submissions
6. ✅ Failed jobs are retried automatically (3 attempts)
7. ✅ Cache reduces MongoDB queries by 80%

---

## 🎯 Next Steps

1. Review and approve this plan
2. Switch to Code mode to implement Phase 1
3. Test Redis infrastructure
4. Implement Judge Worker
5. Integrate and test end-to-end
