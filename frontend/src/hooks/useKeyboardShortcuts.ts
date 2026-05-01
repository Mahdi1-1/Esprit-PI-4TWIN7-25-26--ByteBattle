import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  /** The key to listen for (e.g. 'Enter', 'r', '/', '.') */
  key: string;
  /** Whether Ctrl (or Cmd on Mac) is required */
  ctrl?: boolean;
  /** Whether Shift is required */
  shift?: boolean;
  /** Whether Alt is required */
  alt?: boolean;
  /** Handler to call when the shortcut fires */
  handler: (e: KeyboardEvent) => void;
  /** Human-readable description for help overlay */
  description?: string;
  /** Whether this shortcut is currently enabled (default: true) */
  enabled?: boolean;
}

/**
 * Register keyboard shortcuts that are automatically cleaned up on unmount.
 * Ignores events when the user is typing in an input/textarea/contentEditable
 * unless the shortcut uses Ctrl/Cmd.
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    for (const shortcut of shortcutsRef.current) {
      if (shortcut.enabled === false) continue;

      const ctrlMatch = shortcut.ctrl
        ? e.ctrlKey || e.metaKey
        : !e.ctrlKey && !e.metaKey;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;

      if (
        e.key.toLowerCase() === shortcut.key.toLowerCase() &&
        ctrlMatch &&
        shiftMatch &&
        altMatch
      ) {
        // If user is in an input, only fire if it's a Ctrl/Cmd shortcut
        if (isInput && !shortcut.ctrl) continue;

        e.preventDefault();
        e.stopPropagation();
        shortcut.handler(e);
        return;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
