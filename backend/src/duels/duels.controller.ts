import { Controller, Post, Body, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DuelsService } from './duels.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Duels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('user')
@Controller('duels')
export class DuelsController {
  constructor(private readonly duelsService: DuelsService) {}

  @Post('create')
  @ApiOperation({ summary: 'Crée un duel ou en rejoint un en attente' })
  async createOrJoinDuel(
    @CurrentUser('id') userId: string,
    @Body('difficulty') difficulty: string = 'easy',
  ) {
    return this.duelsService.createOrJoinDuel(userId, difficulty);
  }

  @Get('queue/stats')
  @ApiOperation({ summary: 'Get duel queue stats (online players, waiting duels)' })
  async getQueueStats() {
    return this.duelsService.getQueueStats();
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get duels leaderboard' })
  async getLeaderboard(@Query('limit') limit = '10') {
    return this.duelsService.getLeaderboard(parseInt(limit));
  }

  @Get('history')
  @ApiOperation({ summary: 'Get user duel history' })
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20'
  ) {
    return this.duelsService.getUserDuels(userId, parseInt(page), parseInt(limit));
  }

  @Get('my-stats')
  @ApiOperation({ summary: 'Get current user duel stats' })
  async getMyStats(@CurrentUser('id') userId: string) {
    return this.duelsService.getUserStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get active duel state' })
  async getDuelState(@Param('id') id: string) {
    return this.duelsService.getDuelState(id);
  }

  @Get(':id/result')
  @ApiOperation({ summary: 'Get duel result' })
  async getDuelResult(@Param('id') id: string) {
    return this.duelsService.getDuelResult(id);
  }
}
