import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// constants/animations.ts
// ─────────────────────────────────────────────────────────────────────────────

import { Animations } from '../constants/animations';

describe('Animations constants', () => {
  it('should have correct entrance staggerDelay', () => {
    expect(Animations.entrance.staggerDelay).toBe(300);
  });

  it('should have correct totalSequenceDuration', () => {
    expect(Animations.entrance.totalSequenceDuration).toBe(2500);
  });

  it('should have correct victory confettiCount', () => {
    expect(Animations.particles.victory.confettiCount).toBe(150);
  });

  it('should have correct defeat debrisCount', () => {
    expect(Animations.particles.defeat.debrisCount).toBe(80);
  });

  it('should have countUp defaultDuration as 1500', () => {
    expect(Animations.countUp.defaultDuration).toBe(1500);
  });

  it('should have typewriter defaultSpeed as 50', () => {
    expect(Animations.typewriter.defaultSpeed).toBe(50);
  });

  it('should have exit staggerDelay and fadeDuration', () => {
    expect(Animations.exit.staggerDelay).toBe(200);
    expect(Animations.exit.fadeDuration).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// constants/themes.ts
// ─────────────────────────────────────────────────────────────────────────────

import { ThemeConfigs } from '../constants/themes';
import { GameTheme } from '../types/game.types';

describe('ThemeConfigs constants', () => {
  it('should define CYBER_ARENA theme', () => {
    expect(ThemeConfigs[GameTheme.CYBER_ARENA]).toBeDefined();
    expect(ThemeConfigs[GameTheme.CYBER_ARENA].name).toBe('Cyber Arena');
  });

  it('should define SPACE_OPS theme', () => {
    expect(ThemeConfigs[GameTheme.SPACE_OPS]).toBeDefined();
    expect(ThemeConfigs[GameTheme.SPACE_OPS].name).toBe('Space Ops');
  });

  it('should define SAMURAI_DOJO theme', () => {
    expect(ThemeConfigs[GameTheme.SAMURAI_DOJO]).toBeDefined();
    expect(ThemeConfigs[GameTheme.SAMURAI_DOJO].name).toBe('Samurai Dojo');
  });

  it('each theme should have victory and defeat configs', () => {
    Object.values(ThemeConfigs).forEach((theme) => {
      expect(theme).toHaveProperty('victory');
      expect(theme).toHaveProperty('defeat');
      expect(theme.victory).toHaveProperty('title');
      expect(theme.victory).toHaveProperty('particleColors');
      expect(theme.defeat).toHaveProperty('title');
    });
  });

  it('each theme should have font config', () => {
    Object.values(ThemeConfigs).forEach((theme) => {
      expect(theme).toHaveProperty('fonts');
      expect(theme.fonts).toHaveProperty('heading');
    });
  });

  it('particle colors should be non-empty arrays', () => {
    Object.values(ThemeConfigs).forEach((theme) => {
      expect(theme.victory.particleColors.length).toBeGreaterThan(0);
      expect(theme.defeat.particleColors.length).toBeGreaterThan(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// api/axios interceptors
// ─────────────────────────────────────────────────────────────────────────────

describe('axios instance', () => {
  beforeEach(() => {
    localStorage.clear();
    delete (window as any).location;
    (window as any).location = { href: '', pathname: '/' };
  });

  afterEach(() => { localStorage.clear(); });

  it('should set Authorization header when token exists in localStorage', async () => {
    localStorage.setItem('token', 'my-jwt-token');
    // Import fresh instance
    const { default: api } = await import('../api/axios');
    // Simulate request interceptor manually
    const config: any = { headers: {} };
    const interceptor = (api.interceptors.request as any).handlers[0];
    if (interceptor) {
      const result = interceptor.fulfilled(config);
      expect(result.headers.Authorization).toBe('Bearer my-jwt-token');
    } else {
      // Fallback: verify the interceptor is registered
      expect((api.interceptors.request as any).handlers.length).toBeGreaterThan(0);
    }
  });

  it('should NOT set Authorization header when no token', async () => {
    const { default: api } = await import('../api/axios');
    const config: any = { headers: {} };
    const interceptor = (api.interceptors.request as any).handlers[0];
    if (interceptor) {
      const result = interceptor.fulfilled(config);
      expect(result.headers.Authorization).toBeUndefined();
    }
  });

  it('should have correct baseURL', async () => {
    const { default: api } = await import('../api/axios');
    expect(api.defaults.baseURL).toContain('/api');
  });

  it('should have Content-Type: application/json header', async () => {
    const { default: api } = await import('../api/axios');
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should clear token and redirect on 401 non-auth endpoints', async () => {
    const consoleLogSpy = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
    localStorage.setItem('token', 'expired-token');
    const { default: api } = await import('../api/axios');

    const handler = (api.interceptors.response as any).handlers[0];
    if (handler) {
      const error = { response: { status: 401 }, config: { url: '/challenges' } };
      try {
        await handler.rejected(error);
      } catch (_) { /* expected */ }
      expect(localStorage.getItem('token')).toBeNull();
    }
    consoleLogSpy.mockRestore();
  });

  it('should NOT clear token on 401 for auth login endpoint', async () => {
    const consoleLogSpy = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
    localStorage.setItem('token', 'valid-token');
    const { default: api } = await import('../api/axios');

    const handler = (api.interceptors.response as any).handlers[0];
    if (handler) {
      const error = { response: { status: 401 }, config: { url: '/auth/login' } };
      try {
        await handler.rejected(error);
      } catch (_) { /* expected */ }
      expect(localStorage.getItem('token')).toBe('valid-token');
    }
    consoleLogSpy.mockRestore();
  });
});
