import { apiClient } from '../api/axiosClient';

export interface Challenge {
  id: string;
  title: string;
  kind: 'CODE' | 'CANVAS';
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
  descriptionMd?: string;
  category?: string;
}

export const challengesService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    kind?: string;
    difficulty?: string;
  }) {
    const { data } = await apiClient.get('/challenges', { params });
    // Dépends of backend format, typically data.data or data
    return data.items || data.data || data;
  },

  async getById(id: string) {
    const { data } = await apiClient.get(`/challenges/${id}`);
    return data.data || data;
  },
};
