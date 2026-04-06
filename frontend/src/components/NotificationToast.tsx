import React, { useEffect, useState } from 'react';
import { X, Trophy, Swords, MessageSquare, Code2, Medal, Megaphone, Bell } from 'lucide-react';
import type { Notification } from '../types/notification.types';
import { NotificationCategory } from '../types/notification.types';
import { useNavigate } from 'react-router-dom';
import { notificationsService } from '../services/notificationsService';
import { useNotifications } from '../context/NotificationContext';

interface Props {
  notification: Notification;
}

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  [NotificationCategory.HACKATHON]: <Trophy className="w-4 h-4" />,
  [NotificationCategory.DUEL]: <Swords className="w-4 h-4" />,
  [NotificationCategory.DISCUSSION]: <MessageSquare className="w-4 h-4" />,
  [NotificationCategory.SUBMISSION]: <Code2 className="w-4 h-4" />,
  [NotificationCategory.ACHIEVEMENT]: <Medal className="w-4 h-4" />,
  [NotificationCategory.SYSTEM]: <Megaphone className="w-4 h-4" />,
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30',
  high: 'border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-950/30',
  medium: 'border-l-4 border-blue-400 bg-[var(--surface-1)]',
  low: 'border-l-4 border-gray-300 bg-[var(--surface-1)]',
};

export function NotificationToast({ notification }: Props) {
  const navigate = useNavigate();
  const { removeToast } = useNotifications();
  const [exiting, setExiting] = useState(false);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => removeToast(notification.id), 300);
  };

  useEffect(() => {
    const timer = setTimeout(() => dismiss(), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = async () => {
    await notificationsService.markRead(notification.id);
    dismiss();
    if (notification.actionUrl) navigate(notification.actionUrl);
  };

  return (
    <div
      className={`
        relative flex items-start gap-3 w-80 px-4 py-3 rounded-[var(--radius-md)] shadow-lg cursor-pointer
        transition-all duration-300 ease-out
        ${PRIORITY_STYLES[notification.priority] ?? PRIORITY_STYLES.medium}
        ${exiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}
      `}
      onClick={handleClick}
      role="alert"
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5 text-[var(--brand-primary)]">
        {notification.senderPhoto ? (
          <img src={notification.senderPhoto} alt="" className="w-6 h-6 rounded-full object-cover" />
        ) : (
          CATEGORY_ICON[notification.category] ?? <Bell className="w-4 h-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
          {notification.title}
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{notification.message}</p>
      </div>

      {/* Close */}
      <button
        onClick={e => { e.stopPropagation(); dismiss(); }}
        className="flex-shrink-0 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-[var(--brand-primary)] rounded-bl-[var(--radius-md)]"
        style={{ animation: 'shrink 5s linear forwards' }}
      />
    </div>
  );
}
