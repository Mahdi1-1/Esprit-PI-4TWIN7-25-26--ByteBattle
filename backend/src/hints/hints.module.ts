import { Module } from "@nestjs/common";
import { HintsController } from "./hints.controller";
import { HintsService } from "./hints.service";
import { PrismaModule } from "../prisma/prisma.module";
import { ChallengesModule } from "../challenges/challenges.module";
import { AiModule } from "../ai/ai.module";
import { IntelligenceModule } from "../intelligence/intelligence.module";

@Module({
  imports: [PrismaModule, ChallengesModule, AiModule, IntelligenceModule],
  controllers: [HintsController],
  providers: [HintsService],
  exports: [HintsService],
})
export class HintsModule {}
