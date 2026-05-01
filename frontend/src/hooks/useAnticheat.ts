import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface UseAnticheatOptions {
  /** Called each time a focus loss is detected */
  onFocusLost?: (count: number) => void;
  /** Called when a copy/paste/cut event is blocked */
  onCopyPasteBlocked?: () => void;
  /** Called when user exits fullscreen mode */
  onFullScreenExit?: () => void;
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
    onFullScreenExit,
    autoFullscreen = true,
    blockCopyPaste = true,
  } = options;

  const [focusLostCount, setFocusLostCount] = useState(0);
  const [totalFocusLostTime, setTotalFocusLostTime] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const focusLostCountRef = useRef(0);
  const wasFullScreenRef = useRef(false);

  // Use a ref to hold the interval so it persists across renders without triggering effects
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fullscreen state tracking (always active) ──────────────────────────────
  useEffect(() => {
    const handleFullScreenChange = () => {
      const currentlyFullScreen = !!document.fullscreenElement;
      if (wasFullScreenRef.current && !currentlyFullScreen) {
        toast.error('⚠️ Fullscreen disabled. Please re-enable it to continue.', {
          duration: 4000,
        });
        onFullScreenExit?.();
      }

      wasFullScreenRef.current = currentlyFullScreen;
      setIsFullScreen(currentlyFullScreen);
    };

    // Sync immediately on mount in case page already entered fullscreen
    handleFullScreenChange();

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, [onFullScreenExit]);

  // ── Auto Fullscreen request (optional) ─────────────────────────────────────
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

    return;
  }, [autoFullscreen]);

  // ── Focus / Visibility Tracking ─────────────────────────────────────────────
  useEffect(() => {
    const handleLoss = () => {
      // Only increment once per consecutive blur (avoid double-fire from both blur + visibilitychange)
      if (intervalRef.current !== null) return;

      const next = focusLostCountRef.current + 1;
      focusLostCountRef.current = next;
      setFocusLostCount(next);
      setTimeout(() => {
        toast.error('⚠️ Warning! Focus lost.', { duration: 4000 });
        onFocusLost?.(next);
      }, 0);

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
      toast.error('🚫 Copy/paste is disabled during the challenge.', {
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
