import api from '../api/axios';
import { AvatarResponse, RPMExpression, RPMScene } from '../types/avatar.types';
import { getBackendOrigin } from '../config/runtime';

export const avatarService = {
  saveAvatar: async (glbUrl: string, scene?: string, expression?: string) => {
    const response = await api.post<AvatarResponse['avatar']>('/avatar/save', { 
      glbUrl, scene, expression 
    });
    return response.data;
  },

  getMyAvatar: async () => {
    const response = await api.get<AvatarResponse>('/avatar/me');
    return response.data;
  },

  getUserAvatar: async (userId: string) => {
    const response = await api.get<AvatarResponse>(`/avatar/user/${userId}`);
    return response.data;
  },

  updateExpression: async (expression: RPMExpression) => {
    const response = await api.patch<AvatarResponse['avatar']>('/avatar/expression', { expression });
    return response.data;
  },

  updateScene: async (scene: RPMScene) => {
    const response = await api.patch<AvatarResponse['avatar']>('/avatar/scene', { scene });
    return response.data;
  },

  refreshAvatar: async () => {
    const response = await api.post<AvatarResponse['avatar']>('/avatar/refresh');
    return response.data;
  },

  deleteAvatar: async () => {
    await api.delete('/avatar');
  },

  getFullUrl: (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = getBackendOrigin();
    return `${baseUrl.replace(/\/$/, '')}${path}`;
  }
};
