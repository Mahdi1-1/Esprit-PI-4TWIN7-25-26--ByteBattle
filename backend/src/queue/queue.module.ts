
import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SubmissionsModule } from '../submissions/submissions.module';
import { QueueService } from './queue.service';
import { BadgesModule } from '../badges/badges.module';

const redisEnabled = process.env.REDIS_ENABLED !== 'false';

@Module({
  imports: [
    ...(redisEnabled
      ? [
          BullModule.registerQueue({
            name: 'code-execution',
          }),
        ]
      : []),
    forwardRef(() => SubmissionsModule),
    BadgesModule,
  ],
  providers: [QueueService],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
