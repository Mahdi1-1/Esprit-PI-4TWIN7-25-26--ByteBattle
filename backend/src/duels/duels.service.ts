import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';
import { DUEL_SCORING } from './duels.constants';
import { computeDuelStats, computeDuelStatsBatch } from './duel-stats.util';
import { NotificationEmitterService } from '../notifications/notification-emitter.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationCategory, NotificationPriority, NotificationType } from '../notifications/notification.constants';
import { BadgeEngineService } from '../badges/badge-engine.service';

export interface DuelPlayerState {
  id: string;
  username: string;
  ready: boolean;
  code?: string;
  language?: string;
  testsPassed: number;
  testsTotal: number;
  score: number;
  finishedAt?: number;
  complexityScore?: number; // 0-100 score from AI or BigO mock
  executionTimeMs?: number;
  submissionsCount?: number;
  focusLostCount?: number;
}

export interface DuelState {
  id: string;
  player1: DuelPlayerState;
  player2: DuelPlayerState; // Simplified from null to avoid TS checks everywhere
  challenge: {
    id: string;
    title: string;
    descriptionMd: string;
    difficulty: string;
    tests: any[];
    hints?: string[];
    allowedLanguages?: string[];
  };
  status: 'waiting' | 'ready' | 'active' | 'completed' | 'abandoned';
  winnerId?: string | null;
  timeLimit: number;
  startedAt?: number;
  events: any[];
}

@Injectable()
export class DuelsService {
  private readonly logger = new Logger(DuelsService.name);
  private redis?: Redis;
  private readonly redisEnabled: boolean;

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    private configService: ConfigService,
    private aiService: AiService,
    private notificationEmitter: NotificationEmitterService,
    private notificationsGateway: NotificationsGateway,
    private badgeEngine: BadgeEngineService,
  ) {
    this.redisEnabled = this.configService.get<string>('REDIS_ENABLED', 'true') !== 'false';
    if (this.redisEnabled) {
      this.redis = new Redis({
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD'),
      });
    } else {
      this.logger.warn('Redis is disabled. Duel live state is unavailable.');
    }
  }

  /**
   * 🎯 Matchmaking robuste: 1 duel démarre uniquement avec 2 joueurs en recherche.
   * Évite le cas où 2 requêtes simultanées créent 2 duels distincts en attente.
   */
  async createOrJoinDuel(userId: string, difficulty: string = 'easy') {
    const myWaitingDuel = await this.findMyWaitingDuel(userId);
    if (myWaitingDuel) return myWaitingDuel;

    const availableDuel = await this.findAvailableDuel(difficulty, userId);
    if (availableDuel) {
      return this.joinDuel(availableDuel.id, userId);
    }

    const createdDuel = await this.createDuel(userId, difficulty);

    // Si une autre file d'attente plus ancienne existe, on la rejoint et on nettoie celle qu'on vient de créer.
    const olderWaitingDuel = await this.prisma.duel.findFirst({
      where: {
        status: 'waiting',
        difficulty: difficulty as any,
        player1Id: { not: userId },
        createdAt: { lt: createdDuel.createdAt },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!olderWaitingDuel) {
      return createdDuel;
    }

    try {
      const joinedDuel = await this.joinDuel(olderWaitingDuel.id, userId);
      await this.cleanupOwnedWaitingDuel(createdDuel.id, userId);
      return joinedDuel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Race during matchmaking for user ${userId}: failed to join older duel ${olderWaitingDuel.id} (${errorMessage})`,
      );
      return createdDuel;
    }
  }

  private async cleanupOwnedWaitingDuel(duelId: string, userId: string) {
    const duel = await this.prisma.duel.findUnique({
      where: { id: duelId },
      select: { id: true, status: true, player1Id: true },
    });

    if (!duel || duel.player1Id !== userId || duel.status !== 'waiting') {
      return;
    }

    await this.prisma.duel.delete({ where: { id: duelId } });

    if (this.redisEnabled && this.redis) {
      await this.redis.del(`duel:${duelId}`);
    }
  }

  /**
   * 🎮 Créer un nouveau duel
   */
  async createDuel(player1Id: string, difficulty: string) {
    this.logger.log(`🎮 Creating duel for player ${player1Id}, difficulty: ${difficulty}`);

    // Sélectionner le dernier challenge (le plus récent)
    let challenge = await this.prisma.challenge.findFirst({
      where: {
        difficulty: difficulty as any,
        kind: 'CODE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      // Fallback: prendre le dernier challenge de code
      challenge = await this.prisma.challenge.findFirst({
        where: { kind: 'CODE' },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!challenge) {
      // Fallback extreme
      challenge = await this.prisma.challenge.findFirst({
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!challenge) {
      throw new NotFoundException('No challenges available in the database to create a duel');
    }

    // Normaliser la limite de temps en secondes.
    // Convention legacy: certaines valeurs seedées sont en minutes (ex: 10, 45, 60).
    // Si <= 300, on considère que c'est en minutes.
    const rawDuelTimeLimit = Number(challenge.duelTimeLimit ?? 1800);
    const duelTimeLimitSeconds = Number.isFinite(rawDuelTimeLimit) && rawDuelTimeLimit > 0
      ? (rawDuelTimeLimit <= 300 ? rawDuelTimeLimit * 60 : rawDuelTimeLimit)
      : 1800;

    // Créer le duel dans la DB
    const duel = await this.prisma.duel.create({
      data: {
        player1: { connect: { id: player1Id } },
        player2: { connect: { id: player1Id } }, // Temporaire jusqu'à ce qu'un adversaire rejoigne
        challenge: { connect: { id: challenge.id } },
        status: 'waiting',
        difficulty: difficulty as any,
        timeLimit: duelTimeLimitSeconds,
        events: [
          {
            type: 'create',
            playerId: player1Id,
            timestamp: new Date(),
            data: { difficulty },
          },
        ],
      },
      include: {
        player1: { select: { id: true, username: true, elo: true } },
        challenge: true,
      },
    });

    // Initialiser l'état dans Redis
    const state: DuelState = {
      id: duel.id,
      player1: {
        id: duel.player1.id,
        username: duel.player1.username,
        ready: false,
        testsPassed: 0,
        testsTotal: challenge.tests.length,
        score: 0,
      },
      player2: {
        id: '',
        username: '',
        ready: false,
        testsPassed: 0,
        testsTotal: challenge.tests.length,
        score: 0,
      },
      challenge: {
        id: challenge.id,
        title: challenge.title,
        descriptionMd: challenge.descriptionMd,
        difficulty: challenge.difficulty,
        tests: challenge.tests,
        hints: challenge.hints || [],
        allowedLanguages: challenge.allowedLanguages || [],
      },
      status: 'waiting',
      timeLimit: duel.timeLimit,
      events: [],
    };

    await this.setDuelState(duel.id, state);

    this.logger.log(`✅ Duel created: ${duel.id}`);
    return duel;
  }

  /**
   * 🔍 Rejoindre un duel en attente
   */
  async joinDuel(duelId: string, player2Id: string) {
    const duel = await this.prisma.duel.findUnique({
      where: { id: duelId },
      include: {
        player1: { select: { id: true, username: true } },
        challenge: true,
      },
    });

    if (!duel) {
      throw new NotFoundException('Duel not found');
    }

    if (duel.status !== 'waiting') {
      throw new BadRequestException('Duel is not available');
    }

    if (duel.player1Id === player2Id) {
      throw new BadRequestException('Cannot duel yourself');
    }

    const player2 = await this.prisma.user.findUnique({
      where: { id: player2Id },
      select: { id: true, username: true, elo: true },
    });

    // Mettre à jour le duel
    const updatedDuel = await this.prisma.duel.update({
      where: { id: duelId },
      data: {
        player2: { connect: { id: player2Id } },
        status: 'ready',
        events: {
          push: {
            type: 'join',
            playerId: player2Id,
            timestamp: new Date(),
          },
        },
      },
      include: {
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
        challenge: true,
      },
    });

    // Mettre à jour l'état Redis
    const state = await this.getDuelState(duelId);
    state.player2 = {
      id: player2!.id,
      username: player2!.username,
      ready: false,
      testsPassed: 0,
      testsTotal: state.challenge.tests.length,
      score: 0,
    };
    state.status = 'ready';

    await this.setDuelState(duelId, state);

    // Notify both players they've been matched
    await Promise.all([
      this.notificationEmitter.emit({
        userId: duel.player1Id,
        type: NotificationType.DUEL_MATCHED,
        category: NotificationCategory.DUEL,
        priority: NotificationPriority.HIGH,
        title: '⚔️ Duel opponent found!',
        message: `${player2!.username} has joined your duel. Get ready!`,
        actionUrl: `/duels/${duelId}`,
        entityId: duelId,
        entityType: 'Duel',
        senderId: player2Id,
        senderName: player2!.username,
      }),
      this.notificationEmitter.emit({
        userId: player2Id,
        type: NotificationType.DUEL_MATCHED,
        category: NotificationCategory.DUEL,
        priority: NotificationPriority.HIGH,
        title: '⚔️ Duel matched!',
        message: `You joined a duel against ${duel.player1.username}. Get ready!`,
        actionUrl: `/duels/${duelId}`,
        entityId: duelId,
        entityType: 'Duel',
        senderId: duel.player1Id,
        senderName: duel.player1.username,
      }),
    ]);

    this.logger.log(`✅ Player ${player2Id} joined duel ${duelId}`);
    return updatedDuel;
  }

  /**
   * ▶️ Marquer un joueur comme prêt
   */
  async setPlayerReady(duelId: string, playerId: string) {
    const state = await this.getDuelState(duelId);

    if (state.player1.id === playerId) {
      state.player1.ready = true;
    } else if (state.player2.id === playerId) {
      state.player2.ready = true;
    } else {
      throw new BadRequestException('Player not in this duel');
    }

    // Si les 2 joueurs sont prêts, démarrer le duel
    if (state.player1.ready && state.player2.ready) {
      state.status = 'active';
      state.startedAt = Date.now();

      await this.prisma.duel.update({
        where: { id: duelId },
        data: {
          status: 'active',
          startedAt: new Date(),
          events: {
            push: {
              type: 'start',
              playerId,
              timestamp: new Date(),
            },
          },
        },
      });

      this.logger.log(`🏁 Duel ${duelId} started!`);
    }

    await this.setDuelState(duelId, state);
    return state;
  }

  /**
   * 🧪 Tester le code d'un joueur
   */
  async testCode(duelId: string, playerId: string, code: string, language: string, hintsUsed: number = 0) {
    const state = await this.getDuelState(duelId);

    if (state.status !== 'active') {
      throw new BadRequestException('Duel is not active');
    }

    const player = state.player1.id === playerId ? state.player1 : state.player2;
    
    // Incrémenter le nombre de soumissions
    player.submissionsCount = (player.submissionsCount || 0) + 1;

    // Exécuter les tests via the queue worker synchronously
    const evaluation = await this.queueService.addEvaluateCodeJob({
      language,
      code,
      tests: state.challenge.tests,
    });

    player.code = code;
    player.language = language;
    player.testsPassed = evaluation.passed;
    
    if (evaluation.verdict === 'AC') {
      let finalScore = 100;
      
      // Pénalité par soumission supplémentaire (5 pts par échec précédent)
      const subsPenalty = Math.max(0, (player.submissionsCount - 1) * 5);
      
      // Pénalité pour hints (10 pts/hint)
      const hintsPenalty = hintsUsed * 10;
      
      // Pénalité anticheat
      const focusPenalty = (player.focusLostCount || 0) * 10;
      
      // Pénalité de temps d'implémentation
      let timePenalty = 0;
      if (state.timeLimit && state.startedAt) {
        const timeElapsed = (Date.now() - state.startedAt) / 1000;
        const timeRatio = Math.min(1, Math.max(0, timeElapsed / state.timeLimit));
        // Jusqu'à 15 points de perdus si on prend tout le temps limite
        timePenalty = Math.floor(timeRatio * 15);
      }
      
      finalScore -= (subsPenalty + hintsPenalty + timePenalty + focusPenalty);
      
      // Assurer un minimum de points pour la victoire technique
      player.score = Math.max(20, finalScore);
    } else {
      // Score partiel très limité si on ne valide pas tous les tests (max 40)
      const partialRatio = (evaluation.passed / evaluation.total);
      player.score = Math.round(partialRatio * 40);
    }

    // Si le joueur a réussi tous les tests
    if (evaluation.verdict === 'AC' && !player.finishedAt) {
      player.finishedAt = Date.now();
      player.executionTimeMs = evaluation.totalTimeMs;

      try {
        const review = await this.aiService.reviewCode({
          code: code,
          language: language,
          challengeTitle: state.challenge.title,
          challengeDescription: 'Duel Challenge'
        });
        player.complexityScore = review.score;
        this.logger.log(`🤖 AI Review for Player ${playerId}: Score ${review.score}`);
      } catch (err) {
        this.logger.error(`AI Review failed during duel: ${err}`);
        player.complexityScore = 100; // default score if AI fails
      }

      // Vérifier si c'est le premier à finir
      const opponent = state.player1.id === playerId ? state.player2 : state.player1;
      if (!opponent.finishedAt) {
        this.logger.log(`🏆 Player ${playerId} finished first!`);
      }
    }

    state.events.push({
      type: 'test',
      playerId,
      timestamp: Date.now(),
      data: {
        passed: evaluation.passed,
        total: evaluation.total,
        verdict: evaluation.verdict,
      },
    });

    await this.setDuelState(duelId, state);

    // Vérifier si le duel est terminé
    if (state.player1.finishedAt && state.player2.finishedAt) {
      await this.endDuel(duelId);
    }

    return {
      verdict: evaluation.verdict,
      testsPassed: evaluation.passed,
      testsTotal: evaluation.total,
      results: evaluation.results,
      timeMs: evaluation.totalTimeMs,
      memMb: evaluation.maxMemMb,
      stdout: evaluation.stdout,
      stderr: evaluation.stderr,
    };
  }

  /**
   * 📉 Obtenir une pénalité lorsqu'on quitte la page (anticheat)
   */
  async applyFocusLost(duelId: string, playerId: string) {
    const state = await this.getDuelState(duelId);
    if (state.status !== 'active') return state;

    const player = state.player1.id === playerId ? state.player1 : state.player2;
    player.focusLostCount = (player.focusLostCount || 0) + 1;

    // Si le joueur a déjà un score positif, on lui enlève 10 points directement pour pénaliser immédiatement
    if (player.score > 10) {
      player.score -= 10;
    }

    await this.setDuelState(duelId, state);
    return state;
  }

  /**
   * 🏁 Terminer le duel
   */
  async endDuel(duelId: string) {
    const state = await this.getDuelState(duelId);

    if (state.status === 'completed') {
      return;
    }

    // Déterminer le gagnant
    let winnerId: string | null = null;

    const p1Time = state.player1.finishedAt || Infinity;
    const p2Time = state.player2.finishedAt || Infinity;

    if (state.player1.score === 100 && state.player2.score === 100) {
      // Les deux ont fini, comparer temps + complexité
      const p1DurationSec = (p1Time - (state.startedAt || 0)) / 1000;
      const p2DurationSec = (p2Time - (state.startedAt || 0)) / 1000;

      const p1Complexity = state.player1.complexityScore || 50;
      const p2Complexity = state.player2.complexityScore || 50;

      const p1Exec = state.player1.executionTimeMs || 100;
      const p2Exec = state.player2.executionTimeMs || 100;

      // Un équilibre où le temps réel est prédominant (10 points par seconde sauvée sur le temps limite)
      const baseTimeLimitSec = state.timeLimit || 900;
      const p1SpeedScore = Math.max(0, baseTimeLimitSec - p1DurationSec) * 10;
      const p2SpeedScore = Math.max(0, baseTimeLimitSec - p2DurationSec) * 10;

      // La complexité de l'IA donne jusqu'à 1000 points supplémentaires
      const p1ComplexityScore = p1Complexity * 10;
      const p2ComplexityScore = p2Complexity * 10;

      // Execution Time pénalise légèrement pour les millisecondes dépensées (jusqu'à -500 pts)
      const p1ExecPenalty = Math.min(500, p1Exec);
      const p2ExecPenalty = Math.min(500, p2Exec);

      const p1Performance = p1SpeedScore + p1ComplexityScore - p1ExecPenalty;
      const p2Performance = p2SpeedScore + p2ComplexityScore - p2ExecPenalty;

      this.logger.log(`📊 P1 Perf: ${p1Performance} (Speed: ${p1SpeedScore}, AI: ${p1ComplexityScore}, Exec: -${p1ExecPenalty}) | P2 Perf: ${p2Performance} (Speed: ${p2SpeedScore}, AI: ${p2ComplexityScore}, Exec: -${p2ExecPenalty})`);

      if (p1Performance > p2Performance) {
        winnerId = state.player1.id;
      } else if (p2Performance > p1Performance) {
        winnerId = state.player2.id;
      } else {
        winnerId = state.player1.id; // Draw fallback
      }
    } else if (state.player1.score > state.player2.score) {
      winnerId = state.player1.id;
    } else if (state.player2.score > state.player1.score) {
      winnerId = state.player2.id;
    } else if (p1Time < p2Time) {
      // Même score (partiel), le plus rapide gagne
      winnerId = state.player1.id;
    } else if (p2Time < p1Time) {
      winnerId = state.player2.id;
    }

    // Mettre à jour la DB
    const duelUpdate = this.prisma.duel.update({
      where: { id: duelId },
      data: {
        status: 'completed',
        winnerId,
        endedAt: new Date(),
        player1Score: state.player1.score,
        player2Score: state.player2.score,
        player1Time: state.player1.finishedAt && state.startedAt ? state.player1.finishedAt - state.startedAt : null,
        player2Time: state.player2.finishedAt && state.startedAt ? state.player2.finishedAt - state.startedAt : null,
        player1Tests: state.player1.testsPassed,
        player2Tests: state.player2.testsPassed,
        player1Language: state.player1.language || null,
        player2Language: state.player2.language || null,
        // Persist final code so it survives Redis TTL expiry
        player1Code: state.player1.code || null,
        player2Code: state.player2.code || null,
      },
    });

    // Mettre à jour les stats des joueurs
    let p1StatUpdate;
    let p2StatUpdate;

    if (winnerId === state.player1.id) {
      p1StatUpdate = this.updatePlayerStats(state.player1.id, true);
      p2StatUpdate = this.updatePlayerStats(state.player2.id, false);
    } else if (winnerId === state.player2.id) {
      p2StatUpdate = this.updatePlayerStats(state.player2.id, true);
      p1StatUpdate = this.updatePlayerStats(state.player1.id, false);
    } else {
      // Match nul
      p1StatUpdate = this.updatePlayerStats(state.player1.id, null);
      p2StatUpdate = this.updatePlayerStats(state.player2.id, null);
    }

    const [, p1Stats, p2Stats] = await this.prisma.$transaction([
      duelUpdate,
      p1StatUpdate,
      p2StatUpdate,
    ]);

    try {
      if (!this.redisEnabled || !this.redis) {
        throw new Error('Redis disabled');
      }
      const pipeline = this.redis.pipeline();
      if (p1Stats && (p1Stats as any).elo !== undefined) pipeline.zadd('leaderboard:elo', (p1Stats as any).elo, state.player1.id);
      if (p2Stats && (p2Stats as any).elo !== undefined) pipeline.zadd('leaderboard:elo', (p2Stats as any).elo, state.player2.id);
      // Invalidate user stats cache so next request gets fresh dynamic duel stats
      pipeline.del(`user:stats:${state.player1.id}`);
      pipeline.del(`user:stats:${state.player2.id}`);
      await pipeline.exec();
    } catch (err) {
      this.logger.error('Failed to sync duel ELO changes to Redis leaderboard', err);
    }

    state.status = 'completed';
    state.winnerId = winnerId;
    await this.setDuelState(duelId, state);

    // Notify both players of the result
    const p1Won = winnerId === state.player1.id;
    const p2Won = winnerId === state.player2.id;
    const isDraw = !winnerId;
    const p1Elo = (p1Stats as any)?.elo ?? 0;
    const p2Elo = (p2Stats as any)?.elo ?? 0;

    await Promise.all([
      this.notificationEmitter.emit({
        userId: state.player1.id,
        type: NotificationType.DUEL_RESULT,
        category: NotificationCategory.DUEL,
        priority: NotificationPriority.HIGH,
        title: isDraw ? '🤝 Duel ended in a draw' : p1Won ? '🏆 You won the duel!' : '💔 You lost the duel',
        message: `vs ${state.player2.username} | ELO: ${p1Elo >= 1200 ? '+' : ''}${DUEL_SCORING.ELO_WIN_GAIN}`,
        actionUrl: `/duels/${duelId}/result`,
        entityId: duelId,
        entityType: 'Duel',
      }),
      this.notificationEmitter.emit({
        userId: state.player2.id,
        type: NotificationType.DUEL_RESULT,
        category: NotificationCategory.DUEL,
        priority: NotificationPriority.HIGH,
        title: isDraw ? '🤝 Duel ended in a draw' : p2Won ? '🏆 You won the duel!' : '💔 You lost the duel',
        message: `vs ${state.player1.username} | ELO: ${p2Elo >= 1200 ? '+' : ''}${DUEL_SCORING.ELO_WIN_GAIN}`,
        actionUrl: `/duels/${duelId}/result`,
        entityId: duelId,
        entityType: 'Duel',
      }),
    ]);

    // ELO milestone check (≥50 gain)
    const eloMilestoneCheck = async (userId: string, stats: any) => {
      if (!stats) return;
      const newElo: number = stats.elo ?? 0;
      const milestone = Math.floor(newElo / 100) * 100;
      if (newElo >= milestone && newElo - DUEL_SCORING.ELO_WIN_GAIN < milestone) {
        await this.notificationEmitter.emit({
          userId,
          type: NotificationType.DUEL_ELO_MILESTONE,
          category: NotificationCategory.DUEL,
          priority: NotificationPriority.HIGH,
          title: `🎯 ELO milestone reached: ${milestone}!`,
          message: `You've reached ${newElo} ELO. Keep climbing!`,
          actionUrl: '/leaderboard',
          entityId: userId,
          entityType: 'User',
        });
      }
    };
    await Promise.all([
      eloMilestoneCheck(state.player1.id, p1Stats),
      eloMilestoneCheck(state.player2.id, p2Stats),
    ]);

    // 🏅 Badge triggers — fire-and-forget
    const p1NewElo: number = (p1Stats as any)?.elo ?? 0;
    const p2NewElo: number = (p2Stats as any)?.elo ?? 0;
    this.badgeEngine.onDuelFinished(state.player1.id, p1Won, p1NewElo).catch(() => { });
    this.badgeEngine.onDuelFinished(state.player2.id, p2Won, p2NewElo).catch(() => { });
    // Level/XP badges after duel XP is awarded
    this.badgeEngine.checkUserLevelBadges(state.player1.id).catch(() => { });
    this.badgeEngine.checkUserLevelBadges(state.player2.id).catch(() => { });

    this.logger.log(`🏁 Duel ${duelId} ended. Winner: ${winnerId || 'draw'}`);

    return { winnerId, state };
  }

  /**
   * 📊 Mettre à jour les stats du joueur (ELO + XP uniquement, les compteurs duels sont calculés dynamiquement)
   */
  private updatePlayerStats(playerId: string, won: boolean | null) {
    const updates: any = {};

    if (won === true) {
      updates.elo = { increment: DUEL_SCORING.ELO_WIN_GAIN };
      updates.xp = { increment: DUEL_SCORING.XP_WIN };
    } else if (won === false) {
      updates.elo = { increment: DUEL_SCORING.ELO_LOSS_PENALTY };
      updates.xp = { increment: DUEL_SCORING.XP_LOSS };
    } else {
      // Match nul
      updates.xp = { increment: DUEL_SCORING.XP_DRAW };
    }

    return this.prisma.user.update({
      where: { id: playerId },
      data: updates,
    });
  }

  /**
   * 📜 Récupérer l'état du duel depuis Redis
   */
  async getDuelState(duelId: string): Promise<DuelState> {
    if (!this.redisEnabled || !this.redis) {
      throw new BadRequestException('Duels are temporarily unavailable while Redis is disabled');
    }
    const state = await this.redis.get(`duel:${duelId}`);
    if (!state) {
      throw new NotFoundException('Duel state not found');
    }
    return JSON.parse(state);
  }

  /**
   * 💾 Sauvegarder l'état du duel dans Redis
   */
  async setDuelState(duelId: string, state: DuelState) {
    if (!this.redisEnabled || !this.redis) {
      throw new BadRequestException('Duels are temporarily unavailable while Redis is disabled');
    }
    await this.redis.setex(`duel:${duelId}`, 7200, JSON.stringify(state)); // 2h TTL
  }

  /**
   * 🔍 Trouver un duel en attente (d'un autre joueur)
   */
  async findAvailableDuel(difficulty: string, excludeUserId: string) {
    return this.prisma.duel.findFirst({
      where: {
        status: 'waiting',
        difficulty: difficulty as any,
        player1Id: { not: excludeUserId },
      },
      include: {
        player1: { select: { id: true, username: true, elo: true } },
        challenge: { select: { id: true, title: true, difficulty: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * 🤔 Trouver MON propre duel en attente
   */
  async findMyWaitingDuel(userId: string) {
    return this.prisma.duel.findFirst({
      where: {
        status: 'waiting',
        player1Id: userId,
      },
      include: {
        player1: { select: { id: true, username: true, elo: true } },
        challenge: { select: { id: true, title: true, difficulty: true } },
      },
    });
  }

  /**
   * 📊 Obtenir le leaderboard des duels (stats calculées dynamiquement)
   */
  async getLeaderboard(limit = 10) {
    // Get users who participated in at least one completed duel
    const participantIds = await this.prisma.duel.findMany({
      where: { status: 'completed' },
      select: { player1Id: true, player2Id: true },
    });

    const uniqueIds = [...new Set(participantIds.flatMap(d => [d.player1Id, d.player2Id].filter(Boolean)))];
    if (uniqueIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        username: true,
        elo: true,
        level: true,
      },
      orderBy: { elo: 'desc' },
    });

    const statsMap = await computeDuelStatsBatch(this.prisma, users.map(u => u.id));

    return users
      .map(u => {
        const s = statsMap.get(u.id) || { duelsWon: 0, duelsLost: 0, duelsTotal: 0, winRate: 0 };
        return { ...u, ...s };
      })
      .filter(u => u.duelsTotal > 0)
      .slice(0, limit);
  }

  /**
   * 📜 Historique des duels d'un utilisateur
   */
  async getUserDuels(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [duels, total] = await Promise.all([
      this.prisma.duel.findMany({
        where: {
          OR: [
            { player1Id: userId },
            { player2Id: userId },
          ],
          status: 'completed',
        },
        include: {
          player1: { select: { id: true, username: true, profileImage: true } },
          player2: { select: { id: true, username: true, profileImage: true } },
          challenge: { select: { id: true, title: true, difficulty: true } },
          winner: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.duel.count({
        where: {
          OR: [
            { player1Id: userId },
            { player2Id: userId },
          ],
          status: 'completed',
        },
      }),
    ]);

    return { data: duels, total, page, limit };
  }

  /**
   * 📊 Queue stats: online players + waiting duels count
   */
  async getQueueStats() {
    const [waitingDuels, activeDuels] = await Promise.all([
      this.prisma.duel.count({
        where: { status: 'waiting' },
      }),
      this.prisma.duel.count({
        where: { status: { in: ['active', 'ready'] } },
      }),
    ]);

    // Real connected users from the notifications gateway
    const playersOnline = this.notificationsGateway.getOnlineUserCount();

    // Estimated wait time: less players online = longer wait
    const estimatedWaitSeconds = waitingDuels > 0
      ? Math.max(5, 30 - waitingDuels * 5)
      : playersOnline > 1
        ? 15
        : 30;

    return {
      waitingDuels,
      activeDuels,
      playersOnline,
      estimatedWaitSeconds,
    };
  }

  /**
   * 📊 Get duel stats for a specific user
   */
  async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, elo: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const stats = await computeDuelStats(this.prisma, userId);

    // Get recent form (last 5 duels)
    const recentDuels = await this.prisma.duel.findMany({
      where: {
        OR: [{ player1Id: userId }, { player2Id: userId }],
        status: 'completed',
      },
      select: { winnerId: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentForm = recentDuels.map(d =>
      d.winnerId === userId ? 'W' : d.winnerId ? 'L' : 'D',
    );

    // Current streak
    let streak = 0;
    let streakType: 'W' | 'L' | null = null;
    for (const result of recentForm) {
      if (result === 'D') break;
      if (!streakType) streakType = result as 'W' | 'L';
      if (result === streakType) streak++;
      else break;
    }

    return {
      ...user,
      ...stats,
      recentForm,
      streak,
      streakType,
    };
  }

  /**
   * 🏆 Get duel result with full details
   */
  async getDuelResult(duelId: string) {
    const duel = await this.prisma.duel.findUnique({
      where: { id: duelId },
      include: {
        player1: { select: { id: true, username: true, elo: true, profileImage: true } },
        player2: { select: { id: true, username: true, elo: true, profileImage: true } },
        challenge: { select: { id: true, title: true, difficulty: true } },
        winner: { select: { id: true, username: true } },
      },
    });

    if (!duel) throw new NotFoundException('Duel not found');

    return duel;
  }
}
