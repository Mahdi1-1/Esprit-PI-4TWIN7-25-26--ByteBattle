import { describe, expect, it } from 'vitest';
import { hexToRgb, interpolateColor } from './colors';

describe('color utils', () => {
  it('converts hex colors to rgb objects', () => {
    expect(hexToRgb('#336699')).toEqual({ r: 51, g: 102, b: 153 });
  });

  it('returns null for invalid hex values', () => {
    expect(hexToRgb('oops')).toBeNull();
  });

  it('interpolates between two colors', () => {
    expect(interpolateColor('#000000', '#ffffff', 0.5)).toBe('rgb(128, 128, 128)');
  });

  it('returns the first color when parsing fails', () => {
    expect(interpolateColor('bad', '#ffffff', 0.5)).toBe('bad');
  });
});