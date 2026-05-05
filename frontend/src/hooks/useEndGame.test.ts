import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEndGame } from './useEndGame';

beforeEach(()=>{vi.useFakeTimers();});
afterEach(()=>{vi.useRealTimers();});
const d={score:100,verdict:'win',timeMs:30000,testsPassed:5,testsTotal:5} as any;

describe('useEndGame()', () => {
  it('should start with null data and invisible', () => {
    const {result}=renderHook(()=>useEndGame());
    expect(result.current.endGameData).toBeNull(); expect(result.current.isEndGameVisible).toBe(false);
  });
  it('should set data and show overlay on trigger', async () => {
    const {result}=renderHook(()=>useEndGame());
    act(()=>{result.current.triggerEndGame(d);}); expect(result.current.endGameData).toEqual(d);
    await act(async()=>{vi.advanceTimersByTime(100);}); expect(result.current.isEndGameVisible).toBe(true);
  });
  it('should hide and clear on handleRetry', async () => {
    const {result}=renderHook(()=>useEndGame());
    act(()=>{result.current.triggerEndGame(d);}); await act(async()=>{vi.advanceTimersByTime(100);});
    act(()=>{result.current.handleRetry();}); expect(result.current.isEndGameVisible).toBe(false);
    await act(async()=>{vi.advanceTimersByTime(800);}); expect(result.current.endGameData).toBeNull();
  });
  it('should hide and clear on handleBackToMenu', async () => {
    const {result}=renderHook(()=>useEndGame());
    act(()=>{result.current.triggerEndGame(d);}); await act(async()=>{vi.advanceTimersByTime(100);});
    act(()=>{result.current.handleBackToMenu();}); expect(result.current.isEndGameVisible).toBe(false);
    await act(async()=>{vi.advanceTimersByTime(800);}); expect(result.current.endGameData).toBeNull();
  });
});
