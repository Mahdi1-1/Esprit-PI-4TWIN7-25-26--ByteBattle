import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(data: { recipientId: string; actorId: string; type: string; targetId: string; targetType: string }) {
    if (data.recipientId === data.actorId) {
      return null;
    }

    const notification = await this.prisma.notification.create({
      data: {
        recipientId: data.recipientId,
        actorId: data.actorId,
        type: data.type,
        targetId: data.targetId,
        targetType: data.targetType,
      },
      include: {
        actor: {
          select: { username: true, profileImage: true }
        }
      }
    });

    await this.enforceMax100(data.recipientId);

    this.gateway.emitToUser(data.recipientId, 'new-notification', {
      id: notification.id,
      type: notification.type,
      actorUsername: notification.actor.username,
      actorProfileImage: notification.actor.profileImage,
      targetId: notification.targetId,
      targetType: notification.targetType,
      createdAt: notification.createdAt,
    });

    return notification;
  }

  async getAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      include: {
        actor: { select: { id: true, username: true, profileImage: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
    return { count };
  }

  async markRead(id: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif) {
      throw new NotFoundException('Notification not found');
    }
    if (notif.recipientId !== userId) {
      throw new ForbiddenException('Not your notification');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }

  async enforceMax100(userId: string) {
    const count = await this.prisma.notification.count({
      where: { recipientId: userId },
    });

    if (count > 100) {
      const toDelete = count - 100;
      const oldestNotifications = await this.prisma.notification.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'asc' },
        take: toDelete,
        select: { id: true }
      });

      const idsToDelete = oldestNotifications.map(n => n.id);
      
      if (idsToDelete.length > 0) {
        await this.prisma.notification.deleteMany({
          where: { id: { in: idsToDelete } },
        });
        this.logger.debug(`Deleted ${idsToDelete.length} old notifications for user ${userId}`);
      }
    }
  }
}
