import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { notificationsService } from '../services/notificationsService';
import type { Notification } from '../types/notification.types';
import { NotificationPriority } from '../types/notification.types';
import { useAuth } from './AuthContext';

interface ToastItem {
  id: string;
  notification: Notification;
  addedAt: number;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  toasts: ToastItem[];
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  removeToast: (id: string) => void;
  refreshCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const refreshCount = useCallback(async () => {
    try {
      const count = await notificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (!user) {
      // Not authenticated — skip socket connection and API calls entirely
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const token = localStorage.getItem('token');
    if (token) notificationsService.connect(token);

    // Load initial state
    Promise.all([
      notificationsService.getByPage(1, 5),
      notificationsService.getUnreadCount(),
    ])
      .then(([paged, count]) => {
        setNotifications(paged.data);
        setUnreadCount(count);
      })
      .catch((err) => {
        console.error('[NotificationContext] Failed to load notifications:', err?.response?.data ?? err.message);
      });

    // Subscribe to real-time pushes
    const unsub = notificationsService.onNewNotification((notif) => {
      setNotifications(prev => [notif, ...prev.slice(0, 49)]);
      setUnreadCount(prev => prev + 1);

      // Show toast for high and critical priority
      if (
        notif.priority === NotificationPriority.HIGH ||
        notif.priority === NotificationPriority.CRITICAL
      ) {
        const toastItem: ToastItem = { id: notif.id, notification: notif, addedAt: Date.now() };
        setToasts(prev => {
          const next = [toastItem, ...prev];
          return next.slice(0, 3); // max 3 visible
        });
      }
    });
    unsubscribeRef.current = unsub;

    return () => {
      unsub();
      unsubscribeRef.current = null;
    };
  }, [user]);

  const markRead = useCallback(async (id: string) => {
    await notificationsService.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsService.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, toasts, markRead, markAllRead, removeToast, refreshCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
