// src/ai/ai.service.ts
import {
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConfigService } from "@nestjs/config";

export interface CodeReviewResult {
  score: number; // 0-100
  strengths: string[];
  improvements: string[];
  bugs: string[];
  suggestions: string[];
  complexity: "low" | "medium" | "high";
  readability: number; // 0-100
  bestPractices: number; // 0-100
  summary: string;
}

export interface ChallengeDraft {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags?: string[];
  statementMd?: string;
  tests?: Array<{
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
  }>;
  allowedLanguages?: string[];
  hints?: string[];
  category: string;
  briefMd?: string;
  deliverables?: string;
  rubric?: any;
  assets?: string[];
  excalidrawElements?: any[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private model;
  private currentModelIndex = 0;
  private readonly modelNames = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
  ];

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");
    if (!apiKey) {
      this.logger.warn(
        "⚠️  GEMINI_API_KEY not configured - AI features disabled",
      );
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.createModel(0);

    this.logger.log("✅ Gemini AI initialized successfully");
  }

  async reviewCode(params: {
    code: string;
    language: string;
    challengeTitle: string;
    challengeDescription: string;
  }): Promise<CodeReviewResult> {
    if (!this.model) {
      throw new ServiceUnavailableException(
        "Gemini AI is not configured. Please set GEMINI_API_KEY to enable AI draft generation.",
      );
    }

    this.logger.log(
      `🤖 Reviewing ${params.language} code for: ${params.challengeTitle}`,
    );

    const prompt = this.buildReviewPrompt(params);
    const startTime = Date.now();

    try {
      const text = await this.generateWithRetry(prompt);

      const review = this.parseReviewResponse(text);
      const latency = Date.now() - startTime;

      this.logger.log(
        `✅ Review completed in ${latency}ms — Score: ${review.score}/100`,
      );
      return review;
    } catch (error) {
      this.logger.error("❌ AI review failed:", error);
      if (error instanceof HttpException) {
        throw error;
      }
      const msg = error instanceof Error ? error.message : String(error);
      throw new ServiceUnavailableException(
        `Failed to generate code review: ${msg}`,
      );
    }
  }

  private createModel(index: number) {
    const modelName = this.modelNames[index] || this.modelNames[0];
    this.logger.log(`🔁 Initializing Gemini model: ${modelName}`);
    return this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });
  }

  private isRetryableError(error: any): boolean {
    const message = error?.message || "";
    const status =
      error?.status || error?.statusCode || error?.response?.status;
    return (
      status === 503 ||
      status === 429 ||
      message.includes("503") ||
      message.includes("429") ||
      message.toLowerCase().includes("service unavailable") ||
      message.toLowerCase().includes("high demand") ||
      message.toLowerCase().includes("quota") ||
      message.toLowerCase().includes("too many requests") ||
      message.toLowerCase().includes("rate limit")
    );
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async generateWithRetry(
    request: string,
    maxRetries = 3,
  ): Promise<string> {
    if (!this.genAI) {
      throw new ServiceUnavailableException(
        "Gemini AI is not configured. Please set GEMINI_API_KEY.",
      );
    }

    for (
      let modelIndex = 0;
      modelIndex < this.modelNames.length;
      modelIndex++
    ) {
      const modelName = this.modelNames[modelIndex];
      this.model = this.createModel(modelIndex);

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await this.model.generateContent(request);
          const response = await result.response;
          return response.text();
        } catch (error) {
          const isRetryable = this.isRetryableError(error);

          if (isRetryable && attempt < maxRetries) {
            const delayMs = Math.pow(2, attempt) * 1000;
            this.logger.warn(
              `⏳ Model ${modelName} attempt ${attempt}/${maxRetries} failed. Retrying in ${delayMs / 1000}s...`,
            );
            await this.delay(delayMs);
            continue;
          }

          // If retryable but exhausted retries, break to try next model
          if (isRetryable) {
            this.logger.warn(
              `⚠️ Model ${modelName} failed after ${attempt} attempts. ${
                modelIndex < this.modelNames.length - 1
                  ? `Falling back to ${this.modelNames[modelIndex + 1]}`
                  : "No more fallback models."
              }`,
            );
            break;
          }

          // Non-retryable error — throw immediately
          throw error;
        }
      }
    }

    throw new ServiceUnavailableException(
      "All AI models are currently unavailable. Please try again in a few minutes.",
    );
  }

  private buildReviewPrompt(params: {
    code: string;
    language: string;
    challengeTitle: string;
    challengeDescription: string;
  }): string {
    return `Tu es un expert en revue de code et un ingénieur senior. Analyse le code suivant et fournis une revue détaillée et constructive.

**Challenge:** ${params.challengeTitle}

**Description du problème:**
${params.challengeDescription}

**Langage:** ${params.language}

**Code soumis:**
\`\`\`${params.language}
${params.code}
\`\`\`

**Instructions:**
Fournis une revue de code structurée au format JSON strict avec les champs suivants:

{
  "score": <nombre 0-100>,
  "strengths": [<liste de 3-5 points forts>],
  "improvements": [<liste de 3-5 améliorations possibles>],
  "bugs": [<liste des bugs potentiels, vide si aucun>],
  "suggestions": [<3-5 suggestions concrètes de refactoring>],
  "complexity": "<'low' | 'medium' | 'high'>",
  "readability": <score 0-100>,
  "bestPractices": <score 0-100>,
  "summary": "<résumé en 2-3 phrases>"
}

**Critères d'évaluation:**
1. **Correction** - Le code résout-il correctement le problème ?
2. **Lisibilité** - Code clair, bien nommé, bien structuré ?
3. **Performance** - Complexité algorithmique optimale ?
4. **Bonnes pratiques** - Respect des conventions du langage ${params.language}
5. **Robustesse** - Gestion des cas limites et erreurs
6. **Maintenabilité** - Facilité de modification future

**Important:**
- Sois constructif et encourageant
- Fournis des exemples concrets
- Évite le jargon inutile
- RÉPONDS UNIQUEMENT avec du JSON valide, sans balises markdown

JSON:`;
  }

  private parseReviewResponse(text: string): CodeReviewResult {
    try {
      // Nettoyer la réponse
      let cleanText = text.trim();

      // Enlever les balises markdown si présentes
      cleanText = cleanText.replace(/```json\n?/gi, "");
      cleanText = cleanText.replace(/```\n?/g, "");

      // Trouver le JSON (entre { et })
      const jsonStart = cleanText.indexOf("{");
      const jsonEnd = cleanText.lastIndexOf("}");

      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
      }

      const parsed = JSON.parse(cleanText);

      // Validation et valeurs par défaut
      return {
        score: this.clamp(parsed.score, 0, 100) || 50,
        strengths: this.ensureArray(parsed.strengths),
        improvements: this.ensureArray(parsed.improvements),
        bugs: this.ensureArray(parsed.bugs),
        suggestions: this.ensureArray(parsed.suggestions),
        complexity: ["low", "medium", "high"].includes(parsed.complexity)
          ? parsed.complexity
          : "medium",
        readability: this.clamp(parsed.readability, 0, 100) || 50,
        bestPractices: this.clamp(parsed.bestPractices, 0, 100) || 50,
        summary: parsed.summary || "Aucun résumé disponible",
      };
    } catch (error) {
      this.logger.error("Failed to parse AI response:", error);
      this.logger.debug("Raw response:", text);

      // Retourne une revue par défaut
      return {
        score: 50,
        strengths: ["Code fonctionnel"],
        improvements: ["L'analyse automatique a échoué"],
        bugs: [],
        suggestions: ["Veuillez réessayer"],
        complexity: "medium",
        readability: 50,
        bestPractices: 50,
        summary:
          "L'analyse automatique a rencontré un problème. Veuillez réessayer.",
      };
    }
  }

  async generateChallengeDraft(
    prompt: string,
    kind: "CODE" | "CANVAS" = "CODE",
  ): Promise<ChallengeDraft> {
    if (!this.model) {
      throw new ServiceUnavailableException(
        "Gemini AI is not configured. Please set GEMINI_API_KEY to enable AI draft generation.",
      );
    }

    const request =
      kind === "CANVAS"
        ? this.buildCanvasChallengeDraftPrompt(prompt)
        : this.buildChallengeDraftPrompt(prompt);
    this.logger.log(
      `🤖 Generating AI ${kind.toLowerCase()} challenge draft...`,
    );

    try {
      const text = await this.generateWithRetry(request);

      const draft =
        kind === "CANVAS"
          ? this.parseCanvasChallengeDraftResponse(text)
          : this.parseChallengeDraftResponse(text);
      this.logger.log(`✅ AI draft generated: ${draft.title}`);
      return draft;
    } catch (error) {
      this.logger.error("❌ AI challenge draft generation failed:", error);
      if (error instanceof HttpException) {
        throw error;
      }
      const msg = error instanceof Error ? error.message : String(error);
      throw new ServiceUnavailableException(
        `Failed to generate challenge draft: ${msg}`,
      );
    }
  }

  private buildChallengeDraftPrompt(prompt: string): string {
    return `Tu es un expert en conception de challenges de programmation. Crée un brouillon de challenge de code clair, original et réalisable en 1 à 2 heures, en respectant cette demande :\n\n${prompt}\n\nRetourne uniquement du JSON valide sans explication supplémentaire. Le JSON doit contenir les champs suivants :\n{\n  "title": "...",\n  "difficulty": "easy|medium|hard",\n  "tags": ["tag1", "tag2"],\n  "category": "algorithms|data structures|math|strings|graphs|dynamic programming|other",\n  "statementMd": "Description du problème en markdown",\n  "allowedLanguages": ["javascript", "python", "java"],\n  "tests": [{"input": "...", "expectedOutput": "...", "isHidden": false}],\n  "hints": ["Hint 1", "Hint 2"]\n}\n\nFais en sorte que le challenge soit directement utilisable en tant que brouillon d'administration.`;
  }

  private buildCanvasChallengeDraftPrompt(prompt: string): string {
    return `Tu es un expert en conception de challenges Canvas/UX. Crée un brouillon de challenge Canvas clair, original et réalisable en 1 à 2 heures, en respectant cette demande :\n\n${prompt}\n\nRetourne uniquement du JSON valide sans explication supplémentaire. Le JSON doit contenir les champs suivants :\n{\n  "title": "...",\n  "difficulty": "easy|medium|hard",\n  "category": "frontend|ux|dataflow|integration|security|product|general",\n  "briefMd": "Description du challenge en markdown",\n  "deliverables": "Liste des livrables attendus",\n  "rubric": {"criteria": "...", "points": "..."},\n  "assets": ["asset1.png", "asset2.svg"],\n  "hints": ["Hint 1", "Hint 2"],\n  "excalidrawElements": [\n    {\n      "id": "element-1",\n      "type": "rectangle",\n      "x": 0,\n      "y": 0,\n      "width": 100,\n      "height": 50,\n      "angle": 0,\n      "seed": 123456,\n      "version": 1,\n      "versionNonce": 654321,\n      "updated": 0,\n      "isDeleted": false,\n      "groupIds": [],\n      "boundElements": null,\n      "locked": false,\n      "text": "Label text"\n    }\n  ]\n}\n\nLe champ \"excalidrawElements\" doit contenir un tableau d'éléments Excalidraw que l'application peut rendre directement, avec des positions, tailles et textes simples. Si tu génères des éléments, ne retourne aucun autre contenu que le JSON valide demandé.`;
  }

  private parseChallengeDraftResponse(text: string): ChallengeDraft {
    try {
      let cleanText = text.trim();
      cleanText = cleanText.replace(/```json\n?/gi, "");
      cleanText = cleanText.replace(/```\n?/g, "");

      const start = cleanText.indexOf("{");
      const end = cleanText.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        cleanText = cleanText.substring(start, end + 1);
      }

      const parsed = JSON.parse(cleanText);

      const draft: ChallengeDraft = {
        title: String(parsed.title || "New AI Challenge"),
        difficulty: ["easy", "medium", "hard"].includes(parsed.difficulty)
          ? parsed.difficulty
          : "medium",
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.filter((tag: any) => typeof tag === "string")
          : [],
        category:
          typeof parsed.category === "string" ? parsed.category : "general",
        statementMd: String(
          parsed.statementMd || parsed.description || parsed.brief || "",
        ),
        allowedLanguages: Array.isArray(parsed.allowedLanguages)
          ? parsed.allowedLanguages.filter(
              (lang: any) => typeof lang === "string",
            )
          : ["javascript", "python", "java"],
        tests: Array.isArray(parsed.tests)
          ? parsed.tests.map((test: any) => ({
              input: String(test.input || ""),
              expectedOutput: String(test.expectedOutput || ""),
              isHidden: Boolean(test.isHidden),
            }))
          : [],
        hints: Array.isArray(parsed.hints)
          ? parsed.hints.filter((hint: any) => typeof hint === "string")
          : [],
      };

      if (!draft.title.trim()) {
        throw new Error("Invalid AI draft response: missing title");
      }

      return draft;
    } catch (error) {
      this.logger.error("Failed to parse AI challenge draft response:", error);
      this.logger.debug("Raw AI challenge response:", text);

      throw new ServiceUnavailableException(
        "AI draft generation failed due to an invalid response from Gemini. Please retry.",
      );
    }
  }

  private parseCanvasChallengeDraftResponse(text: string): ChallengeDraft {
    try {
      let cleanText = text.trim();
      cleanText = cleanText.replace(/```json\n?/gi, "");
      cleanText = cleanText.replace(/```\n?/g, "");

      const start = cleanText.indexOf("{");
      const end = cleanText.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        cleanText = cleanText.substring(start, end + 1);
      }

      const parsed = JSON.parse(cleanText);

      const draft: ChallengeDraft = {
        title: String(parsed.title || "New AI Canvas Challenge"),
        difficulty: ["easy", "medium", "hard"].includes(parsed.difficulty)
          ? parsed.difficulty
          : "medium",
        category:
          typeof parsed.category === "string" ? parsed.category : "general",
        briefMd: String(
          parsed.briefMd || parsed.description || parsed.brief || "",
        ),
        deliverables:
          typeof parsed.deliverables === "string" ? parsed.deliverables : "",
        rubric:
          typeof parsed.rubric === "object" && parsed.rubric !== null
            ? parsed.rubric
            : {},
        assets: Array.isArray(parsed.assets)
          ? parsed.assets.filter((asset: any) => typeof asset === "string")
          : [],
        hints: Array.isArray(parsed.hints)
          ? parsed.hints.filter((hint: any) => typeof hint === "string")
          : [],
        excalidrawElements: Array.isArray(parsed.excalidrawElements)
          ? parsed.excalidrawElements.map((el: any, index: number) => ({
              ...el,
              id: el.id || `el_${index}_${Date.now()}`,
              version: el.version || 1,
              versionNonce:
                el.versionNonce || Math.floor(Math.random() * 999999),
              updated: Date.now(),
              isDeleted: false,
              groupIds: el.groupIds || [],
              boundElements: el.boundElements || null,
              locked: el.locked || false,
            }))
          : [],
      };

      if (!draft.title.trim()) {
        throw new Error("Invalid AI canvas draft response: missing title");
      }

      return draft;
    } catch (error) {
      this.logger.error("Failed to parse AI canvas draft response:", error);
      this.logger.debug("Raw AI canvas response:", text);

      throw new ServiceUnavailableException(
        "AI canvas draft generation failed due to an invalid response from Gemini. Please retry.",
      );
    }
  }

  async suggestImprovements(code: string, language: string): Promise<string> {
    if (!this.model) {
      throw new ServiceUnavailableException(
        "Gemini AI is not configured. Please set GEMINI_API_KEY to enable code review.",
      );
    }

    const prompt = `En tant qu'expert ${language}, analyse ce code et propose une version améliorée:

\`\`\`${language}
${code}
\`\`\`

Fournis:
1. **Code amélioré** avec commentaires
2. **Explications** des changements effectués
3. **Pourquoi** ces changements améliorent le code

Format markdown avec sections claires.`;

    try {
      return await this.generateWithRetry(prompt);
    } catch (error) {
      this.logger.error("Failed to generate improvements:", error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new ServiceUnavailableException(
        "Failed to generate improvement suggestions",
      );
    }
  }

  async generateProgressiveHint(params: {
    challengeTitle: string;
    challengeDescription: string;
    challengeTags?: string[];
    language: string;
    targetLevel: number;
    staticHints?: string[];
    hintStyle?:
      | "concept"
      | "strategy"
      | "pseudocode"
      | "partial_snippet"
      | "near_solution";
    hintIntensity?: "low" | "medium" | "high";
    hintTiming?: "now" | "wait";
  }): Promise<string> {
    if (!this.model) {
      throw new ServiceUnavailableException(
        "Gemini AI is not configured. Please set GEMINI_API_KEY to enable progressive hints.",
      );
    }

    const safeLevel = Math.min(5, Math.max(1, params.targetLevel));
    const hints = params.staticHints || [];
    const style = params.hintStyle || "strategy";
    const intensity = params.hintIntensity || "medium";
    const timing = params.hintTiming || "now";

    const levelInstruction =
      safeLevel === 1
        ? "Niveau 1: donne uniquement un indice conceptuel sans pseudo-code et sans code."
        : safeLevel === 2
          ? "Niveau 2: donne uniquement une stratégie algorithmique en étapes, sans code exécutable."
          : safeLevel === 3
            ? "Niveau 3: donne un pseudo-code lisible, sans code complet d'un langage précis."
            : safeLevel === 4
              ? "Niveau 4: donne un snippet partiel (20-40% max), pas la solution complète."
              : "Niveau 5: solution quasi complète autorisée.";

    const request = `Tu es un assistant pédagogique pour programmation compétitive.

Problème: ${params.challengeTitle}
Langage cible: ${params.language}
Tags: ${(params.challengeTags || []).join(", ") || "N/A"}

Description:
${params.challengeDescription || "N/A"}

Hints statiques disponibles:
${hints.length ? hints.map((h, i) => `${i + 1}. ${h}`).join("\n") : "Aucun"}

Instruction de niveau:
${levelInstruction}

Policy pédagogique décidée par le modèle:
- hint_style: ${style}
- hint_intensity: ${intensity}
- hint_timing: ${timing}

Réponds UNIQUEMENT au format JSON valide:
{
  "hint_text": "..."
}

Contraintes:
- Réponse concise et utile.
- Aucune divulgation de solution complète pour les niveaux 1 à 4.
- Respecte hint_style, hint_intensity et hint_timing.
- Pas de markdown, pas de texte hors JSON.`;

    try {
      const text = await this.generateWithRetry(request);
      let cleanText = text.trim();
      cleanText = cleanText.replace(/```json\n?/gi, "");
      cleanText = cleanText.replace(/```\n?/g, "");

      const jsonStart = cleanText.indexOf("{");
      const jsonEnd = cleanText.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
      }

      const parsed = JSON.parse(cleanText);
      const hintText = String(parsed?.hint_text || "").trim();
      if (!hintText) {
        throw new Error("Gemini returned empty hint_text");
      }

      return hintText;
    } catch (error) {
      this.logger.error(
        "Failed to generate progressive hint with Gemini:",
        error,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      const msg = error instanceof Error ? error.message : String(error);
      throw new ServiceUnavailableException(
        `Failed to generate progressive hint: ${msg}`,
      );
    }
  }

  // Helper methods
  private clamp(value: any, min: number, max: number): number {
    const num = Number(value);
    if (isNaN(num)) return min;
    return Math.min(max, Math.max(min, num));
  }

  private ensureArray(value: any): string[] {
    if (Array.isArray(value)) {
      return value.filter((item) => typeof item === "string");
    }
    return [];
  }
}
