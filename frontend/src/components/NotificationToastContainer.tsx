import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { NotificationToast } from './NotificationToast';

export function NotificationToastContainer() {
  const { toasts } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <NotificationToast notification={t.notification} />
        </div>
      ))}
    </div>
  );
}
