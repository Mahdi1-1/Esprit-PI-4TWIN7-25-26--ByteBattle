import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CompanyResponseDto,
  CompanyMemberResponseDto,
} from './dto/company-response.dto';
import { NotificationEmitterService } from '../notifications/notification-emitter.service';
import {
  NotificationCategory,
  NotificationPriority,
  NotificationType,
} from '../notifications/notification.constants';
import { InterviewsService } from '../interviews/interviews.service';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);
  private static readonly JOIN_CODE_TTL_MS = 10 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationEmitter: NotificationEmitterService,
    private readonly interviewsService: InterviewsService,
  ) {}

  private slugify(text: string) {
    return text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private generateJoinCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generateTimedJoinCode() {
    const code = this.generateJoinCode();
    const expiresAt = new Date(Date.now() + CompaniesService.JOIN_CODE_TTL_MS);
    const expiresToken = expiresAt.getTime().toString(36).toUpperCase();
    return {
      joinCode: `${code}-${expiresToken}`,
      expiresAt,
    };
  }

  private parseJoinCodeExpiry(joinCode: string): Date | null {
    const parts = joinCode.split('-');
    if (parts.length !== 2) {
      return null;
    }

    const expiresMs = Number.parseInt(parts[1], 36);
    if (!Number.isFinite(expiresMs)) {
      return null;
    }

    return new Date(expiresMs);
  }

  private async getCompanyOrThrow(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  private async getCompanyMembership(companyId: string, userId: string) {
    return this.prisma.companyMembership.findUnique({
      where: {
        companyId_userId: { companyId, userId },
      },
    });
  }

  private async requireCompanyAdmin(companyId: string, userId: string) {
    const company = await this.getCompanyOrThrow(companyId);
    if (company.ownerId === userId) return company;

    const membership = await this.getCompanyMembership(companyId, userId);
    if (!membership || membership.status !== 'active') {
      throw new ForbiddenException('Access denied to company administration');
    }

    if (membership.role !== 'owner' && membership.role !== 'recruiter') {
      throw new ForbiddenException('Only company owner or recruiter can perform this action');
    }

    return company;
  }

  private async requireActiveMember(companyId: string, userId: string) {
    const membership = await this.getCompanyMembership(companyId, userId);
    if (!membership || membership.status !== 'active') {
      throw new ForbiddenException('Access denied to company resources');
    }
    return membership;
  }

  private async createCompanyNotification(
    companyId: string,
    type: string,
    userId?: string,
  ) {
    return this.prisma.companyNotification.create({
      data: {
        companyId,
        type: type as any,
        userId,
      },
    });
  }

  private async emitAppNotification(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string,
    entityId?: string,
    entityType?: string,
  ) {
    await this.notificationEmitter.emit({
      userId,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      category: NotificationCategory.SYSTEM,
      priority: NotificationPriority.HIGH,
      title,
      message,
      actionUrl,
      entityId,
      entityType,
    });
  }

  async createCompany(userId: string, dto: any) {
    const slug = dto.slug?.trim() ? this.slugify(dto.slug) : this.slugify(dto.name);
    const joinCode = this.generateJoinCode();

    const company = await this.prisma.company.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        website: dto.website,
        industry: dto.industry,
        size: dto.size,
        logo: dto.logoUrl,
        joinPolicy: dto.joinPolicy ?? 'approval',
        joinCode,
        ownerId: userId,
        verified: false,
        status: 'active',
      },
    });

    await this.prisma.companyMembership.create({
      data: {
        companyId: company.id,
        userId,
        role: 'owner',
        status: 'active',
        joinedAt: new Date(),
        requestedAt: new Date(),
      },
    });

    // Sync User model with company membership
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        companyId: company.id,
        companyRole: 'owner',
        companyJoinedAt: new Date(),
      },
    });

    return CompanyResponseDto.fromPrisma(company);
  }

  async updateCompany(companyId: string, userId: string, dto: any) {
    await this.requireCompanyAdmin(companyId, userId);
    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        name: dto.name,
        description: dto.description,
        website: dto.website,
        industry: dto.industry,
        size: dto.size,
        joinPolicy: dto.joinPolicy,
      },
    });
    return CompanyResponseDto.fromPrisma(company);
  }

  async getPublicCompanies(): Promise<CompanyResponseDto[]> {
    const companies = await this.prisma.company.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
    });
    return companies.map((c) => CompanyResponseDto.fromPrisma(c));
  }

  async getUserCompanies(userId: string): Promise<CompanyMemberResponseDto[]> {
    const memberships = await this.prisma.companyMembership.findMany({
      where: { userId },
      include: { company: true },
      orderBy: { joinedAt: 'desc' },
    });
    return memberships.map((m) => CompanyMemberResponseDto.fromPrisma(m));
  }

  async getCompanyById(companyId: string): Promise<CompanyResponseDto> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { owner: { select: { id: true, username: true, email: true } } },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return CompanyResponseDto.fromPrisma(company);
  }

  async getMyCompany(userId: string) {
    const membership = await this.prisma.companyMembership.findFirst({
      where: { userId, status: 'active' },
      include: { company: true },
    });

    if (!membership) {
      return null;
    }

    return {
      id: membership.company.id,
      name: membership.company.name,
      slug: membership.company.slug,
      description: membership.company.description,
      industry: membership.company.industry,
      size: membership.company.size,
      verified: membership.company.verified,
      status: membership.company.status,
      joinCode: membership.role === 'owner' || membership.role === 'recruiter' ? membership.company.joinCode : null,
    };
  }

  async requestVerification(userId: string) {
    const membership = await this.prisma.companyMembership.findFirst({
      where: { userId, status: 'active', role: 'owner' },
      include: { company: true },
    });

    if (!membership) {
      throw new ForbiddenException('You must be an owner to request verification');
    }

    if (membership.company.verified) {
      throw new BadRequestException('Company is already verified');
    }

    return { message: 'Verification request submitted', company: membership.company.name };
  }

  async joinCompany(userId: string, companyId: string): Promise<CompanyMemberResponseDto> {
    const company = await this.getCompanyOrThrow(companyId);
    const existingMembership = await this.prisma.companyMembership.findUnique({
      where: {
        companyId_userId: { companyId, userId },
      },
    });

    if (existingMembership) {
      if (existingMembership.status === 'active') {
        throw new BadRequestException('Already a member of this company');
      }
      if (existingMembership.status === 'pending') {
        throw new BadRequestException('Join request already pending');
      }
    }

    if (company.joinPolicy === 'invite_only') {
      throw new ForbiddenException(
        'This company is invite-only. Please contact an administrator.',
      );
    }

    const status = company.joinPolicy === 'open' ? 'active' : 'pending';

    if (existingMembership?.status === 'rejected') {
      await this.prisma.companyMembership.delete({ where: { id: existingMembership.id } });
    }

    const membership = await this.prisma.companyMembership.create({
      data: {
        companyId,
        userId,
        role: 'member',
        status,
        joinedAt: new Date(),
        requestedAt: new Date(),
      },
      include: { company: true },
    });

    // Sync User model when membership is immediately active
    if (status === 'active') {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          companyId,
          companyRole: 'member',
          companyJoinedAt: new Date(),
        },
      });
    }

    if (status === 'pending') {
      await this.createCompanyNotification(companyId, 'join_request', company.ownerId || undefined);
      if (company.ownerId) {
        await this.emitAppNotification(
          company.ownerId,
          'New company join request',
          `${membership.userId} requested to join ${company.name}.`,
          `/companies/${companyId}`,
          companyId,
          'company',
        );
      }
    }

    return CompanyMemberResponseDto.fromPrisma(membership);
  }

  async joinByCode(userId: string, code: string): Promise<CompanyMemberResponseDto> {
    const normalizedCode = code.trim().toUpperCase();
    const company = await this.prisma.company.findUnique({
      where: { joinCode: normalizedCode },
    });

    if (!company) {
      throw new NotFoundException('Invalid join code');
    }

    if (company.status !== 'active') {
      throw new BadRequestException('Company is not active');
    }

    const expiresAt = this.parseJoinCodeExpiry(company.joinCode ?? '');
    if (expiresAt && expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Join code expired. Ask a recruiter for a new one.');
    }

    return this.joinCompany(userId, company.id);
  }

  async regenerateJoinCode(companyId: string, userId: string): Promise<{ joinCode: string; expiresAt: string }> {
    const company = await this.requireCompanyAdmin(companyId, userId);
    await this.requireCompanyAdmin(companyId, userId);
    const { joinCode, expiresAt } = this.generateTimedJoinCode();

    await this.prisma.company.update({
      where: { id: companyId },
      data: { joinCode },
    });

    return {
      joinCode,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async getCompanyMembers(companyId: string, userId: string) {
    await this.requireCompanyAdmin(companyId, userId);
    const members = await this.prisma.companyMembership.findMany({
      where: { companyId },
      include: { 
        user: { 
          select: { 
            id: true, 
            username: true, 
            email: true,
            profileImage: true,
            level: true,
            elo: true
          } 
        }, 
        company: true,
        team: true
      },
      orderBy: { joinedAt: 'desc' },
    });
    return members.map((m) => CompanyMemberResponseDto.fromPrisma(m));
  }

  async getCompanyTeams(companyId: string, userId: string) {
    // Allow any active member or admin to see the teams
    await this.requireActiveMember(companyId, userId);
    const teams = await this.prisma.companyTeam.findMany({
      where: { companyId },
      include: {
        members: {
          include: {
            user: { select: { elo: true } }
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    return teams.map((team: any) => {
      const activeMembers = team.members ? team.members.filter((m: any) => m.status === 'active') : [];
      const totalElo = activeMembers.reduce((sum: number, m: any) => sum + (m.user?.elo || 1200), 0);
      const totalSolved = 0; // Solved count removed as it's not a field
      
      const { members, ...teamBase } = team;
      return {
        ...teamBase,
        stats: {
          memberCount: activeMembers.length,
          avgElo: activeMembers.length ? Math.round(totalElo / activeMembers.length) : 0,
          totalSolved
        }
      };
    });
  }

  async createCompanyTeam(companyId: string, userId: string, name: string, description?: string) {
    await this.requireCompanyAdmin(companyId, userId);
    return this.prisma.companyTeam.create({
      data: {
        companyId,
        name,
        description,
      },
    });
  }

  async assignMemberToTeam(companyId: string, memberUserId: string, teamId: string | null, actorId: string) {
    await this.requireCompanyAdmin(companyId, actorId);
    const membership = await this.prisma.companyMembership.findUnique({
      where: { companyId_userId: { companyId, userId: memberUserId } },
    });
    

    if (!membership || membership.status !== 'active') {
      throw new NotFoundException('Active company member not found');
    }

    if (teamId) {
      const team = await this.prisma.companyTeam.findUnique({ where: { id: teamId, companyId } });
      if (!team) {
        throw new NotFoundException('Team not found');
      }
    }

    const updated = await this.prisma.companyMembership.update({
      where: { id: membership.id },
      data: { teamId: teamId || null },
      include: {
        user: { 
          select: { id: true, username: true, email: true, profileImage: true, level: true, elo: true } 
        },
        company: true,
        team: true
      },
    });

    return CompanyMemberResponseDto.fromPrisma(updated);
  }

  async getPendingJoinRequests(companyId: string, userId: string) {
    await this.requireCompanyAdmin(companyId, userId);
    return this.prisma.companyMembership.findMany({
      where: { companyId, status: 'pending' },
      include: { user: { select: { id: true, username: true, email: true } } },
      orderBy: { requestedAt: 'asc' },
    });
  }

  async updateMemberRole(companyId: string, targetUserId: string, role: string, actorId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const company = await this.requireCompanyAdmin(companyId, actorId);

    if (company.ownerId === targetUserId) {
      throw new BadRequestException('Cannot change the owner\'s role');
    }

    const membership = await this.prisma.companyMembership.findUnique({
      where: { companyId_userId: { companyId, userId: targetUserId } },
    });
    if (!membership || membership.status !== 'active') {
      throw new NotFoundException('Active company member not found');
    }

    const previousRole = membership.role;
    const updated = await this.prisma.companyMembership.update({
      where: { id: membership.id },
      data: { role: role as any },
      include: { user: { select: { id: true, username: true, email: true } }, company: true },
    });

    // Sync User model with new role
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { companyRole: role as any },
    });

    await this.createCompanyNotification(companyId, 'member_role_changed', targetUserId);
    await this.emitAppNotification(
      targetUserId,
      'Company role updated',
      `Your role in ${company.name} has been changed from ${previousRole} to ${role}.`,
    );

    return updated;
  }

  async removeMember(companyId: string, targetUserId: string, actorId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const company = await this.requireCompanyAdmin(companyId, actorId);

    if (company.ownerId === targetUserId) {
      throw new BadRequestException('Cannot remove the company owner');
    }

    const membership = await this.prisma.companyMembership.findUnique({
      where: { companyId_userId: { companyId, userId: targetUserId } },
    });
    if (!membership) {
      throw new NotFoundException('Company member not found');
    }

    await this.prisma.companyMembership.delete({ where: { id: membership.id } });

    // Clear company fields on the User model
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        companyId: null,
        companyRole: null,
        companyJoinedAt: null,
      },
    });

    await this.emitAppNotification(
      targetUserId,
      'Removed from company',
      `You have been removed from ${company.name}.`,
    );

    return { success: true };
  }

  async inviteMember(companyId: string, email: string, actorId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const company = await this.requireCompanyAdmin(companyId, actorId);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User with this email not found');
    }

    const existingMembership = await this.prisma.companyMembership.findUnique({
      where: { companyId_userId: { companyId, userId: user.id } },
    });
    if (existingMembership) {
      throw new BadRequestException('User is already a member or has a pending request');
    }

    const membership = await this.prisma.companyMembership.create({
      data: {
        companyId,
        userId: user.id,
        role: 'member',
        status: 'pending',
      },
      include: { user: { select: { id: true, username: true, email: true } }, company: true },
    });

    await this.createCompanyNotification(companyId, 'join_request', user.id);
    await this.emitAppNotification(
      user.id,
      'Company invitation',
      `You have been invited to join ${company.name}.`,
      `/companies/${companyId}/join`,
    );

    return membership;
  }

  async respondToJoinRequest(
    companyId: string,
    targetUserId: string,
    action: 'approve' | 'reject',
    adminId: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const company = await this.requireCompanyAdmin(companyId, adminId);

    const membership = await this.prisma.companyMembership.findUnique({
      where: { companyId_userId: { companyId, userId: targetUserId } },
    });
    if (!membership || membership.status !== 'pending') {
      throw new NotFoundException('Pending company request not found');
    }

    const updated = await this.prisma.companyMembership.update({
      where: { id: membership.id },
      data: {
        status: action === 'approve' ? 'active' : 'rejected',
      },
      include: { company: true },
    });

    // Sync User model when join request is approved
    if (action === 'approve') {
      await this.prisma.user.update({
        where: { id: targetUserId },
        data: {
          companyId,
          companyRole: membership.role as any,
          companyJoinedAt: new Date(),
        },
      });
    }

    await this.createCompanyNotification(companyId, 'join_request', targetUserId);
    await this.emitAppNotification(
      targetUserId,
      action === 'approve' ? 'Company membership approved' : 'Company membership rejected',
      action === 'approve'
        ? `Your request to join ${company.name} has been approved.`
        : `Your request to join ${company.name} was rejected.`,
      `/company-space`,
      companyId,
      'company',
    );

    return updated;
  }

  async getCompanyRoadmaps(companyId: string, userId: string) {
    const company = await this.getCompanyOrThrow(companyId);
    const isActiveMember = await this.getCompanyMembership(companyId, userId);
    const where: any = { companyId };
    if (!isActiveMember || isActiveMember.status !== 'active') {
      where.visibility = 'public';
    }
    return this.prisma.companyRoadmap.findMany({
      where,
      orderBy: { order: 'asc' },
      include: { assignments: true },
    });
  }

  async createCompanyRoadmap(companyId: string, userId: string, dto: any) {
    await this.requireCompanyAdmin(companyId, userId);
    return this.prisma.companyRoadmap.create({
      data: {
        companyId,
        title: dto.title,
        description: dto.description,
        type: dto.type || 'custom',
        challengeIds: dto.challengeIds || [],
        visibility: dto.visibility || 'public',
      },
    });
  }

  async assignRoadmap(
    companyId: string,
    roadmapId: string,
    userId: string,
    targetUserId: string,
  ) {
    await this.requireCompanyAdmin(companyId, userId);
    const roadmap = await this.prisma.companyRoadmap.findUnique({ where: { id: roadmapId } });
    if (!roadmap || roadmap.companyId !== companyId) {
      throw new NotFoundException('Company roadmap not found');
    }

    const existing = await this.prisma.roadmapAssignment.findUnique({
      where: { roadmapId_userId: { roadmapId, userId: targetUserId } },
    });
    if (existing) {
      return existing;
    }

    const assignment = await this.prisma.roadmapAssignment.create({
      data: {
        roadmapId,
        userId: targetUserId,
        assignedBy: userId,
      },
    });

    await this.createCompanyNotification(companyId, 'roadmap_assigned', targetUserId);
    await this.emitAppNotification(
      targetUserId,
      'New roadmap assigned',
      `A company training roadmap has been assigned to you.`,
      `/company-space`,
      roadmapId,
      'roadmap',
    );

    return assignment;
  }

  async updateRoadmapProgress(
    companyId: string,
    roadmapId: string,
    userId: string,
    progress: number,
  ) {
    const roadmap = await this.prisma.companyRoadmap.findUnique({ where: { id: roadmapId } });
    if (!roadmap || roadmap.companyId !== companyId) {
      throw new NotFoundException('Roadmap not found');
    }

    await this.requireActiveMember(companyId, userId);

    return this.prisma.roadmapAssignment.upsert({
      where: { roadmapId_userId: { roadmapId, userId } },
      create: {
        roadmapId,
        userId,
        assignedBy: userId,
        progress,
        completedAt: progress >= 100 ? new Date() : null,
      },
      update: {
        progress,
        completedAt: progress >= 100 ? new Date() : null,
      },
    });
  }

  async getCompanyCourses(companyId: string, userId: string) {
    const membership = await this.getCompanyMembership(companyId, userId);
    const where: any = { companyId };
    if (!membership || membership.status !== 'active') {
      where.visibility = 'public';
    }
    return this.prisma.companyCourse.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { enrollments: true },
    });
  }

  async createCompanyCourse(companyId: string, userId: string, dto: any) {
    await this.requireCompanyAdmin(companyId, userId);
    return this.prisma.companyCourse.create({
      data: {
        companyId,
        title: dto.title,
        description: dto.description,
        content: dto.content ?? {},
        visibility: dto.visibility || 'public',
      },
    });
  }

  async enrollInCourse(companyId: string, courseId: string, userId: string) {
    const course = await this.prisma.companyCourse.findUnique({ where: { id: courseId } });
    if (!course || course.companyId !== companyId) {
      throw new NotFoundException('Course not found');
    }
    if (course.visibility === 'employees_only') {
      await this.requireActiveMember(companyId, userId);
    }

    const existing = await this.prisma.courseEnrollment.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
    if (existing) {
      throw new BadRequestException('Already enrolled');
    }

    const enrollment = await this.prisma.courseEnrollment.create({
      data: {
        courseId,
        userId,
      },
    });

    await this.createCompanyNotification(companyId, 'course_enrolled', userId);
    await this.emitAppNotification(
      userId,
      'Course enrolled',
      `You have been enrolled in ${course.title}.`,
      `/company-space`,
      courseId,
      'course',
    );

    return enrollment;
  }

  async updateCourseProgress(
    companyId: string,
    courseId: string,
    userId: string,
    progress: number,
  ) {
    const course = await this.prisma.companyCourse.findUnique({ where: { id: courseId } });
    if (!course || course.companyId !== companyId) {
      throw new NotFoundException('Course not found');
    }
    if (course.visibility === 'employees_only') {
      await this.requireActiveMember(companyId, userId);
    }

    return this.prisma.courseEnrollment.upsert({
      where: { courseId_userId: { courseId, userId } },
      create: {
        courseId,
        userId,
        progress,
        enrolledAt: new Date(),
        completedAt: progress >= 100 ? new Date() : null,
      },
      update: {
        progress,
        completedAt: progress >= 100 ? new Date() : null,
      },
    });
  }

  async getCompanyJobs(companyId: string) {
    return this.prisma.companyJobPosting.findMany({
      where: { companyId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHiringCandidates(companyId: string, userId: string, search?: string) {
    await this.requireActiveMember(companyId, userId);

    const jobs = await this.prisma.companyJobPosting.findMany({
      where: { companyId },
      select: {
        id: true,
        title: true,
        applicants: true,
      },
    });

    const candidateIds = Array.from(
      new Set(
        jobs.flatMap((job) => job.applicants ?? []).filter((id) => Boolean(id)),
      ),
    );

    if (candidateIds.length === 0) {
      return [];
    }

    const normalizedSearch = search?.trim();
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: candidateIds },
        ...(normalizedSearch
          ? {
              OR: [
                { username: { contains: normalizedSearch, mode: 'insensitive' } },
                { email: { contains: normalizedSearch, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        profileImage: true,
        level: true,
        elo: true,
        earnedBadges: {
          take: 5,
          orderBy: { earnedAt: 'desc' },
          select: {
            badge: {
              select: {
                id: true,
                name: true,
                iconUrl: true,
              },
            },
          },
        },
      },
    });

    const userIds = users.map((user) => user.id);
    const submissions = await this.prisma.submission.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        verdict: true,
        createdAt: true,
        challenge: {
          select: {
            title: true,
            difficulty: true,
          },
        },
      },
    });

    const submissionsByUser = new Map<string, any[]>();
    for (const submission of submissions) {
      const list = submissionsByUser.get(submission.userId);
      if (list) {
        list.push(submission);
      } else {
        submissionsByUser.set(submission.userId, [submission]);
      }
    }

    return users.map((candidateUser) => {
      const userSubmissions = submissionsByUser.get(candidateUser.id) ?? [];
      const accepted = userSubmissions.filter((submission) =>
        submission.verdict.toUpperCase() === 'ACCEPTED',
      );

      const easy = accepted.filter(
        (submission) => submission.challenge?.difficulty === 'easy',
      ).length;
      const medium = accepted.filter(
        (submission) => submission.challenge?.difficulty === 'medium',
      ).length;
      const hard = accepted.filter(
        (submission) => submission.challenge?.difficulty === 'hard',
      ).length;

      const totalSubmissions = userSubmissions.length;
      const acceptanceRate =
        totalSubmissions > 0
          ? Math.round((accepted.length / totalSubmissions) * 100)
          : 0;

      const appliedJobs = jobs
        .filter((job) => job.applicants?.includes(candidateUser.id))
        .map((job) => ({
          jobId: job.id,
          jobTitle: job.title,
          appliedAt: null,
          status: 'pending',
        }));

      const recentSubmissions = userSubmissions.slice(0, 5).map((submission) => ({
        id: submission.id,
        challengeTitle: submission.challenge?.title ?? 'Challenge',
        verdict: submission.verdict,
        createdAt: submission.createdAt,
      }));

      return {
        id: candidateUser.id,
        userId: candidateUser.id,
        user: {
          id: candidateUser.id,
          username: candidateUser.username,
          email: candidateUser.email,
          profileImage: candidateUser.profileImage,
          level: candidateUser.level,
          elo: candidateUser.elo,
          solvedCount: accepted.length,
          badges: candidateUser.earnedBadges.map((userBadge) => userBadge.badge),
        },
        stats: {
          totalSolved: accepted.length,
          easy,
          medium,
          hard,
          totalSubmissions,
          acceptanceRate,
        },
        recentSubmissions,
        appliedJobs,
      };
    });
  }

  async getHiringDashboard(companyId: string, userId: string) {
    const candidates = await this.getHiringCandidates(companyId, userId);

    const totalApplications = candidates.reduce(
      (sum, candidate) => sum + (candidate.appliedJobs?.length ?? 0),
      0,
    );

    const shortlistedCandidates = candidates.filter(
      (candidate) => candidate.stats.acceptanceRate >= 60,
    ).length;
    const hiredCandidates = candidates.filter(
      (candidate) => candidate.stats.acceptanceRate >= 80,
    ).length;

    return {
      totalApplications,
      aiInterviewsCompleted: 0,
      aiInterviewsPending: 0,
      humanInterviewsScheduled: 0,
      shortlistedCandidates,
      hiredCandidates,
    };
  }

  async sendAIInterview(companyId: string, userId: string, dto: any) {
    await this.requireCompanyAdmin(companyId, userId);

    const difficulty: 'easy' | 'medium' | 'hard' =
      dto?.difficulty && ['easy', 'medium', 'hard'].includes(dto.difficulty)
        ? dto.difficulty
        : 'medium';
    const domain = dto?.domain || 'SOFTWARE_ENGINEERING';
    const language = dto?.language || 'FR';

    // Create a real interview session for the candidate, so they can open it by ID.
    const session = await this.interviewsService.start(dto.candidateId, {
      difficulty,
      domain,
      language,
    });

    await this.emitAppNotification(
      dto.candidateId,
      'AI Interview Assigned',
      'You have been assigned an AI interview. Good luck!',
      `/interview?sessionId=${encodeURIComponent(session.id)}`,
      companyId,
      'ai_interview',
    );

    return {
      interviewId: session.id,
    };
  }

  async scheduleHumanInterview(companyId: string, userId: string, dto: any) {
    await this.requireCompanyAdmin(companyId, userId);

    const mockInterviewId = 'human_interview_' + Date.now();
    const scheduledAt = dto.scheduledAt ? String(dto.scheduledAt) : new Date().toISOString();

    await this.emitAppNotification(
      dto.candidateId,
      'Interview Scheduled',
      `You have been scheduled for an interview with the company. Date: ${new Date(scheduledAt).toLocaleString()}.`,
      `/dashboard?viewHumanInterview=${mockInterviewId}&scheduledAt=${encodeURIComponent(scheduledAt)}`,
      companyId,
      'interview',
    );

    // Mock response for now.
    return {
      id: mockInterviewId,
      ...dto,
      status: 'scheduled',
    };
  }

  async getPublicJobs(userId?: string) {
    const memberCompanyIds = userId
      ? (await this.prisma.companyMembership.findMany({
          where: { userId, status: 'active' },
          select: { companyId: true },
        })).map((membership) => membership.companyId)
      : [];

    return this.prisma.companyJobPosting.findMany({
      where: {
        status: 'active',
        companyId: { notIn: memberCompanyIds },
      },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCompanyJob(companyId: string, userId: string, dto: any) {
    await this.requireCompanyAdmin(companyId, userId);
    return this.prisma.companyJobPosting.create({
      data: {
        companyId,
        title: dto.title,
        description: dto.description,
        requirements: dto.requirements || [],
        salaryRange: dto.salaryRange,
        location: dto.location,
        type: dto.type || 'full_time',
        status: 'active',
      },
    });
  }

  async updateCompanyJob(companyId: string, jobId: string, userId: string, dto: any) {
    await this.requireCompanyAdmin(companyId, userId);
    const job = await this.prisma.companyJobPosting.findUnique({ where: { id: jobId } });
    if (!job || job.companyId !== companyId) {
      throw new NotFoundException('Job posting not found');
    }

    return this.prisma.companyJobPosting.update({
      where: { id: jobId },
      data: {
        title: dto.title ?? job.title,
        description: dto.description ?? job.description,
        requirements: dto.requirements ?? job.requirements,
        salaryRange: dto.salaryRange ?? job.salaryRange,
        location: dto.location ?? job.location,
        type: dto.type ?? job.type,
        status: dto.status ?? job.status,
      },
    });
  }

  async applyToJob(companyId: string, jobId: string, userId: string) {
    const job = await this.prisma.companyJobPosting.findUnique({ where: { id: jobId } });
    if (!job || job.companyId !== companyId) {
      throw new NotFoundException('Job posting not found');
    }
    if (job.applicants.includes(userId)) {
      throw new BadRequestException('Already applied to this job');
    }

    const updated = await this.prisma.companyJobPosting.update({
      where: { id: jobId },
      data: {
        applicants: { push: userId },
      },
    });

    const admins = await this.prisma.companyMembership.findMany({
      where: { companyId, role: { in: ['owner', 'recruiter'] }, status: 'active' },
    });
    const recipientId = admins[0]?.userId || job.companyId;
    if (recipientId) {
      await this.createCompanyNotification(companyId, 'application_received', recipientId);
      await this.emitAppNotification(
        recipientId,
        'New job application',
        `A candidate applied to ${job.title}.`,
        `/company/${companyId}/jobs`,
        jobId,
        'job',
      );
    }

    return updated;
  }

  async getCompanyForumGroups(companyId: string) {
    return this.prisma.companyForumGroup.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCompanyForumGroup(companyId: string, userId: string, dto: any) {
    await this.requireCompanyAdmin(companyId, userId);
    return this.prisma.companyForumGroup.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        visibility: dto.visibility || 'public',
      },
    });
  }

  async getCompanyForumPosts(companyId: string, userId: string) {
    const membership = await this.getCompanyMembership(companyId, userId);
    const where: any = { companyId };
    if (!membership || membership.status !== 'active') {
      where.visibility = 'public';
    }
    return this.prisma.companyForumPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCompanyForumPost(companyId: string, userId: string, dto: any) {
    const membership = await this.getCompanyMembership(companyId, userId);
    if (dto.visibility === 'company_only' && (!membership || membership.status !== 'active')) {
      throw new ForbiddenException('Only company members can post private content');
    }

    if (dto.groupId) {
      const group = await this.prisma.companyForumGroup.findUnique({ where: { id: dto.groupId } });
      if (!group || group.companyId !== companyId) {
        throw new NotFoundException('Forum group not found');
      }
    }

    return this.prisma.companyForumPost.create({
      data: {
        companyId,
        title: dto.title,
        content: dto.content,
        authorId: userId,
        groupId: dto.groupId,
        visibility: dto.visibility || 'public',
        isCompanyAnnouncement: dto.isCompanyAnnouncement ?? false,
        tags: dto.tags || [],
      },
    });
  }

  async getCompanyNotifications(companyId: string, userId: string) {
    const membership = await this.getCompanyMembership(companyId, userId);
    if (!membership || membership.status !== 'active') {
      throw new ForbiddenException('Access denied to company notifications');
    }

    const where: any = { companyId };
    if (membership.role !== 'owner' && membership.role !== 'recruiter') {
      where.OR = [{ userId }, { userId: null }];
    }

    return this.prisma.companyNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async markCompanyNotificationRead(notificationId: string, userId: string) {
    const notification = await this.prisma.companyNotification.findUnique({ where: { id: notificationId } });
    if (!notification) {
      throw new NotFoundException('Company notification not found');
    }
    if (notification.userId && notification.userId !== userId) {
      const membership = await this.getCompanyMembership(notification.companyId, userId);
      if (!membership || membership.role === 'member') {
        throw new ForbiddenException('Not allowed to update this notification');
      }
    }
    return this.prisma.companyNotification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async userIsCompanyMember(userId: string, companyId: string): Promise<boolean> {
    const membership = await this.prisma.companyMembership.findUnique({
      where: { companyId_userId: { companyId, userId } },
    });
    return membership?.status === 'active';
  }

  async getCompanyMember(companyId: string, userId: string): Promise<CompanyMemberResponseDto> {
    const membership = await this.prisma.companyMembership.findUnique({
      where: { companyId_userId: { companyId, userId } },
      include: { company: true },
    });
    if (!membership) {
      throw new NotFoundException('Not a member of this company');
    }
    return CompanyMemberResponseDto.fromPrisma(membership);
  }

  async getMyAnnouncements(userId: string) {
    const activeMemberships = await this.prisma.companyMembership.findMany({
      where: { userId, status: 'active' },
      select: { companyId: true },
    });

    const companyIds = activeMemberships.map((m) => m.companyId);
    if (companyIds.length === 0) return [];

    const rows = await this.prisma.hackathonAnnouncement.findMany({
      where: {
        hackathon: {
          companyId: { in: companyIds },
        },
      },
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
            companyId: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 20,
    });

    return rows.map((a) => ({
      id: a.id,
      type: 'hackathon_announcement',
      title: a.hackathon?.title || 'Company Update',
      content: a.content,
      isPinned: a.isPinned,
      createdAt: a.createdAt,
      hackathonId: a.hackathonId,
      companyId: a.hackathon?.companyId || null,
    }));
  }
}
