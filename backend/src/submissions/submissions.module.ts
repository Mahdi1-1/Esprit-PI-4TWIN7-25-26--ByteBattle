import { Module } from '@nestjs/common';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { SubmissionsGateway } from './submissions.gateway';
import { QueueModule } from '../queue/queue.module';
import { AiModule } from '../ai/ai.module'; // ← Import AI Module

@Module({
  imports: [
    QueueModule,
    AiModule, // ← Add AI Module
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, SubmissionsGateway],
  exports: [SubmissionsService, SubmissionsGateway],
})
export class SubmissionsModule { }