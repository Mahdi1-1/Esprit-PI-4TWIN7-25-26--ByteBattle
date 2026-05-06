import { Controller, Post, Body, UseGuards, Req } from "@nestjs/common";
import { HintsService } from "./hints.service";
import { RecommendLevelDto, RequestHintDto } from "./dto/hint.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("hints")
export class HintsController {
  constructor(private readonly hintsService: HintsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("recommend-level")
  async recommendLevel(@Req() req, @Body() dto: RecommendLevelDto) {
    return this.hintsService.recommendLevel(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("serve")
  async getHint(@Req() req, @Body() dto: RequestHintDto) {
    return this.hintsService.getHint(req.user.id, {
      challengeId: dto.challengeId,
      language: dto.language,
      targetLevel: dto.targetLevel,
      confirmLevel5: dto.confirmLevel5,
      attemptsCount: dto.wrongAnswerCount,
      codeLength: dto.codeLength,
      testsPassed: dto.testsPassed,
      testsTotal: dto.testsTotal,
      previousHintLevel: dto.previousHintLevel,
      minutesStuck: dto.minutesStuck,
      decisionModel: dto.decisionModel,
      decisionConfidence: dto.decisionConfidence,
      hintStyle: dto.hintStyle,
      hintIntensity: dto.hintIntensity,
      hintTiming: dto.hintTiming,
    });
  }
}
