import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MetricsController } from './metrics.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'code-execution',
    }),
  ],
  controllers: [MetricsController],
})
export class MetricsModule {}
