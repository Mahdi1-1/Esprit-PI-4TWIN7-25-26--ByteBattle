import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useScoreboard } from './useScoreboard';

vi.mock('../services/hackathonsService',()=>{const mock={getScoreboard:vi.fn()};return{hackathonsService:mock};});
const board={hackathonId:'h1',title:'T',status:'active',challengeIds:['c1'],rows:[{rank:1,teamName:'Alpha',solved:2,penalty:30,problems:{}}],isFrozen:false,generatedAt:new Date().toISOString()};
beforeEach(()=>{vi.clearAllMocks();});

describe('useScoreboard()', () => {
  it('should start in loading state', async () => {
    const {hackathonsService}=await import('../services/hackathonsService');
    hackathonsService.getScoreboard.mockReturnValue(new Promise(()=>{}));
    const {result}=renderHook(()=>useScoreboard('h1'));
    expect(result.current.loading).toBe(true); expect(result.current.scoreboard).toBeNull();
  });
  it('should populate on success', async () => {
    const {hackathonsService}=await import('../services/hackathonsService');
    hackathonsService.getScoreboard.mockResolvedValue(board);
    const {result}=renderHook(()=>useScoreboard('h1'));
    await waitFor(()=>expect(result.current.loading).toBe(false));
    expect(result.current.scoreboard).toEqual(board); expect(result.current.error).toBeNull();
  });
  it('should set error on failure', async () => {
    const {hackathonsService}=await import('../services/hackathonsService');
    hackathonsService.getScoreboard.mockRejectedValue(new Error('fail'));
    const {result}=renderHook(()=>useScoreboard('h1'));
    await waitFor(()=>expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('fail');
  });
  it('should apply real-time updates via socket', async () => {
    const {hackathonsService}=await import('../services/hackathonsService');
    hackathonsService.getScoreboard.mockResolvedValue(board);
    let cb: any=null;
    const onUpdate=vi.fn().mockImplementation((f)=>{cb=f; return ()=>{};});
    const {result}=renderHook(()=>useScoreboard('h1',onUpdate));
    await waitFor(()=>expect(result.current.loading).toBe(false));
    const updated={...board,rows:[{rank:1,teamName:'Beta',solved:3,penalty:0,problems:{}}]};
    act(()=>{cb?.(updated);});
    expect(result.current.scoreboard?.rows[0].teamName).toBe('Beta');
  });
});
