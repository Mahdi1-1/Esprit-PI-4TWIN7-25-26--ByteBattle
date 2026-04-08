import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyResponseDto, CompanyMemberResponseDto } from './dto/company-response.dto';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(private readonly prisma: PrismaService) {}

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
      include: { company: true },
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

  /**
   * User joins a company based on joinPolicy
   *
   * - open: immediately active
   * - approval: status pending
   * - invite_only: forbidden
   */
  async joinCompany(
    userId: string,
    companyId: string,
  ): Promise<CompanyMemberResponseDto> {
    // Check if company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if user already has membership
    const existingMembership = await this.prisma.companyMember.findUnique({
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
      // If rejected, allow re-applying
    }

    // Enforce join policy
    let status: 'pending' | 'active' = 'pending';

    if (company.joinPolicy === 'open') {
      status = 'active';
    } else if (company.joinPolicy === 'approval') {
      status = 'pending';
    } else if (company.joinPolicy === 'invite_only') {
      throw new ForbiddenException(
        'This company is invite-only. Please contact an administrator.',
      );
    }

    // Create membership (delete previous rejected one if exists)
    if (existingMembership?.status === 'rejected') {
      await this.prisma.companyMember.delete({
        where: { id: existingMembership.id },
      });
    }

    const membership = await this.prisma.companyMember.create({
      data: {
        companyId,
        userId,
        role: 'member', // Always start as member
        status,
        joinedAt: new Date(),
      },
      include: { company: true },
    });

    this.logger.log(
      `User ${userId} joined company ${companyId} with status: ${status}`,
    );

    return CompanyMemberResponseDto.fromPrisma(membership);
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
      include: { company: true },
    });

    if (!membership) {
      throw new NotFoundException('Not a member of this company');
    }

    return CompanyMemberResponseDto.fromPrisma(membership);
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
