import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAvatar } from './useAvatar';

vi.mock('../services/avatarService',()=>{const mock={getMyAvatar:vi.fn(),saveAvatar:vi.fn(),updateExpression:vi.fn()};return{avatarService:mock};});

beforeEach(()=>{vi.clearAllMocks();});

describe('useAvatar()', () => {
  it('should start loading', async () => {
    const {avatarService}=await import('../services/avatarService');
    avatarService.getMyAvatar.mockReturnValue(new Promise(()=>{}));
    const {result}=renderHook(()=>useAvatar()); expect(result.current.loading).toBe(true);
  });
  it('should populate avatar on success', async () => {
    const {avatarService}=await import('../services/avatarService');
    const av={id:'av-1',glbUrl:'https://…'};
    avatarService.getMyAvatar.mockResolvedValue({avatar:av});
    const {result}=renderHook(()=>useAvatar());
    await waitFor(()=>expect(result.current.loading).toBe(false));
    expect(result.current.avatar).toEqual(av); expect(result.current.error).toBeNull();
  });
  it('should set null on 404', async () => {
    const {avatarService}=await import('../services/avatarService');
    avatarService.getMyAvatar.mockRejectedValue({response:{status:404}});
    const {result}=renderHook(()=>useAvatar());
    await waitFor(()=>expect(result.current.loading).toBe(false));
    expect(result.current.avatar).toBeNull(); expect(result.current.error).toBeNull();
  });
  it('should set error on unexpected failure', async () => {
    const {avatarService}=await import('../services/avatarService');
    avatarService.getMyAvatar.mockRejectedValue(new Error('boom'));
    const {result}=renderHook(()=>useAvatar());
    await waitFor(()=>expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Unable to load avatar');
  });
  it('handleAvatarCreated() saves avatar and updates state', async () => {
    const {avatarService}=await import('../services/avatarService');
    avatarService.getMyAvatar.mockResolvedValue({avatar:null});
    const saved={id:'av-2',glbUrl:'https://new.glb'};
    avatarService.saveAvatar.mockResolvedValue(saved);
    const {result}=renderHook(()=>useAvatar());
    await waitFor(()=>expect(result.current.loading).toBe(false));
    await act(async()=>{await result.current.handleAvatarCreated('https://new.glb');});
    expect(avatarService.saveAvatar).toHaveBeenCalledWith('https://new.glb');
    expect(result.current.avatar).toEqual(saved);
  });
});
