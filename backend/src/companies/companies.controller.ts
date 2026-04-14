import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CompaniesService } from './companies.service';
import {
  CompanyResponseDto,
  CompanyMemberResponseDto,
} from './dto/company-response.dto';
import {
  CreateCompanyDto,
  InviteUserToCompanyDto,
  UpdateCompanyDto,
  UpdateCompanyMemberRoleDto,
} from './dto/company-request.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  /**
   * GET /companies/admin/pending
   * Platform admin: list pending company admissions
   */
  @Get('admin/pending')
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  async getPendingCompanies(): Promise<CompanyResponseDto[]> {
    return this.companiesService.getPendingCompanies();
  }

  /**
   * GET /companies/admin
   * Platform admin: list companies (all statuses) with optional status filter
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  async getAdminCompanies(@Query('status') status?: string): Promise<CompanyResponseDto[]> {
    return this.companiesService.getAdminCompanies(status);
  }

  /**
   * POST /companies/admin/:id/approve
   * Platform admin: approve company admission
   */
  @Post('admin/:id/approve')
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  async approveCompanyAdmission(@Param('id') companyId: string): Promise<CompanyResponseDto> {
    return this.companiesService.approveCompanyAdmission(companyId);
  }

  /**
   * POST /companies/admin/:id/reject
   * Platform admin: reject company admission
   */
  @Post('admin/:id/reject')
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  async rejectCompanyAdmission(@Param('id') companyId: string): Promise<CompanyResponseDto> {
    return this.companiesService.rejectCompanyAdmission(companyId);
  }

  /**
   * POST /companies/admin/:id/suspend
   * Platform admin: suspend active company
   */
  @Post('admin/:id/suspend')
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  async suspendCompany(@Param('id') companyId: string): Promise<CompanyResponseDto> {
    return this.companiesService.suspendCompany(companyId);
  }

  /**
   * POST /companies/admin/:id/reactivate
   * Platform admin: reactivate suspended/rejected company
   */
  @Post('admin/:id/reactivate')
  @UseGuards(JwtAuthGuard)
  @Roles('admin')
  async reactivateCompany(@Param('id') companyId: string): Promise<CompanyResponseDto> {
    return this.companiesService.reactivateCompany(companyId);
  }

  /**
   * POST /companies
    * Create a new company admission request
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createCompany(
    @CurrentUser() user: any,
    @Body() dto: CreateCompanyDto,
  ): Promise<CompanyMemberResponseDto> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }

    return this.companiesService.createCompany(user.id, dto);
  }

  /**
   * GET /companies
   * List all public companies
   */
  @Get()
  async getPublicCompanies(): Promise<CompanyResponseDto[]> {
    return this.companiesService.getPublicCompanies();
  }

  /**
   * GET /companies/my
   * Get current user's company memberships
   */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyCompanies(
    @CurrentUser() user: any,
  ): Promise<CompanyMemberResponseDto[]> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.getUserCompanies(user.id);
  }

  /**
   * GET /companies/my/announcements
   * Get announcements for active company memberships
   */
  @Get('my/announcements')
  @UseGuards(JwtAuthGuard)
  async getMyAnnouncements(@CurrentUser() user: any) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.getMyAnnouncements(user.id);
  }

  /**
   * GET /companies/my/invitations
   * List my pending company invitations
   */
  @Get('my/invitations')
  @UseGuards(JwtAuthGuard)
  async getMyInvitations(@CurrentUser() user: any): Promise<CompanyMemberResponseDto[]> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }

    return this.companiesService.getMyInvitations(user.id);
  }

  /**
   * GET /companies/:id
   * Get single company details
   */
  @Get(':id')
  async getCompany(@Param('id') id: string): Promise<CompanyResponseDto> {
    return this.companiesService.getCompanyById(id);
  }

  /**
   * PATCH /companies/:id
   * Company admin/platform admin: update company profile and join policy
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateCompany(
    @Param('id') companyId: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: any,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.updateCompany(companyId, dto, user);
  }

  /**
   * POST /companies/:id/invitations
   * Company admin: invite user by username
   */
  @Post(':id/invitations')
  @UseGuards(JwtAuthGuard)
  async inviteUserByUsername(
    @Param('id') companyId: string,
    @Body() dto: InviteUserToCompanyDto,
    @CurrentUser() user: any,
  ): Promise<CompanyMemberResponseDto> {
    return this.companiesService.inviteUserByUsername(companyId, dto, user);
  }

  /**
   * POST /companies/:id/invitations/accept
   * Invited user accepts company invitation
   */
  @Post(':id/invitations/accept')
  @UseGuards(JwtAuthGuard)
  async acceptInvitation(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
  ): Promise<CompanyMemberResponseDto> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }

    return this.companiesService.acceptMyInvitation(user.id, companyId);
  }

  /**
   * POST /companies/:id/invitations/reject
   * Invited user rejects company invitation
   */
  @Post(':id/invitations/reject')
  @UseGuards(JwtAuthGuard)
  async rejectInvitation(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
  ): Promise<CompanyMemberResponseDto> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }

    return this.companiesService.rejectMyInvitation(user.id, companyId);
  }

  /**
   * POST /companies/:id/leave
   * Leave a company
   */
  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  async leaveCompany(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
  ): Promise<{ success: boolean }> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }

    return this.companiesService.leaveCompany(user.id, companyId);
  }

  /**
   * GET /companies/:id/members
   * Get all members for a company
   */
  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  async getCompanyMembers(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
  ): Promise<CompanyMemberResponseDto[]> {
    return this.companiesService.getCompanyMembers(companyId, user);
  }

  /**
   * POST /companies/:id/members/:userId/approve
   */
  @Post(':id/members/:userId/approve')
  @UseGuards(JwtAuthGuard)
  async approveMembership(
    @Param('id') companyId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ): Promise<CompanyMemberResponseDto> {
    return this.companiesService.approveMembership(companyId, userId, user);
  }

  /**
   * POST /companies/:id/members/:userId/reject
   */
  @Post(':id/members/:userId/reject')
  @UseGuards(JwtAuthGuard)
  async rejectMembership(
    @Param('id') companyId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ): Promise<CompanyMemberResponseDto> {
    return this.companiesService.rejectMembership(companyId, userId, user);
  }

  /**
   * POST /companies/:id/members/:userId/suspend
   */
  @Post(':id/members/:userId/suspend')
  @UseGuards(JwtAuthGuard)
  async suspendMembership(
    @Param('id') companyId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ): Promise<CompanyMemberResponseDto> {
    return this.companiesService.suspendMembership(companyId, userId, user);
  }

  /**
   * DELETE /companies/:id/members/:userId
   */
  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  async removeMembership(
    @Param('id') companyId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ): Promise<{ success: boolean }> {
    return this.companiesService.removeMembership(companyId, userId, user);
  }

  /**
   * PATCH /companies/:id/members/:userId/role
   */
  @Patch(':id/members/:userId/role')
  @UseGuards(JwtAuthGuard)
  async updateMemberRole(
    @Param('id') companyId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateCompanyMemberRoleDto,
    @CurrentUser() user: any,
  ): Promise<CompanyMemberResponseDto> {
    return this.companiesService.updateMemberRole(companyId, userId, dto, user);
  }
}
