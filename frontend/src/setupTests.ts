import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import React from 'react';

(globalThis as any).React = React;

Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: vi.fn(),
});
