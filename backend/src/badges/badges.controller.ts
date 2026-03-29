import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BadgesService } from './badges.service';
import { CreateBadgeDto } from './dto/badge.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Badges')
@Controller('badges')
export class BadgesController {
  constructor(private badgesService: BadgesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all badges' })
  findAll() {
    return this.badgesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get badge by ID' })
  findOne(@Param('id') id: string) {
    return this.badgesService.findOne(id);
  }

  @Post()
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a badge (admin)' })
  create(@Body() dto: CreateBadgeDto) {
    return this.badgesService.create(dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a badge (admin)' })
  remove(@Param('id') id: string) {
    return this.badgesService.remove(id);
  }
}
