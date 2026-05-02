// src/interviews/interviews.service.ts
import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiInterviewService } from '../ai/ai-interview.service';
import { VoiceService } from '../voice/voice.service';
import { StartInterviewDto, SendMessageDto, InterviewDomainEnum, InterviewLanguageEnum } from './dto/interview.dto';
import { DOMAIN_PROMPTS } from '../ai/prompts';
import { Prisma } from '@prisma/client';

export interface DomainMetadata {
  id: string;
  label: string;
  labelFr: string;
  labelEn: string;
  icon: string;
  description: string;
  descriptionFr: string;
  descriptionEn: string;
  color: string;
  subTopics: string[];
  estimatedDurations: {
    easy: string;
    medium: string;
    hard: string;
  };
}

@Injectable()
export class InterviewsService {
  private readonly logger = new Logger(InterviewsService.name);

  constructor(
    private prisma: PrismaService,
    private aiInterview: AiInterviewService,
    private voice: VoiceService,
  ) { }

  /**
   * Get all available interview domains with metadata
   */
  getDomains(): DomainMetadata[] {
    return Object.entries(DOMAIN_PROMPTS).map(([key, config]) => {
      const colorMap: Record<string, string> = {
        CLOUD_COMPUTING: '#FF6B35',
        SOFTWARE_ENGINEERING: '#4ECDC4',
        CYBERSECURITY: '#FF006E',
        DATA_SCIENCE_AI: '#8338EC',
        FRONTEND_ENGINEERING: '#3A86FF',
        BACKEND_ENGINEERING: '#06D6A0',
        DEVOPS_SRE: '#FFD60A',
        MOBILE_DEVELOPMENT: '#F72585',
      };

      const durationMap: Record<string, { easy: string; medium: string; hard: string }> = {
        CLOUD_COMPUTING: { easy: '30 min', medium: '45 min', hard: '60 min' },
        SOFTWARE_ENGINEERING: { easy: '30 min', medium: '45 min', hard: '60 min' },
        CYBERSECURITY: { easy: '25 min', medium: '40 min', hard: '55 min' },
        DATA_SCIENCE_AI: { easy: '35 min', medium: '50 min', hard: '65 min' },
        FRONTEND_ENGINEERING: { easy: '25 min', medium: '40 min', hard: '55 min' },
        BACKEND_ENGINEERING: { easy: '30 min', medium: '45 min', hard: '60 min' },
        DEVOPS_SRE: { easy: '30 min', medium: '45 min', hard: '60 min' },
        MOBILE_DEVELOPMENT: { easy: '25 min', medium: '40 min', hard: '55 min' },
      };

      return {
        id: config.domainEnum,
        label: config.domain,
        labelFr: config.domain,
        labelEn: config.domain,
        icon: this.getDomainIcon(config.domainEnum),
        description: `${config.subTopics.length} sub-topics available`,
        descriptionFr: `${config.subTopics.length} sous-thèmes disponibles`,
        descriptionEn: `${config.subTopics.length} sub-topics available`,
        color: colorMap[key] || '#6366F1',
        subTopics: config.subTopics,
        estimatedDurations: durationMap[key] || { easy: '30 min', medium: '45 min', hard: '60 min' },
      };
    });
  }

  private getDomainIcon(domainEnum: string): string {
    const iconMap: Record<string, string> = {
      CLOUD_COMPUTING: '☁️',
      SOFTWARE_ENGINEERING: '💻',
      CYBERSECURITY: '🔐',
      DATA_SCIENCE_AI: '🤖',
      FRONTEND_ENGINEERING: '🎨',
      BACKEND_ENGINEERING: '⚙️',
      DEVOPS_SRE: '🚀',
      MOBILE_DEVELOPMENT: '📱',
    };
    return iconMap[domainEnum] || '🎯';
  }

  async start(userId: string, dto: StartInterviewDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.isPremium && user.tokensLeft <= 0) {
      throw new ForbiddenException('No tokens remaining. Upgrade to premium for unlimited access.');
    }

    if (!user.isPremium) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { tokensLeft: { decrement: 1 } },
      });
    }

    this.logger.log(`🎯 Starting ${dto.domain} interview for user ${userId} — ${dto.difficulty} (${dto.language})`);

    const initialContent = await this.aiInterview.generateInitialPrompt(
      dto.domain,
      dto.difficulty,
      dto.language,
    );

    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        difficulty: dto.difficulty as any,
        topic: dto.topic || null,
        domain: dto.domain as any,
        language: dto.language as any,
        status: 'active',
        tokensUsed: 1,
        messages: [
          {
            role: 'ai',
            content: initialContent,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });

    this.logger.log(`✅ Interview session ${session.id} created`);
    return session;
  }

  async sendMessage(sessionId: string, userId: string, dto: SendMessageDto) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('Not your session');
    if (session.status !== 'active') throw new ForbiddenException('Session is not active');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.isPremium && user.tokensLeft <= 0) {
      throw new ForbiddenException('No tokens remaining. Upgrade to premium for unlimited access.');
    }

    if (!user.isPremium) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { tokensLeft: { decrement: 1 } },
      });
    }

    const userMessage = {
      role: 'user' as const,
      content: dto.content,
      timestamp: new Date().toISOString(),
      code: dto.code,
      language: dto.language,
    };

    this.logger.log(`💬 User message in session ${sessionId}`);

    let aiResponseContent: string;

    if (dto.code) {
      this.logger.log(`🔍 Reviewing code (${dto.language})`);
      aiResponseContent = await this.aiInterview.reviewCode({
        code: dto.code,
        language: dto.language || 'javascript',
        conversationHistory: session.messages as any,
        domain: session.domain as InterviewDomainEnum,
        difficulty: session.difficulty,
        interviewLanguage: session.language as InterviewLanguageEnum,
      });
    } else {
      aiResponseContent = await this.aiInterview.generateResponse({
        userMessage: dto.content,
        conversationHistory: session.messages as any,
        domain: session.domain as InterviewDomainEnum,
        difficulty: session.difficulty,
        language: session.language as InterviewLanguageEnum,
      });
    }

    const aiMessage = {
      role: 'ai' as const,
      content: aiResponseContent,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...(session.messages as any[]), userMessage, aiMessage];

    const updatedSession = await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        messages: updatedMessages,
        tokensUsed: { increment: 1 },
      },
    });

    this.logger.log(`✅ AI response generated for session ${sessionId}`);

    return {
      userMessage,
      aiMessage,
      tokensUsed: updatedSession.tokensUsed,
    };
  }

  /**
   * 🎤 Send voice message (STT → AI → TTS)
   */
  async sendVoiceMessage(
    sessionId: string,
    userId: string,
    audioBuffer: Buffer,
    languageCode = 'fr-FR',
  ) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('Not your session');
    if (session.status !== 'active') throw new ForbiddenException('Session is not active');

    // Check tokens
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.isPremium && user.tokensLeft <= 0) {
      throw new ForbiddenException('No tokens remaining');
    }

    if (!user.isPremium) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { tokensLeft: { decrement: 2 } }, // 2 tokens for voice (STT + TTS)
      });
    }

    this.logger.log(`🎤 Processing voice message for session ${sessionId}`);

    // 1. Speech to Text
    const sttResult = await this.voice.speechToText({
      audioBuffer,
      languageCode,
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
    });

    this.logger.log(`📝 Transcribed: "${sttResult.transcript.substring(0, 50)}..."`);

    const userMessage = {
      role: 'user' as const,
      content: sttResult.transcript,
      timestamp: new Date().toISOString(),
      isVoice: true,
      confidence: sttResult.confidence,
    };

    // 2. Generate AI response
    const aiResponseContent = await this.aiInterview.generateResponse({
      userMessage: sttResult.transcript,
      conversationHistory: session.messages as any,
      domain: session.domain as InterviewDomainEnum,
      difficulty: session.difficulty,
      language: session.language as InterviewLanguageEnum,
    });

    // 3. Text to Speech
    const ttsResult = await this.voice.textToSpeech({
      text: aiResponseContent,
      languageCode,
      speakingRate: 1.0,
    });

    const aiMessage = {
      role: 'ai' as const,
      content: aiResponseContent,
      timestamp: new Date().toISOString(),
      audioUrl: ttsResult.audioUrl,
      isVoice: true,
    };

    // 4. Update session
    const updatedMessages = [...(session.messages as any[]), userMessage, aiMessage];

    const updatedSession = await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        messages: updatedMessages,
        tokensUsed: { increment: 2 },
      },
    });

    this.logger.log(`✅ Voice message processed for session ${sessionId}`);

    return {
      userMessage: {
        ...userMessage,
        transcript: sttResult.transcript,
        confidence: sttResult.confidence,
      },
      aiMessage,
      tokensUsed: updatedSession.tokensUsed,
    };
  }

  /**
   * 🔊 Get TTS for any message
   */
  async getMessageAudio(sessionId: string, userId: string, messageIndex: number) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('Not your session');

    const messages = session.messages as any[];
    const message = messages[messageIndex];

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // If already has audio, return it
    if (message.audioUrl) {
      return { audioUrl: message.audioUrl };
    }

    // Generate TTS - use language from session
    const ttsLanguageCode = session.language === 'EN' ? 'en-US' : 'fr-FR';
    const ttsResult = await this.voice.textToSpeech({
      text: message.content,
      languageCode: ttsLanguageCode,
    });

    // Update message with audio URL
    messages[messageIndex].audioUrl = ttsResult.audioUrl;

    await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: { messages },
    });

    return { audioUrl: ttsResult.audioUrl };
  }

  async endInterview(sessionId: string, userId: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('Not your session');

    this.logger.log(`🏁 Ending interview session ${sessionId}`);

    const feedback = await this.aiInterview.generateFinalFeedback({
      conversationHistory: session.messages as any,
      domain: session.domain as InterviewDomainEnum,
      difficulty: session.difficulty,
      language: session.language as InterviewLanguageEnum,
    });

    // ✅ Convert feedback to JSON compatible with Prisma
    const feedbackJson = this.toJsonObject(feedback);

    const updatedSession = await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        feedback: feedbackJson,
        verdict: feedback.verdict,
      },
    });

    this.logger.log(`✅ Interview session ${sessionId} completed — Verdict: ${feedback.verdict}, Score: ${feedback.overallScore}/10`);

    return updatedSession;
  }

  async getUserSessions(userId: string) {
    const sessions = await this.prisma.interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        difficulty: true,
        domain: true,
        language: true,
        topic: true,
        verdict: true,
        status: true,
        tokensUsed: true,
        feedback: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sessions.map((session) => this.normalizeSession(session));
  }

  // Backward-compatible helper for old sessions
  private normalizeSession(session: any) {
    return {
      ...session,
      domain: session.domain || null,
      language: session.language || 'FR',
      topic: session.topic || null,
      verdict: session.verdict || session.feedback?.verdict || null,
    };
  }

  async getSession(sessionId: string, userId: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('Not your session');
    return this.normalizeSession(session);
  }

  async getTokenBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tokensLeft: true, isPremium: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      tokensLeft: user.isPremium ? -1 : user.tokensLeft,
      isPremium: user.isPremium,
      unlimited: user.isPremium,
    };
  }

  // ✅ Helper: Convert typed object to Prisma-compatible JSON
  private toJsonObject<T extends Record<string, any>>(obj: T): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(obj));
  }
}
