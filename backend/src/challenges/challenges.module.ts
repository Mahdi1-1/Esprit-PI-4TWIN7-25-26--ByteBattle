import { Module } from "@nestjs/common";
import { ChallengesController } from "./challenges.controller";
import { ChallengesService } from "./challenges.service";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [AiModule],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
