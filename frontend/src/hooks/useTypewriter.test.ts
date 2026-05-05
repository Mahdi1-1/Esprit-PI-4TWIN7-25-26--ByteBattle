import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTypewriter } from './useTypewriter';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('useTypewriter()', () => {
  it('should start with empty string', () => {
    const {result}=renderHook(()=>useTypewriter('Hello',50,0));
    expect(result.current).toBe('');
  });
  it('should reveal all characters after enough time', async () => {
    const {result}=renderHook(()=>useTypewriter('Hi',50,0));
    await act(async()=>{vi.advanceTimersByTime(300);});
    expect(result.current).toBe('Hi');
  });
  it('should respect initial delay', async () => {
    const {result}=renderHook(()=>useTypewriter('Hi',50,200));
    await act(async()=>{vi.advanceTimersByTime(100);});
    expect(result.current).toBe('');
    await act(async()=>{vi.advanceTimersByTime(400);});
    expect(result.current).toBe('Hi');
  });
  it('should handle empty string', async () => {
    const {result}=renderHook(()=>useTypewriter('',50,0));
    await act(async()=>{vi.advanceTimersByTime(200);});
    expect(result.current).toBe('');
  });
  it('should restart when text changes', async () => {
    const {result,rerender}=renderHook(({t})=>useTypewriter(t,50,0),{initialProps:{t:'AB'}});
    await act(async()=>{vi.advanceTimersByTime(200);}); expect(result.current).toBe('AB');
    rerender({t:'XY'});
    await act(async()=>{vi.advanceTimersByTime(300);}); expect(result.current).toBe('XY');
  });
});
