import api from '../api/axios';

export const teamsService = {
  async getMine() {
    const { data } = await api.get('/teams/mine');
    return data;
  },

  async getAll() {
    const { data } = await api.get('/teams/all');
    return data;
  },

  async getTeam(teamId: string) {
    const { data } = await api.get(`/teams/${teamId}`);
    return data;
  },

  async create(name: string) {
    const { data } = await api.post('/teams', { name });
    return data;
  },

  async addMember(teamId: string, username: string) {
    const { data } = await api.post(`/teams/${teamId}/members`, { username });
    return data;
  },

  async removeMember(teamId: string, targetUserId: string) {
    const { data } = await api.delete(`/teams/${teamId}/members/${targetUserId}`);
    return data;
  },

  async leaveTeam(teamId: string) {
    const { data } = await api.delete(`/teams/${teamId}/leave`);
    return data;
  },

  async deleteTeam(teamId: string) {
    const { data } = await api.delete(`/teams/${teamId}`);
    return data;
  },

  async requestJoinByCode(joinCode: string) {
    const { data } = await api.post('/teams/request-join', { joinCode });
    return data;
  },

  async requestToJoin(teamId: string) {
    const { data } = await api.post(`/teams/${teamId}/join-request`);
    return data;
  },

  async approveJoinRequest(teamId: string, targetUserId: string) {
    const { data } = await api.post(`/teams/${teamId}/join-requests/${targetUserId}/accept`);
    return data;
  },

  async rejectJoinRequest(teamId: string, targetUserId: string) {
    const { data } = await api.post(`/teams/${teamId}/join-requests/${targetUserId}/reject`);
    return data;
  },

  async registerToHackathon(teamId: string, hackathonId: string) {
    const { data } = await api.post(`/teams/${teamId}/register/${hackathonId}`);
    return data;
  },
};