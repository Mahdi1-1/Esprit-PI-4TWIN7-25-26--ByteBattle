import api from '../api/axios';

export interface Duel {
  id: string;
  status: string;
  difficulty: string;
  player1: { id: string; username: string; elo: number };
  player2?: { id: string; username: string; elo: number };
  challenge: { id: string; title: string; difficulty: string };
}

export const duelsService = {
  createOrJoin: async (difficulty: string = 'easy'): Promise<Duel> => {
    const { data } = await api.post('/duels/create', { difficulty });
    return data;
  },

  getLeaderboard: async (limit: number = 10) => {
    const { data } = await api.get(`/duels/leaderboard?limit=${limit}`);
    return data;
  },

  getHistory: async (page: number = 1, limit: number = 20) => {
    const { data } = await api.get(`/duels/history?page=${page}&limit=${limit}`);
    return data;
  },

  getDuelState: async (id: string) => {
    const { data } = await api.get(`/duels/${id}`);
    return data;
  },

  getDuelResult: async (id: string) => {
    const { data } = await api.get(`/duels/${id}/result`);
    return data;
  }
};
