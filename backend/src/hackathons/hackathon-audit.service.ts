import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HackathonAuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    hackathonId: string,
    actorId: string,
    action: string,
    details?: Record<string, any>,
  ) {
    return this.prisma.hackathonAuditLog.create({
      data: {
        hackathonId,
        actorId,
        action,
        details: details ?? undefined,
      },
    });
  }

  async getAuditLog(
    hackathonId: string,
    options: { action?: string; page?: number; limit?: number } = {},
  ) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { hackathonId };
    if (options.action) where.action = options.action;

    const [data, total] = await Promise.all([
      this.prisma.hackathonAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.hackathonAuditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
