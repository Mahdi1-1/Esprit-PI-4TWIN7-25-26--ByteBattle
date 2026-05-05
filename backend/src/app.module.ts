import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import * as path from "path";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { AvatarModule } from "./avatar/avatar.module";
import { ChallengesModule } from "./challenges/challenges.module";
import { SubmissionsModule } from "./submissions/submissions.module";
import { DiscussionsModule } from "./discussions/discussions.module";
import { HackathonsModule } from "./hackathons/hackathons.module";
import { LeaderboardModule } from "./leaderboard/leaderboard.module";
import { BadgesModule } from "./badges/badges.module";
import { InterviewsModule } from "./interviews/interviews.module";
import { TeamsModule } from "./teams/teams.module";
import { AdminModule } from "./admin/admin.module";
import { DuelsModule } from "./duels/duels.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { CacheModule } from "./cache/cache.module";
import { CompaniesModule } from "./companies/companies.module";
import { HintsModule } from "./hints/hints.module";
import { MetricsModule } from "./metrics/metrics.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), ".env"),
        path.resolve(__dirname, "../.env"),
      ],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get("REDIS_HOST", "localhost"),
          port: configService.get<number>("REDIS_PORT", 6379),
          password: configService.get("REDIS_PASSWORD", ""),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    CacheModule,
    AuthModule,
    UsersModule,
    AvatarModule,
    ChallengesModule,
    SubmissionsModule,
    DiscussionsModule,
    HackathonsModule,
    TeamsModule,
    LeaderboardModule,
    BadgesModule,
    InterviewsModule,
    AdminModule,
    DuelsModule,
    NotificationsModule,
    CompaniesModule,
    HintsModule,
    MetricsModule,
  ],
})
export class AppModule {}
