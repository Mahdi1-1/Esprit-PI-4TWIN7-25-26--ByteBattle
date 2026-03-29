import api from '../api/axios';

export const hackathonsService = {
  // ── List & Detail ──────────────────────────────────────
  async getAll(params?: { page?: number; limit?: number; status?: string; scope?: string }) {
    const { data } = await api.get('/hackathons', { params });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/hackathons/${id}`);
    return data;
  },

  // ── Scoreboard ─────────────────────────────────────────
  async getScoreboard(id: string) {
    const { data } = await api.get(`/hackathons/${id}/scoreboard`);
    return data;
  },

  async getScoreboardLive(id: string) {
    const { data } = await api.get(`/hackathons/${id}/admin/scoreboard`);
    return data;
  },

  // ── Team Management ────────────────────────────────────
  async createTeam(hackathonId: string, name: string) {
    const { data } = await api.post(`/hackathons/${hackathonId}/teams`, { name });
    return data;
  },

  async joinTeamByCode(hackathonId: string, joinCode: string) {
    const { data } = await api.post(`/hackathons/${hackathonId}/teams/join`, { joinCode });
    return data;
  },

  async joinSolo(hackathonId: string) {
    const { data } = await api.post(`/hackathons/${hackathonId}/join-solo`);
    return data;
  },

  async checkinTeam(hackathonId: string, teamId: string) {
    const { data } = await api.post(`/hackathons/${hackathonId}/teams/${teamId}/checkin`);
    return data;
  },

  async leaveTeam(hackathonId: string, teamId: string) {
    const { data } = await api.post(`/hackathons/${hackathonId}/teams/${teamId}/leave`);
    return data;
  },

  async removeTeamMember(hackathonId: string, teamId: string, userId: string) {
    const { data } = await api.delete(`/hackathons/${hackathonId}/teams/${teamId}/members/${userId}`);
    return data;
  },

  // ── Submissions ────────────────────────────────────────
  async submitCode(hackathonId: string, teamId: string, body: { challengeId: string; code: string; language: string }) {
    const { data } = await api.post(`/hackathons/${hackathonId}/teams/${teamId}/submit`, body);
    return data;
  },

  async runCode(hackathonId: string, body: { challengeId: string; code: string; language: string }) {
    const { data } = await api.post(`/hackathons/${hackathonId}/run`, body);
    return data;
  },

  async getTeamSubmissions(hackathonId: string, teamId: string, challengeId?: string) {
    const params = challengeId ? { challengeId } : {};
    const { data } = await api.get(`/hackathons/${hackathonId}/teams/${teamId}/submissions`, { params });
    return data;
  },

  // ── Communication ──────────────────────────────────────
  async getClarifications(hackathonId: string, teamId?: string) {
    const params = teamId ? { teamId } : {};
    const { data } = await api.get(`/hackathons/${hackathonId}/clarifications`, { params });
    return data;
  },

  async createClarification(hackathonId: string, body: { teamId: string; challengeId?: string; question: string }) {
    const { data } = await api.post(`/hackathons/${hackathonId}/clarifications`, body);
    return data;
  },

  async getAnnouncements(hackathonId: string) {
    const { data } = await api.get(`/hackathons/${hackathonId}/announcements`);
    return data;
  },

  async getTeamMessages(hackathonId: string, teamId: string, params?: { before?: string; limit?: number }) {
    const { data } = await api.get(`/hackathons/${hackathonId}/teams/${teamId}/messages`, { params });
    return data;
  },

  async sendTeamMessage(hackathonId: string, teamId: string, body: { content: string; codeSnippet?: string; codeLanguage?: string }) {
    const { data } = await api.post(`/hackathons/${hackathonId}/teams/${teamId}/messages`, body);
    return data;
  },

  // ── Admin ──────────────────────────────────────────────
  async create(hackathon: any) {
    const { data } = await api.post('/hackathons', hackathon);
    return data;
  },

  async update(id: string, hackathon: any) {
    const { data } = await api.patch(`/hackathons/${id}`, hackathon);
    return data;
  },

  async delete(id: string) {
    const { data } = await api.delete(`/hackathons/${id}`);
    return data;
  },

  async transitionStatus(hackathonId: string, status: string) {
    const { data } = await api.post(`/hackathons/${hackathonId}/transition`, { status });
    return data;
  },

  async cancelHackathon(hackathonId: string, reason: string) {
    const { data } = await api.post(`/hackathons/${hackathonId}/cancel`, { reason });
    return data;
  },

  async disqualifyTeam(hackathonId: string, teamId: string, reason: string) {
    const { data } = await api.post(`/hackathons/${hackathonId}/teams/${teamId}/disqualify`, { reason });
    return data;
  },

  async reinstateTeam(hackathonId: string, teamId: string) {
    const { data } = await api.post(`/hackathons/${hackathonId}/teams/${teamId}/reinstate`);
    return data;
  },

  async rejudge(hackathonId: string, body: { challengeId?: string; teamId?: string }) {
    const { data } = await api.post(`/hackathons/${hackathonId}/rejudge`, body);
    return data;
  },

  async getMonitoring(hackathonId: string) {
    const { data } = await api.get(`/hackathons/${hackathonId}/admin/monitoring`);
    return data;
  },

  async getAuditLog(hackathonId: string, params?: { action?: string; page?: number; limit?: number }) {
    const { data } = await api.get(`/hackathons/${hackathonId}/admin/audit-log`, { params });
    return data;
  },

  async getAdminScoreboard(hackathonId: string) {
    const { data } = await api.get(`/hackathons/${hackathonId}/admin/scoreboard`);
    return data;
  },

  async exportResults(hackathonId: string, format: 'csv' | 'json') {
    const { data } = await api.post(`/hackathons/${hackathonId}/export`, { format }, {
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    return data;
  },

  async triggerPlagiarismScan(hackathonId: string, challengeId: string) {
    const { data } = await api.post(`/hackathons/${hackathonId}/plagiarism-scan`, { challengeId });
    return data;
  },

  // Legacy
  async joinTeam(teamId: string) {
    const { data } = await api.post(`/hackathons/legacy-teams/${teamId}/join`);
    return data;
  },
};
