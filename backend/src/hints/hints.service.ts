import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ChallengesService } from "../challenges/challenges.service";
import { AiService } from "../ai/ai.service";
import { IntelligenceService } from "../intelligence/intelligence.service";

type HintStyle =
  | "concept"
  | "strategy"
  | "pseudocode"
  | "partial_snippet"
  | "near_solution";
type HintIntensity = "low" | "medium" | "high";
type HintTiming = "now" | "wait";

@Injectable()
export class HintsService {
  private readonly logger = new Logger(HintsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly challengesService: ChallengesService,
    private readonly aiService: AiService,
    private readonly intelligenceService: IntelligenceService,
  ) {}

  private mapDifficultyToRating(difficulty: unknown): number {
    const value = String(difficulty || "").toLowerCase();
    if (value === "easy") return 800;
    if (value === "medium") return 1300;
    if (value === "hard") return 1700;
    const numeric = Number(difficulty);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    return 1300;
  }

  /**
   * Recommend a hint level using the external ML service.
   * If ML fails, falls back to a local heuristic policy.
   */
  async recommendLevel(
    userId: string,
    data: {
      challengeId: string;
      language: string;
      codeLength: number;
      wrongAnswerCount: number;
    },
  ) {
    const challenge = await this.challengesService.findOne(data.challengeId);
    if (!challenge) {
      throw new HttpException("Challenge not found", HttpStatus.NOT_FOUND);
    }

    try {
      const result = await this.intelligenceService.getSubmitDecision({
        user_id: userId,
        challenge_id: challenge.id,
        challenge_name: challenge.title,
        difficulty: this.mapDifficultyToRating((challenge as any).difficulty),
        cf_rating: this.mapDifficultyToRating(
          (challenge as any).cfRating ||
            (challenge as any).cf_rating ||
            (challenge as any).difficulty,
        ),
        minutes_stuck: 0,
        attempts_count: data.wrongAnswerCount,
        last_hint_level: 0,
        challenge_tags: challenge.tags || [],
        code_lines:
          data.codeLength > 0
            ? Math.max(1, Math.round(data.codeLength / 6))
            : 40,
      });

      const rawLevel = Number(
        (result?.recommended_hint_level ?? result?.needs_help)
          ? result?.recommended_hint_level
          : 1,
      );
      const level = Number.isFinite(rawLevel)
        ? Math.max(1, Math.min(5, rawLevel))
        : 2;
      const fallbackPolicy = this.derivePolicyFromLevel(
        level,
        data.wrongAnswerCount,
      );
      const mlHintStyle = this.parseHintStyle((result as any)?.hint_style);
      const mlHintIntensity = this.parseHintIntensity(
        (result as any)?.hint_intensity,
      );
      const mlHintTiming = this.parseHintTiming((result as any)?.hint_timing);
      const rawConfidence = Number(
        result?.hint_confidence ?? (result as any)?.confidence,
      );
      const confidence = Number.isFinite(rawConfidence)
        ? Math.max(0, Math.min(1, rawConfidence))
        : null;

      return {
        level,
        modelUsed: (result as any).model_used || "intelligence_engine",
        hintStyle: mlHintStyle || fallbackPolicy.hintStyle,
        hintIntensity: mlHintIntensity || fallbackPolicy.hintIntensity,
        hintTiming: mlHintTiming || fallbackPolicy.hintTiming,
        confidence,
      };
    } catch (e) {
      this.logger.warn(`Fallback triggered for level prediction: ${e.message}`);
      // Fallback heuristic based on wrong answers
      let level = 1;
      if (data.codeLength > 200) level += 1;
      if (data.wrongAnswerCount >= 3) level = Math.min(level + 1, 5);
      if (data.wrongAnswerCount >= 6) level = Math.min(level + 1, 5);
      if (data.wrongAnswerCount >= 8) level = 5;
      const fallbackPolicy = this.derivePolicyFromLevel(
        level,
        data.wrongAnswerCount,
      );
      return {
        level,
        modelUsed: "fallback_heuristic",
        hintStyle: fallbackPolicy.hintStyle,
        hintIntensity: fallbackPolicy.hintIntensity,
        hintTiming: fallbackPolicy.hintTiming,
        confidence: null,
      };
    }
  }

  /**
   * Get the actual hint text for a requested level.
   * For level 5, explicitly asserts confirmation.
   * Logs the interaction payload in Prisma.
   */
  async getHint(
    userId: string,
    data: {
      challengeId: string;
      language: string;
      targetLevel: number;
      confirmLevel5?: boolean;
      attemptsCount: number;
      codeLength: number;
      testsPassed?: number;
      testsTotal?: number;
      previousHintLevel?: number;
      minutesStuck?: number;
      decisionModel?: string;
      decisionConfidence?: number;
      hintStyle?: HintStyle;
      hintIntensity?: HintIntensity;
      hintTiming?: HintTiming;
    },
  ) {
    if (data.targetLevel === 5 && !data.confirmLevel5) {
      throw new HttpException(
        "Le Niveau 5 nécessite une confirmation explicite.",
        HttpStatus.FORBIDDEN,
      );
    }

    const challenge = await this.challengesService.findOne(data.challengeId);
    if (!challenge) {
      throw new HttpException("Challenge not found", HttpStatus.NOT_FOUND);
    }

    let hintText = "";
    let usedSource = "gemini";
    const effectiveStyle =
      data.hintStyle ||
      this.derivePolicyFromLevel(data.targetLevel, data.attemptsCount)
        .hintStyle;
    const effectiveIntensity =
      data.hintIntensity ||
      this.derivePolicyFromLevel(data.targetLevel, data.attemptsCount)
        .hintIntensity;
    const effectiveTiming =
      data.hintTiming ||
      this.derivePolicyFromLevel(data.targetLevel, data.attemptsCount)
        .hintTiming;

    try {
      const policy = await this.intelligenceService.getHintPolicy({
        user_id: userId,
        challenge_id: data.challengeId,
        challenge_name: challenge.title,
        difficulty: this.mapDifficultyToRating((challenge as any).difficulty),
        cf_rating: this.mapDifficultyToRating(
          (challenge as any).cfRating ||
            (challenge as any).cf_rating ||
            (challenge as any).difficulty,
        ),
        minutes_stuck: data.minutesStuck || 0,
        attempts_count: data.attemptsCount,
        last_hint_level: data.previousHintLevel || 0,
        challenge_tags: challenge.tags || [],
        code_lines:
          data.codeLength > 0
            ? Math.max(1, Math.round(data.codeLength / 6))
            : 40,
        force_level: data.targetLevel,
      });

      hintText = await this.aiService.generateProgressiveHint({
        challengeTitle: challenge.title,
        challengeDescription: challenge.descriptionMd || "",
        challengeTags: challenge.tags || [],
        language: data.language,
        targetLevel: policy.level || data.targetLevel,
        staticHints: challenge.hints || [],
        hintStyle: policy.hint_style || effectiveStyle,
        hintIntensity: policy.hint_intensity || effectiveIntensity,
        hintTiming: policy.hint_timing || effectiveTiming,
      });
      usedSource = "intelligence_engine";

      const effectiveDecisionModel =
        (policy as any).decision?.model ||
        data.decisionModel ||
        "intelligence_engine";
      const effectiveDecisionConfidence =
        (policy as any).decision?.confidence ?? data.decisionConfidence ?? null;
      const policyStyle = policy.hint_style || effectiveStyle;
      const policyIntensity = policy.hint_intensity || effectiveIntensity;
      const policyTiming = policy.hint_timing || effectiveTiming;

      await this.prisma.hintInteraction.create({
        data: {
          userId,
          challengeId: data.challengeId,
          difficulty: challenge.difficulty,
          language: data.language,
          attemptsCount: data.attemptsCount,
          testsPassed: data.testsPassed || 0,
          testsTotal: data.testsTotal || 0,
          previousHintLevel: data.previousHintLevel,
          servedHintLevel: policy.level || data.targetLevel,
          minutesStuck: data.minutesStuck || 0,
          decisionModel: effectiveDecisionModel,
          decisionConfidence:
            typeof effectiveDecisionConfidence === "number"
              ? effectiveDecisionConfidence
              : null,
          hintStyle: policyStyle,
          hintIntensity: policyIntensity,
          hintTiming: policyTiming,
          hintSource: usedSource,
        },
      });

      return {
        level: policy.level || data.targetLevel,
        hintText,
        source: usedSource,
        decision: {
          model: effectiveDecisionModel,
          confidence:
            typeof effectiveDecisionConfidence === "number"
              ? effectiveDecisionConfidence
              : null,
          hintStyle: policyStyle,
          hintIntensity: policyIntensity,
          hintTiming: policyTiming,
        },
      };
    } catch (e) {
      this.logger.warn(
        `Fallback triggered for getting hint text: ${e.message}`,
      );
      usedSource = "static_fallback";
      hintText = this.generateStaticFallbackHint(challenge, data.targetLevel);
    }

    return {
      level: data.targetLevel,
      hintText,
      source: usedSource,
      decision: {
        model: data.decisionModel || "unknown",
        confidence:
          typeof data.decisionConfidence === "number"
            ? data.decisionConfidence
            : null,
        hintStyle: effectiveStyle,
        hintIntensity: effectiveIntensity,
        hintTiming: effectiveTiming,
      },
    };
  }

  private parseHintStyle(value: unknown): HintStyle | null {
    const v = String(value || "").toLowerCase();
    if (
      v === "concept" ||
      v === "strategy" ||
      v === "pseudocode" ||
      v === "partial_snippet" ||
      v === "near_solution"
    ) {
      return v as HintStyle;
    }
    return null;
  }

  private parseHintIntensity(value: unknown): HintIntensity | null {
    const v = String(value || "").toLowerCase();
    if (v === "low" || v === "medium" || v === "high") {
      return v as HintIntensity;
    }
    return null;
  }

  private parseHintTiming(value: unknown): HintTiming | null {
    const v = String(value || "").toLowerCase();
    if (v === "now" || v === "wait") {
      return v as HintTiming;
    }
    return null;
  }

  private derivePolicyFromLevel(
    level: number,
    wrongAnswerCount: number,
  ): {
    hintStyle: HintStyle;
    hintIntensity: HintIntensity;
    hintTiming: HintTiming;
  } {
    const safeLevel = Math.max(1, Math.min(5, level));
    const hintStyle: HintStyle =
      safeLevel <= 1
        ? "concept"
        : safeLevel === 2
          ? "strategy"
          : safeLevel === 3
            ? "pseudocode"
            : safeLevel === 4
              ? "partial_snippet"
              : "near_solution";

    const hintIntensity: HintIntensity =
      safeLevel >= 4 || wrongAnswerCount >= 6
        ? "high"
        : safeLevel >= 2
          ? "medium"
          : "low";

    const hintTiming: HintTiming =
      wrongAnswerCount >= 2 || safeLevel >= 3 ? "now" : "wait";

    return { hintStyle, hintIntensity, hintTiming };
  }

  private generateStaticFallbackHint(challenge: any, level: number): string {
    const hints = challenge.hints || [];
    switch (level) {
      case 1:
        return hints.length > 0
          ? `💡 Concept: ${hints[0]}`
          : "💡 Réfléchissez aux structures de données de base adaptées (ex: Maps ou Graphes).";
      case 2:
        return hints.length > 1
          ? `🔍 Stratégie: ${hints[1]}`
          : "🔍 Divisez le problème en sous-fonctions.";
      case 3:
        return "📋 Pseudo-code générique:\n1. Lire les inputs\n2. Traiter les cas limites\n3. Boucle principale\n4. Renvoyer résultat";
      case 4:
        return "🔧 L'extrait partiel de code n'est pas disponible hors-ligne sans le service AI.";
      case 5:
        return "📦 La solution complète n'est pas disponible sans le service AI.";
      default:
        return "";
    }
  }
}
