import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, X,
  Trophy, Swords, MessageSquare, Code2, Palette, Medal, Megaphone,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { notificationsService } from '../services/notificationsService';
import type { Notification } from '../types/notification.types';

function getCategoryIcon(category: string) {
  switch (category) {
    case 'hackathon':    return <Trophy className="w-4 h-4 text-orange-400" />;
    case 'duel':         return <Swords className="w-4 h-4 text-red-400" />;
    case 'discussion':   return <MessageSquare className="w-4 h-4 text-blue-400" />;
    case 'submission':   return <Code2 className="w-4 h-4 text-green-400" />;
    case 'canvas':       return <Palette className="w-4 h-4 text-purple-400" />;
    case 'achievement':  return <Medal className="w-4 h-4 text-yellow-400" />;
    case 'system':       return <Megaphone className="w-4 h-4 text-gray-400" />;
    default:             return <Bell className="w-4 h-4" />;
  }
}

function formatTime(dateStr: string) {
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
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const badgeLabel = unreadCount === 0 ? null : unreadCount > 99 ? '99+' : String(unreadCount);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleClickNotif = async (n: Notification) => {
    if (!n.isRead) await markRead(n.id);
    setIsOpen(false);
    if (n.actionUrl) navigate(n.actionUrl);
  };

  const handleSendTest = async () => {
    setTesting(true);
    try {
      await notificationsService.sendTest();
    } catch (e) {
      console.error('Test notification failed:', e);
    } finally {
      setTesting(false);
    }
  };

  const latest5 = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-2)] rounded-[var(--radius-md)] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {badgeLabel && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[1rem] h-4 px-0.5 text-[10px] font-bold text-white bg-[var(--state-error)] rounded-full">
            {badgeLabel}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
            <h3 className="font-semibold text-sm text-[var(--text-primary)]">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
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
            {latest5.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--text-muted)]">No notifications yet</div>
            ) : (
              latest5.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotif(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--surface-2)] transition-colors ${!n.isRead ? 'bg-[var(--brand-primary)]/5' : ''}`}
                >
                  <div className="flex-shrink-0 mt-0.5">{getCategoryIcon(n.category)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${!n.isRead ? 'font-semibold' : ''} text-[var(--text-primary)]`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{n.message}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-500" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--border-default)] px-4 py-2 space-y-1">
            <button
              onClick={() => { setIsOpen(false); navigate('/notifications'); }}
              className="w-full text-center text-xs text-[var(--brand-primary)] hover:underline py-1"
            >
              View all notifications
            </button>
            <button
              onClick={handleSendTest}
              disabled={testing}
              className="w-full text-center text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] py-0.5 disabled:opacity-50"
            >
              {testing ? 'Sending…' : '🧪 Send test notification'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
