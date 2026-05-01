import api from '../api/axios';
import { InterviewDomain, InterviewLanguage, InterviewFeedback } from '../data/interviewData';

export interface InterviewMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  code?: string;
  language?: string;
  audioUrl?: string;
  isVoice?: boolean;
  confidence?: number;
}

export interface InterviewSession {
  id: string;
  difficulty: string;
  domain: InterviewDomain;
  language: InterviewLanguage;
  topic?: string;
  verdict?: 'HIRE' | 'MAYBE' | 'NO_HIRE';
  messages: InterviewMessage[];
  feedback?: InterviewFeedback;
  status: string;
  tokensUsed: number;
  createdAt: string;
  updatedAt: string;
}

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

export const interviewsService = {
  async getDomains(): Promise<DomainMetadata[]> {
    const { data } = await api.get('/interviews/domains');
    return data;
  },

  async startInterview(params: { difficulty: string; domain: InterviewDomain; language: InterviewLanguage }) {
    const { data } = await api.post('/interviews/start', params);
    return data;
  },

  async start(params: { difficulty: string; domain: InterviewDomain; language: InterviewLanguage }) {
    return this.startInterview(params);
  },

  async sendMessage(sessionId: string, message: { content: string; code?: string; language?: string }) {
    const { data } = await api.post(`/interviews/${sessionId}/message`, message);
    return { ...data, reply: data?.aiMessage?.content };
  },

  async sendVoiceMessage(sessionId: string, audioBlob: Blob, languageCode = 'fr-FR') {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    formData.append('languageCode', languageCode);

    const { data } = await api.post(`/interviews/${sessionId}/voice`, formData);
    return { ...data, reply: data?.aiMessage?.content, audioUrl: data?.aiMessage?.audioUrl };
  },

  async endInterview(sessionId: string): Promise<InterviewSession> {
    const { data } = await api.post(`/interviews/${sessionId}/end`);
    return { ...data, feedback: data?.feedback };
  },

  async getSessions(): Promise<InterviewSession[]> {
    const { data } = await api.get('/interviews/sessions');
    return Array.isArray(data) ? data.map((s: InterviewSession) => ({ ...s, feedback: s.feedback })) : data;
  },

  async getSession(sessionId: string): Promise<InterviewSession> {
    const { data } = await api.get(`/interviews/${sessionId}`);
    return { ...data, feedback: data?.feedback };
  },

  async getTokenBalance() {
    const { data } = await api.get('/interviews/tokens');
    return data;
  },
};
