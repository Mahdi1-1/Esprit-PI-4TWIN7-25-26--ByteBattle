import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHackathonSocket } from './useHackathonSocket';

type MockSocket={on:any;off:any;emit:any;disconnect:any};
const mockSockets:MockSocket[]=[];

vi.mock('socket.io-client',()=>({
  io:vi.fn(()=>{
    const socket:MockSocket={on:vi.fn(),off:vi.fn(),emit:vi.fn(),disconnect:vi.fn()};
    mockSockets.push(socket);
    return socket;
  })
}));

beforeEach(()=>{localStorage.setItem('token','fake-jwt'); mockSockets.length=0; vi.clearAllMocks();});
afterEach(()=>{localStorage.clear();});

describe('useHackathonSocket()', () => {
  it('should start disconnected', () => {
    const {result}=renderHook(()=>useHackathonSocket({hackathonId:'h1'}));
    expect(result.current.connected).toBe(false);
  });
  it('should not connect without token', () => {
    localStorage.removeItem('token');
    renderHook(()=>useHackathonSocket({hackathonId:'h1'}));
    expect(mockSockets).toHaveLength(0);
  });
  it('should connect and join hackathon room', async () => {
    const {result}=renderHook(()=>useHackathonSocket({hackathonId:'h1'}));
    expect(mockSockets).toHaveLength(1);
    const socket=mockSockets[0];
    const connectCb=(socket.on as any).mock.calls.find(([e]:any)=>e==='connect')?.[1];
    if(connectCb) act(()=>connectCb());
    await waitFor(()=>expect((socket.emit as any).mock.calls).toContainEqual(['join_hackathon',{hackathonId:'h1'}]));
  });
  it('should disconnect socket on unmount', () => {
    const {unmount}=renderHook(()=>useHackathonSocket({hackathonId:'h1'}));
    const socket=mockSockets[0];
    unmount();
    expect((socket.disconnect as any).mock.calls.length).toBeGreaterThan(0);
  });
  it('onScoreboardUpdate() registers socket listener', () => {
    const {result}=renderHook(()=>useHackathonSocket({hackathonId:'h1'}));
    const cb=vi.fn();
    act(()=>{result.current.onScoreboardUpdate(cb);});
    const socket=mockSockets[0];
    expect((socket.on as any).mock.calls).toContainEqual(['scoreboard:update',cb]);
  });
});
