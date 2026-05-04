import { describe, expect, it } from 'vitest';
import { easing } from './easing';

describe('easing utils', () => {
  it('returns linear progression unchanged', () => {
    expect(easing.linear(0.42)).toBe(0.42);
  });

  it('applies quadratic ease-in/out behavior', () => {
    expect(easing.easeInQuad(0.5)).toBe(0.25);
    expect(easing.easeOutQuad(0.5)).toBe(0.75);
    expect(easing.easeInOutQuad(0.25)).toBeCloseTo(0.125);
  });

  it('returns 1 at the end of exponential easing', () => {
    expect(easing.easeOutExpo(1)).toBe(1);
  });
});