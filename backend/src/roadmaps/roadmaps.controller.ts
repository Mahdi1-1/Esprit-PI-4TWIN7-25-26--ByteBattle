import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, IsNumber, Min } from 'class-validator';
import { RoadmapsService, RoadmapProgressStatus } from './roadmaps.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyRoleAuthGuard, SetCompanyRole } from '../auth/guards/company-role.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class CreateRoadmapDto {
  @ApiProperty({ description: 'Roadmap title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Roadmap description markdown' })
  @IsOptional()
  @IsString()
  description?: string;
}

class UpdateRoadmapDto {
  @ApiPropertyOptional({ description: 'Roadmap title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Roadmap description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Publish status' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

class CreateNodeDto {
  @ApiProperty() @IsString() @IsNotEmpty() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ enum: ['topic', 'subtopic', 'resource'] }) @IsIn(['topic', 'subtopic', 'resource']) type: string;
  @ApiProperty({ enum: ['required', 'optional', 'alternative'] }) @IsIn(['required', 'optional', 'alternative']) style: string;
  @ApiProperty() @IsNumber() positionX: number;
  @ApiProperty() @IsNumber() positionY: number;
}

class UpdateNodeDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: ['topic', 'subtopic', 'resource'] }) @IsOptional() @IsIn(['topic', 'subtopic', 'resource']) type?: string;
  @ApiPropertyOptional({ enum: ['required', 'optional', 'alternative'] }) @IsOptional() @IsIn(['required', 'optional', 'alternative']) style?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() positionX?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() positionY?: number;
}

class CreateEdgeDto {
  @ApiProperty() @IsString() sourceId: string;
  @ApiProperty() @IsString() targetId: string;
}

class CreateResourceDto {
  @ApiProperty() @IsString() @IsNotEmpty() title: string;
  @ApiProperty() @IsUrl() url: string;
  @ApiProperty({ enum: ['article', 'video', 'course', 'docs'] }) @IsString() type: string;
}

class UpdateRoadmapProgressDto {
  @ApiProperty({ description: 'Roadmap node id' })
  @IsString()
  @IsNotEmpty()
  nodeId: string;

  @ApiPropertyOptional({ enum: ['done', 'in_progress', 'skipped', null] })
  @IsOptional()
  @IsIn(['done', 'in_progress', 'skipped', null])
  status: RoadmapProgressStatus | null;
}

@ApiTags('Company Roadmaps')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies/my-company/roadmaps')
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  private resolveCompanyId(user: any) {
    const companyId = user?.companyId || user?.company?.id;
    if (!companyId) {
      throw new BadRequestException('User is not part of a company');
    }
    return companyId;
  }

  @Get()
  async findPublishedRoadmaps(@CurrentUser() user: any) {
    const companyId = this.resolveCompanyId(user);
    return this.roadmapsService.getPublishedRoadmaps(companyId, user.id);
  }

  @Get(':roadmapId')
  async findRoadmapById(@Param('roadmapId') roadmapId: string, @CurrentUser() user: any) {
    const companyId = this.resolveCompanyId(user);
    return this.roadmapsService.getRoadmapDetail(companyId, roadmapId, user.id);
  }

  @Patch(':roadmapId/progress')
  async updateProgress(
    @Param('roadmapId') roadmapId: string,
    @Body() dto: UpdateRoadmapProgressDto,
    @CurrentUser() user: any,
  ) {
    const companyId = this.resolveCompanyId(user);
    return this.roadmapsService.patchProgress(companyId, roadmapId, user.id, dto.nodeId, dto.status ?? null);
  }

  @Post()
  @UseGuards(CompanyRoleAuthGuard)
  @SetCompanyRole(['owner', 'recruiter'])
  async createRoadmap(@Body() dto: CreateRoadmapDto, @CurrentUser() user: any) {
    const companyId = this.resolveCompanyId(user);
    return this.roadmapsService.createRoadmap(companyId, user.id, dto);
  }

  @Patch(':roadmapId')
  @UseGuards(CompanyRoleAuthGuard)
  @SetCompanyRole(['owner', 'recruiter'])
  async updateRoadmap(@Param('roadmapId') roadmapId: string, @Body() dto: UpdateRoadmapDto, @CurrentUser() user: any) {
    const companyId = this.resolveCompanyId(user);
    return this.roadmapsService.updateRoadmap(companyId, roadmapId, dto);
  }

  @Delete(':roadmapId')
  @UseGuards(CompanyRoleAuthGuard)
  @SetCompanyRole(['owner', 'recruiter'])
  async deleteRoadmap(@Param('roadmapId') roadmapId: string, @CurrentUser() user: any) {
    const companyId = this.resolveCompanyId(user);
    return this.roadmapsService.deleteRoadmap(companyId, roadmapId);
  }

  @Post(':roadmapId/nodes')
  @UseGuards(CompanyRoleAuthGuard)
  @SetCompanyRole(['owner', 'recruiter'])
  async createNode(@Param('roadmapId') roadmapId: string, @Body() dto: CreateNodeDto, @CurrentUser() user: any) {
    const companyId = this.resolveCompanyId(user);
    return this.roadmapsService.createNode(companyId, roadmapId, dto);
  }

  @Patch(':roadmapId/nodes/:nodeId')
  @UseGuards(CompanyRoleAuthGuard)
  @SetCompanyRole(['owner', 'recruiter'])
  async updateNode(
    @Param('roadmapId') roadmapId: string,
    @Param('nodeId') nodeId: string,
    @Body() dto: UpdateNodeDto,
    @CurrentUser() user: any,
  ) {
    const companyId = this.resolveCompanyId(user);
    return this.roadmapsService.updateNode(companyId, roadmapId, nodeId, dto);
  }

  @Delete(':roadmapId/nodes/:nodeId')
  @UseGuards(CompanyRoleAuthGuard)
  @SetCompanyRole(['owner', 'recruiter'])
  async deleteNode(@Param('roadmapId') roadmapId: string, @Param('nodeId') nodeId: string, @CurrentUser() user: any) {
    const companyId = this.resolveCompanyId(user);
    return this.roadmapsService.deleteNode(companyId, roadmapId, nodeId);
  }

  @Post(':roadmapId/edges')
  @UseGuards(CompanyRoleAuthGuard)
  @SetCompanyRole(['owner', 'recruiter'])
  async createEdge(@Param('roadmapId') roadmapId: string, @Body() dto: CreateEdgeDto, @CurrentUser() user: any) {
    const companyId = this.resolveCompanyId(user);
    return this.roadmapsService.createEdge(companyId, roadmapId, dto);
  }

  @Delete(':roadmapId/edges/:edgeId')
  @UseGuards(CompanyRoleAuthGuard)
  @SetCompanyRole(['owner', 'recruiter'])
  async deleteEdge(@Param('roadmapId') roadmapId: string, @Param('edgeId') edgeId: string, @CurrentUser() user: any) {
    const companyId = this.resolveCompanyId(user);
    return this.roadmapsService.deleteEdge(companyId, roadmapId, edgeId);
  }

  @Post(':roadmapId/nodes/:nodeId/resources')
  @UseGuards(CompanyRoleAuthGuard)
  @SetCompanyRole(['owner', 'recruiter'])
  async createResource(
    @Param('roadmapId') roadmapId: string,
    @Param('nodeId') nodeId: string,
    @Body() dto: CreateResourceDto,
    @CurrentUser() user: any,
  ) {
    const companyId = this.resolveCompanyId(user);
    return this.roadmapsService.createResource(companyId, roadmapId, nodeId, dto);
  }

  @Delete(':roadmapId/nodes/:nodeId/resources/:resourceId')
  @UseGuards(CompanyRoleAuthGuard)
  @SetCompanyRole(['owner', 'recruiter'])
  async deleteResource(
    @Param('roadmapId') roadmapId: string,
    @Param('nodeId') nodeId: string,
    @Param('resourceId') resourceId: string,
    @CurrentUser() user: any,
  ) {
    const companyId = this.resolveCompanyId(user);
    return this.roadmapsService.deleteResource(companyId, roadmapId, nodeId, resourceId);
  }
}
