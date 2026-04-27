import { apiClient } from '../api/axiosClient';

export const dashboardService = {
  async getRecommended() {
    try {
      const { data } = await apiClient.get('/challenges/recommended');
      return Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
    } catch { return []; }
  },

  async getRecentMatches() {
    try {
      const { data } = await apiClient.get('/users/me/history');
      return Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
    } catch { return []; }
  },

  async getSkills() {
    try {
      // Try ML service first
      const { data } = await apiClient.get('/ml/skills');
      if (data?.source === 'ml') {
        const { source, ...scores } = data;
        return scores;
      }
    } catch { /* fallback */ }
    try {
      const { data } = await apiClient.get('/users/me/skills');
      return data || {};
    } catch { return {}; }
  },
};
