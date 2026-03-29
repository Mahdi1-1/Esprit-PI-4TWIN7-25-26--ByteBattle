import api from '../api/axios';

export interface Submission {
  id: string;
  userId: string;
  challengeId: string;
  kind: 'CODE' | 'CANVAS';
  score: number;
  context: string;
  language?: string;
  code?: string;
  verdict?: string;
  testsPassed?: number;
  testsTotal?: number;
  timeMs?: number;
  memMb?: number;
  snapshotUrl?: string;
  canvasJson?: any;
  createdAt: string;
  challenge?: any;
  user?: any;
  aiReview?: any;
}

export const submissionsService = {
  async submitCode(data: {
    challengeId: string;
    kind: 'CODE';
    language: string;
    code: string;
    context?: string;
  }) {
    const { data: result } = await api.post('/submissions/code', data);
    return result;
  },

  async submitCanvas(data: {
    challengeId: string;
    kind: 'CANVAS';
    canvasJson: any;
    snapshotUrl?: string;
    context?: string;
  }) {
    const { data: result } = await api.post('/submissions/canvas', data);
    return result;
  },

  async submit(data: {
    challengeId: string;
    kind: 'CODE' | 'CANVAS';
    language?: string;
    code?: string;
    context?: string;
    canvasJson?: any;
    snapshotUrl?: string;
  }) {
    const { data: result } = await api.post('/submissions', data);
    return result;
  },

  async runCode(data: { challengeId: string; language: string; code: string }) {
    const { data: result } = await api.post('/submissions/run', data);
    return result;
  },

  async getMyHistory(params?: { page?: number; limit?: number; kind?: string; verdict?: string }) {
    const { data } = await api.get('/submissions/me', { params });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/submissions/${id}`);
    return data;
  },

  async getAiReview(submissionId: string) {
    const { data } = await api.get(`/submissions/${submissionId}/ai-review`);
    return data;
  },

  // Admin
  async getAll(params?: any) {
    const { data } = await api.get('/submissions', { params });
    return data;
  },
};
