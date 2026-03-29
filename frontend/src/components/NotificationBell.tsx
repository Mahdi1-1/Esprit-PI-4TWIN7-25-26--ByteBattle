import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, ThumbsUp, MessageSquare, Reply, Award, X } from 'lucide-react';
import { notificationsService, type Notification } from '../services/notificationsService';
import { useAuth } from '../context/AuthContext';

export function NotificationBell() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch initial data and connect socket
    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem('access_token');
        if (token) {
            notificationsService.connect(token);
        }

        // Subscribe to new notifications
        const unsubscribe = notificationsService.onNewNotification((notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        // Fetch initial data
        Promise.all([
            notificationsService.getAll(),
            notificationsService.getUnreadCount(),
        ]).then(([all, count]) => {
            setNotifications(all);
            setUnreadCount(count);
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });

        return () => {
            unsubscribe();
            notificationsService.disconnect();
        };
    }, [user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleMarkRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await notificationsService.markRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark read:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsService.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all read:', err);
        }
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'like-post':
            case 'like-comment':
                return <ThumbsUp className="w-4 h-4 text-green-500" />;
            case 'new-comment':
                return <MessageSquare className="w-4 h-4 text-blue-500" />;
            case 'reply-comment':
                return <Reply className="w-4 h-4 text-purple-500" />;
            case 'best-answer':
                return <Award className="w-4 h-4 text-yellow-500" />;
            default:
                return <Bell className="w-4 h-4" />;
        }
    };

    const getNotificationText = (notification: Notification) => {
        const actorName = notification.actor?.username || 'Someone';
        switch (notification.type) {
            case 'like-post':
                return `${actorName} liked your post`;
            case 'like-comment':
                return `${actorName} liked your comment`;
            case 'new-comment':
                return `${actorName} commented on your post`;
            case 'reply-comment':
                return `${actorName} replied to your comment`;
            case 'best-answer':
                return `${actorName} marked your answer as best`;
            default:
                return 'New notification';
        }
    };

    const getNotificationLink = (notification: Notification) => {
        if (notification.targetType === 'discussion') {
            return `/discussion/${notification.targetId}`;
        }
        return `/discussion/${notification.targetId}`; // Would need to fetch discussion ID for comment
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] rounded-[var(--radius-md)] transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-[var(--state-error)] rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-lg z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
                        <h3 className="font-semibold text-sm text-[var(--text-primary)]">Notifications</h3>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] rounded-[var(--radius-sm)] transition-colors"
                                    title="Mark all as read"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] rounded-[var(--radius-sm)] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-72 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <a
                                    key={notification.id}
                                    href={getNotificationLink(notification)}
                                    onClick={() => {
                                        if (!notification.isRead) {
                                            handleMarkRead(notification.id, { stopPropagation: () => { } } as React.MouseEvent);
                                        }
                                        setIsOpen(false);
                                    }}
                                    className={`flex items-start gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition-colors ${!notification.isRead ? 'bg-[var(--brand-primary)]/5' : ''
                                        }`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''} text-[var(--text-primary)]`}>
                                            {getNotificationText(notification)}
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                            {formatTime(notification.createdAt)}
                                        </p>
                                    </div>
                                    {!notification.isRead && (
                                        <button
                                            onClick={(e) => handleMarkRead(notification.id, e)}
                                            className="flex-shrink-0 p-1 text-[var(--text-muted)] hover:text-[var(--state-success)] transition-colors"
                                            title="Mark as read"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                </a>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
