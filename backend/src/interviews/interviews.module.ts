// src/interviews/interviews.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { AiModule } from '../ai/ai.module';
import { VoiceModule } from '../voice/voice.module';

@Module({
  imports: [
    AiModule,
    VoiceModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService],
  exports: [InterviewsService],
})
export class InterviewsModule { }