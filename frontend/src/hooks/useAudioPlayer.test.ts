import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioPlayer } from './useAudioPlayer';

vi.mock('../services/interviewsService',()=>({interviewsService:{getTtsAudio:vi.fn()}}));
const s={autoPlay:false,previewMode:false,sttMode:'browser' as const,ttsMode:'browser' as const,languageCode:'fr-FR'};

beforeEach(()=>{
  vi.clearAllMocks();
  vi.stubGlobal('speechSynthesis',{speak:vi.fn(),cancel:vi.fn(),pause:vi.fn(),resume:vi.fn(),getVoices:vi.fn().mockReturnValue([])});
  vi.stubGlobal('SpeechSynthesisUtterance',vi.fn().mockImplementation(()=>({onstart:null,onend:null,onerror:null,lang:'',voice:null})));
});
afterEach(()=>{vi.unstubAllGlobals();});

describe('useAudioPlayer()', () => {
  it('should start idle', () => {
    const {result}=renderHook(()=>useAudioPlayer({sessionId:'s1',settings:s}));
    expect(result.current.state).toBe('idle'); expect(result.current.currentMessageIndex).toBeNull();
  });
  it('stop() should reset to idle', () => {
    const {result}=renderHook(()=>useAudioPlayer({sessionId:'s1',settings:s}));
    act(()=>{result.current.stop();}); expect(result.current.state).toBe('idle');
  });
  it('play() with browser tts should call speechSynthesis.speak', async () => {
    const {result}=renderHook(()=>useAudioPlayer({sessionId:'s1',settings:s}));
    await act(async()=>{await result.current.play(0,'Hello world');});
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    expect(result.current.currentMessageIndex).toBe(0);
  });
  it('stop() clears currentMessageIndex', async () => {
    const {result}=renderHook(()=>useAudioPlayer({sessionId:'s1',settings:s}));
    await act(async()=>{await result.current.play(0,'Hi');});
    act(()=>{result.current.stop();}); expect(result.current.currentMessageIndex).toBeNull();
  });
});
