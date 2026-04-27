import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface CodeFocusManagerProps {
  onFocusLoss?: () => void;
  onFocusGain?: () => void;
  disabled?: boolean;
}

export function CodeFocusManager({ onFocusLoss, onFocusGain, disabled = false }: CodeFocusManagerProps) {
  useEffect(() => {
    if (disabled) return;

    let lossTimeout: ReturnType<typeof setTimeout>;

    const handleLoss = () => {
      // Delay slightly to prevent false positives when switching quickly or opening devtools
      lossTimeout = setTimeout(() => {
        if (onFocusLoss) onFocusLoss();
        else toast.error('Attention ! Focus perdu.', { icon: '⚠️' });
      }, 100);
    };

    const handleGain = () => {
      clearTimeout(lossTimeout);
      if (onFocusGain) onFocusGain();
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
      clearTimeout(lossTimeout);
      window.removeEventListener('blur', handleLoss);
      window.removeEventListener('focus', handleGain);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onFocusLoss, onFocusGain, disabled]);

  return null;
}
