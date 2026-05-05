import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInterval } from './useInterval';

// @testing-library/react is needed — install with:
// npm install -D @testing-library/react @testing-library/react-hooks

describe('useInterval()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call callback after the given delay', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 1000));

    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should call callback multiple times', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 500));

    vi.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(4);
  });

  it('should NOT start interval when delay is null', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, null));

    vi.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should clear interval on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useInterval(callback, 1000));

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    unmount();

    vi.advanceTimersByTime(3000);
    // Should still be 1 — interval cleared on unmount
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should use the latest callback without restarting the interval', () => {
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();

    const { rerender } = renderHook(
      ({ cb }) => useInterval(cb, 1000),
      { initialProps: { cb: firstCallback } },
    );

    vi.advanceTimersByTime(1000);
    expect(firstCallback).toHaveBeenCalledTimes(1);
    expect(secondCallback).not.toHaveBeenCalled();

    rerender({ cb: secondCallback });
    vi.advanceTimersByTime(1000);

    // The new callback should fire, not the old one
    expect(secondCallback).toHaveBeenCalledTimes(1);
  });

  it('should restart interval when delay changes', () => {
    const callback = vi.fn();

    const { rerender } = renderHook(
      ({ delay }) => useInterval(callback, delay),
      { initialProps: { delay: 1000 } },
    );

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Change delay
    rerender({ delay: 500 });
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(3); // 2 more at 500ms intervals
  });

  it('should stop interval when delay changes from number to null', () => {
    const callback = vi.fn();

    const { rerender } = renderHook(
      ({ delay }: { delay: number | null }) => useInterval(callback, delay),
      { initialProps: { delay: 1000 as number | null } },
    );

    vi.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(2);

    rerender({ delay: null });
    vi.advanceTimersByTime(3000);
    // Count should stay at 2
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
