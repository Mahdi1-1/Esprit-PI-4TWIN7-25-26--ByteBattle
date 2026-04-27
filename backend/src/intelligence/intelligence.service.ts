import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

export interface IntelligenceSubmitRequest {
  user_id: string;
  challenge_id: string;
  challenge_name: string;
  difficulty: number;
  cf_rating: number;
  minutes_stuck: number;
  attempts_count: number;
  last_hint_level: number;
  challenge_tags: string[];
  code_lines: number;
}

export interface IntelligenceSubmitResponse {
  user_id: string;
  challenge_id: string;
  needs_help: boolean;
  needs_help_probability: number;
  recommended_hint_level: number;
  hint_confidence: number | null;
  source?: string;
}

export interface IntelligenceHintResponse extends IntelligenceSubmitResponse {
  level: number;
  hint_style: 'concept' | 'strategy' | 'pseudocode' | 'partial_snippet' | 'near_solution';
  hint_intensity: 'low' | 'medium' | 'high';
  hint_timing: 'now' | 'wait';
  decision: IntelligenceSubmitResponse;
}

export interface IntelligenceProfileRequest {
  user_id: string;
  challenge_id: string;
  challenge_name: string;
  difficulty: number;
  cf_rating: number;
  minutes_stuck: number;
  attempts_count: number;
  last_hint_level: number;
  challenge_tags: string[];
  code_lines: number;
  current_skills: Record<string, number>;
  top_k?: number;
}

@Injectable()
export class IntelligenceService {
  private readonly logger = new Logger(IntelligenceService.name);
  private readonly engineUrl = process.env.INTELLIGENCE_ENGINE_URL || process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';

  private buildUrl(path: string): string {
    return `${this.engineUrl.replace(/\/$/, '')}${path}`;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(this.buildUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new ServiceUnavailableException(`Intelligence engine ${path} failed (${response.status}): ${text}`);
    }

    return response.json() as Promise<T>;
  }

  async getSubmitDecision(payload: IntelligenceSubmitRequest): Promise<IntelligenceSubmitResponse> {
    this.logger.debug(`Submitting telemetry to intelligence engine for challenge ${payload.challenge_id}`);
    return this.post<IntelligenceSubmitResponse>('/submit', payload);
  }

  async getHintPolicy(payload: IntelligenceSubmitRequest & { force_level?: number }): Promise<IntelligenceHintResponse> {
    this.logger.debug(`Requesting hint policy from intelligence engine for challenge ${payload.challenge_id}`);
    return this.post<IntelligenceHintResponse>('/get-hint', payload);
  }

  async getProfile(payload: IntelligenceProfileRequest): Promise<any> {
    this.logger.debug(`Requesting skill profile from intelligence engine for user ${payload.user_id}`);
    return this.post<any>('/profile', payload);
  }
}