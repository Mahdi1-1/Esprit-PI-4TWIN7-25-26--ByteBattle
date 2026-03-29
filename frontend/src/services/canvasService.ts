import api from '../api/axios';

export const canvasService = {
  async getChallenges(params?: { type?: string; difficulty?: string }) {
    const { data } = await api.get('/challenges', {
      params: { ...params, kind: 'CANVAS' },
    });
    return data;
  },

  async getChallengeById(id: string) {
    const { data } = await api.get(`/challenges/${id}`);
    return data;
  },

  async submitChallenge(id: string, submission: {
    imageData: string;
    elements: any[];
    mode: string;
  }) {
    const { data } = await api.post(`/submissions/submit`, {
      challengeId: id,
      code: JSON.stringify(submission),
      language: 'canvas',
    });
    return data;
  },

  async getSubmissions(challengeId: string) {
    const { data } = await api.get('/submissions/history', {
      params: { challengeId },
    });
    return data;
  },

  async getCommunityDesigns(params?: { challengeId?: string; sort?: string }) {
    const { data } = await api.get('/submissions/history', { params });
    return data;
  },
};
