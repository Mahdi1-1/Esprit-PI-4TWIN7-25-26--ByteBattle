import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceRecorder } from './useVoiceRecorder';

vi.mock('../services/interviewsService', () => ({
  interviewsService: { sendVoiceMessage: vi.fn(), getTtsAudio: vi.fn() },
}));

const defaultSettings = {
  autoPlay: false, previewMode: false,
  sttMode: 'browser' as const, ttsMode: 'browser' as const, languageCode: 'fr-FR',
};

const makeMockMediaDevices = () => {
  const mockStream = { getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]) };
  return { getUserMedia: vi.fn().mockResolvedValue(mockStream) };
};

describe('useVoiceRecorder()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('navigator', { mediaDevices: makeMockMediaDevices() });
    vi.stubGlobal('AudioContext', vi.fn().mockImplementation(() => ({
      createMediaStreamSource: vi.fn().mockReturnValue({ connect: vi.fn() }),
      createAnalyser: vi.fn().mockReturnValue({ getByteFrequencyData: vi.fn(), frequencyBinCount: 128 }),
      state: 'running',
      close: vi.fn().mockResolvedValue(undefined),
    })));
    vi.stubGlobal('MediaRecorder', vi.fn().mockImplementation(() => ({
      start: vi.fn(), stop: vi.fn(), pause: vi.fn(), resume: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      state: 'inactive',
    })));
  });

  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); vi.clearAllMocks(); });

  it('should start in idle state', () => {
    const { result } = renderHook(() => useVoiceRecorder({
      sessionId: 's1', settings: defaultSettings, onMessageSent: vi.fn(),
    }));
    expect(result.current.state).toBe('idle');
    expect(result.current.elapsedTime).toBe(0);
    expect(result.current.audioLevel).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('should report isSupported=true when mediaDevices available', () => {
    const { result } = renderHook(() => useVoiceRecorder({
      sessionId: 's1', settings: defaultSettings, onMessageSent: vi.fn(),
    }));
    expect(result.current.isSupported).toBe(true);
  });

  it('should report isSupported=false when mediaDevices unavailable', () => {
    vi.stubGlobal('navigator', {});
    const { result } = renderHook(() => useVoiceRecorder({
      sessionId: 's1', settings: defaultSettings, onMessageSent: vi.fn(),
    }));
    expect(result.current.isSupported).toBe(false);
  });

  it('should start recording and change state to recording', async () => {
    const { result } = renderHook(() => useVoiceRecorder({
      sessionId: 's1', settings: defaultSettings, onMessageSent: vi.fn(),
    }));
    await act(async () => { await result.current.startRecording(); });
    expect(result.current.state).toBe('recording');
  });

  it('should expose stopRecording function', () => {
    const { result } = renderHook(() => useVoiceRecorder({
      sessionId: 's1', settings: defaultSettings, onMessageSent: vi.fn(),
    }));
    expect(typeof result.current.stopRecording).toBe('function');
  });

  it('should clear transcript and state on cancelRecording', async () => {
    const { result } = renderHook(() => useVoiceRecorder({
      sessionId: 's1', settings: defaultSettings, onMessageSent: vi.fn(),
    }));
    await act(async () => { await result.current.startRecording(); });
    act(() => { result.current.cancelRecording(); });
    expect(result.current.state).toBe('idle');
    expect(result.current.transcript).toBeNull();
  });
});
