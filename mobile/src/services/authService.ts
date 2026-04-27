import { apiClient } from '../api/axiosClient';
import { tokenStorage } from '../api/axiosClient';

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    level: number;
    xp: number;
    elo: number;
    profileImage?: string;
  };
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post('/auth/login', { email, password });
    return data;
  },

  async register(username: string, email: string, password: string) {
    const { data } = await apiClient.post('/auth/register', { username, email, password });
    return data;
  },

  async forgotPassword(email: string) {
    const { data } = await apiClient.post('/auth/forgot-password', { email });
    return data;
  },

  async logout() {
    try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
    await tokenStorage.delete('accessToken');
    await tokenStorage.delete('refreshToken');
  },

  async saveTokens(accessToken: string, refreshToken?: string) {
    await tokenStorage.set('accessToken', accessToken);
    if (refreshToken) {
      await tokenStorage.set('refreshToken', refreshToken);
    }
  },

  async getMe() {
    const { data } = await apiClient.get('/users/me');
    return data;
  },
};
