import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface UseAnticheatOptions {
  /** Called each time a focus loss is detected */
  onFocusLost?: (count: number) => void;
  /** Called when a copy/paste/cut event is blocked */
  onCopyPasteBlocked?: () => void;
  /** Whether to auto-request fullscreen on mount */
  autoFullscreen?: boolean;
  /** Whether to block copy/paste/contextmenu */
  blockCopyPaste?: boolean;
}

interface AnticheatState {
  focusLostCount: number;
  totalFocusLostTime: number;
  isFullScreen: boolean;
}

export function useAnticheat(options: UseAnticheatOptions = {}): AnticheatState {
  const {
    onFocusLost,
    onCopyPasteBlocked,
    autoFullscreen = true,
    blockCopyPaste = true,
  } = options;

  const [focusLostCount, setFocusLostCount] = useState(0);
  const [totalFocusLostTime, setTotalFocusLostTime] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Use a ref to hold the interval so it persists across renders without triggering effects
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Auto Fullscreen ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoFullscreen) return;

    const enterFullScreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          setIsFullScreen(true);
        }
      } catch {
        console.warn('Auto-fullscreen blocked by browser.');
      }
    };

    enterFullScreen();

    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, [autoFullscreen]);

  // ── Focus / Visibility Tracking ─────────────────────────────────────────────
  useEffect(() => {
    const handleLoss = () => {
      // Only increment once per consecutive blur (avoid double-fire from both blur + visibilitychange)
      if (intervalRef.current !== null) return;

      setFocusLostCount((prev) => {
        const next = prev + 1;
        toast.error('⚠️ Attention ! Focus perdu.', { duration: 4000 });
        onFocusLost?.(next);
        return next;
      });

      intervalRef.current = setInterval(() => {
        setTotalFocusLostTime((prev) => prev + 1);
      }, 1000);
    };

    const handleGain = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleLoss();
      } else {
        handleGain();
      }
    };

    window.addEventListener('blur', handleLoss);
    window.addEventListener('focus', handleGain);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('blur', handleLoss);
      window.removeEventListener('focus', handleGain);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onFocusLost]);

  // ── Block Copy / Paste / Contextmenu ────────────────────────────────────────
  useEffect(() => {
    if (!blockCopyPaste) return;

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error('🚫 Copier-coller désactivé pendant l\'épreuve.', {
        style: {
          background: 'var(--surface-2)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
        },
      });
      onCopyPasteBlocked?.();
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('copy', handleCopyPaste as EventListener);
    window.addEventListener('cut', handleCopyPaste as EventListener);
    window.addEventListener('paste', handleCopyPaste as EventListener);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('copy', handleCopyPaste as EventListener);
      window.removeEventListener('cut', handleCopyPaste as EventListener);
      window.removeEventListener('paste', handleCopyPaste as EventListener);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [blockCopyPaste, onCopyPasteBlocked]);

  return { focusLostCount, totalFocusLostTime, isFullScreen };
}
