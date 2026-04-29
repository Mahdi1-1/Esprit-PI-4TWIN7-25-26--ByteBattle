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
import { CompaniesService } from './companies.service';
import {
  CompanyResponseDto,
  CompanyMemberResponseDto,
  JoinCompanyResultDto,
} from './dto/company-response.dto';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CreateCompanyRoadmapDto,
  AssignRoadmapDto,
  CreateCompanyCourseDto,
  CreateCompanyJobDto,
  CreateCompanyForumGroupDto,
  CreateCompanyForumPostDto,
  UpdateRoadmapProgressDto,
  UpdateCourseProgressDto,
  UpdateCompanyJobDto,
} from './dto/company-request.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  async getPublicCompanies(): Promise<CompanyResponseDto[]> {
    return this.companiesService.getPublicCompanies();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCompany(
    @Body() dto: CreateCompanyDto,
    @CurrentUser() user: any,
  ): Promise<CompanyResponseDto> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.createCompany(user.id, dto);
  }

  @Get('my-company')
  @UseGuards(JwtAuthGuard)
  async getMyCompany(@CurrentUser() user: any) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.getMyCompany(user.id);
  }

  @Post('request-verification')
  @UseGuards(JwtAuthGuard)
  async requestVerification(@CurrentUser() user: any) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.requestVerification(user.id);
  }

  @Post('join-code')
  @UseGuards(JwtAuthGuard)
  async joinByCode(
    @Body('code') code: string,
    @CurrentUser() user: any,
  ): Promise<JoinCompanyResultDto> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    if (!code) {
      throw new BadRequestException('Join code is required');
    }
    const membership = await this.companiesService.joinByCode(user.id, code);
    return {
      success: true,
      membership,
      message: membership.status === 'active' ? 'Successfully joined company' : 'Join request sent. Awaiting admin approval.',
    };
  }

  @Post(':id/join-code/regenerate')
  @UseGuards(JwtAuthGuard)
  async regenerateJoinCode(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.regenerateJoinCode(companyId, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateCompany(
    @Param('id') companyId: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: any,
  ): Promise<CompanyResponseDto> {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.updateCompany(companyId, user.id, dto);
  }

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

  @Get('my/announcements')
  @UseGuards(JwtAuthGuard)
  async getMyAnnouncements(@CurrentUser() user: any) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.getMyAnnouncements(user.id);
  }

  @Get('public/jobs')
  @UseGuards(JwtAuthGuard)
  async getFilteredPublicJobs(@CurrentUser() user: any) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.getPublicJobs(user.id);
  }

  @Get(':id')
  async getCompany(@Param('id') id: string): Promise<CompanyResponseDto> {
    return this.companiesService.getCompanyById(id);
  }

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

  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  async getCompanyMembers(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.getCompanyMembers(companyId, user.id);
  }

  @Patch(':id/members/:userId/role')
  @UseGuards(JwtAuthGuard)
  async updateMemberRole(
    @Param('id') companyId: string,
    @Param('userId') targetUserId: string,
    @Body('role') role: string,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.updateMemberRole(companyId, targetUserId, role, user.id);
  }

  @Get(':id/teams')
  @UseGuards(JwtAuthGuard)
  async getCompanyTeams(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.getCompanyTeams(companyId, user.id);
  }

  @Post(':id/teams')
  @UseGuards(JwtAuthGuard)
  async createCompanyTeam(
    @Param('id') companyId: string,
    @Body('name') name: string,
    @Body('description') description: string,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.createCompanyTeam(companyId, user.id, name, description);
  }

  @Patch(':id/members/:userId/team')
  @UseGuards(JwtAuthGuard)
  async assignMemberToTeam(
    @Param('id') companyId: string,
    @Param('userId') targetUserId: string,
    @Body('teamId') teamId: string | null,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.assignMemberToTeam(companyId, targetUserId, teamId, user.id);
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  async removeMember(
    @Param('id') companyId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.removeMember(companyId, targetUserId, user.id);
  }

  @Post(':id/invite')
  @UseGuards(JwtAuthGuard)
  async inviteMember(
    @Param('id') companyId: string,
    @Body('email') email: string,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.inviteMember(companyId, email, user.id);
  }

  @Get(':id/join-requests')
  @UseGuards(JwtAuthGuard)
  async getJoinRequests(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.getPendingJoinRequests(companyId, user.id);
  }

  @Post(':id/join-requests/:userId/respond')
  @UseGuards(JwtAuthGuard)
  async respondToJoinRequest(
    @Param('id') companyId: string,
    @Param('userId') targetUserId: string,
    @Query('action') action: 'approve' | 'reject',
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.respondToJoinRequest(
      companyId,
      targetUserId,
      action,
      user.id,
    );
  }

  @Get(':id([0-9a-fA-F]{24})/roadmaps')
  @UseGuards(JwtAuthGuard)
  async getCompanyRoadmaps(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.getCompanyRoadmaps(companyId, user.id);
  }

  @Post(':id([0-9a-fA-F]{24})/roadmaps')
  @UseGuards(JwtAuthGuard)
  async createCompanyRoadmap(
    @Param('id') companyId: string,
    @Body() dto: CreateCompanyRoadmapDto,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.createCompanyRoadmap(companyId, user.id, dto);
  }

  @Post(':id([0-9a-fA-F]{24})/roadmaps/:roadmapId/assign')
  @UseGuards(JwtAuthGuard)
  async assignRoadmap(
    @Param('id') companyId: string,
    @Param('roadmapId') roadmapId: string,
    @Body() dto: AssignRoadmapDto,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.assignRoadmap(
      companyId,
      roadmapId,
      user.id,
      dto.userId,
    );
  }

  @Patch(':id([0-9a-fA-F]{24})/roadmaps/:roadmapId/progress')
  @UseGuards(JwtAuthGuard)
  async updateRoadmapProgress(
    @Param('id') companyId: string,
    @Param('roadmapId') roadmapId: string,
    @Body() dto: UpdateRoadmapProgressDto,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.updateRoadmapProgress(
      companyId,
      roadmapId,
      user.id,
      dto.progress,
    );
  }

  @Get(':id/courses')
  @UseGuards(JwtAuthGuard)
  async getCompanyCourses(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.getCompanyCourses(companyId, user.id);
  }

  @Post(':id/courses')
  @UseGuards(JwtAuthGuard)
  async createCompanyCourse(
    @Param('id') companyId: string,
    @Body() dto: CreateCompanyCourseDto,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.createCompanyCourse(companyId, user.id, dto);
  }

  @Post(':id/courses/:courseId/enroll')
  @UseGuards(JwtAuthGuard)
  async enrollInCourse(
    @Param('id') companyId: string,
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.enrollInCourse(companyId, courseId, user.id);
  }

  @Patch(':id/courses/:courseId/progress')
  @UseGuards(JwtAuthGuard)
  async updateCourseProgress(
    @Param('id') companyId: string,
    @Param('courseId') courseId: string,
    @Body() dto: UpdateCourseProgressDto,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.updateCourseProgress(
      companyId,
      courseId,
      user.id,
      dto.progress,
    );
  }

  @Get(':id/jobs')
  async getCompanyJobs(@Param('id') companyId: string) {
    return this.companiesService.getCompanyJobs(companyId);
  }

  @Get(':id/hiring/candidates')
  @UseGuards(JwtAuthGuard)
  async getHiringCandidates(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
    @Query('search') search?: string,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.getHiringCandidates(companyId, user.id, search);
  }

  @Get(':id/hiring/dashboard')
  @UseGuards(JwtAuthGuard)
  async getHiringDashboard(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.getHiringDashboard(companyId, user.id);
  }

  @Post(':id/hiring/interviews/ai')
  @UseGuards(JwtAuthGuard)
  async sendAIInterview(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.sendAIInterview(companyId, user.id, dto);
  }

  @Post(':id/hiring/interviews/human')
  @UseGuards(JwtAuthGuard)
  async scheduleHumanInterview(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.scheduleHumanInterview(companyId, user.id, dto);
  }

  @Post(':id/jobs')
  @UseGuards(JwtAuthGuard)
  async createCompanyJob(
    @Param('id') companyId: string,
    @Body() dto: CreateCompanyJobDto,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.createCompanyJob(companyId, user.id, dto);
  }

  @Patch(':id/jobs/:jobId')
  @UseGuards(JwtAuthGuard)
  async updateCompanyJob(
    @Param('id') companyId: string,
    @Param('jobId') jobId: string,
    @Body() dto: UpdateCompanyJobDto,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.updateCompanyJob(companyId, jobId, user.id, dto);
  }

  @Post(':id/jobs/:jobId/apply')
  @UseGuards(JwtAuthGuard)
  async applyToJob(
    @Param('id') companyId: string,
    @Param('jobId') jobId: string,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.applyToJob(companyId, jobId, user.id);
  }

  @Get(':id/forum/groups')
  async getCompanyForumGroups(@Param('id') companyId: string) {
    return this.companiesService.getCompanyForumGroups(companyId);
  }

  @Post(':id/forum/groups')
  @UseGuards(JwtAuthGuard)
  async createCompanyForumGroup(
    @Param('id') companyId: string,
    @Body() dto: CreateCompanyForumGroupDto,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.createCompanyForumGroup(
      companyId,
      user.id,
      dto,
    );
  }

  @Get(':id/forum/posts')
  async getCompanyForumPosts(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
  ) {
    const userId = user?.id ?? null;
    return this.companiesService.getCompanyForumPosts(companyId, userId);
  }

  @Post(':id/forum/posts')
  @UseGuards(JwtAuthGuard)
  async createCompanyForumPost(
    @Param('id') companyId: string,
    @Body() dto: CreateCompanyForumPostDto,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.createCompanyForumPost(
      companyId,
      user.id,
      dto,
    );
  }

  @Get(':id/notifications')
  @UseGuards(JwtAuthGuard)
  async getCompanyNotifications(
    @Param('id') companyId: string,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.getCompanyNotifications(companyId, user.id);
  }

  @Post(':companyId/notifications/:notificationId/read')
  @UseGuards(JwtAuthGuard)
  async readCompanyNotification(
    @Param('companyId') companyId: string,
    @Param('notificationId') notificationId: string,
    @CurrentUser() user: any,
  ) {
    if (!user?.id) {
      throw new BadRequestException('User not authenticated');
    }
    return this.companiesService.markCompanyNotificationRead(
      notificationId,
      user.id,
    );
  }
}
