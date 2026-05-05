import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StackVisualizer } from './StackVisualizer';

(globalThis as any).React = React;

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('StackVisualizer', () => {
  it('push/pop follows LIFO order', () => {
    render(<StackVisualizer />);

    const input = screen.getByPlaceholderText('Enter value');
    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.click(screen.getByText('Push'));

    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.click(screen.getByText('Push'));

    expect(screen.queryByText('Top:')).toBeTruthy();
    expect(screen.queryAllByText('20').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('Pop'));

    expect(screen.queryByText('pop() → 20')).toBeTruthy();
  });
});
