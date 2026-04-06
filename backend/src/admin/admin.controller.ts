import {
  Controller, Get, Post, Patch, Param, Query, Body,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateReportDto, UpdateReportStatusDto } from './dto/admin.dto';
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
}
