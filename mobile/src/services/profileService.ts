import { apiClient } from '../api/axiosClient';

export interface ProfileStats {
  elo: number;
  xp: number;
  level: number;
  duelsWon: number;
  duelsLost: number;
  duelsTotal: number;
  winRate: number;
  challengesSolved: number;
  discussionsCount: number;
  commentsCount: number;
  leaderboardPosition: number;
  totalUsers: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  profileImage?: string;
  elo: number;
  duelsWon: number;
  duelsLost: number;
  winRate: number;
  isCurrentUser?: boolean;
}

export const profileService = {
  async getProfileStats(): Promise<ProfileStats> {
    const { data } = await apiClient.get('/users/me/stats');
    return data;
  },

  async getActivity(limit = 15) {
    const { data } = await apiClient.get('/users/me/activity', { params: { limit } });
    return Array.isArray(data) ? data : [];
  },

  async getBadges() {
    const { data } = await apiClient.get('/badges/user/me');
    return Array.isArray(data) ? data : [];
  },

  getAvatarUrl(profileImage?: string | null, username?: string): string {
    if (profileImage && profileImage.startsWith('http')) return profileImage;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || 'user'}`;
  },
};

export const leaderboardService = {
  async getGlobal(params?: { limit?: number; sort?: string; language?: string }) {
    const { data } = await apiClient.get('/leaderboard', { params });
    return data;
  },

  async getMyRank() {
    const { data } = await apiClient.get('/leaderboard/me');
    return data;
  },

  async getLanguages() {
    const { data } = await apiClient.get('/leaderboard/languages');
    return data;
  },
};
