// src/interviews/interviews.module.ts
import { Module } from '@nestjs/common';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { AiModule } from '../ai/ai.module';
import { VoiceModule } from '../voice/voice.module'; // ← Nouveau

@Module({
  imports: [AiModule, VoiceModule], // ← Ajouter VoiceModule
  controllers: [InterviewsController],
  providers: [InterviewsService],
  exports: [InterviewsService],
})
export class InterviewsModule { }