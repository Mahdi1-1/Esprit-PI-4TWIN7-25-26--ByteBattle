import api from '../api/axios';
import { io, Socket } from 'socket.io-client';
import { getSocketNamespaceUrl } from '../config/runtime';
import type {
  Notification,
  NotificationPreference,
  PaginatedResponse,
} from '../types/notification.types';

export type { Notification };

export type CompanyNotificationType = 'join_request' | 'roadmap_assigned' | 'course_enrolled' | 'application_received' | 'badge_earned';

export interface CompanyNotification {
  id: string;
  companyId: string;
  type: CompanyNotificationType;
  userId?: string;
  user?: {
    id: string;
    username: string;
    profileImage?: string;
  };
  read: boolean;
  createdAt: string;
  targetUrl?: string;
  message: string;
}

export interface NotificationsFilters {
  type?: CompanyNotificationType;
  read?: boolean;
  startDate?: string;
  endDate?: string;
}

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

    socket = io(getSocketNamespaceUrl('/notifications'), {
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

  // ─── Company Notifications ──────────────────────────────────

  async getCompanyNotifications(
    companyId: string,
    page = 1,
    limit = 20,
    filters?: NotificationsFilters
  ): Promise<{ notifications: CompanyNotification[]; total: number }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.read !== undefined) params.append('read', filters.read.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const { data } = await api.get(`/companies/${companyId}/notifications?${params.toString()}`);
    return data;
  },

  async markCompanyNotificationRead(companyId: string, notificationId: string): Promise<void> {
    await api.post(`/companies/${companyId}/notifications/${notificationId}/read`);
  },

  async markAllCompanyNotificationsRead(companyId: string): Promise<void> {
    await api.post(`/companies/${companyId}/notifications/read-all`);
  },

  async getCompanyUnreadCount(companyId: string): Promise<{ count: number }> {
    const { data } = await api.get(`/companies/${companyId}/notifications/unread-count`);
    return data;
  },

  onCompanyNotification(callback: (notification: CompanyNotification) => void): () => void {
    const handler = (data: CompanyNotification) => callback(data);

    const companyEventHandlers = [
      'company:join_request',
      'company:roadmap_assigned',
      'company:course_enrolled',
      'company:application_received',
      'company:badge_earned'
    ];

    if (socket?.connected) {
      companyEventHandlers.forEach(event => {
        socket?.on(event, handler);
      });
    }

    const unsubscribe = () => {
      companyEventHandlers.forEach(event => {
        socket?.off(event, handler);
      });
      listeners.delete(unsubscribe);
    };
    listeners.add(unsubscribe);
    return unsubscribe;
  },
};
