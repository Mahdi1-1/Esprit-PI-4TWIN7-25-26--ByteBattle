// src/voice/voice.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { VoiceService } from "./voice.service";
import { VoiceController } from "./voice.controller";

@Module({
  imports: [ConfigModule],
  controllers: [VoiceController],
  providers: [VoiceService],
  exports: [VoiceService],
})
export class VoiceModule {}
