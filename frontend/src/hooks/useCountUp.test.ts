import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountUp } from './useCountUp';

// requestAnimationFrame is not available in jsdom — polyfill it
let rafCallbacks: Map<number, FrameRequestCallback> = new Map();
let rafId = 0;
let currentTimestamp = 0;

const advanceAnimationFrames = (ms: number) => {
  currentTimestamp += ms;
  act(() => {
    const callbacks = Array.from(rafCallbacks.values());
    rafCallbacks.clear();
    callbacks.forEach((cb) => cb(currentTimestamp));
  });
};

describe('useCountUp()', () => {
  beforeEach(() => {
    currentTimestamp = 0;
    rafCallbacks.clear();
    rafId = 0;

    // Polyfill requestAnimationFrame
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = ++rafId;
      rafCallbacks.set(id, cb);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafCallbacks.delete(id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should start at the start value (default 0)', () => {
    const { result } = renderHook(() => useCountUp(100, 1000));
    expect(result.current).toBe(0);
  });

  it('should start at a custom start value', () => {
    const { result } = renderHook(() => useCountUp(100, 1000, 50));
    expect(result.current).toBe(50);
  });

  it('should be at the end value when animation completes', () => {
    const { result } = renderHook(() => useCountUp(100, 1000));

    advanceAnimationFrames(1000); // First frame at 1000ms
    advanceAnimationFrames(1000); // Second frame at 2000ms (100% complete)
    advanceAnimationFrames(100);  // one more frame after completion

    expect(result.current).toBe(100);
  });

  it('should return a rounded integer', () => {
    const { result } = renderHook(() => useCountUp(100, 1000));

    advanceAnimationFrames(500);

    // Result must always be a rounded integer
    expect(Number.isInteger(result.current)).toBe(true);
  });

  it('should return end when end === start (no-op animation)', () => {
    const { result } = renderHook(() => useCountUp(42, 1000, 42));

    advanceAnimationFrames(0);

    expect(result.current).toBe(42);
  });

  it('should count down when end < start', () => {
    const { result } = renderHook(() => useCountUp(0, 1000, 100));

    // At start
    expect(result.current).toBe(100);

    // At completion
    advanceAnimationFrames(1000); // First frame
    advanceAnimationFrames(1000); // Second frame (100% complete)
    advanceAnimationFrames(100);

    expect(result.current).toBe(0);
  });

  it('should accept a custom easing function', () => {
    const linearEasing = vi.fn((t: number) => t); // pure linear
    const { result } = renderHook(() => useCountUp(100, 1000, 0, linearEasing));

    advanceAnimationFrames(1000); // First frame at 1000ms
    advanceAnimationFrames(500);  // Second frame at 1500ms (50% progress = 500ms elapsed)
    expect(linearEasing).toHaveBeenCalled();
    // At 50% linear progress from 0 to 100 → ~50
    expect(result.current).toBeGreaterThanOrEqual(40);
    expect(result.current).toBeLessThanOrEqual(60);
  });

  it('should cancel animation frame on unmount', () => {
    const cancelSpy = vi.fn((id: number) => { rafCallbacks.delete(id); });
    vi.stubGlobal('cancelAnimationFrame', cancelSpy);

    const { unmount } = renderHook(() => useCountUp(100, 1000));
    unmount();

    expect(cancelSpy).toHaveBeenCalled();
  });

  it('should restart animation when end value changes', () => {
    const { result, rerender } = renderHook(
      ({ end }) => useCountUp(end, 1000),
      { initialProps: { end: 100 } },
    );

    advanceAnimationFrames(1000);
    advanceAnimationFrames(1000);
    advanceAnimationFrames(100);
    expect(result.current).toBe(100);

    // Change target - this triggers the effect to re-run with a new dependency
    rerender({ end: 200 });
    advanceAnimationFrames(1000);
    advanceAnimationFrames(1000);
    advanceAnimationFrames(100);

    expect(result.current).toBe(200);
  });
});
