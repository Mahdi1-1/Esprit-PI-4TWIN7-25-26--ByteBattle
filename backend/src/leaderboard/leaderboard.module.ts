import { Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { RedisLeaderboardService } from './redis-leaderboard.service';

@Module({
  controllers: [LeaderboardController],
  providers: [LeaderboardService, RedisLeaderboardService],
  exports: [LeaderboardService, RedisLeaderboardService],
})
export class LeaderboardModule {}
