import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BadgesService } from './badges.service';
import { BadgeEngineService } from './badge-engine.service';
import { CreateBadgeDto } from './dto/badge.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Badges')
@Controller('badges')
export class BadgesController {
  constructor(
    private badgesService: BadgesService,
    private badgeEngine: BadgeEngineService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all badge definitions' })
  findAll() {
    return this.badgesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get badge by ID' })
  findOne(@Param('id') id: string) {
    return this.badgesService.findOne(id);
  }

  @Get('user/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my earned badges' })
  getMyBadges(@CurrentUser() user: any) {
    return this.badgeEngine.getUserBadges(user.id);
  }

  @Public()
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get badges earned by a user' })
  getUserBadges(@Param('userId') userId: string) {
    return this.badgeEngine.getUserBadges(userId);
  }

  @Post('seed')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed badge catalogue (admin)' })
  seed() {
    return this.badgeEngine.seedBadges();
  }

  @Post()
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a custom badge (admin)' })
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
