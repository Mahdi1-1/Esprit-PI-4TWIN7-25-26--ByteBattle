import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto, UpdateReportStatusDto } from './dto/admin.dto';
import { NotificationEmitterService } from '../notifications/notification-emitter.service';
import {
  NotificationCategory,
  NotificationPriority,
  NotificationType,
} from '../notifications/notification.constants';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ALLOWED_ROLES = ["user", "moderator", "admin"] as const;
type AllowedRole = typeof _ALLOWED_ROLES[number];

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationEmitter: NotificationEmitterService,
  ) {}

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      this.prisma.companyMembership.count().catch(() => 0),

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

  async getCompanies(query: { page?: number; limit?: number; status?: string; verified?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.verified !== undefined) {
      where.verified = query.verified === 'true' || query.verified === 'true';
    }

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { owner: { select: { id: true, username: true, email: true } } },
      }),
      this.prisma.company.count({ where }),
    ]);

    return { data: companies, total, page, limit };
  }

  async updateCompany(companyId: string, dto: any, actorId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { owner: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        ...(dto.verified !== undefined ? { verified: dto.verified } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });

    await this.createAuditLog(actorId, 'COMPANY_UPDATED', 'Company', companyId, {
      verified: dto.verified,
      status: dto.status,
      message: dto.message,
    });

    if (company.ownerId) {
      await this.notificationEmitter.emit({
        userId: company.ownerId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.HIGH,
        title: dto.verified ? 'Company verified' : 'Company status updated',
        message:
          dto.message ||
          (dto.verified
            ? `Your company ${company.name} is now verified.`
            : `Your company status was updated to ${dto.status || 'updated'} by an administrator.`),
        actionUrl: `/companies/${companyId}`,
        entityId: companyId,
        entityType: 'company',
      });
    }

    return updated;
  }

  async getPendingCompanies(query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where: { verified: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { owner: { select: { id: true, username: true, email: true } } },
      }),
      this.prisma.company.count({ where: { verified: false } }),
    ]);

    return { companies, totalPages: Math.ceil(total / limit) };
  }

  async verifyCompany(companyId: string, action: 'APPROVE' | 'REJECT', reason?: string, actorId?: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { owner: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const isApproved = action === 'APPROVE';
    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        verified: isApproved,
        status: isApproved ? 'active' : 'rejected',
        verificationToken: null,
      },
    });

    if (actorId) {
      await this.createAuditLog(actorId, 'COMPANY_VERIFICATION', 'Company', companyId, {
        action,
        reason,
      });
    }

    if (company.ownerId) {
      await this.notificationEmitter.emit({
        userId: company.ownerId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.HIGH,
        title: isApproved ? 'Company verified' : 'Company verification rejected',
        message: isApproved
          ? `Your company ${company.name} has been verified.`
          : `Your company verification was rejected.${reason ? ` Reason: ${reason}` : ''}`,
        actionUrl: `/companies/${companyId}`,
        entityId: companyId,
        entityType: 'company',
      });
    }

    return updated;
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

  // ─── Advanced Analytics ──────────────────────────────────────────

  /**
   * Returns day-by-day counts for the last N days:
   * registrations, submissions, duels started, hackathon submissions
   */
  async getTimeSeries(days: number = 30) {
    const now = new Date();
    // Build array of day buckets (oldest → newest)
    const buckets: { date: string; start: Date; end: Date }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      buckets.push({
        date: start.toISOString().slice(0, 10),
        start,
        end,
      });
    }

    // Fetch all records in the full range once, then aggregate in-memory
    const rangeStart = buckets[0].start;
    const rangeEnd = buckets[buckets.length - 1].end;

    const [users, submissions, duels, hackathonSubs] = await Promise.all([
      this.prisma.user.findMany({
        where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
        select: { createdAt: true },
      }).catch(() => []),
      this.prisma.submission.findMany({
        where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
        select: { createdAt: true, verdict: true },
      }).catch(() => []),
      this.prisma.duel.findMany({
        where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
        select: { createdAt: true },
      }).catch(() => []),
      this.prisma.hackathonSubmission.findMany({
        where: { submittedAt: { gte: rangeStart, lte: rangeEnd } },
        select: { submittedAt: true },
      }).catch(() => []),
    ]);

    const dateKey = (d: Date) => d.toISOString().slice(0, 10);

    // Build lookup maps
    const regMap: Record<string, number> = {};
    const subMap: Record<string, number> = {};
    const subACMap: Record<string, number> = {};
    const duelMap: Record<string, number> = {};
    const hackMap: Record<string, number> = {};

    for (const u of users) { const k = dateKey(u.createdAt); regMap[k] = (regMap[k] || 0) + 1; }
    for (const s of submissions) {
      const k = dateKey(s.createdAt);
      subMap[k] = (subMap[k] || 0) + 1;
      if (s.verdict === 'AC') subACMap[k] = (subACMap[k] || 0) + 1;
    }
    for (const d of duels) { const k = dateKey(d.createdAt); duelMap[k] = (duelMap[k] || 0) + 1; }
    for (const h of hackathonSubs) { const k = dateKey(h.submittedAt); hackMap[k] = (hackMap[k] || 0) + 1; }

    return {
      days,
      series: buckets.map(b => ({
        date: b.date,
        registrations: regMap[b.date] || 0,
        submissions: subMap[b.date] || 0,
        acceptedSubmissions: subACMap[b.date] || 0,
        duels: duelMap[b.date] || 0,
        hackathonSubmissions: hackMap[b.date] || 0,
      })),
    };
  }

  /**
   * Retention & engagement metrics:
   * DAU/MAU, avg sessions, user cohort basics, top active users
   */
  async getRetentionMetrics() {
    const now = new Date();
    const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      dau, wau, mau,
      activeSubmitters24h, activeSubmitters7d,
      topSubmitters,
      topDuelPlayers,
      newUsersD1, newUsersD7, newUsersD30,
      returningUsers,
    ] = await Promise.all([
      // DAU: users who submitted in last 24h
      this.prisma.submission.groupBy({ by: ['userId'], where: { createdAt: { gte: h24 } } }).then(r => r.length).catch(() => 0),
      // WAU
      this.prisma.submission.groupBy({ by: ['userId'], where: { createdAt: { gte: d7 } } }).then(r => r.length).catch(() => 0),
      // MAU
      this.prisma.submission.groupBy({ by: ['userId'], where: { createdAt: { gte: d30 } } }).then(r => r.length).catch(() => 0),
      // Active submitters
      this.prisma.submission.groupBy({ by: ['userId'], where: { createdAt: { gte: h24 } } }).then(r => r.length).catch(() => 0),
      this.prisma.submission.groupBy({ by: ['userId'], where: { createdAt: { gte: d7 } } }).then(r => r.length).catch(() => 0),
      // Top submitters (30d)
      this.prisma.submission.groupBy({
        by: ['userId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
        where: { createdAt: { gte: d30 } },
      }).then(async (rows) => {
        const ids = rows.map(r => r.userId);
        const users = await this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, username: true, elo: true } });
        return rows.map(r => ({ ...r, username: users.find(u => u.id === r.userId)?.username || '?', elo: users.find(u => u.id === r.userId)?.elo || 0 }));
      }).catch(() => []),
      // Top duel players (30d)
      this.prisma.duel.groupBy({
        by: ['player1Id'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
        where: { createdAt: { gte: d30 } },
      }).then(async (rows) => {
        const ids = rows.map(r => r.player1Id);
        const users = await this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, username: true, elo: true } });
        return rows.map(r => ({ userId: r.player1Id, count: r._count.id, username: users.find(u => u.id === r.player1Id)?.username || '?', elo: users.find(u => u.id === r.player1Id)?.elo || 0 }));
      }).catch(() => []),
      // New users cohorts
      this.prisma.user.count({ where: { createdAt: { gte: h24 } } }).catch(() => 0),
      this.prisma.user.count({ where: { createdAt: { gte: d7 } } }).catch(() => 0),
      this.prisma.user.count({ where: { createdAt: { gte: d30 } } }).catch(() => 0),
      // Returning users: submitted in both d7 and before d7
      this.prisma.submission.groupBy({ by: ['userId'], where: { createdAt: { gte: d7 } } })
        .then(r => r.length).catch(() => 0),
    ]);

    const totalUsers = await this.prisma.user.count().catch(() => 1);
    const dauRate = mau > 0 ? Math.round((dau / mau) * 100) : 0;

    return {
      dau,
      wau,
      mau,
      dauMauRatio: dauRate,
      activeSubmitters: { h24: activeSubmitters24h, d7: activeSubmitters7d },
      newUsers: { d1: newUsersD1, d7: newUsersD7, d30: newUsersD30 },
      retentionRate: totalUsers > 0 ? Math.round((returningUsers / totalUsers) * 100) : 0,
      topSubmitters: topSubmitters.map(r => ({ username: (r as any).username, count: r._count.id, elo: (r as any).elo })),
      topDuelPlayers: (topDuelPlayers as any[]).map(r => ({ username: r.username, count: r.count, elo: r.elo })),
    };
  }

  /**
   * Platform performance:
   * - Difficulty distribution of challenges
   * - Top 5 most attempted challenges
   * - Hourly submissions heatmap (last 7d)
   * - Verdict trend over last 7 days
   */
  async getPerformanceMetrics() {
    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      difficultyDist,
      topChallenges,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      recentSubmissions,
      avgTimeMs,
      submissionsPerHour,
    ] = await Promise.all([
      // Difficulty distribution
      this.prisma.challenge.groupBy({
        by: ['difficulty'],
        _count: { id: true },
      }).catch(() => []),
      // Top 5 most attempted (all time)
      this.prisma.submission.groupBy({
        by: ['challengeId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }).then(async (rows) => {
        const ids = rows.map(r => r.challengeId);
        const challenges = await this.prisma.challenge.findMany({
          where: { id: { in: ids } },
          select: { id: true, title: true, difficulty: true },
        });
        const acCounts = await Promise.all(ids.map(id =>
          this.prisma.submission.count({ where: { challengeId: id, verdict: 'AC' } }).catch(() => 0),
        ));
        return rows.map((r, i) => {
          const ch = challenges.find(c => c.id === r.challengeId);
          return {
            id: r.challengeId,
            title: ch?.title || 'Unknown',
            difficulty: ch?.difficulty || 'medium',
            attempts: r._count.id,
            accepted: acCounts[i],
            acceptRate: r._count.id > 0 ? Math.round((acCounts[i] / r._count.id) * 100) : 0,
          };
        });
      }).catch(() => []),
      // Avg execution time (last 30d)
      this.prisma.submission.aggregate({
        _avg: { timeMs: true },
        where: { createdAt: { gte: d30 }, timeMs: { not: null } },
      }).catch(() => ({ _avg: { timeMs: null } })),
      // Avg time
      this.prisma.submission.aggregate({
        _avg: { timeMs: true },
        where: { verdict: 'AC', timeMs: { not: null } },
      }).catch(() => ({ _avg: { timeMs: null } })),
      // Submissions per hour of day (last 7d) — fetch and aggregate in memory
      this.prisma.submission.findMany({
        where: { createdAt: { gte: d7 } },
        select: { createdAt: true },
      }).catch(() => []),
    ]);

    // Hourly heatmap
    const hourCounts = Array(24).fill(0);
    for (const s of submissionsPerHour) {
      hourCounts[new Date(s.createdAt).getHours()]++;
    }

    return {
      difficultyDistribution: difficultyDist.map(d => ({
        difficulty: d.difficulty,
        count: d._count.id,
      })),
      topChallenges,
      avgExecutionTimeMs: Math.round(avgTimeMs._avg.timeMs ?? 0),
      avgAcceptedTimeMs: Math.round((avgTimeMs as any)._avg?.timeMs ?? 0),
      hourlyHeatmap: hourCounts.map((count, hour) => ({ hour, count })),
    };
  }

  /**
   * Module Usage Analytics
   * Returns per-module statistics:
   * - Total sessions / items created
   * - Active users (last 7d and 30d)
   * - Avg session/completion time where available
   * - Growth vs previous period
   * - Engagement rate (users who used module / total active users)
   */
  async getModuleUsage() {
    const now = new Date();
    const d7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prev7  = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const prev30 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const totalActiveUsers = await this.prisma.user.count({ where: { status: 'active' } }).catch(() => 1);

    const pctChange = (curr: number, prev: number) =>
      prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100 * 10) / 10;

    const [
      // ─── Code Challenges ───
      totalSubmissions,
      subs7d, subsPrev7d,
      uniqueSubmitters7d,
      avgExecTime,
      avgCodeLen,

      // ─── Canvas ───
      totalCanvasSubmissions,
      canvas7d, canvasPrev7d,
      uniqueCanvasUsers7d,

      // ─── Duels ───
      totalDuels,
      duels7d, duelsPrev7d,
      uniqueDuelPlayers7d,
      avgDuelDurationRaw,
      duelCompletionRaw,

      // ─── Hackathons ───
      totalHackSubmissions,
      hack7d, hackPrev7d,
      uniqueHackUsers7d,
      avgHackTeamSize,

      // ─── AI Interviews ───
      totalInterviews,
      interviews7d, interviewsPrev7d,
      uniqueInterviewers7d,
      avgInterviewMessages,

      // ─── Discussions / Forum ───
      totalDiscussions,
      discussions7d, discussionsPrev7d,
      uniquePosters7d,
      totalComments7d,

      // ─── AI Code Reviews ───
      totalReviews,
      reviews7d, reviewsPrev7d,
      uniqueReviewers7d,
      avgReviewScore,

      // ─── Notifications ───
      totalNotifications,
      notifs7d,
      readNotifs7d,
    ] = await Promise.all([

      // Code Challenges
      this.prisma.submission.count({ where: { kind: 'CODE' } }).catch(() => 0),
      this.prisma.submission.count({ where: { kind: 'CODE', createdAt: { gte: d7 } } }).catch(() => 0),
      this.prisma.submission.count({ where: { kind: 'CODE', createdAt: { gte: prev7, lt: d7 } } }).catch(() => 0),
      this.prisma.submission.groupBy({ by: ['userId'], where: { kind: 'CODE', createdAt: { gte: d7 } } }).then(r => r.length).catch(() => 0),
      this.prisma.submission.aggregate({ _avg: { timeMs: true }, where: { kind: 'CODE', verdict: 'AC', timeMs: { not: null } } }).catch(() => ({ _avg: { timeMs: null } })),
      this.prisma.submission.findMany({ where: { kind: 'CODE', code: { not: null } }, select: { code: true }, take: 200 })
        .then(rows => rows.length ? Math.round(rows.reduce((s, r) => s + (r.code?.length ?? 0), 0) / rows.length) : 0).catch(() => 0),

      // Canvas
      this.prisma.submission.count({ where: { kind: 'CANVAS' } }).catch(() => 0),
      this.prisma.submission.count({ where: { kind: 'CANVAS', createdAt: { gte: d7 } } }).catch(() => 0),
      this.prisma.submission.count({ where: { kind: 'CANVAS', createdAt: { gte: prev7, lt: d7 } } }).catch(() => 0),
      this.prisma.submission.groupBy({ by: ['userId'], where: { kind: 'CANVAS', createdAt: { gte: d7 } } }).then(r => r.length).catch(() => 0),

      // Duels
      this.prisma.duel.count().catch(() => 0),
      this.prisma.duel.count({ where: { createdAt: { gte: d7 } } }).catch(() => 0),
      this.prisma.duel.count({ where: { createdAt: { gte: prev7, lt: d7 } } }).catch(() => 0),
      this.prisma.duel.groupBy({ by: ['player1Id'], where: { createdAt: { gte: d7 } } }).then(r => r.length).catch(() => 0),
      this.prisma.duel.findMany({
        where: { status: 'completed', startedAt: { not: null }, endedAt: { not: null } },
        select: { startedAt: true, endedAt: true },
        take: 500,
      }).then(rows => {
        const valid = rows.filter(r => r.startedAt && r.endedAt);
        if (!valid.length) return 0;
        const avgMs = valid.reduce((s, r) => s + (r.endedAt!.getTime() - r.startedAt!.getTime()), 0) / valid.length;
        return Math.round(avgMs / 60000); // minutes
      }).catch(() => 0),
      this.prisma.duel.count({ where: { status: 'completed' } }).catch(() => 0),

      // Hackathons
      this.prisma.hackathonSubmission.count().catch(() => 0),
      this.prisma.hackathonSubmission.count({ where: { submittedAt: { gte: d7 } } }).catch(() => 0),
      this.prisma.hackathonSubmission.count({ where: { submittedAt: { gte: prev7, lt: d7 } } }).catch(() => 0),
      this.prisma.hackathonSubmission.groupBy({ by: ['userId'], where: { submittedAt: { gte: d7 } } }).then(r => r.length).catch(() => 0),
      this.prisma.hackathonTeam.findMany({ select: { members: true }, take: 200 })
        .then(teams => teams.length ? Math.round(teams.reduce((s, t) => s + t.members.length, 0) / teams.length * 10) / 10 : 0).catch(() => 0),

      // AI Interviews
      this.prisma.interviewSession.count().catch(() => 0),
      this.prisma.interviewSession.count({ where: { createdAt: { gte: d7 } } }).catch(() => 0),
      this.prisma.interviewSession.count({ where: { createdAt: { gte: prev7, lt: d7 } } }).catch(() => 0),
      this.prisma.interviewSession.groupBy({ by: ['userId'], where: { createdAt: { gte: d7 } } }).then(r => r.length).catch(() => 0),
      this.prisma.interviewSession.findMany({ select: { messages: true }, take: 200 })
        .then(sessions => sessions.length ? Math.round(sessions.reduce((s, sess) => s + sess.messages.length, 0) / sessions.length * 10) / 10 : 0).catch(() => 0),

      // Discussions
      this.prisma.discussion.count().catch(() => 0),
      this.prisma.discussion.count({ where: { createdAt: { gte: d7 } } }).catch(() => 0),
      this.prisma.discussion.count({ where: { createdAt: { gte: prev7, lt: d7 } } }).catch(() => 0),
      this.prisma.discussion.groupBy({ by: ['authorId'], where: { createdAt: { gte: d7 } } }).then(r => r.length).catch(() => 0),
      this.prisma.comment.count({ where: { createdAt: { gte: d7 } } }).catch(() => 0),

      // AI Reviews
      this.prisma.aIReview.count().catch(() => 0),
      this.prisma.aIReview.count({ where: { createdAt: { gte: d7 } } }).catch(() => 0),
      this.prisma.aIReview.count({ where: { createdAt: { gte: prev7, lt: d7 } } }).catch(() => 0),
      this.prisma.aIReview.groupBy({ by: ['submissionId'], where: { createdAt: { gte: d7 } } }).then(r => r.length).catch(() => 0),
      this.prisma.aIReview.aggregate({ _avg: { score: true }, where: { status: 'completed' } }).catch(() => ({ _avg: { score: null } })),

      // Notifications
      this.prisma.notification.count().catch(() => 0),
      this.prisma.notification.count({ where: { createdAt: { gte: d7 } } }).catch(() => 0),
      this.prisma.notification.count({ where: { isRead: true, createdAt: { gte: d7 } } }).catch(() => 0),
    ]);

    const duelCompletion = totalDuels > 0 ? Math.round((duelCompletionRaw / totalDuels) * 100) : 0;
    const notifReadRate = notifs7d > 0 ? Math.round((readNotifs7d / notifs7d) * 100) : 0;
    const engRate = (u: number) => Math.round((u / totalActiveUsers) * 100);

    return {
      modules: [
        {
          key: 'code-challenges',
          label: 'Code Challenges',
          icon: 'code',
          color: '#6366f1',
          total: totalSubmissions,
          last7d: subs7d,
          growth7d: pctChange(subs7d, subsPrev7d),
          uniqueUsers7d: uniqueSubmitters7d,
          engagementRate: engRate(uniqueSubmitters7d),
          metrics: [
            { label: 'Avg Exec Time', value: `${Math.round(avgExecTime._avg.timeMs ?? 0)} ms`, raw: avgExecTime._avg.timeMs ?? 0 },
            { label: 'Avg Code Length', value: `${avgCodeLen} chars`, raw: avgCodeLen },
          ],
        },
        {
          key: 'canvas',
          label: 'Canvas Challenges',
          icon: 'canvas',
          color: '#a855f7',
          total: totalCanvasSubmissions,
          last7d: canvas7d,
          growth7d: pctChange(canvas7d, canvasPrev7d),
          uniqueUsers7d: uniqueCanvasUsers7d,
          engagementRate: engRate(uniqueCanvasUsers7d),
          metrics: [],
        },
        {
          key: 'duels',
          label: 'Duels',
          icon: 'swords',
          color: '#f59e0b',
          total: totalDuels,
          last7d: duels7d,
          growth7d: pctChange(duels7d, duelsPrev7d),
          uniqueUsers7d: uniqueDuelPlayers7d,
          engagementRate: engRate(uniqueDuelPlayers7d),
          metrics: [
            { label: 'Avg Duration', value: `${avgDuelDurationRaw} min`, raw: avgDuelDurationRaw },
            { label: 'Completion Rate', value: `${duelCompletion}%`, raw: duelCompletion },
          ],
        },
        {
          key: 'hackathons',
          label: 'Hackathons',
          icon: 'trophy',
          color: '#ec4899',
          total: totalHackSubmissions,
          last7d: hack7d,
          growth7d: pctChange(hack7d, hackPrev7d),
          uniqueUsers7d: uniqueHackUsers7d,
          engagementRate: engRate(uniqueHackUsers7d),
          metrics: [
            { label: 'Avg Team Size', value: `${avgHackTeamSize} members`, raw: avgHackTeamSize },
          ],
        },
        {
          key: 'interviews',
          label: 'AI Interviews',
          icon: 'mic',
          color: '#06b6d4',
          total: totalInterviews,
          last7d: interviews7d,
          growth7d: pctChange(interviews7d, interviewsPrev7d),
          uniqueUsers7d: uniqueInterviewers7d,
          engagementRate: engRate(uniqueInterviewers7d),
          metrics: [
            { label: 'Avg Messages/Session', value: `${avgInterviewMessages}`, raw: avgInterviewMessages },
          ],
        },
        {
          key: 'forum',
          label: 'Discussion Forum',
          icon: 'message',
          color: '#10b981',
          total: totalDiscussions,
          last7d: discussions7d,
          growth7d: pctChange(discussions7d, discussionsPrev7d),
          uniqueUsers7d: uniquePosters7d,
          engagementRate: engRate(uniquePosters7d),
          metrics: [
            { label: 'Comments (7d)', value: `${totalComments7d}`, raw: totalComments7d },
          ],
        },
        {
          key: 'ai-review',
          label: 'AI Code Review',
          icon: 'brain',
          color: '#f97316',
          total: totalReviews,
          last7d: reviews7d,
          growth7d: pctChange(reviews7d, reviewsPrev7d),
          uniqueUsers7d: uniqueReviewers7d,
          engagementRate: engRate(uniqueReviewers7d),
          metrics: [
            { label: 'Avg Score', value: `${Math.round(avgReviewScore._avg?.score ?? 0)}/100`, raw: avgReviewScore._avg?.score ?? 0 },
          ],
        },
        {
          key: 'notifications',
          label: 'Notifications',
          icon: 'bell',
          color: '#ef4444',
          total: totalNotifications,
          last7d: notifs7d,
          growth7d: 0,
          uniqueUsers7d: 0,
          engagementRate: notifReadRate,
          metrics: [
            { label: 'Read Rate (7d)', value: `${notifReadRate}%`, raw: notifReadRate },
            { label: 'Sent (7d)', value: `${notifs7d}`, raw: notifs7d },
          ],
        },
      ],
      // Relative popularity: % of total activity each module represents
      totalActivity: subs7d + canvas7d + duels7d + hack7d + interviews7d + discussions7d + reviews7d,
      period: '7d',
    };
  }
}
