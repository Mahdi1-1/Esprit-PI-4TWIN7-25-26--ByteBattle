// src/ai/ai-interview.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConfigService } from "@nestjs/config";
import { DOMAIN_PROMPTS, DomainPromptConfig } from "./prompts";
import {
  InterviewDomainEnum,
  InterviewLanguageEnum,
} from "../interviews/dto/interview.dto";

export interface InterviewMessage {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  code?: string;
  language?: string;
  isVoice?: boolean;
  confidence?: number;
}

export interface InterviewFeedback {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  verdict: "HIRE" | "MAYBE" | "NO_HIRE";
  competencyScores: CompetencyScore[];
  strengths: string[];
  improvements: string[];
  recommendedResources: RecommendedResource[];
  closingMessage: string;
}

export interface CompetencyScore {
  competency: string;
  score: number;
  feedback: string;
}

export interface RecommendedResource {
  title: string;
  url: string;
  type: "course" | "article" | "practice";
}

@Injectable()
export class AiInterviewService {
  private readonly logger = new Logger(AiInterviewService.name);
  private genAI: GoogleGenerativeAI;
  private model;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");
    if (!apiKey) {
      this.logger.warn(
        "⚠️  GEMINI_API_KEY not configured - Interview AI disabled",
      );
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    this.logger.log("✅ Interview AI initialized");
  }

  async generateInitialPrompt(
    domain: InterviewDomainEnum,
    difficulty: string,
    language: InterviewLanguageEnum = InterviewLanguageEnum.FR,
  ): Promise<string> {
    const domainConfig = DOMAIN_PROMPTS[domain];
    const lang = language === InterviewLanguageEnum.EN ? "en" : "fr";

    if (!this.model || !domainConfig) {
      return this.getMockInitialPrompt(domain, difficulty, lang);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const persona = domainConfig.persona[lang];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const subTopics = domainConfig.subTopics.join(", ");

    const prompt = this.buildSystemPrompt(domainConfig, difficulty, lang);

    const userPrompt =
      lang === "fr"
        ? `Tu es un interviewer technique. Présente-toi selon le persona fourni, puis pose ta première question adaptée au niveau **${difficulty}** sur le domaine de **${domainConfig.domain}**.`
        : `You are a technical interviewer. Introduce yourself according to the provided persona, then ask your first question suitable for **${difficulty}** level in **${domainConfig.domain}**.`;

    try {
      const result = await this.model.generateContent([
        { text: prompt },
        { text: userPrompt },
      ]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error("Failed to generate initial prompt:", error);
      return this.getMockInitialPrompt(domain, difficulty, lang);
    }
  }

  async generateResponse(params: {
    userMessage: string;
    conversationHistory: InterviewMessage[];
    domain: InterviewDomainEnum;
    difficulty: string;
    language: InterviewLanguageEnum;
  }): Promise<string> {
    const domainConfig = DOMAIN_PROMPTS[params.domain];
    const lang = params.language === InterviewLanguageEnum.EN ? "en" : "fr";

    if (!this.model || !domainConfig) {
      return this.getMockResponse(params.userMessage, lang);
    }

    const conversationContext = this.buildConversationContext(
      params.conversationHistory,
      lang,
    );
    const systemPrompt = this.buildSystemPrompt(
      domainConfig,
      params.difficulty,
      lang,
    );

    const userPrompt =
      lang === "fr"
        ? `${systemPrompt}

${conversationContext}

**Message actuel de l'utilisateur:**
${params.userMessage}

En tant qu'interviewer, fournis une réponse adaptée, pose des questions de suivi si pertinent, et guide le candidat. Réponds en français.`
        : `${systemPrompt}

${conversationContext}

**Current user message:**
${params.userMessage}

As an interviewer, provide an appropriate response, ask follow-up questions if relevant, and guide the candidate. Respond in English.`;

    try {
      const result = await this.model.generateContent(userPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error("Failed to generate response:", error);
      return this.getMockResponse(params.userMessage, lang);
    }
  }

  async reviewCode(params: {
    code: string;
    language: string;
    conversationHistory: InterviewMessage[];
    domain: InterviewDomainEnum;
    difficulty: string;
    interviewLanguage: InterviewLanguageEnum;
  }): Promise<string> {
    const domainConfig = DOMAIN_PROMPTS[params.domain];
    const lang =
      params.interviewLanguage === InterviewLanguageEnum.EN ? "en" : "fr";

    if (!this.model || !domainConfig) {
      return this.getMockCodeReview(params.code, lang);
    }

    const conversationContext = this.buildConversationContext(
      params.conversationHistory,
      lang,
    );

    const userPrompt =
      lang === "fr"
        ? `${conversationContext}

**Code soumis (${params.language}):**
\`\`\`${params.language}
${params.code}
\`\`\`

Analyse ce code dans le contexte d'un entretien de niveau **${params.difficulty}** sur **${domainConfig.domain}**.

Fournis un feedback structuré:
1. **Correction ✅/❌** - Le code résout-il le problème ?
2. **Complexité** - Big-O temporel et spatial
3. **Qualité** - Lisibilité, bonnes pratiques, nommage
4. **Edge cases** - Cas limites gérés ou manquants
5. **Améliorations** - 3-5 suggestions concrètes

Sois constructif et guide vers les améliorations. Réponds en français.`
        : `${conversationContext}

**Submitted code (${params.language}):**
\`\`\`${params.language}
${params.code}
\`\`\`

Analyze this code in the context of a **${params.difficulty}** level interview on **${domainConfig.domain}**.

Provide structured feedback:
1. **Correctness ✅/❌** - Does the code solve the problem?
2. **Complexity** - Time and space Big-O
3. **Quality** - Readability, best practices, naming
4. **Edge cases** - Cases handled or missing
5. **Improvements** - 3-5 concrete suggestions

Be constructive and guide toward improvements. Respond in English.`;

    try {
      const result = await this.model.generateContent(userPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error("Failed to review code:", error);
      return this.getMockCodeReview(params.code, lang);
    }
  }

  async generateFinalFeedback(params: {
    conversationHistory: InterviewMessage[];
    domain: InterviewDomainEnum;
    difficulty: string;
    language: InterviewLanguageEnum;
  }): Promise<InterviewFeedback> {
    const domainConfig = DOMAIN_PROMPTS[params.domain];
    const lang = params.language === InterviewLanguageEnum.EN ? "en" : "fr";

    if (!this.model || !domainConfig) {
      return this.getMockFeedback(domainConfig, lang);
    }

    const conversationContext = this.buildConversationContext(
      params.conversationHistory,
      lang,
    );

    const evaluationCriteria = domainConfig.evaluationCriteria
      .map((c) => `- ${c}`)
      .join("\n");

    const userPrompt =
      lang === "fr"
        ? `L'entretien de niveau **${params.difficulty}** sur **${domainConfig.domain}** vient de se terminer.

${conversationContext}

**Critères d'évaluation pour ce domaine:**
${evaluationCriteria}

Génère un feedback final détaillé au format JSON avec:

{
  "overallScore": <note globale sur 10>,
  "technicalScore": <note technique sur 10>,
  "communicationScore": <note communication sur 10>,
  "problemSolvingScore": <note résolution de problèmes sur 10>,
  "verdict": "HIRE" | "MAYBE" | "NO_HIRE",
  "competencyScores": [
    {"competency": "<nom>", "score": <0-10>, "feedback": "<commentaire>"}
  ],
  "strengths": [<3-5 points forts>],
  "improvements": [<3-5 points à améliorer>],
  "recommendedResources": [
    {"title": "<titre>", "url": "<url>", "type": "course"|"article"|"practice"}
  ],
  "closingMessage": "<message personnalisé>"
}

Base ton évaluation sur la qualité des réponses, la communication, et la résolution de problèmes. Sois constructif. RÉPONDS UNIQUEMENT avec du JSON valide.`
        : `The **${params.difficulty}** level interview on **${domainConfig.domain}** has just ended.

${conversationContext}

**Evaluation criteria for this domain:**
${evaluationCriteria}

Generate detailed final feedback in JSON format:

{
  "overallScore": <global score out of 10>,
  "technicalScore": <technical score out of 10>,
  "communicationScore": <communication score out of 10>,
  "problemSolvingScore": <problem solving score out of 10>,
  "verdict": "HIRE" | "MAYBE" | "NO_HIRE",
  "competencyScores": [
    {"competency": "<name>", "score": <0-10>, "feedback": "<comment>"}
  ],
  "strengths": [<3-5 strengths>],
  "improvements": [<3-5 areas for improvement>],
  "recommendedResources": [
    {"title": "<title>", "url": "<url>", "type": "course"|"article"|"practice"}
  ],
  "closingMessage": "<personalized message>"
}

Base your evaluation on answer quality, communication, and problem-solving. Be constructive. RESPOND ONLY with valid JSON.`;

    try {
      const result = await this.model.generateContent(userPrompt);
      const response = await result.response;
      const text = response.text();

      return this.parseFeedbackResponse(text, domainConfig, lang);
    } catch (error) {
      this.logger.error("Failed to generate feedback:", error);
      return this.getMockFeedback(domainConfig, lang);
    }
  }

  // Helper methods
  private buildSystemPrompt(
    domainConfig: DomainPromptConfig,
    difficulty: string,
    lang: string,
  ): string {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const persona = domainConfig.persona[lang];
    const questions =
      domainConfig.questionsByLevel[
        difficulty as keyof typeof domainConfig.questionsByLevel
      ] || domainConfig.questionsByLevel.medium;
    const criteria = domainConfig.evaluationCriteria
      .map((c) => `- ${c}`)
      .join("\n");

    if (lang === "fr") {
      return `${persona}

## Instructions d'interview
- Niveau: ${difficulty}
- Domaine: ${domainConfig.domain}
- Sous-sujets: ${domainConfig.subTopics.join(", ")}

## Comportement
- Pose des questions ouvertes et écoute attentivement
- Donne des indices si le candidat est bloqué (sans révéler la solution)
- Encourage la réflexion à voix haute
- Évalue selon ces critères:
${criteria}

## Questions de référence pour ce niveau
${questions
  .slice(0, 3)
  .map((q) => `- ${q}`)
  .join("\n")}

Sois bienveillant, rigoureux, et professionnel.`;
    } else {
      return `${persona}

## Interview Instructions
- Level: ${difficulty}
- Domain: ${domainConfig.domain}
- Sub-topics: ${domainConfig.subTopics.join(", ")}

## Behavior
- Ask open-ended questions and listen carefully
- Provide hints if the candidate is stuck (without revealing the solution)
- Encourage think-aloud approach
- Evaluate based on these criteria:
${criteria}

## Reference questions for this level
${questions
  .slice(0, 3)
  .map((q) => `- ${q}`)
  .join("\n")}

Be warm, rigorous, and professional.`;
    }
  }

  private buildConversationContext(
    history: InterviewMessage[],
    lang: string,
  ): string {
    if (!history || history.length === 0) {
      return lang === "fr"
        ? "C'est le début de l'entretien."
        : "This is the beginning of the interview.";
    }

    const messages = history.slice(-10);
    const roleLabel =
      lang === "fr"
        ? { user: "Candidat", ai: "Interviewer" }
        : { user: "Candidate", ai: "Interviewer" };

    return `${lang === "fr" ? "**Historique de la conversation:**" : "**Conversation history:**"}\n\n${messages
      .map(
        (msg) =>
          `**${roleLabel[msg.role as keyof typeof roleLabel] || msg.role}:** ${msg.content.substring(0, 300)}${msg.content.length > 300 ? "..." : ""}`,
      )
      .join("\n\n")}`;
  }

  private parseFeedbackResponse(
    text: string,
    domainConfig: DomainPromptConfig,
    lang: string,
  ): InterviewFeedback {
    try {
      let cleanText = text.trim();
      cleanText = cleanText.replace(/```json\n?/gi, "");
      cleanText = cleanText.replace(/```\n?/g, "");

      const jsonStart = cleanText.indexOf("{");
      const jsonEnd = cleanText.lastIndexOf("}");

      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
      }

      const parsed = JSON.parse(cleanText);

      return {
        overallScore: Math.min(10, Math.max(0, parsed.overallScore || 5)),
        technicalScore: Math.min(10, Math.max(0, parsed.technicalScore || 5)),
        communicationScore: Math.min(
          10,
          Math.max(0, parsed.communicationScore || 5),
        ),
        problemSolvingScore: Math.min(
          10,
          Math.max(0, parsed.problemSolvingScore || 5),
        ),
        verdict: this.determineVerdict(parsed.overallScore || 5),
        competencyScores: Array.isArray(parsed.competencyScores)
          ? parsed.competencyScores.map(
              (c: { competency: string; score: number; feedback: string }) => ({
                competency: c.competency || "Unknown",
                score: Math.min(10, Math.max(0, c.score || 5)),
                feedback: c.feedback || "",
              }),
            )
          : domainConfig.evaluationCriteria.map((c) => ({
              competency: c,
              score: Math.min(10, Math.max(0, parsed.overallScore || 5)),
              feedback: "",
            })),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        improvements: Array.isArray(parsed.improvements)
          ? parsed.improvements
          : [],
        recommendedResources: Array.isArray(parsed.recommendedResources)
          ? parsed.recommendedResources
          : [],
        closingMessage:
          parsed.closingMessage ||
          (lang === "fr"
            ? "Bon courage pour la suite ! 🚀"
            : "Good luck with your future interviews! 🚀"),
      };
    } catch (error) {
      this.logger.error("Failed to parse feedback:", error);
      return this.getMockFeedback(domainConfig, lang);
    }
  }

  private determineVerdict(score: number): "HIRE" | "MAYBE" | "NO_HIRE" {
    if (score >= 7) return "HIRE";
    if (score >= 4) return "MAYBE";
    return "NO_HIRE";
  }

  // Fallback mock methods
  private getMockInitialPrompt(
    domain: InterviewDomainEnum,
    difficulty: string,
    lang: string,
  ): string {
    const domainConfig = DOMAIN_PROMPTS[domain];

    if (lang === "fr") {
      return `# Bienvenue dans votre entretien ${domainConfig?.domain || domain}! 🎯

Bonjour ! Je suis votre interviewer IA pour aujourd'hui. Nous allons aborder des sujets liés à **${domainConfig?.domain || domain}** au niveau **${difficulty}**.

Pendant cet entretien, je vais vous poser des questions pour évaluer vos compétences techniques, votre capacité à résoudre des problèmes et votre communication.

Prenez votre temps pour réfléchir, n'hésitez pas à réfléchir à voix haute, et posez-moi des questions si quelque chose n'est pas clair.

Êtes-vous prêt ? Commençons par une première question...`;
    } else {
      return `# Welcome to your ${domainConfig?.domain || domain} interview! 🎯

Hello! I am your AI interviewer for today. We will be discussing topics related to **${domainConfig?.domain || domain}** at the **${difficulty}** level.

During this interview, I will ask you questions to assess your technical skills, problem-solving ability, and communication.

Take your time to think, feel free to think out loud, and ask me questions if something is unclear.

Are you ready? Let's start with a first question...`;
    }
  }

  private getMockResponse(content: string, lang: string): string {
    if (lang === "fr") {
      return `Bonne réflexion ! 🤔

C'est une approche intéressante. Pouvez-vous développer un peu plus sur votre raisonnement ?

N'hésitez pas à penser à voix haute sur les complexités temporelle et spatiale.`;
    } else {
      return `Good thinking! 🤔

That's an interesting approach. Can you elaborate a bit more on your reasoning?

Feel free to think out loud about time and space complexity.`;
    }
  }

  private getMockCodeReview(code: string, lang: string): string {
    if (lang === "fr") {
      return `## Analyse du Code 📝

✅ **Correction:** Le code semble résoudre le problème correctement.

**Complexité:**
- Temporelle: O(n)
- Spatiale: O(1)

**Qualité:** Le code est bien structuré et lisible.

**Points à améliorer:** Pensez à gérer les cas limites supplémentaires.

Continuez comme ça ! 💪`;
    } else {
      return `## Code Analysis 📝

✅ **Correctness:** The code seems to solve the problem correctly.

**Complexity:**
- Time: O(n)
- Space: O(1)

**Quality:** The code is well-structured and readable.

**Areas for improvement:** Consider handling additional edge cases.

Keep it up! 💪`;
    }
  }

  private getMockFeedback(
    domainConfig: DomainPromptConfig | undefined,
    lang: string,
  ): InterviewFeedback {
    const criteria = domainConfig?.evaluationCriteria || [
      "Technical Skills",
      "Problem Solving",
      "Communication",
    ];

    if (lang === "fr") {
      return {
        overallScore: 7,
        technicalScore: 7,
        communicationScore: 7,
        problemSolvingScore: 7,
        verdict: "MAYBE",
        competencyScores: criteria.map((c) => ({
          competency: c,
          score: 7,
          feedback: "Bonne performance globale.",
        })),
        strengths: [
          "Bonne approche de résolution",
          "Communication claire",
          "Bienstructuré dans les explications",
        ],
        improvements: [
          "Pratiquez plus d'edge cases",
          "Travaillez la complexité algorithmique",
          "Améliorez la gestion d'erreurs",
        ],
        recommendedResources: [
          {
            title: "Introduction aux Algorithms",
            url: "https://example.com/intro-algo",
            type: "course",
          },
          {
            title: "Pratique du System Design",
            url: "https://example.com/system-design",
            type: "practice",
          },
        ],
        closingMessage: "Bon courage pour la suite de votre carrière ! 🚀",
      };
    } else {
      return {
        overallScore: 7,
        technicalScore: 7,
        communicationScore: 7,
        problemSolvingScore: 7,
        verdict: "MAYBE",
        competencyScores: criteria.map((c) => ({
          competency: c,
          score: 7,
          feedback: "Good overall performance.",
        })),
        strengths: [
          "Good problem-solving approach",
          "Clear communication",
          "Well-structured explanations",
        ],
        improvements: [
          "Practice more edge cases",
          "Work on algorithmic complexity",
          "Improve error handling",
        ],
        recommendedResources: [
          {
            title: "Introduction to Algorithms",
            url: "https://example.com/intro-algo",
            type: "course",
          },
          {
            title: "System Design Practice",
            url: "https://example.com/system-design",
            type: "practice",
          },
        ],
        closingMessage: "Good luck with your future career! 🚀",
      };
    }
  }
}
