import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HackathonYjsService {
  private readonly logger = new Logger(HackathonYjsService.name);

  /** Debounce timers: key = `${hackathonId}:${teamId}:${challengeId}` */
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  /** Pending snapshots waiting to be persisted */
  private pendingSnapshots = new Map<string, Buffer>();

  constructor(private prisma: PrismaService) {}

  /**
   * Queue a Yjs document snapshot for debounced persistence.
   * On each call, resets a 5-second timer. When the timer fires,
   * the accumulated snapshot is persisted to MongoDB.
   */
  queueSnapshot(
    hackathonId: string,
    teamId: string,
    challengeId: string,
    snapshot: Buffer,
  ) {
    const key = `${hackathonId}:${teamId}:${challengeId}`;

    // Store latest snapshot
    this.pendingSnapshots.set(key, snapshot);

    // Reset debounce timer
    const existing = this.debounceTimers.get(key);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.persistSnapshot(hackathonId, teamId, challengeId);
      this.debounceTimers.delete(key);
    }, 5000);

    this.debounceTimers.set(key, timer);
  }

  /** Persist Yjs snapshot to MongoDB via upsert */
  async persistSnapshot(
    hackathonId: string,
    teamId: string,
    challengeId: string,
    explicitSnapshot?: Buffer,
  ) {
    const key = `${hackathonId}:${teamId}:${challengeId}`;
    const snapshot = explicitSnapshot || this.pendingSnapshots.get(key);
    if (!snapshot) return;

    // Convert Buffer to Uint8Array for Prisma Bytes compatibility
    const uint8Snapshot = new Uint8Array(snapshot) as Uint8Array<ArrayBuffer>;

    try {
      // Find existing doc to upsert
      const existing = await this.prisma.yjsDocumentSnapshot.findFirst({
        where: { hackathonId, teamId, challengeId },
      });

      if (existing) {
        await this.prisma.yjsDocumentSnapshot.update({
          where: { id: existing.id },
          data: { snapshot: uint8Snapshot, updatedAt: new Date() },
        });
      } else {
        await this.prisma.yjsDocumentSnapshot.create({
          data: { hackathonId, teamId, challengeId, snapshot: uint8Snapshot },
        });
      }

      this.pendingSnapshots.delete(key);
      this.logger.debug(`Persisted Yjs snapshot for ${key}`);
    } catch (err) {
      this.logger.error(`Failed to persist Yjs snapshot for ${key}`, err);
    }
  }

  /** Load the last saved Yjs snapshot (for reconnect / page reload) */
  async loadSnapshot(
    hackathonId: string,
    teamId: string,
    challengeId: string,
  ): Promise<Buffer | null> {
    const doc = await this.prisma.yjsDocumentSnapshot.findFirst({
      where: { hackathonId, teamId, challengeId },
    });
    return doc?.snapshot ? Buffer.from(doc.snapshot) : null;
  }

  /** Flush all pending snapshots (called on module destroy) */
  async flushAll() {
    for (const [key] of this.pendingSnapshots) {
      const [hackathonId, teamId, challengeId] = key.split(':');
      await this.persistSnapshot(hackathonId, teamId, challengeId);
    }
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }
}
