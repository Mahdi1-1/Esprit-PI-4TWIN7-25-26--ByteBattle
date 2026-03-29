import api from '../api/axios';

export const leaderboardService = {
  async getGlobal(params?: { page?: number; limit?: number; sort?: string; language?: string }) {
    const { data } = await api.get('/leaderboard', { params });
    return data;
  },

  async getLanguages() {
    const { data } = await api.get('/leaderboard/languages');
    return data;
  },

  async getMyRank() {
    const { data } = await api.get('/leaderboard/me');
    return data;
  },

  async getMyStats() {
    const { data } = await api.get('/leaderboard/stats');
    return data;
  },
};
