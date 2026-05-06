import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsGateway } from "./notifications.gateway";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async getAll(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      category?: string;
      unreadOnly?: boolean;
    } = {},
  ) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { recipientId: userId, isArchived: false };
    if (options.category) where.category = options.category;
    if (options.unreadOnly) where.isRead = false;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total, page, limit, hasMore: skip + data.length < total };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { recipientId: userId, isRead: false, isArchived: false },
    });
    return { count };
  }

  async markRead(id: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif) throw new NotFoundException("Notification not found");
    if (notif.recipientId !== userId)
      throw new ForbiddenException("Not your notification");
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false, isArchived: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: result.count };
  }

  async archive(id: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif) throw new NotFoundException("Notification not found");
    if (notif.recipientId !== userId)
      throw new ForbiddenException("Not your notification");
    return this.prisma.notification.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  async bulkMarkRead(ids: string[], userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id: { in: ids }, recipientId: userId },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: result.count };
  }

  async bulkArchive(ids: string[], userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id: { in: ids }, recipientId: userId },
      data: { isArchived: true },
    });
    return { updated: result.count };
  }

  async delete(id: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif) throw new NotFoundException("Notification not found");
    if (notif.recipientId !== userId)
      throw new ForbiddenException("Not your notification");
    await this.prisma.notification.delete({ where: { id } });
    return { deleted: true };
  }
}
