// src/ai/ai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

export interface CodeReviewResult {
    score: number; // 0-100
    strengths: string[];
    improvements: string[];
    bugs: string[];
    suggestions: string[];
    complexity: 'low' | 'medium' | 'high';
    readability: number; // 0-100
    bestPractices: number; // 0-100
    summary: string;
}

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenerativeAI;
    private model;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            this.logger.warn('⚠️  GEMINI_API_KEY not configured - AI features disabled');
            return;
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 2048,
                responseMimeType: "application/json",
            },
        });

        this.logger.log('✅ Gemini AI initialized successfully');
    }

    async reviewCode(params: {
        code: string;
        language: string;
        challengeTitle: string;
        challengeDescription: string;
    }): Promise<CodeReviewResult> {
        if (!this.model) {
            throw new Error('Gemini AI not configured');
        }

        this.logger.log(`🤖 Reviewing ${params.language} code for: ${params.challengeTitle}`);

        const prompt = this.buildReviewPrompt(params);
        const startTime = Date.now();

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const review = this.parseReviewResponse(text);
            const latency = Date.now() - startTime;

            this.logger.log(`✅ Review completed in ${latency}ms — Score: ${review.score}/100`);
            return review;

        } catch (error) {
            this.logger.error('❌ AI review failed:', error);
            const msg = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to generate code review: ${msg}`);
        }
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
            cleanText = cleanText.replace(/```json\n?/gi, '');
            cleanText = cleanText.replace(/```\n?/g, '');

            // Trouver le JSON (entre { et })
            const jsonStart = cleanText.indexOf('{');
            const jsonEnd = cleanText.lastIndexOf('}');

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
                complexity: ['low', 'medium', 'high'].includes(parsed.complexity)
                    ? parsed.complexity
                    : 'medium',
                readability: this.clamp(parsed.readability, 0, 100) || 50,
                bestPractices: this.clamp(parsed.bestPractices, 0, 100) || 50,
                summary: parsed.summary || 'Aucun résumé disponible',
            };
        } catch (error) {
            this.logger.error('Failed to parse AI response:', error);
            this.logger.debug('Raw response:', text);

            // Retourne une revue par défaut
            return {
                score: 50,
                strengths: ['Code fonctionnel'],
                improvements: ['L\'analyse automatique a échoué'],
                bugs: [],
                suggestions: ['Veuillez réessayer'],
                complexity: 'medium',
                readability: 50,
                bestPractices: 50,
                summary: 'L\'analyse automatique a rencontré un problème. Veuillez réessayer.',
            };
        }
    }

    async suggestImprovements(code: string, language: string): Promise<string> {
        if (!this.model) {
            throw new Error('Gemini AI not configured');
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
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            this.logger.error('Failed to generate improvements:', error);
            throw new Error('Failed to generate improvement suggestions');
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
            return value.filter(item => typeof item === 'string');
        }
        return [];
    }
}