import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationEmitterService } from '../notifications/notification-emitter.service';
import { NotificationCategory, NotificationPriority, NotificationType } from '../notifications/notification.constants';
import {
  CreateCompanyDto,
  InviteUserToCompanyDto,
  UpdateCompanyDto,
  UpdateCompanyMemberRoleDto,
} from './dto/company-request.dto';
import { CompanyResponseDto, CompanyMemberResponseDto } from './dto/company-response.dto';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationEmitter: NotificationEmitterService,
  ) {}

  private async emitCompanySystemNotification(
    userId: string,
    title: string,
    message: string,
    actionUrl = '/companies',
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    entityId?: string,
  ) {
    await this.notificationEmitter.emit({
      userId,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      category: NotificationCategory.SYSTEM,
      priority,
      title,
      message,
      actionUrl,
      entityId,
      entityType: 'Company',
    });
  }

  private async getActiveCompanyAdminIds(companyId: string): Promise<string[]> {
    const admins = await this.prisma.companyMember.findMany({
      where: { companyId, role: 'admin', status: 'active' },
      select: { userId: true },
    });

    return admins.map((admin) => admin.userId);
  }

  private isP2002(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
  }

  private async ensureCompanyAdmin(companyId: string, requester: { id?: string; role?: string }) {
    if (requester.role === 'admin') {
      return;
    }

    if (!requester.id) {
      throw new ForbiddenException('User not authenticated');
    }

    const membership = await this.prisma.companyMember.findUnique({
      where: { companyId_userId: { companyId, userId: requester.id } },
    });

    if (!membership || membership.status !== 'active' || membership.role !== 'admin') {
      throw new ForbiddenException('Company admin access required');
    }

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.status !== 'active') {
      throw new ForbiddenException('Company is not active on the platform');
    }
  }

  private normalizeText(value?: string) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeNullableText(value?: string) {
    if (value === undefined) return undefined;
    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  private async countActiveAdmins(companyId: string, excludeUserId?: string): Promise<number> {
    return this.prisma.companyMember.count({
      where: {
        companyId,
        role: 'admin',
        status: 'active',
        ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
      },
    });
  }

  async createCompany(userId: string, dto: CreateCompanyDto): Promise<CompanyMemberResponseDto> {
    const slug = dto.slug.trim().toLowerCase();

    const blockingMembership = await this.prisma.companyMember.findFirst({
      where: {
        userId,
        status: { in: ['active', 'pending'] },
      },
      include: { company: true },
      orderBy: { joinedAt: 'desc' },
    });

    if (blockingMembership) {
      if (blockingMembership.status === 'active') {
        throw new BadRequestException(
          `You already have an active company membership (${blockingMembership.company?.name || 'company'})`,
        );
      }

      throw new BadRequestException(
        `You already have a pending company membership/request (${blockingMembership.company?.name || 'company'})`,
      );
    }

    const existingCompany = await this.prisma.company.findUnique({
      where: { slug },
    });

    if (existingCompany) {
      throw new BadRequestException('Company slug already exists');
    }

    try {
      const company = await this.prisma.company.create({
        data: {
          name: dto.name.trim(),
          slug,
          status: 'pending',
          joinPolicy: dto.joinPolicy || 'approval',
          logoUrl: this.normalizeText(dto.logoUrl),
          website: this.normalizeText(dto.website),
          domain: this.normalizeText(dto.domain),
        },
      });

      const membership = await this.prisma.companyMember.create({
        data: {
          companyId: company.id,
          userId,
          role: 'admin',
          status: 'pending',
          joinedAt: new Date(),
        },
        include: {
          company: true,
          user: true,
        },
      });

      this.logger.log(`User ${userId} created company ${company.id} (pending platform approval)`);

      return CompanyMemberResponseDto.fromPrisma(membership);
    } catch (error) {
      if (this.isP2002(error)) {
        throw new BadRequestException('Company slug already exists');
      }

      throw error;
    }
  }

  /**
   * Get all public companies
   */
  async getPublicCompanies(): Promise<CompanyResponseDto[]> {
    const companies = await this.prisma.company.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
    });

    return companies.map((c) => CompanyResponseDto.fromPrisma(c));
  }

  /**
   * Get user's company memberships
   */
  async getUserCompanies(userId: string): Promise<CompanyMemberResponseDto[]> {
    const memberships = await this.prisma.companyMember.findMany({
      where: { userId },
      include: { company: true, user: true },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => CompanyMemberResponseDto.fromPrisma(m));
  }

  /**
   * Get single company by ID
   */
  async getCompanyById(companyId: string): Promise<CompanyResponseDto> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return CompanyResponseDto.fromPrisma(company);
  }

  async updateCompany(
    companyId: string,
    dto: UpdateCompanyDto,
    requester: { id?: string; role?: string },
  ): Promise<CompanyResponseDto> {
    await this.ensureCompanyAdmin(companyId, requester);

    const data: {
      name?: string;
      website?: string | null;
      domain?: string | null;
      logoUrl?: string | null;
      joinPolicy?: 'open' | 'approval' | 'invite_only';
    } = {};

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.website !== undefined) data.website = this.normalizeNullableText(dto.website);
    if (dto.domain !== undefined) data.domain = this.normalizeNullableText(dto.domain);
    if (dto.logoUrl !== undefined) data.logoUrl = this.normalizeNullableText(dto.logoUrl);
    if (dto.joinPolicy !== undefined) data.joinPolicy = dto.joinPolicy;

    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data,
    });

    const activeMembers = await this.prisma.companyMember.findMany({
      where: { companyId, status: 'active' },
      select: { userId: true },
    });

    await Promise.allSettled(
      activeMembers.map((member) =>
        this.emitCompanySystemNotification(
          member.userId,
          'Company settings updated',
          `${updated.name} profile or membership settings were updated by a company admin.`,
          '/company/settings',
          NotificationPriority.LOW,
          companyId,
        ),
      ),
    );

    return CompanyResponseDto.fromPrisma(updated);
  }

  async inviteUserByUsername(
    companyId: string,
    dto: InviteUserToCompanyDto,
    requester: { id?: string; role?: string },
  ) {
    await this.ensureCompanyAdmin(companyId, requester);

    const username = dto.username.trim();
    if (!username) {
      throw new BadRequestException('Username is required');
    }

    const targetUser = await this.prisma.user.findUnique({ where: { username } });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (requester.id && requester.id === targetUser.id) {
      throw new BadRequestException('You cannot invite yourself');
    }

    const role: 'member' = 'member';
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const existingMembership = await this.prisma.companyMember.findUnique({
      where: {
        companyId_userId: { companyId, userId: targetUser.id },
      },
      include: { company: true, user: true },
    });

    if (existingMembership) {
      if (existingMembership.status === 'active') {
        throw new BadRequestException('User is already an active company member');
      }

      if (existingMembership.status === 'pending') {
        throw new BadRequestException('An invitation for this user is already pending');
      }

      const updated = await this.prisma.companyMember.update({
        where: { id: existingMembership.id },
        data: {
          status: 'pending',
          role,
        },
        include: { company: true, user: true },
      });

      await this.emitCompanySystemNotification(
        targetUser.id,
        `Invitation to join ${company.name}`,
        `You have a pending ${role} invitation from ${company.name}.`,
        '/companies',
        NotificationPriority.HIGH,
        companyId,
      );

      return CompanyMemberResponseDto.fromPrisma(updated);
    }

    const membership = await this.prisma.companyMember.create({
      data: {
        companyId,
        userId: targetUser.id,
        role,
        status: 'pending',
        joinedAt: new Date(),
      },
      include: { company: true, user: true },
    });

    await this.emitCompanySystemNotification(
      targetUser.id,
      `Invitation to join ${company.name}`,
      `You have been invited as ${role} to join ${company.name}.`,
      '/companies',
      NotificationPriority.HIGH,
      companyId,
    );

    return CompanyMemberResponseDto.fromPrisma(membership);
  }

  async getMyInvitations(userId: string) {
    const memberships = await this.prisma.companyMember.findMany({
      where: {
        userId,
        status: 'pending',
        role: 'member',
      },
      include: { company: true, user: true },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => CompanyMemberResponseDto.fromPrisma(m));
  }

  async acceptMyInvitation(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: {
        companyId_userId: { companyId, userId },
      },
      include: { company: true, user: true },
    });

    if (!membership) {
      throw new NotFoundException('Invitation not found');
    }

    if (membership.status !== 'pending') {
      throw new BadRequestException('Only pending invitations can be accepted');
    }

    if (membership.role === 'admin') {
      throw new BadRequestException('This pending membership is not a user invitation');
    }

    if (!membership.company || membership.company.status !== 'active') {
      throw new ForbiddenException('This company is not active on the platform');
    }

    const updated = await this.prisma.companyMember.update({
      where: { id: membership.id },
      data: {
        status: 'active',
        joinedAt: new Date(),
      },
      include: { company: true, user: true },
    });

    const adminIds = await this.getActiveCompanyAdminIds(companyId);
    await Promise.allSettled(
      adminIds.map((adminId) =>
        this.emitCompanySystemNotification(
          adminId,
          'Invitation accepted',
          `${updated.user?.username || 'A user'} accepted invitation to ${updated.company?.name || 'company'}.`,
          '/company/members',
          NotificationPriority.MEDIUM,
          companyId,
        ),
      ),
    );

    return CompanyMemberResponseDto.fromPrisma(updated);
  }

  async rejectMyInvitation(userId: string, companyId: string) {
    const membership = await this.prisma.companyMember.findUnique({
      where: {
        companyId_userId: { companyId, userId },
      },
      include: { company: true, user: true },
    });

    if (!membership) {
      throw new NotFoundException('Invitation not found');
    }

    if (membership.status !== 'pending') {
      throw new BadRequestException('Only pending invitations can be rejected');
    }

    if (membership.role === 'admin') {
      throw new BadRequestException('This pending membership is not a user invitation');
    }

    const updated = await this.prisma.companyMember.update({
      where: { id: membership.id },
      data: { status: 'rejected' },
      include: { company: true, user: true },
    });

    const adminIds = await this.getActiveCompanyAdminIds(companyId);
    await Promise.allSettled(
      adminIds.map((adminId) =>
        this.emitCompanySystemNotification(
          adminId,
          'Invitation declined',
          `${updated.user?.username || 'A user'} declined invitation to ${updated.company?.name || 'company'}.`,
          '/company/members',
          NotificationPriority.LOW,
          companyId,
        ),
      ),
    );

    return CompanyMemberResponseDto.fromPrisma(updated);
  }

  async getPendingCompanies(): Promise<CompanyResponseDto[]> {
    const companies = await this.prisma.company.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });

    return companies.map((company) => CompanyResponseDto.fromPrisma(company));
  }

  async getAdminCompanies(status?: string): Promise<CompanyResponseDto[]> {
    const allowedStatuses = new Set(['pending', 'active', 'suspended', 'rejected']);

    if (status && !allowedStatuses.has(status)) {
      throw new BadRequestException('Invalid company status filter');
    }

    const companies = await this.prisma.company.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
    });

    return companies.map((company) => CompanyResponseDto.fromPrisma(company));
  }

  async approveCompanyAdmission(companyId: string): Promise<CompanyResponseDto> {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.status !== 'pending') {
      throw new BadRequestException('Only pending companies can be approved');
    }

    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: { status: 'active' },
    });

    // Activate the creator admin membership once the company is admitted.
    await this.prisma.companyMember.updateMany({
      where: { companyId, role: 'admin', status: 'pending' },
      data: { status: 'active' },
    });

    const adminMembers = await this.prisma.companyMember.findMany({
      where: { companyId, role: 'admin', status: 'active' },
      select: { userId: true },
    });

    await Promise.allSettled(
      adminMembers.map((member) =>
        this.emitCompanySystemNotification(
          member.userId,
          'Company approved',
          `${updatedCompany.name} has been approved by platform admin.`,
          '/company/overview',
          NotificationPriority.HIGH,
          companyId,
        ),
      ),
    );

    this.logger.log(`Company ${companyId} approved by platform admin`);

    return CompanyResponseDto.fromPrisma(updatedCompany);
  }

  async rejectCompanyAdmission(companyId: string): Promise<CompanyResponseDto> {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.status !== 'pending') {
      throw new BadRequestException('Only pending companies can be rejected');
    }

    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: { status: 'rejected' },
    });

    await this.prisma.companyMember.updateMany({
      where: { companyId, role: 'admin', status: 'pending' },
      data: { status: 'rejected' },
    });

    const affectedMembers = await this.prisma.companyMember.findMany({
      where: { companyId, role: 'admin', status: 'rejected' },
      select: { userId: true },
    });

    await Promise.allSettled(
      affectedMembers.map((member) =>
        this.emitCompanySystemNotification(
          member.userId,
          'Company admission rejected',
          `${updatedCompany.name} was rejected by platform admin.`,
          '/companies',
          NotificationPriority.HIGH,
          companyId,
        ),
      ),
    );

    this.logger.log(`Company ${companyId} rejected by platform admin`);

    return CompanyResponseDto.fromPrisma(updatedCompany);
  }

  async suspendCompany(companyId: string): Promise<CompanyResponseDto> {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.status !== 'active') {
      throw new BadRequestException('Only active companies can be suspended');
    }

    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: { status: 'suspended' },
    });

    const activeMembers = await this.prisma.companyMember.findMany({
      where: { companyId, status: 'active' },
      select: { userId: true },
    });

    await Promise.allSettled(
      activeMembers.map((member) =>
        this.emitCompanySystemNotification(
          member.userId,
          'Company suspended',
          `${updatedCompany.name} has been suspended by platform admin.`,
          '/companies',
          NotificationPriority.HIGH,
          companyId,
        ),
      ),
    );

    this.logger.log(`Company ${companyId} suspended by platform admin`);

    return CompanyResponseDto.fromPrisma(updatedCompany);
  }

  async reactivateCompany(companyId: string): Promise<CompanyResponseDto> {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (!['suspended', 'rejected'].includes(company.status)) {
      throw new BadRequestException('Only suspended or rejected companies can be reactivated');
    }

    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: { status: 'active' },
    });

    // If the creator admin was rejected during admission, restore admin access on reactivation.
    await this.prisma.companyMember.updateMany({
      where: { companyId, role: 'admin', status: 'rejected' },
      data: { status: 'active' },
    });

    const activeMembers = await this.prisma.companyMember.findMany({
      where: { companyId, status: 'active' },
      select: { userId: true },
    });

    await Promise.allSettled(
      activeMembers.map((member) =>
        this.emitCompanySystemNotification(
          member.userId,
          'Company reactivated',
          `${updatedCompany.name} is active again on the platform.`,
          '/company/overview',
          NotificationPriority.MEDIUM,
          companyId,
        ),
      ),
    );

    this.logger.log(`Company ${companyId} reactivated by platform admin`);

    return CompanyResponseDto.fromPrisma(updatedCompany);
  }

  async leaveCompany(userId: string, companyId: string): Promise<{ success: boolean }> {
    const membership = await this.prisma.companyMember.findUnique({
      where: {
        companyId_userId: { companyId, userId },
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.role === 'admin' && membership.status === 'active') {
      const otherActiveAdmins = await this.countActiveAdmins(companyId, userId);
      if (otherActiveAdmins === 0) {
        throw new BadRequestException('Cannot leave company as the last active admin');
      }
    }

    await this.prisma.companyMember.delete({
      where: { id: membership.id },
    });

    return { success: true };
  }

  /**
   * Check if user can access company-scoped content
   * (used for enterprise hackathon access control)
   */
  async userIsCompanyMember(
    userId: string,
    companyId: string,
  ): Promise<boolean> {
    const membership = await this.prisma.companyMember.findUnique({
      where: {
        companyId_userId: { companyId, userId },
      },
    });

    return membership?.status === 'active';
  }

  /**
   * Get company member details
   */
  async getCompanyMember(
    companyId: string,
    userId: string,
  ): Promise<CompanyMemberResponseDto> {
    const membership = await this.prisma.companyMember.findUnique({
      where: {
        companyId_userId: { companyId, userId },
      },
      include: { company: true, user: true },
    });

    if (!membership) {
      throw new NotFoundException('Not a member of this company');
    }

    return CompanyMemberResponseDto.fromPrisma(membership);
  }

  async getCompanyMembers(companyId: string, requester: { id?: string; role?: string }) {
    await this.ensureCompanyAdmin(companyId, requester);

    const memberships = await this.prisma.companyMember.findMany({
      where: { companyId },
      include: { company: true, user: true },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((member) => CompanyMemberResponseDto.fromPrisma(member));
  }

  async approveMembership(companyId: string, targetUserId: string, requester: { id?: string; role?: string }) {
    await this.ensureCompanyAdmin(companyId, requester);

    const membership = await this.prisma.companyMember.findUnique({
      where: {
        companyId_userId: { companyId, userId: targetUserId },
      },
      include: { company: true, user: true },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (!['pending', 'suspended'].includes(membership.status)) {
      throw new BadRequestException('Only pending or suspended memberships can be approved');
    }

    const updated = await this.prisma.companyMember.update({
      where: { id: membership.id },
      data: { status: 'active' },
      include: { company: true, user: true },
    });

    await this.emitCompanySystemNotification(
      targetUserId,
      'Membership approved',
      `Your membership in ${updated.company?.name || 'company'} is now active.`,
      '/company/overview',
      NotificationPriority.HIGH,
      companyId,
    );

    return CompanyMemberResponseDto.fromPrisma(updated);
  }

  async rejectMembership(companyId: string, targetUserId: string, requester: { id?: string; role?: string }) {
    await this.ensureCompanyAdmin(companyId, requester);

    const membership = await this.prisma.companyMember.findUnique({
      where: {
        companyId_userId: { companyId, userId: targetUserId },
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.status !== 'pending') {
      throw new BadRequestException('Only pending memberships can be rejected');
    }

    const updated = await this.prisma.companyMember.update({
      where: { id: membership.id },
      data: { status: 'rejected' },
      include: { company: true, user: true },
    });

    await this.emitCompanySystemNotification(
      targetUserId,
      'Membership rejected',
      `Your membership request to ${updated.company?.name || 'this company'} was rejected.`,
      '/companies',
      NotificationPriority.MEDIUM,
      companyId,
    );

    return CompanyMemberResponseDto.fromPrisma(updated);
  }

  async suspendMembership(companyId: string, targetUserId: string, requester: { id?: string; role?: string }) {
    await this.ensureCompanyAdmin(companyId, requester);

    const membership = await this.prisma.companyMember.findUnique({
      where: {
        companyId_userId: { companyId, userId: targetUserId },
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.status !== 'active') {
      throw new BadRequestException('Only active memberships can be suspended');
    }

    if (membership.role === 'admin') {
      const otherActiveAdmins = await this.countActiveAdmins(companyId, targetUserId);
      if (otherActiveAdmins === 0) {
        throw new BadRequestException('Cannot suspend the last active admin');
      }
    }

    const updated = await this.prisma.companyMember.update({
      where: { id: membership.id },
      data: { status: 'suspended' },
      include: { company: true, user: true },
    });

    await this.emitCompanySystemNotification(
      targetUserId,
      'Membership suspended',
      `Your membership in ${updated.company?.name || 'this company'} has been suspended.`,
      '/companies',
      NotificationPriority.HIGH,
      companyId,
    );

    return CompanyMemberResponseDto.fromPrisma(updated);
  }

  async removeMembership(companyId: string, targetUserId: string, requester: { id?: string; role?: string }) {
    await this.ensureCompanyAdmin(companyId, requester);

    const membership = await this.prisma.companyMember.findUnique({
      where: {
        companyId_userId: { companyId, userId: targetUserId },
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.role === 'admin' && membership.status === 'active') {
      const otherActiveAdmins = await this.countActiveAdmins(companyId, targetUserId);
      if (otherActiveAdmins === 0) {
        throw new BadRequestException('Cannot remove the last active admin');
      }
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    await this.prisma.companyMember.delete({
      where: { id: membership.id },
    });

    await this.emitCompanySystemNotification(
      targetUserId,
      'Removed from company',
      `You were removed from ${company?.name || 'this company'}.`,
      '/companies',
      NotificationPriority.HIGH,
      companyId,
    );

    return { success: true };
  }

  async updateMemberRole(
    companyId: string,
    targetUserId: string,
    dto: UpdateCompanyMemberRoleDto,
    requester: { id?: string; role?: string },
  ) {
    await this.ensureCompanyAdmin(companyId, requester);

    const membership = await this.prisma.companyMember.findUnique({
      where: {
        companyId_userId: { companyId, userId: targetUserId },
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.status !== 'active') {
      throw new BadRequestException('Only active memberships can change role');
    }

    if (membership.role === 'admin' && dto.role !== 'admin') {
      const otherActiveAdmins = await this.countActiveAdmins(companyId, targetUserId);
      if (otherActiveAdmins === 0) {
        throw new BadRequestException('Cannot demote the last active admin');
      }
    }

    const updated = await this.prisma.companyMember.update({
      where: { id: membership.id },
      data: { role: dto.role },
      include: { company: true, user: true },
    });

    await this.emitCompanySystemNotification(
      targetUserId,
      'Company role updated',
      `Your role in ${updated.company?.name || 'this company'} is now ${dto.role}.`,
      '/company/overview',
      NotificationPriority.MEDIUM,
      companyId,
    );

    return CompanyMemberResponseDto.fromPrisma(updated);
  }

  /**
   * Get announcements for the current user's active companies.
   * Source: HackathonAnnouncement linked through Hackathon.companyId
   */
  async getMyAnnouncements(userId: string) {
    const activeMemberships = await this.prisma.companyMember.findMany({
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
