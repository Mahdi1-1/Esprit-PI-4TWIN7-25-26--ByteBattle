import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SubmissionsModule } from '../submissions/submissions.module';
import { QueueService } from './queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'code-execution',
    }),
    forwardRef(() => SubmissionsModule),
  ],
  providers: [QueueService],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
