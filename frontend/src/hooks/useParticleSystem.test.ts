import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useParticleSystem } from './useParticleSystem';

let rafCbs=new Map<number,FrameRequestCallback>(); let rafId=0;
beforeEach(()=>{
  rafCbs.clear(); rafId=0;
  vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{const id=++rafId;rafCbs.set(id,cb);return id;});
  vi.stubGlobal('cancelAnimationFrame',(id:number)=>{rafCbs.delete(id);});
});
afterEach(()=>{vi.unstubAllGlobals();});

const cfg={count:10,colors:['#f00'],speed:{min:1,max:5},size:{min:2,max:8},lifetime:1000,gravity:0.1,spread:Math.PI,shapes:['circle' as const]};

describe('useParticleSystem()', () => {
  it('should start inactive with no particles', () => {
    const {result}=renderHook(()=>useParticleSystem({current:null} as any,cfg));
    expect(result.current.active).toBe(false); expect(result.current.particles).toHaveLength(0);
  });
  it('start() sets active=true', () => {
    const {result}=renderHook(()=>useParticleSystem({current:null} as any,cfg));
    act(()=>{result.current.start();}); expect(result.current.active).toBe(true);
  });
  it('stop() sets active=false', () => {
    const {result}=renderHook(()=>useParticleSystem({current:null} as any,cfg));
    act(()=>{result.current.start();}); act(()=>{result.current.stop();}); expect(result.current.active).toBe(false);
  });
  it('burst() adds particles', () => {
    const {result}=renderHook(()=>useParticleSystem({current:null} as any,cfg));
    act(()=>{result.current.burst(100,100,5);}); expect(result.current.particles).toHaveLength(5);
  });
  it('burst() uses config.count by default', () => {
    const {result}=renderHook(()=>useParticleSystem({current:null} as any,cfg));
    act(()=>{result.current.burst(0,0);}); expect(result.current.particles).toHaveLength(cfg.count);
  });
});
