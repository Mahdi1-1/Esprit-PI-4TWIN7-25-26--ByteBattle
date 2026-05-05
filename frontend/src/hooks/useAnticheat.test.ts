import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnticheat } from './useAnticheat';

vi.mock('react-hot-toast',()=>({toast:{error:vi.fn(),success:vi.fn()},default:{error:vi.fn()}}));
beforeEach(()=>{
  vi.useFakeTimers();
  Object.defineProperty(document,'fullscreenElement',{value:null,configurable:true});
});
afterEach(()=>{vi.useRealTimers(); vi.clearAllMocks();});

describe('useAnticheat()', () => {
  it('should start with focusLostCount=0', () => {
    const {result}=renderHook(()=>useAnticheat({autoFullscreen:false}));
    expect(result.current.focusLostCount).toBe(0);
  });
  it('should start with isFullScreen=false', () => {
    const {result}=renderHook(()=>useAnticheat({autoFullscreen:false}));
    expect(result.current.isFullScreen).toBe(false);
  });
  it('should call onFullScreenExit when exiting fullscreen', () => {
    const onFullScreenExit=vi.fn();
    renderHook(()=>useAnticheat({autoFullscreen:false,onFullScreenExit}));
    Object.defineProperty(document,'fullscreenElement',{value:document.body,configurable:true});
    act(()=>{document.dispatchEvent(new Event('fullscreenchange'));});
    Object.defineProperty(document,'fullscreenElement',{value:null,configurable:true});
    act(()=>{document.dispatchEvent(new Event('fullscreenchange'));});
    expect(onFullScreenExit).toHaveBeenCalled();
  });
  it('should update isFullScreen state on change', () => {
    const {result}=renderHook(()=>useAnticheat({autoFullscreen:false}));
    Object.defineProperty(document,'fullscreenElement',{value:document.body,configurable:true});
    act(()=>{document.dispatchEvent(new Event('fullscreenchange'));});
    expect(result.current.isFullScreen).toBe(true);
  });
});
