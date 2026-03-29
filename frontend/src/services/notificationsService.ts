import api from '../api/axios';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

export interface Notification {
    id: string;
    recipientId: string;
    actorId: string;
    actor?: { id: string; username: string; profileImage?: string };
    type: 'like-post' | 'like-comment' | 'new-comment' | 'reply-comment' | 'best-answer';
    targetId: string;
    targetType: 'discussion' | 'comment';
    isRead: boolean;
    createdAt: string;
}

let socket: Socket | null = null;
const listeners: Set<() => void> = new Set();

export const notificationsService = {
    // REST API methods
    async getAll(): Promise<Notification[]> {
        const { data } = await api.get('/notifications');
        return data;
    },

    async getUnreadCount(): Promise<number> {
        const { data } = await api.get('/notifications/unread-count');
        return data.count || 0;
    },

    async markRead(id: string): Promise<void> {
        await api.patch(`/notifications/${id}/read`);
    },

    async markAllRead(): Promise<void> {
        await api.patch('/notifications/read-all');
    },

    // Socket.IO connection
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

    // Subscribe to new notifications — safe to call before connect()
    onNewNotification(callback: (notification: Notification) => void): () => void {
        const handler = (data: Notification) => callback(data);

        if (socket?.connected) {
            // Already connected — attach immediately
            socket.on('new-notification', handler);
        } else if (socket) {
            // Socket exists but not yet connected — wait for connect event
            socket.once('connect', () => {
                socket?.on('new-notification', handler);
            });
        } else {
            // Socket not even created yet (connect() wasn't called before this)
            console.warn('Notifications socket not initialised. Call connect() first.');
            return () => {};
        }

        const unsubscribe = () => {
            socket?.off('new-notification', handler);
            listeners.delete(unsubscribe);
        };

        listeners.add(unsubscribe);
        return unsubscribe;
    },
};
