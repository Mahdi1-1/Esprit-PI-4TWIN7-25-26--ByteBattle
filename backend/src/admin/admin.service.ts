import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto, UpdateReportStatusDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── Dashboard Stats ──────────────────────────────
  async getDashboardStats() {
    const [
      totalUsers, activeUsers, totalChallenges, totalSubmissions,
      acceptedSubmissions, totalHackathons, totalDiscussions, totalReports,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'active' } }),
      this.prisma.challenge.count(),
      this.prisma.submission.count(),
      this.prisma.submission.count({ where: { verdict: 'AC' } }),
      this.prisma.hackathon.count(),
      this.prisma.discussion.count(),
      this.prisma.report.count({ where: { status: 'open' } }),
    ]);

    return {
      users: { total: totalUsers, active: activeUsers },
      challenges: totalChallenges,
      submissions: {
        total: totalSubmissions,
        accepted: acceptedSubmissions,
        acceptRate: totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0,
      },
      hackathons: totalHackathons,
      discussions: totalDiscussions,
      openReports: totalReports,
    };
  }

  // ─── Reports ──────────────────────────────────
  async createReport(reporterId: string, dto: CreateReportDto) {
    return this.prisma.report.create({
      data: {
        ...dto,
        reporterId,
      },
    });
  }

  async getReports(query: { page?: number; limit?: number; status?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    return { data: reports, total, page, limit };
  }

  async updateReportStatus(id: string, dto: UpdateReportStatusDto) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    return this.prisma.report.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // ─── Audit Logs ──────────────────────────────────
  async createAuditLog(actorId: string, action: string, entityType: string, entityId: string, details?: any, ip?: string) {
    return this.prisma.auditLog.create({
      data: { actorId, action, entityType, entityId, details, ip },
    });
  }

  async getAuditLogs(query: { page?: number; limit?: number; action?: string; actorId?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.action) where.action = query.action;
    if (query.actorId) where.actorId = query.actorId;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, username: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: logs, total, page, limit };
  }
}
