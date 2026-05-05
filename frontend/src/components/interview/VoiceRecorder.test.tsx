import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { VoiceRecorder } from './VoiceRecorder';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';

vi.mock('../../hooks/useVoiceRecorder', () => ({
  useVoiceRecorder: vi.fn(),
}));

vi.mock('./WaveformVisualizer', () => ({
  WaveformVisualizer: () => <div data-testid="waveform" />,
}));

const mockedUseVoiceRecorder = vi.mocked(useVoiceRecorder);

const baseHookState = {
  state: 'idle' as const,
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
  cancelRecording: vi.fn(),
  transcript: null,
  setTranscript: vi.fn(),
  sendTranscript: vi.fn(),
  reRecord: vi.fn(),
  elapsedTime: 5,
  audioLevel: 0.3,
  isSupported: true,
  error: null,
};

const settings = {
  autoPlay: false,
  previewMode: true,
  languageCode: 'en-US',
  sttMode: 'browser' as const,
  ttsMode: 'browser' as const,
};

describe('VoiceRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows disabled mic when recording is not supported', () => {
    mockedUseVoiceRecorder.mockReturnValue({ ...baseHookState, isSupported: false });

    render(
      <VoiceRecorder
        sessionId="s1"
        settings={settings}
        onMessageSent={vi.fn()}
      />,
    );

    expect(screen.getByTitle('Your browser does not support audio recording')).toBeDisabled();
  });

  it('starts recording from idle state', () => {
    const startRecording = vi.fn();
    mockedUseVoiceRecorder.mockReturnValue({ ...baseHookState, startRecording, state: 'idle' });

    render(
      <VoiceRecorder
        sessionId="s1"
        settings={settings}
        onMessageSent={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTitle('Record a voice message'));
    expect(startRecording).toHaveBeenCalledTimes(1);
  });

  it('handles recording controls in recording state', () => {
    const stopRecording = vi.fn();
    const cancelRecording = vi.fn();

    mockedUseVoiceRecorder.mockReturnValue({
      ...baseHookState,
      state: 'recording',
      stopRecording,
      cancelRecording,
    });

    render(
      <VoiceRecorder
        sessionId="s1"
        settings={settings}
        onMessageSent={vi.fn()}
      />,
    );

    expect(screen.getByTestId('waveform')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Cancel'));
    fireEvent.click(screen.getByTitle('Stop and edit'));

    expect(cancelRecording).toHaveBeenCalledTimes(1);
    expect(stopRecording).toHaveBeenCalledTimes(1);
  });

  it('sends transcript from preview state', () => {
    const sendTranscript = vi.fn();
    const setTranscript = vi.fn();

    mockedUseVoiceRecorder.mockReturnValue({
      ...baseHookState,
      state: 'preview',
      transcript: 'hello world',
      sendTranscript,
      setTranscript,
    });

    render(
      <VoiceRecorder
        sessionId="s1"
        settings={settings}
        onMessageSent={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'edited text' } });
    expect(setTranscript).toHaveBeenCalledWith('edited text');

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(sendTranscript).toHaveBeenCalledTimes(1);
  });
});
