import { afterEach, describe, expect, it, vi } from 'vitest';
import { random, randomChoice, randomInt } from './random';

describe('random utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calculates a floating-point value within range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    expect(random(10, 20)).toBe(15);
  });

  it('calculates an inclusive integer within range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9999);

    expect(randomInt(1, 3)).toBe(3);
  });

  it('selects an array item by index', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.34);

    expect(randomChoice(['a', 'b', 'c'])).toBe('b');
  });
});