import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

const fire=(key:string,opts:any={})=>{ const e=new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,ctrlKey:false,shiftKey:false,altKey:false,metaKey:false,...opts}); window.dispatchEvent(e); };

describe('useKeyboardShortcuts()', () => {
  it('should call handler on matching key', () => {
    const h=vi.fn(); renderHook(()=>useKeyboardShortcuts([{key:'r',handler:h}]));
    act(()=>{fire('r');}); expect(h).toHaveBeenCalledTimes(1);
  });
  it('should NOT call handler on non-matching key', () => {
    const h=vi.fn(); renderHook(()=>useKeyboardShortcuts([{key:'r',handler:h}]));
    act(()=>{fire('s');}); expect(h).not.toHaveBeenCalled();
  });
  it('should handle Ctrl+S shortcut', () => {
    const h=vi.fn(); renderHook(()=>useKeyboardShortcuts([{key:'s',ctrl:true,handler:h}]));
    act(()=>{fire('s',{ctrlKey:true});}); expect(h).toHaveBeenCalledTimes(1);
  });
  it('should NOT fire Ctrl+S without Ctrl', () => {
    const h=vi.fn(); renderHook(()=>useKeyboardShortcuts([{key:'s',ctrl:true,handler:h}]));
    act(()=>{fire('s');}); expect(h).not.toHaveBeenCalled();
  });
  it('should not fire disabled shortcut', () => {
    const h=vi.fn(); renderHook(()=>useKeyboardShortcuts([{key:'r',handler:h,enabled:false}]));
    act(()=>{fire('r');}); expect(h).not.toHaveBeenCalled();
  });
  it('should use latest handler on rerender', () => {
    const h1=vi.fn(); const h2=vi.fn();
    const {rerender}=renderHook(({h})=>useKeyboardShortcuts([{key:'r',handler:h}]),{initialProps:{h:h1}});
    rerender({h:h2}); act(()=>{fire('r');}); expect(h1).not.toHaveBeenCalled(); expect(h2).toHaveBeenCalledTimes(1);
  });
  it('should remove listener on unmount', () => {
    const spy=vi.spyOn(window,'removeEventListener');
    const {unmount}=renderHook(()=>useKeyboardShortcuts([{key:'r',handler:vi.fn()}]));
    unmount(); expect(spy).toHaveBeenCalledWith('keydown',expect.any(Function));
  });
});
