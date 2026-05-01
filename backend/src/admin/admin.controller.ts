import {
  Controller, Get, Post, Patch, Param, Query, Body,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateReportDto, UpdateReportStatusDto, UpdateCompanyVerificationDto } from './dto/admin.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const ALLOWED_ROLES = ['user', 'moderator', 'admin'] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @Roles('admin')
  @ApiOperation({ summary: 'Admin dashboard stats' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // ─── User Role Management ─────────────────────────────────────────
  @Patch('users/:id/role')
  @Roles('admin')
  @ApiOperation({ summary: 'Change user role (admin only)' })
  @ApiBody({ schema: { properties: { role: { type: 'string', enum: ['user', 'moderator', 'admin'] } } } })
  async changeUserRole(
    @Param('id') targetId: string,
    @Body('role') role: string,
    @CurrentUser('id') actorId: string,
  ) {
    if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
      throw new BadRequestException(`Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}`);
    }
    return this.adminService.changeUserRole(actorId, targetId, role as AllowedRole);
  }

  // ─── Reports ─────────────────────────────────────────────────────
  @Get('reports')
  @Roles('admin')
  @ApiOperation({ summary: 'List reports' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  getReports(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getReports({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      status,
    });
  }

  @Post('reports')
  @Roles('user')
  @ApiOperation({ summary: 'Create a report (any authenticated user)' })
  createReport(@CurrentUser('id') userId: string, @Body() dto: CreateReportDto) {
    return this.adminService.createReport(userId, dto);
  }

  @Patch('reports/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update report status' })
  updateReport(@Param('id') id: string, @Body() dto: UpdateReportStatusDto) {
    return this.adminService.updateReportStatus(id, dto);
  }

  @Get('companies')
  @Roles('admin')
  @ApiOperation({ summary: 'List companies for admin review' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'verified', required: false })
  getCompanies(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('verified') verified?: string,
  ) {
    return this.adminService.getCompanies({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      status,
      verified,
    });
  }

  @Get('companies/pending')
  @Roles('admin')
  @ApiOperation({ summary: 'List unverified companies pending review' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getPendingCompanies(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getPendingCompanies({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Patch('companies/:id/verify')
  @Roles('admin')
  @ApiOperation({ summary: 'Verify or reject company' })
  @ApiBody({ schema: { properties: { action: { type: 'string', enum: ['APPROVE', 'REJECT'] }, reason: { type: 'string' } } } })
  verifyCompany(
    @Param('id') companyId: string,
    @Body('action') action: 'APPROVE' | 'REJECT',
    @Body('reason') reason?: string,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.adminService.verifyCompany(companyId, action, reason, actorId);
  }

  @Patch('companies/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update company verification or status' })
  @ApiBody({ type: UpdateCompanyVerificationDto })
  updateCompany(
    @Param('id') companyId: string,
    @Body() dto: UpdateCompanyVerificationDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.adminService.updateCompany(companyId, dto, actorId);
  }

  @Get('audit-logs')
  @Roles('admin')
  @ApiOperation({ summary: 'List audit logs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'action', required: false })
  getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('action') action?: string,
  ) {
    return this.adminService.getAuditLogs({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      action,
    });
  }

  // ─── Advanced Analytics ──────────────────────────────────────────
  @Get('analytics/timeseries')
  @Roles('admin')
  @ApiOperation({ summary: 'Time-series data for charts (registrations, submissions, duels) over last N days' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days (default 30)' })
  getTimeSeries(@Query('days') days?: number) {
    return this.adminService.getTimeSeries(days ? +days : 30);
  }

  @Get('analytics/retention')
  @Roles('admin')
  @ApiOperation({ summary: 'User retention & engagement metrics' })
  getRetention() {
    return this.adminService.getRetentionMetrics();
  }

  @Get('analytics/performance')
  @Roles('admin')
  @ApiOperation({ summary: 'Platform performance: top challenges, difficulty distribution, hourly activity heatmap' })
  getPerformanceMetrics() {
    return this.adminService.getPerformanceMetrics();
  }

  @Get('analytics/modules')
  @Roles('admin')
  @ApiOperation({ summary: 'Module usage: sessions, unique users, engagement rate, avg time per module (last 7d)' })
  getModuleUsage() {
    return this.adminService.getModuleUsage();
  }
}
