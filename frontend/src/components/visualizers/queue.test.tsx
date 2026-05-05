import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueueVisualizer } from './QueueVisualizer';

(globalThis as any).React = React;

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('QueueVisualizer', () => {
  it('enqueue/dequeue follows FIFO order', () => {
    render(<QueueVisualizer />);

    const input = screen.getByPlaceholderText('Enter value');
    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.click(screen.getByText('Enqueue'));

    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.click(screen.getByText('Enqueue'));

    fireEvent.click(screen.getByText('Dequeue'));

    expect(screen.queryByText('dequeue() → 10')).toBeTruthy();
    expect(screen.queryAllByText('Front:').length).toBeGreaterThan(0);
  });
});
