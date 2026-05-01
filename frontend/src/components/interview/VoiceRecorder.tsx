import React from 'react';
import { Mic, MicOff, Send, RotateCcw, X, Loader2 } from 'lucide-react';
import { WaveformVisualizer } from './WaveformVisualizer';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { VoiceSettings } from '../../hooks/useVoiceSettings';

interface VoiceRecorderProps {
  sessionId: string;
  settings: VoiceSettings;
  onMessageSent: (message: { transcript: string; audioUrl?: string; originalBlobUrl?: string }) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ sessionId, settings, onMessageSent, disabled }: VoiceRecorderProps) {
  const {
    state,
    startRecording,
    stopRecording,
    cancelRecording,
    transcript,
    setTranscript,
    sendTranscript,
    reRecord,
    elapsedTime,
    audioLevel,
    isSupported,
    error,
  } = useVoiceRecorder({ sessionId, settings, onMessageSent });

  if (!isSupported) {
    return (
      <button 
        disabled
        title="Your browser does not support audio recording"
        className="px-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-muted)] opacity-50 cursor-not-allowed flex items-center justify-center"
      >
        <MicOff className="w-4 h-4" />
      </button>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (state === 'idle') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={startRecording}
          disabled={disabled}
          className="w-10 flex-shrink-0 flex items-center justify-center rounded-[var(--radius-md)] transition-colors bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface-3)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
          title="Record a voice message"
        >
          <Mic className="w-4 h-4" />
        </button>
        {error && (
          <span className="text-xs text-[var(--state-error)] bg-[var(--state-error)]/10 px-2 py-1 rounded">
            {error}
          </span>
        )}
      </div>
    );
  }

  if (state === 'recording') {
    return (
      <div className="flex-1 flex items-center gap-3 bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/30 rounded-[var(--radius-md)] px-3 py-2 animate-pulse-light">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-mono font-medium text-[var(--text-primary)] min-w-[40px]">
            {formatTime(elapsedTime)}
          </span>
        </div>
        
        <WaveformVisualizer 
          audioLevel={audioLevel} 
          isRecording={true} 
          className="flex-1 h-6 mx-2"
        />

        <div className="flex gap-1">
          <button
            onClick={cancelRecording}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] rounded-md transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={stopRecording}
            className="p-1.5 bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary)]/90 rounded-md transition-colors"
            title="Stop and edit"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (state === 'processing') {
    return (
      <div className="flex-1 flex items-center justify-center gap-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-[var(--brand-primary)]" />
        <span className="text-sm text-[var(--text-secondary)]">Transcribing...</span>
      </div>
    );
  }

  if (state === 'preview') {
    return (
      <div className="flex-1 flex flex-col gap-2">
        <textarea
          value={transcript || ''}
          onChange={(e) => setTranscript(e.target.value)}
          className="w-full bg-[var(--surface-2)] border border-[var(--brand-primary)]/50 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors resize-none"
          rows={2}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={cancelRecording}
            className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={reRecord}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--surface-3)] text-[var(--text-primary)] hover:bg-[var(--surface-4)] rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Re-record
          </button>
          <button
            onClick={sendTranscript}
            disabled={!transcript?.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </div>
      </div>
    );
  }

  return null;
}
