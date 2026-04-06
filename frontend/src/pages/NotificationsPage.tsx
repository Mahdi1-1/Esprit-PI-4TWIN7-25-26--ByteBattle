import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Trophy, Swords, MessageSquare, Code2, Palette, Medal, Megaphone,
  CheckCheck, Archive, Trash2, ChevronDown,
} from 'lucide-react';
import { notificationsService } from '../services/notificationsService';
import type { Notification } from '../types/notification.types';
import { NotificationCategory } from '../types/notification.types';
import { useNotifications } from '../context/NotificationContext';

const CATEGORIES: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <Bell className="w-4 h-4" /> },
  { id: NotificationCategory.HACKATHON, label: 'Hackathon', icon: <Trophy className="w-4 h-4" /> },
  { id: NotificationCategory.DUEL, label: 'Duel', icon: <Swords className="w-4 h-4" /> },
  { id: NotificationCategory.DISCUSSION, label: 'Discussion', icon: <MessageSquare className="w-4 h-4" /> },
  { id: NotificationCategory.SUBMISSION, label: 'Submission', icon: <Code2 className="w-4 h-4" /> },
  { id: NotificationCategory.ACHIEVEMENT, label: 'Achievement', icon: <Medal className="w-4 h-4" /> },
  { id: NotificationCategory.SYSTEM, label: 'System', icon: <Megaphone className="w-4 h-4" /> },
];

const PRIORITY_BORDER: Record<string, string> = {
  critical: 'border-l-4 border-red-500',
  high: 'border-l-4 border-orange-400',
  medium: 'border-l-4 border-blue-400',
  low: 'border-l-4 border-gray-400',
};

function CategoryIcon({ category }: { category: string }) {
  const cat = CATEGORIES.find(c => c.id === category);
  return <>{cat?.icon ?? <Bell className="w-4 h-4" />}</>;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { markAllRead } = useNotifications();

  const [items, setItems] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [activeTab, setActiveTab] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadNotifications = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    if (reset) setLoading(true); else setLoadingMore(true);

    try {
      const result = await notificationsService.getByPage(
        currentPage,
        20,
        activeTab === 'all' ? undefined : activeTab,
        unreadOnly || undefined,
      );
      if (reset) {
        setItems(result.data);
        setPage(1);
      } else {
        setItems(prev => [...prev, ...result.data]);
      }
      setTotal(result.total);
      setHasMore(result.hasMore);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, unreadOnly, page]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
    loadNotifications(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, unreadOnly]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    const result = await notificationsService.getByPage(
      nextPage, 20,
      activeTab === 'all' ? undefined : activeTab,
      unreadOnly || undefined,
    );
    setItems(prev => [...prev, ...result.data]);
    setHasMore(result.hasMore);
    setLoadingMore(false);
  };

  const handleClickItem = async (n: Notification) => {
    if (!n.isRead) {
      await notificationsService.markRead(n.id);
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
    }
    if (n.actionUrl) navigate(n.actionUrl);
  };

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationsService.archive(id);
    setItems(prev => prev.filter(x => x.id !== id));
    setTotal(t => t - 1);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkRead = async () => {
    const ids = [...selected];
    await notificationsService.bulkMarkRead(ids);
    setItems(prev => prev.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n));
    setSelected(new Set());
  };

  const handleBulkArchive = async () => {
    const ids = [...selected];
    await notificationsService.bulkArchive(ids);
    setItems(prev => prev.filter(n => !ids.includes(n.id)));
    setTotal(t => t - ids.length);
    setSelected(new Set());
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={e => setUnreadOnly(e.target.checked)}
                className="rounded"
              />
              Unread only
            </label>
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-sm text-[var(--brand-primary)] hover:underline"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-sm whitespace-nowrap transition-colors ${
                activeTab === cat.id
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Bulk actions toolbar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 mb-4 px-4 py-2 bg-[var(--surface-2)] rounded-[var(--radius-md)]">
            <span className="text-sm text-[var(--text-secondary)]">{selected.size} selected</span>
            <button onClick={handleBulkRead} className="flex items-center gap-1 text-sm text-[var(--brand-primary)] hover:underline">
              <CheckCheck className="w-3.5 h-3.5" /> Mark read
            </button>
            <button onClick={handleBulkArchive} className="flex items-center gap-1 text-sm text-[var(--state-error)] hover:underline">
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
          </div>
        )}

        {/* Notification List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
            <Bell className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">You're all caught up!</p>
            <p className="text-sm mt-1">No notifications to show</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(n => (
              <div
                key={n.id}
                onClick={() => handleClickItem(n)}
                className={`flex items-start gap-3 px-4 py-3 rounded-[var(--radius-md)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] cursor-pointer transition-colors ${PRIORITY_BORDER[n.priority] ?? ''} ${!n.isRead ? 'bg-[var(--brand-primary)]/5' : ''}`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selected.has(n.id)}
                  onChange={() => toggleSelect(n.id)}
                  onClick={e => e.stopPropagation()}
                  className="mt-1 flex-shrink-0 rounded"
                />

                {/* Category icon / sender avatar */}
                <div className="flex-shrink-0 mt-0.5">
                  {n.senderPhoto ? (
                    <img src={n.senderPhoto} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
                      <CategoryIcon category={n.category} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? 'font-semibold' : ''} text-[var(--text-primary)] truncate`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{n.message}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatTime(n.createdAt)}</p>
                </div>

                {/* Unread dot + archive */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                  <button
                    onClick={e => handleArchive(n.id, e)}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--state-error)] transition-colors"
                    title="Archive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--brand-primary)] border border-[var(--brand-primary)] rounded-[var(--radius-md)] hover:bg-[var(--brand-primary)]/10 transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <div className="w-4 h-4 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              Load more
            </button>
          </div>
        )}

        {!loading && items.length > 0 && (
          <p className="text-center text-xs text-[var(--text-muted)] mt-4">
            Showing {items.length} of {total}
          </p>
        )}
      </div>
    </div>
  );
}
