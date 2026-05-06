import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiService } from "./ai.service";
import { AiInterviewService } from "./ai-interview.service"; // ← Nouveau

@Module({
  imports: [ConfigModule],
  providers: [AiService, AiInterviewService], // ← Ajouter
  exports: [AiService, AiInterviewService], // ← Ajouter
})
export class AiModule {}
