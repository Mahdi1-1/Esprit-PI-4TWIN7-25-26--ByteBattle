import { Controller, Get, Query } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { LeaderboardService } from "./leaderboard.service";
import { RedisLeaderboardService } from "./redis-leaderboard.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("Leaderboard")
@Controller("leaderboard")
export class LeaderboardController {
  constructor(
    private leaderboardService: LeaderboardService,
    private redisLeaderboardService: RedisLeaderboardService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Global leaderboard" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({
    name: "sort",
    required: false,
    description: "elo|xp|level|winRate",
  })
  @ApiQuery({
    name: "language",
    required: false,
    description: "Filter by programming language",
  })
  getGlobal(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sort") sort?: string,
    @Query("language") language?: string,
  ) {
    return this.leaderboardService.getGlobal({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      sort,
      language,
    });
  }

  @Public()
  @Get("top")
  @ApiOperation({ summary: "Fast global leaderboard (top 50) from Redis" })
  getTop50() {
    return this.redisLeaderboardService.getTopUsers(50);
  }

  @Public()
  @Get("languages")
  @ApiOperation({ summary: "Available languages for leaderboard filters" })
  getLanguages() {
    return this.leaderboardService.getAvailableLanguages();
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Current user rank" })
  getMyRank(@CurrentUser("id") userId: string) {
    return this.leaderboardService.getUserRank(userId);
  }

  @Get("stats")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Current user stats" })
  getMyStats(@CurrentUser("id") userId: string) {
    return this.leaderboardService.getUserStats(userId);
  }
}
