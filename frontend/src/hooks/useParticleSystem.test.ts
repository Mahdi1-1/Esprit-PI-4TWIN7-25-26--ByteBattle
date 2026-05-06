import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useParticleSystem } from "./useParticleSystem";

let rafCbs = new Map<number, FrameRequestCallback>();
let rafId = 0;

const runAnimationFrame = (time: number) => {
  const callbacks = Array.from(rafCbs.values());
  rafCbs.clear();
  callbacks.forEach((cb) => cb(time));
};

const createCanvas = () => {
  const ctx = {
    clearRect: vi.fn(),
    save: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    restore: vi.fn(),
    globalAlpha: 1,
    fillStyle: "",
  } as any;

  const canvas = {
    width: 200,
    height: 100,
    getContext: vi.fn(() => ctx),
  } as any;

  return { canvas, ctx };
};

const baseConfig = {
  count: 10,
  colors: ["#f00"],
  speed: { min: 1, max: 5 },
  size: { min: 2, max: 8 },
  lifetime: 1000,
  gravity: 0.1,
  spread: Math.PI,
  shapes: ["circle" as const],
};

beforeEach(() => {
  rafCbs.clear();
  rafId = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    const id = ++rafId;
    rafCbs.set(id, cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    rafCbs.delete(id);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useParticleSystem()", () => {
  it("starts inactive with no particles", () => {
    const { result } = renderHook(() =>
      useParticleSystem({ current: null } as any, baseConfig),
    );

    expect(result.current.active).toBe(false);
    expect(result.current.particles).toHaveLength(0);
  });

  it("start() sets active=true", () => {
    const { result } = renderHook(() =>
      useParticleSystem({ current: null } as any, baseConfig),
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.active).toBe(true);
  });

  it("stop() sets active=false", () => {
    const { result } = renderHook(() =>
      useParticleSystem({ current: null } as any, baseConfig),
    );

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.stop();
    });

    expect(result.current.active).toBe(false);
  });

  it("burst() adds particles and activates", () => {
    const { result } = renderHook(() =>
      useParticleSystem({ current: null } as any, baseConfig),
    );

    act(() => {
      result.current.burst(100, 100, 5);
    });

    expect(result.current.particles).toHaveLength(5);
    expect(result.current.active).toBe(true);
  });

  it("burst() uses config.count by default", () => {
    const { result } = renderHook(() =>
      useParticleSystem({ current: null } as any, baseConfig),
    );

    act(() => {
      result.current.burst(0, 0);
    });

    expect(result.current.particles).toHaveLength(baseConfig.count);
  });

  it("draws rect particles on animation frame", () => {
    const { canvas, ctx } = createCanvas();
    const config = { ...baseConfig, shapes: ["rect" as const] };
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const { result } = renderHook(() =>
      useParticleSystem({ current: canvas } as any, config),
    );

    act(() => {
      result.current.burst(50, 50, 1);
    });
    act(() => {
      runAnimationFrame(0);
      runAnimationFrame(16);
    });

    expect(ctx.clearRect).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
    randomSpy.mockRestore();
  });

  it("draws circle particles on animation frame", () => {
    const { canvas, ctx } = createCanvas();
    const config = { ...baseConfig, shapes: ["circle" as const] };
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const { result } = renderHook(() =>
      useParticleSystem({ current: canvas } as any, config),
    );

    act(() => {
      result.current.burst(10, 10, 1);
    });
    act(() => {
      runAnimationFrame(0);
      runAnimationFrame(16);
    });

    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    randomSpy.mockRestore();
  });

  it("draws triangle particles on animation frame", () => {
    const { canvas, ctx } = createCanvas();
    const config = { ...baseConfig, shapes: ["triangle" as const] };
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const { result } = renderHook(() =>
      useParticleSystem({ current: canvas } as any, config),
    );

    act(() => {
      result.current.burst(25, 25, 1);
    });
    act(() => {
      runAnimationFrame(0);
      runAnimationFrame(16);
    });

    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    randomSpy.mockRestore();
  });
});
