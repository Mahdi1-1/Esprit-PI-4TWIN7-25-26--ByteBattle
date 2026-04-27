import api from '../api/axios';

export interface RecommendLevelDto {
  challengeId: string;
  language: string;
  codeLength: number;
  wrongAnswerCount: number;
}

export interface RecommendLevelResponse {
  level: number;
  modelUsed: string;
  hintStyle?: 'concept' | 'strategy' | 'pseudocode' | 'partial_snippet' | 'near_solution';
  hintIntensity?: 'low' | 'medium' | 'high';
  hintTiming?: 'now' | 'wait';
  confidence?: number | null;
}

export interface RequestHintDto extends RecommendLevelDto {
  targetLevel: number;
  confirmLevel5?: boolean;
  testsPassed?: number;
  testsTotal?: number;
  previousHintLevel?: number;
  minutesStuck?: number;
  decisionModel?: string;
  decisionConfidence?: number;
  hintStyle?: 'concept' | 'strategy' | 'pseudocode' | 'partial_snippet' | 'near_solution';
  hintIntensity?: 'low' | 'medium' | 'high';
  hintTiming?: 'now' | 'wait';
}

export const hintsService = {
  recommendLevel: async (data: RecommendLevelDto): Promise<RecommendLevelResponse> => {
    const response = await api.post('/hints/recommend-level', data);
    return response.data;
  },

  getHint: async (data: RequestHintDto) => {
    const response = await api.post('/hints/serve', data);
    return response.data;
  },
};
