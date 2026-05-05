import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnimationFrame } from './useAnimationFrame';

let rafCallbacks = new Map<number, FrameRequestCallback>();
let rafId = 0; let ts = 0;

beforeEach(() => {
  rafCallbacks.clear(); rafId = 0; ts = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { const id=++rafId; rafCallbacks.set(id,cb); return id; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { rafCallbacks.delete(id); });
});
afterEach(() => { vi.unstubAllGlobals(); });

const flush = () => { ts+=16; const cbs=Array.from(rafCallbacks.values()); rafCallbacks.clear(); act(()=>{cbs.forEach(cb=>cb(ts));}); };

describe('useAnimationFrame()', () => {
  it('should NOT call callback when active=false', () => {
    const cb=vi.fn(); renderHook(()=>useAnimationFrame(cb,false)); flush();
    expect(cb).not.toHaveBeenCalled();
  });
  it('should call callback with deltaTime when active=true', () => {
    const cb=vi.fn(); renderHook(()=>useAnimationFrame(cb,true)); flush(); flush();
    expect(cb).toHaveBeenCalledWith(expect.any(Number));
  });
  it('should stop calling when active switches to false', () => {
    const cb=vi.fn(); const {rerender}=renderHook(({a})=>useAnimationFrame(cb,a),{initialProps:{a:true}});
    flush(); flush(); const count=cb.mock.calls.length;
    rerender({a:false}); flush(); flush();
    expect(cb.mock.calls.length).toBe(count);
  });
  it('should cancel rAF on unmount', () => {
    const cancelSpy=vi.fn((id:number)=>{rafCallbacks.delete(id);}); vi.stubGlobal('cancelAnimationFrame',cancelSpy);
    const {unmount}=renderHook(()=>useAnimationFrame(vi.fn(),true)); unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });
});
