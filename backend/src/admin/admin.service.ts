import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto, UpdateReportStatusDto } from './dto/admin.dto';

const ALLOWED_ROLES = ['user', 'moderator', 'admin'] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── User Role Management ─────────────────────────────────────
  async changeUserRole(actorId: string, targetId: string, role: AllowedRole) {
    // Prevent self-demotion (admin can't remove their own admin role)
    if (actorId === targetId && role !== 'admin') {
      throw new BadRequestException('Cannot demote yourself. Ask another admin.');
    }

    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException('User not found');

    const previousRole = target.role;

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { role: role as any },
      select: { id: true, username: true, email: true, role: true, status: true },
    });

    // Audit trail
    await this.createAuditLog(
      actorId,
      'USER_ROLE_CHANGED',
      'User',
      targetId,
      { previousRole, newRole: role, targetUsername: target.username },
    );

    return updated;
  }

  // ─── Dashboard Stats ──────────────────────────────
  async getDashboardStats() {
    const now = new Date();
    const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevH24 = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const prevD7 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, activeUsers, bannedUsers, suspendedUsers,
      newUsers24h, newUsersPrev24h,
      premiumUsers, adminUsers, moderatorUsers,
      totalChallenges, totalSubmissions,
      submissions24h, submissionsPrev24h,
      submissions7d, submissionsPrev7d,
      acceptedSubmissions,
      totalHackathons, activeHackathons,
      hackathonSubmissions, hackathonTeams,
      totalDiscussions, totalComments, totalRevisions,
      openReports, totalReports,
      totalDuels, activeDuels, completedDuels,
      totalInterviews,
      totalNotifications, unreadNotifications,
      totalBadges, totalBadgesAwarded,
      totalCompanies, totalCompanyMembers,
      totalAIReviews,
      recentAuditLogs,
      verdictAC, verdictWA, verdictTLE, verdictRE, verdictCE, verdictQueued,
      topLanguages,
      newUsers7d,
      userAggregates,
    ] = await Promise.all([
      // Users
      this.prisma.user.count().catch(() => 0),
      this.prisma.user.count({ where: { status: 'active' } }).catch(() => 0),
      this.prisma.user.count({ where: { status: 'banned' } }).catch(() => 0),
      this.prisma.user.count({ where: { status: 'suspended' } }).catch(() => 0),
      this.prisma.user.count({ where: { createdAt: { gte: h24 } } }).catch(() => 0),
      this.prisma.user.count({ where: { createdAt: { gte: prevH24, lt: h24 } } }).catch(() => 0),

      // Users by role/premium
      this.prisma.user.count({ where: { isPremium: true } }).catch(() => 0),
      this.prisma.user.count({ where: { role: 'admin' as any } }).catch(() => 0),
      this.prisma.user.count({ where: { role: 'moderator' as any } }).catch(() => 0),

      // Challenges
      this.prisma.challenge.count().catch(() => 0),
      this.prisma.submission.count().catch(() => 0),

      // Submissions time-based
      this.prisma.submission.count({ where: { createdAt: { gte: h24 } } }).catch(() => 0),
      this.prisma.submission.count({ where: { createdAt: { gte: prevH24, lt: h24 } } }).catch(() => 0),
      this.prisma.submission.count({ where: { createdAt: { gte: d7 } } }).catch(() => 0),
      this.prisma.submission.count({ where: { createdAt: { gte: prevD7, lt: d7 } } }).catch(() => 0),
      this.prisma.submission.count({ where: { verdict: 'AC' } }).catch(() => 0),

      // Hackathons
      this.prisma.hackathon.count().catch(() => 0),
      this.prisma.hackathon.count({ where: { status: { in: ['active', 'lobby', 'checkin'] } } }).catch(() => 0),
      this.prisma.hackathonSubmission.count().catch(() => 0),
      this.prisma.hackathonTeam.count().catch(() => 0),

      // Discussions
      this.prisma.discussion.count().catch(() => 0),
      this.prisma.comment.count().catch(() => 0),
      this.prisma.discussionRevision.count().catch(() => 0),

      // Reports
      this.prisma.report.count({ where: { status: 'open' } }).catch(() => 0),
      this.prisma.report.count().catch(() => 0),

      // Duels
      this.prisma.duel.count().catch(() => 0),
      this.prisma.duel.count({ where: { status: 'active' } }).catch(() => 0),
      this.prisma.duel.count({ where: { status: 'completed' } }).catch(() => 0),

      // Interviews
      this.prisma.interviewSession.count().catch(() => 0),

      // Notifications
      this.prisma.notification.count().catch(() => 0),
      this.prisma.notification.count({ where: { isRead: false } }).catch(() => 0),

      // Badges
      this.prisma.badge.count().catch(() => 0),
      this.prisma.userBadge.count().catch(() => 0),

      // Companies
      this.prisma.company.count().catch(() => 0),
      this.prisma.companyMember.count().catch(() => 0),

      // AI Reviews
      this.prisma.aIReview.count().catch(() => 0),

      // Recent audit
      this.prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { id: true, username: true } } },
      }).catch(() => []),

      // Verdicts breakdown
      this.prisma.submission.count({ where: { verdict: 'AC' } }).catch(() => 0),
      this.prisma.submission.count({ where: { verdict: 'WA' } }).catch(() => 0),
      this.prisma.submission.count({ where: { verdict: 'TLE' } }).catch(() => 0),
      this.prisma.submission.count({ where: { verdict: 'RE' } }).catch(() => 0),
      this.prisma.submission.count({ where: { verdict: 'CE' } }).catch(() => 0),
      this.prisma.submission.count({ where: { verdict: 'queued' } }).catch(() => 0),

      // Top languages
      this.prisma.submission.groupBy({
        by: ['language'],
        _count: { language: true },
        where: { language: { not: null } },
        orderBy: { _count: { language: 'desc' } },
        take: 6,
      }).catch(() => []),

      // Growth
      this.prisma.user.count({ where: { createdAt: { gte: d7 } } }).catch(() => 0),

      // Aggregates (avg level, xp, elo)
      this.prisma.user.aggregate({
        _avg: { level: true, xp: true, elo: true },
      }).catch(() => ({ _avg: { level: null, xp: null, elo: null } })),
    ]);

    // Percent change helpers
    const pctChange = (curr: number, prev: number) =>
      prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100 * 10) / 10;

    // Verdict ratio
    const verdictTotal = verdictAC + verdictWA + verdictTLE + verdictRE + verdictCE + verdictQueued;
    const pct = (v: number) => verdictTotal > 0 ? Math.round((v / verdictTotal) * 1000) / 10 : 0;

    return {
      // Users KPIs
      users: {
        total: totalUsers,
        active: activeUsers,
        banned: bannedUsers,
        suspended: suspendedUsers,
        premium: premiumUsers,
        admins: adminUsers,
        moderators: moderatorUsers,
        regularUsers: totalUsers - adminUsers - moderatorUsers,
        newToday: newUsers24h,
        newTodayTrend: pctChange(newUsers24h, newUsersPrev24h),
        newThisWeek: newUsers7d,
        avgLevel: Math.round(userAggregates._avg.level ?? 0),
        avgXp: Math.round(userAggregates._avg.xp ?? 0),
        avgElo: Math.round(userAggregates._avg.elo ?? 0),
      },

      // Challenges & Submissions
      challenges: totalChallenges,
      submissions: {
        total: totalSubmissions,
        accepted: acceptedSubmissions,
        acceptRate: totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0,
      },
      submissions24h,
      submissions24hTrend: pctChange(submissions24h, submissionsPrev24h),
      submissions7d,
      submissions7dTrend: pctChange(submissions7d, submissionsPrev7d),

      // Verdicts
      verdictRatio: {
        AC: pct(verdictAC),
        WA: pct(verdictWA),
        TLE: pct(verdictTLE),
        RE: pct(verdictRE),
        CE: pct(verdictCE),
        QUEUED: pct(verdictQueued),
      },

      // Top languages
      topLanguages: topLanguages.map(l => ({
        language: l.language || 'unknown',
        count: l._count.language,
      })),

      // Live activity
      duels: { total: totalDuels, active: activeDuels, completed: completedDuels },
      hackathons: {
        total: totalHackathons,
        active: activeHackathons,
        submissions: hackathonSubmissions,
        teams: hackathonTeams,
      },
      interviews: totalInterviews,

      // Community
      discussions: totalDiscussions,
      comments: totalComments,
      revisions: totalRevisions,
      openReports,
      totalReports,

      // Notifications
      notifications: {
        total: totalNotifications,
        unread: unreadNotifications,
      },

      // Badges
      badges: {
        total: totalBadges,
        awarded: totalBadgesAwarded,
      },

      // Companies
      companies: {
        total: totalCompanies,
        members: totalCompanyMembers,
      },

      // AI
      aiReviews: totalAIReviews,

      // Audit trail
      recentActivity: recentAuditLogs.map(l => ({
        id: l.id,
        actor: l.actor?.username || 'System',
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        details: l.details,
        time: l.createdAt,
      })),
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
