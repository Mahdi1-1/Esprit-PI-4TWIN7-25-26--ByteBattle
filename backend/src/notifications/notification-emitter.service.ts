import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsGateway } from "./notifications.gateway";
import { NotificationPreferenceService } from "./notification-preference.service";

export interface EmitNotificationDto {
  userId: string;
  type: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  actionUrl?: string;
  entityId?: string;
  entityType?: string;
  senderId?: string;
  senderName?: string;
  senderPhoto?: string;
}

@Injectable()
export class NotificationEmitterService {
  private readonly logger = new Logger(NotificationEmitterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
    private readonly preferenceService: NotificationPreferenceService,
  ) {}

  async emit(dto: EmitNotificationDto): Promise<void> {
    try {
      // (1) Self-notification guard
      if (dto.senderId && dto.senderId === dto.userId) {
        return;
      }

      // (2) Preference check — skip unless critical
      if (dto.priority !== "critical") {
        const pref = await this.preferenceService.getOrDefault(dto.userId);
        const categoryEnabled = pref[
          dto.category as keyof typeof pref
        ] as boolean;
        if (categoryEnabled === false) {
          return;
        }
      }

      // (3) Deduplication — same (userId, type, entityId) within 5s
      if (dto.entityId) {
        const recent = await this.prisma.notification.findFirst({
          where: {
            recipientId: dto.userId,
            type: dto.type,
            entityId: dto.entityId,
            createdAt: { gte: new Date(Date.now() - 5000) },
          },
        });
        if (recent) {
          return;
        }
      }

      // (4) Persist notification
      const notification = await this.prisma.notification.create({
        data: {
          recipientId: dto.userId,
          type: dto.type,
          category: dto.category,
          priority: dto.priority,
          title: dto.title,
          message: dto.message,
          actionUrl: dto.actionUrl ?? null,
          entityId: dto.entityId ?? null,
          entityType: dto.entityType ?? null,
          senderId: dto.senderId ?? null,
          senderName: dto.senderName ?? null,
          senderPhoto: dto.senderPhoto ?? null,
        },
      });

      // (5) Quiet hours check — suppress push only (not persistence)
      const shouldPush = await this.shouldPush(dto.userId, dto.priority);
      if (!shouldPush) {
        return;
      }

      // (6) Push via WebSocket
      this.gateway.emitToUser(dto.userId, "notification:new", {
        id: notification.id,
        type: notification.type,
        category: notification.category,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        entityId: notification.entityId,
        entityType: notification.entityType,
        senderId: notification.senderId,
        senderName: notification.senderName,
        senderPhoto: notification.senderPhoto,
        isRead: notification.isRead,
        isArchived: notification.isArchived,
        createdAt: notification.createdAt,
      });
    } catch (err) {
      this.logger.error(
        `Failed to emit notification to user ${dto.userId}: ${err.message}`,
      );
    }
  }

  async emitBroadcast(dto: Omit<EmitNotificationDto, "userId">): Promise<void> {
    try {
      const users = await this.prisma.user.findMany({
        where: { status: "active" },
        select: { id: true },
      });

      if (users.length === 0) return;

      const notificationsData = users.map((u) => ({
        recipientId: u.id,
        type: dto.type,
        category: dto.category,
        priority: dto.priority,
        title: dto.title,
        message: dto.message,
        actionUrl: dto.actionUrl ?? null,
        entityId: dto.entityId ?? null,
        entityType: dto.entityType ?? null,
        senderId: dto.senderId ?? null,
        senderName: dto.senderName ?? null,
        senderPhoto: dto.senderPhoto ?? null,
      }));

      await this.prisma.notification.createMany({ data: notificationsData });

      // Broadcast to all connected sockets
      this.gateway.emitBroadcast("notification:new", {
        type: dto.type,
        category: dto.category,
        priority: dto.priority,
        title: dto.title,
        message: dto.message,
        actionUrl: dto.actionUrl,
        isRead: false,
        isArchived: false,
        createdAt: new Date(),
      });

      this.logger.log(
        `Broadcast notification "${dto.type}" sent to ${users.length} users`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to emit broadcast notification: ${err.message}`,
      );
    }
  }

  // (5) Check if push should fire — respects quiet hours
  private async shouldPush(userId: string, priority: string): Promise<boolean> {
    if (priority === "critical") return true;
    const pref = await this.preferenceService.getOrDefault(userId);
    if (!pref.inApp) return false;
    if (pref.quietStart && pref.quietEnd) {
      return !this.isQuietHours(pref.quietStart, pref.quietEnd);
    }
    return true;
  }

  // Compare current server time against HH:mm range (handles overnight 22:00–08:00)
  private isQuietHours(quietStart: string, quietEnd: string): boolean {
    const now = new Date();
    const [sh, sm] = quietStart.split(":").map(Number);
    const [eh, em] = quietEnd.split(":").map(Number);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    if (startMinutes <= endMinutes) {
      // Same-day range (e.g. 09:00–17:00)
      return nowMinutes >= startMinutes && nowMinutes < endMinutes;
    } else {
      // Overnight range (e.g. 22:00–08:00)
      return nowMinutes >= startMinutes || nowMinutes < endMinutes;
    }
  }
}
