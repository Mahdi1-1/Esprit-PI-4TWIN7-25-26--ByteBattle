import api from '../api/axios';
import { io, Socket } from 'socket.io-client';
import type {
  Notification,
  NotificationPreference,
  PaginatedResponse,
} from '../types/notification.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

export type { Notification };

let socket: Socket | null = null;
const listeners: Set<() => void> = new Set();

export const notificationsService = {
  // ─── REST ────────────────────────────────────────────────

  async getByPage(
    page = 1,
    limit = 20,
    category?: string,
    unreadOnly?: boolean,
  ): Promise<PaginatedResponse<Notification>> {
    const params: Record<string, unknown> = { page, limit };
    if (category) params.category = category;
    if (unreadOnly !== undefined) params.unreadOnly = unreadOnly;
    const { data } = await api.get('/notifications', { params });
    return data;
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get('/notifications/unread-count');
    return data.count ?? 0;
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async archive(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/archive`);
  },

  async bulkMarkRead(ids: string[]): Promise<{ updated: number }> {
    const { data } = await api.patch('/notifications/bulk/read', { ids });
    return data;
  },

  async bulkArchive(ids: string[]): Promise<{ updated: number }> {
    const { data } = await api.patch('/notifications/bulk/archive', { ids });
    return data;
  },

  async getPreferences(): Promise<NotificationPreference> {
    const { data } = await api.get('/notifications/preferences');
    return data;
  },

  async updatePreferences(dto: Partial<NotificationPreference>): Promise<NotificationPreference> {
    const { data } = await api.put('/notifications/preferences', dto);
    return data;
  },

  /** Dev helper — fires a test notification to the current user */
  async sendTest(): Promise<void> {
    await api.post('/notifications/test');
  },

  // ─── Socket.IO ───────────────────────────────────────────

  connect(token: string) {
    if (socket?.connected) return;

    socket = io(`${API_URL}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('🔔 Notifications socket connected');
    });

    socket.on('disconnect', () => {
      console.log('🔔 Notifications socket disconnected');
    });

    socket.on('error', (err: Error) => {
      console.error('🔔 Socket error:', err);
    });
  },

  disconnect() {
    if (socket) {
      listeners.forEach(unsub => unsub());
      listeners.clear();
      socket.disconnect();
      socket = null;
    }
  },

  onNewNotification(callback: (notification: Notification) => void): () => void {
    const handler = (data: Notification) => callback(data);

    if (socket?.connected) {
      socket.on('notification:new', handler);
    } else if (socket) {
      socket.once('connect', () => {
        socket?.on('notification:new', handler);
      });
    } else {
      console.warn('Notifications socket not initialised. Call connect() first.');
      return () => {};
    }

    const unsubscribe = () => {
      socket?.off('notification:new', handler);
      listeners.delete(unsubscribe);
    };
    listeners.add(unsubscribe);
    return unsubscribe;
  },
};
