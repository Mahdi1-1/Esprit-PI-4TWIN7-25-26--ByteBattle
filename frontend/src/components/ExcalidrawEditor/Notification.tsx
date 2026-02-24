                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        import type { Theme } from "./types";

interface NotificationProps {
  message: string | null;
  theme: Theme;
}

export function Notification({ message }: NotificationProps) {
  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-bounce">
      <div className="px-6 py-3 rounded-[var(--card-radius)] shadow-lg font-medium text-sm bg-[var(--surface-1)] text-[var(--text-primary)] border border-[var(--border-default)]">
        {message}
      </div>
    </div>
  );
}
