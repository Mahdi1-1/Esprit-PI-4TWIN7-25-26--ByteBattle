import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueModule } from '../queue/queue.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { HackathonsController } from './hackathons.controller';
import { HackathonsService } from './hackathons.service';
import { HackathonAuditService } from './hackathon-audit.service';
import { HackathonSubmissionService } from './hackathon-submission.service';
import { HackathonScoreboardService } from './hackathon-scoreboard.service';
import { HackathonChatService } from './hackathon-chat.service';
import { HackathonClarificationService } from './hackathon-clarification.service';
import { HackathonAnnouncementService } from './hackathon-announcement.service';
import { HackathonYjsService } from './hackathon-yjs.service';
import { HackathonMonitoringService } from './hackathon-monitoring.service';
import { HackathonSchedulerService } from './hackathon-scheduler.service';
import { HackathonPlagiarismService } from './hackathon-plagiarism.service';
import { HackathonsGateway } from './hackathons.gateway';

@Module({
  imports: [
    QueueModule,
    ConfigModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [HackathonsController],
  providers: [
    HackathonsService,
    HackathonAuditService,
    HackathonSubmissionService,
    HackathonScoreboardService,
    HackathonChatService,
    HackathonClarificationService,
    HackathonAnnouncementService,
    HackathonYjsService,
    HackathonMonitoringService,
    HackathonSchedulerService,
    HackathonPlagiarismService,
    HackathonsGateway,
  ],
  exports: [
    HackathonsService,
    HackathonAuditService,
    HackathonSubmissionService,
    HackathonScoreboardService,
  ],
})
export class HackathonsModule {}
