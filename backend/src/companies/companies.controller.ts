import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CompaniesService } from './companies.service';
import { CompanyResponseDto, CompanyMemberResponseDto, JoinCompanyResultDto } from './dto/company-response.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

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
   * GET /companies/:id
   * Get single company details
   */
  @Get(':id')
  async getCompany(@Param('id') id: string): Promise<CompanyResponseDto> {
    return this.companiesService.getCompanyById(id);
  }

  /**
   * POST /companies/:id/join
   * User joins a company
   * - Respects joinPolicy (open | approval | invite_only)
   * - Creates CompanyMember with role='member'
   * - Status based on joinPolicy
   */
  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinCompany(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
  ): Promise<JoinCompanyResultDto> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }

    const membership = await this.companiesService.joinCompany(
      user.id,
      companyId,
    );

    return {
      success: true,
      membership,
      message:
        membership.status === 'active'
          ? 'Successfully joined company'
          : 'Join request sent. Awaiting admin approval.',
    };
  }
}
