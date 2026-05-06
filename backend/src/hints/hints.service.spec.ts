import { Test, TestingModule } from "@nestjs/testing";
import { HintsService } from "./hints.service";
import { PrismaService } from "../prisma/prisma.service";
import { ChallengesService } from "../challenges/challenges.service";
import { AiService } from "../ai/ai.service";
import { IntelligenceService } from "../intelligence/intelligence.service";
import { HttpException } from "@nestjs/common";

describe("HintsService", () => {
  let service: HintsService;
  let prismaService: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let challengesService: ChallengesService;
  let aiService: AiService;
  let intelligenceService: IntelligenceService;

  beforeEach(async () => {
    // Mock fetch
    global.fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HintsService,
        {
          provide: PrismaService,
          useValue: {
            hintInteraction: {
              create: jest.fn().mockResolvedValue({ id: "1" }),
            },
          },
        },
        {
          provide: ChallengesService,
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              id: "chal_1",
              title: "Two Sum",
              difficulty: "easy",
              hints: ["hint1", "hint2"],
            }),
          },
        },
        {
          provide: AiService,
          useValue: {
            generateProgressiveHint: jest
              .fn()
              .mockResolvedValue("Gemini Hint Here"),
          },
        },
        {
          provide: IntelligenceService,
          useValue: {
            getSubmitDecision: jest.fn().mockResolvedValue({
              user_id: "user_1",
              challenge_id: "chal_1",
              needs_help: true,
              needs_help_probability: 0.81,
              recommended_hint_level: 3,
              hint_confidence: 0.72,
              model_used: "intelligence_engine",
            }),
            getHintPolicy: jest.fn().mockResolvedValue({
              user_id: "user_1",
              challenge_id: "chal_1",
              level: 3,
              hint_style: "pseudocode",
              hint_intensity: "medium",
              hint_timing: "now",
              decision: {
                model: "intelligence_engine",
                confidence: 0.72,
                hintStyle: "pseudocode",
                hintIntensity: "medium",
                hintTiming: "now",
              },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<HintsService>(HintsService);
    prismaService = module.get<PrismaService>(PrismaService);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    challengesService = module.get<ChallengesService>(ChallengesService);
    aiService = module.get<AiService>(AiService);
    intelligenceService = module.get<IntelligenceService>(IntelligenceService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("recommendLevel", () => {
    it("should recommend level via intelligence engine when available", async () => {
      const result = await service.recommendLevel("user_1", {
        challengeId: "chal_1",
        language: "PYTHON3",
        codeLength: 100,
        wrongAnswerCount: 2,
      });

      expect(intelligenceService.getSubmitDecision).toHaveBeenCalled();
      expect(result.level).toBe(3);
      expect(result.modelUsed).toBe("intelligence_engine");
      expect(result.hintStyle).toBe("pseudocode");
      expect(result.hintIntensity).toBe("medium");
      expect(result.hintTiming).toBe("now");
      expect(result.confidence).toBe(0.72);
    });

    it("should fallback to heuristic if intelligence engine fails", async () => {
      (
        intelligenceService.getSubmitDecision as jest.Mock
      ).mockRejectedValueOnce(new Error("Network error"));

      const result = await service.recommendLevel("user_1", {
        challengeId: "chal_1",
        language: "PYTHON3",
        codeLength: 300,
        wrongAnswerCount: 6,
      });

      expect(result.level).toBe(4); // Base 1 + 1 (length > 200) + 1 (wrong >= 3) + 1 (wrong >= 6)
      expect(result.modelUsed).toBe("fallback_heuristic");
      expect(result.hintStyle).toBe("partial_snippet");
      expect(result.hintIntensity).toBe("high");
      expect(result.hintTiming).toBe("now");
      expect(result.confidence).toBeNull();
    });
  });

  describe("getHint", () => {
    it("should block level 5 if confirmLevel5 is not true", async () => {
      await expect(
        service.getHint("user_1", {
          challengeId: "chal_1",
          language: "PYTHON3",
          targetLevel: 5,
          confirmLevel5: false,
          attemptsCount: 3,
          codeLength: 100,
        }),
      ).rejects.toThrow(HttpException);
    });

    it("should load level 5 if explicitly confirmed", async () => {
      (intelligenceService.getHintPolicy as jest.Mock).mockResolvedValueOnce({
        user_id: "user_1",
        challenge_id: "chal_1",
        level: 5,
        hint_style: "near_solution",
        hint_intensity: "high",
        hint_timing: "now",
        decision: {
          model: "intelligence_engine",
          confidence: 0.91,
          hintStyle: "near_solution",
          hintIntensity: "high",
          hintTiming: "now",
        },
      });
      (aiService.generateProgressiveHint as jest.Mock).mockResolvedValueOnce(
        "Full Solution Here",
      );

      const result = await service.getHint("user_1", {
        challengeId: "chal_1",
        language: "PYTHON3",
        targetLevel: 5,
        confirmLevel5: true,
        attemptsCount: 3,
        codeLength: 100,
      });

      expect(result.source).toBe("intelligence_engine");
      expect(result.hintText).toBe("Full Solution Here");
      expect(prismaService.hintInteraction.create).toHaveBeenCalled();
    });

    it("should serve static fallback if Gemini hint generation fails", async () => {
      (intelligenceService.getHintPolicy as jest.Mock).mockRejectedValueOnce(
        new Error("Down"),
      );

      const result = await service.getHint("user_1", {
        challengeId: "chal_1",
        language: "PYTHON3",
        targetLevel: 2,
        confirmLevel5: false,
        attemptsCount: 1,
        codeLength: 10,
      });

      expect(result.source).toBe("static_fallback");
      expect(result.hintText).toContain("Stratégie: hint2"); // because hints[1]
    });
  });
});
