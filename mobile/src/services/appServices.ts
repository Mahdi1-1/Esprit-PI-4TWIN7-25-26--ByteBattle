import { apiClient } from '../api/axiosClient';

export const duelsService = {
  async getQueueStats() {
    try {
      const { data } = await apiClient.get('/duels/queue/stats');
      return data;
    } catch { return { playersOnline: 0, waitingDuels: 0, activeDuels: 0, estimatedWaitSeconds: 30 }; }
  },

  async getMyStats() {
    const { data } = await apiClient.get('/duels/me/stats');
    return data;
  },

  async createOrJoin(difficulty: string = 'easy') {
    const { data } = await apiClient.post('/duels/matchmaking', { difficulty });
    return data;
  },

  async getById(id: string) {
    const { data } = await apiClient.get(`/duels/${id}`);
    return data;
  },

  async getResult(id: string) {
    const { data } = await apiClient.get(`/duels/${id}/result`);
    return data;
  },
};

export const notificationsService = {
  async getAll(page = 1, limit = 20, category?: string, unreadOnly?: boolean) {
    const params: any = { page, limit };
    if (category && category !== 'all') params.category = category;
    if (unreadOnly) params.unread = true;
    const { data } = await apiClient.get('/notifications', { params });
    return data;
  },

  async markRead(id: string) {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllRead() {
    await apiClient.patch('/notifications/read-all');
  },

  async archive(id: string) {
    await apiClient.delete(`/notifications/${id}`);
  },

  async getUnreadCount() {
    try {
      const { data } = await apiClient.get('/notifications/unread-count');
      return data?.count ?? 0;
    } catch { return 0; }
  },
};

export const hackathonsService = {
  async getAll() {
    const { data } = await apiClient.get('/hackathons');
    return data;
  },

  async getById(id: string) {
    const { data } = await apiClient.get(`/hackathons/${id}`);
    return data;
  },

  async getResults(id: string) {
    const { data } = await apiClient.get(`/hackathons/${id}/results`);
    return data;
  },

  async getScoreboard(id: string) {
    const { data } = await apiClient.get(`/hackathons/${id}/scoreboard`);
    return data;
  },
};

export const teamsService = {
  async getMine() {
    const { data } = await apiClient.get('/teams/mine');
    return Array.isArray(data) ? data : [];
  },

  async registerToHackathon(teamId: string, hackathonId: string) {
    const { data } = await apiClient.post(`/teams/${teamId}/hackathons/${hackathonId}`);
    return data;
  },

  async create(name: string) {
    const { data } = await apiClient.post('/teams', { name });
    return data;
  },
};

export const discussionsService = {
  async getAll(params?: { page?: number; limit?: number; search?: string; tag?: string }) {
    const { data } = await apiClient.get('/discussions', { params });
    return data;
  },

  async getById(id: string) {
    const { data } = await apiClient.get(`/discussions/${id}`);
    return data;
  },

  async create(payload: { title: string; content: string; tags?: string[] }) {
    const { data } = await apiClient.post('/discussions', payload);
    return data;
  },

  async createComment(id: string, content: string) {
    const { data } = await apiClient.post(`/discussions/${id}/comments`, { content });
    return data;
  },

  async upvote(id: string) {
    const { data } = await apiClient.post(`/discussions/${id}/upvote`);
    return data;
  },
};

export const settingsService = {
  async update(payload: { username?: string; bio?: string; email?: string }) {
    const { data } = await apiClient.patch('/users/me', payload);
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const { data } = await apiClient.patch('/auth/change-password', { currentPassword, newPassword });
    return data;
  },

  async uploadAvatar(formData: FormData) {
    const { data } = await apiClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export const aiInterviewService = {
  async getSessions() {
    const { data } = await apiClient.get('/interviews');
    return Array.isArray(data) ? data : [];
  },

  async startNew(params: { jobRole: string; difficulty: string }) {
    const { data } = await apiClient.post('/interviews/start', params);
    return data;
  },
};

export const companiesService = {
  async getAll() {
    const { data } = await apiClient.get('/companies');
    return Array.isArray(data) ? data : [];
  },
  
  async getById(id: string) {
    const { data } = await apiClient.get(`/companies/${id}`);
    return data;
  }
};
