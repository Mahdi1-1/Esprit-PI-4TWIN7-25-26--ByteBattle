import api from '../api/axios';

export interface Challenge {
  id: string;
  title: string;
  kind: 'CODE' | 'CANVAS';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  descriptionMd: string;
  status: string;
  allowedLanguages: string[];
  constraints: any;
  tests: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
  examples: any[];
  category: string;
  createdAt: string;
  _count?: { submissions: number };
}

export const challengesService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    kind?: string;
    difficulty?: string;
    tags?: string;
    search?: string;
    status?: string;
  }) {
    const { data } = await api.get('/challenges', { params });
    return data;
  },

  async getRecommended() {
    const { data } = await api.get('/challenges/recommended');
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/challenges/${id}`);
    return data;
  },

  // Admin
  async create(challenge: Partial<Challenge>) {
    const { data } = await api.post('/challenges', challenge);
    return data;
  },

  async createCodeChallenge(challenge: any) {
    const { data } = await api.post('/challenges/code', challenge);
    return data;
  },

  async createCompanyCodeChallenge(challenge: any) {
    const { data } = await api.post('/challenges/company/code', challenge);
    return data;
  },

  async createCanvasChallenge(challenge: any) {
    const { data } = await api.post('/challenges/canvas', challenge);
    return data;
  },

  async update(id: string, challenge: Partial<Challenge>) {
    const { data } = await api.patch(`/challenges/${id}`, challenge);
    return data;
  },

  async delete(id: string) {
    const { data } = await api.delete(`/challenges/${id}`);
    return data;
  },

  async getAllAdmin(params?: any) {
    const { data } = await api.get('/challenges/admin/all', { params });
    return data;
  },

  async getCompanyChallenges(companyId?: string) {
    const { data } = await api.get('/challenges/company/mine', {
      params: companyId ? { companyId } : undefined,
    });
    return data;
  },

  async getCompanyChallengeResults(challengeId: string) {
    const { data } = await api.get(`/challenges/company/${challengeId}/results`);
    return data;
  },

  async getByIdAdmin(id: string) {
    const { data } = await api.get(`/challenges/admin/${id}`);
    return data;
  },
};
