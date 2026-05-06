import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { HackathonsService } from "./hackathons.service";
import { HackathonScoreboardService } from "./hackathon-scoreboard.service";
import { HackathonsGateway } from "./hackathons.gateway";

/**
 * T019d — Scheduler for automatic hackathon lifecycle transitions.
 *
 * Checks every 30 seconds for hackathons that need automatic transitions:
 *   - lobby → checkin  (30 min before startTime)
 *   - checkin → active  (at startTime)
 *   - active → frozen   (at freezeAt)
 *   - frozen → ended    (at endTime)
 *
 * Uses a simple setInterval approach (no @nestjs/schedule dependency).
 */
@Injectable()
export class HackathonSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(HackathonSchedulerService.name);
  private intervalRef: NodeJS.Timeout | null = null;

  constructor(
    private prisma: PrismaService,
    private hackathonsService: HackathonsService,
    private scoreboardService: HackathonScoreboardService,
    private gateway: HackathonsGateway,
  ) {}

  onModuleInit() {
    this.intervalRef = setInterval(() => this.tick(), 30_000);
    this.logger.log("Hackathon scheduler started (30s interval)");
  }

  onModuleDestroy() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
    this.logger.log("Hackathon scheduler stopped");
  }

  private async tick() {
    try {
      const now = new Date();
      const thirtyMinFromNow = new Date(now.getTime() + 30 * 60_000);

      // 1. lobby → checkin (30 min before startTime)
      const lobbyToCheckin = await this.prisma.hackathon.findMany({
        where: {
          status: "lobby",
          startTime: { lte: thirtyMinFromNow },
        },
        select: { id: true },
      });
      for (const h of lobbyToCheckin) {
        try {
          await this.hackathonsService.transitionStatus(
            h.id,
            "checkin",
            "system",
          );
          this.gateway.emitStatusChange(h.id, "checkin", "lobby");
          this.logger.log(`Auto-transitioned hackathon ${h.id} to checkin`);
        } catch (err) {
          this.logger.warn(
            `Failed auto-transition ${h.id} lobby→checkin: ${err.message}`,
          );
        }
      }

      // 2. checkin → active (at startTime)
      const checkinToActive = await this.prisma.hackathon.findMany({
        where: {
          status: "checkin",
          startTime: { lte: now },
        },
        select: { id: true },
      });
      for (const h of checkinToActive) {
        try {
          await this.hackathonsService.transitionStatus(
            h.id,
            "active",
            "system",
          );
          // 🚀 Notify all connected clients to open the workspace
          this.gateway.emitStatusChange(h.id, "active", "checkin");
          this.logger.log(
            `Auto-transitioned hackathon ${h.id} to active — workspace open broadcast sent`,
          );
        } catch (err) {
          this.logger.warn(
            `Failed auto-transition ${h.id} checkin→active: ${err.message}`,
          );
        }
      }

      // 3. active → frozen (at freezeAt)
      const activeToFrozen = await this.prisma.hackathon.findMany({
        where: {
          status: "active",
          freezeAt: { lte: now, not: null },
        },
      });
      for (const h of activeToFrozen) {
        try {
          await this.hackathonsService.transitionStatus(
            h.id,
            "frozen",
            "system",
          );
          await this.scoreboardService.freezeScoreboard(h.id);
          this.gateway.emitStatusChange(h.id, "frozen", "active");
          this.logger.log(
            `Auto-transitioned hackathon ${h.id} to frozen + cached scoreboard`,
          );
        } catch (err) {
          this.logger.warn(
            `Failed auto-transition ${h.id} active→frozen: ${err.message}`,
          );
        }
      }

      // 4. frozen → ended (at endTime)
      const frozenToEnded = await this.prisma.hackathon.findMany({
        where: {
          status: "frozen",
          endTime: { lte: now },
        },
        select: { id: true },
      });
      for (const h of frozenToEnded) {
        try {
          await this.hackathonsService.transitionStatus(
            h.id,
            "ended",
            "system",
          );
          this.gateway.emitStatusChange(h.id, "ended", "frozen");
          this.logger.log(`Auto-transitioned hackathon ${h.id} to ended`);
        } catch (err) {
          this.logger.warn(
            `Failed auto-transition ${h.id} frozen→ended: ${err.message}`,
          );
        }
      }

      // 5. active → ended (at endTime, if no freezeAt was set)
      const activeToEnded = await this.prisma.hackathon.findMany({
        where: {
          status: "active",
          endTime: { lte: now },
          freezeAt: null,
        },
        select: { id: true },
      });
      for (const h of activeToEnded) {
        try {
          await this.hackathonsService.transitionStatus(
            h.id,
            "ended",
            "system",
          );
          this.gateway.emitStatusChange(h.id, "ended", "active");
          this.logger.log(
            `Auto-transitioned hackathon ${h.id} to ended (no freeze)`,
          );
        } catch (err) {
          this.logger.warn(
            `Failed auto-transition ${h.id} active→ended: ${err.message}`,
          );
        }
      }
    } catch (err) {
      this.logger.error("Scheduler tick failed", err);
    }
  }
}
