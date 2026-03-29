import React from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';

interface AudioPlayButtonProps {
  isCurrentMessage: boolean;
  state: 'idle' | 'loading' | 'playing' | 'paused';
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
}

export function AudioPlayButton({ isCurrentMessage, state, onPlay, onPause, onResume }: AudioPlayButtonProps) {
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isCurrentMessage) {
      onPlay();
      return;
    }

    if (state === 'playing') {
      onPause();
    } else if (state === 'paused') {
      onResume();
    } else if (state === 'idle') {
      onPlay();
    }
  };

  const isPlaying = isCurrentMessage && state === 'playing';
  const isLoading = isCurrentMessage && state === 'loading';

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all flex-shrink-0 ${
        isPlaying || isLoading
          ? 'bg-[var(--brand-primary)] text-white' 
          : 'bg-[var(--surface-3)] text-[var(--text-secondary)] hover:bg-[var(--surface-4)] hover:text-[var(--text-primary)]'
      }`}
      aria-label="Lecture du message"
      title="Écouter le message"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isPlaying ? (
        <Pause className="w-4 h-4" />
      ) : (
        <Play className="w-4 h-4 ml-0.5" />
      )}
      
      {/* Subtle pulse effect when playing */}
      {isPlaying && (
        <span className="absolute inset-0 rounded-full ring-2 ring-[var(--brand-primary)] ring-offset-2 ring-offset-[var(--surface-1)] animate-pulse" />
      )}
    </button>
  );
}
