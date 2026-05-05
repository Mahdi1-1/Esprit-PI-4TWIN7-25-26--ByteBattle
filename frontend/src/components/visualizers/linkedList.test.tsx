import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LinkedListVisualizer } from './LinkedListVisualizer';

(globalThis as any).React = React;

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('LinkedListVisualizer', () => {
  it('insert at head and tail updates pointers correctly', () => {
    render(<LinkedListVisualizer />);

    const valueInput = screen.getByPlaceholderText('Enter value');

    fireEvent.change(valueInput, { target: { value: '10' } });
    fireEvent.click(screen.getByText('Insert at Head'));

    fireEvent.change(valueInput, { target: { value: '20' } });
    fireEvent.click(screen.getByText('Insert at Tail'));

    expect(screen.queryByText('Head:')).toBeTruthy();
    expect(screen.queryByText('Tail:')).toBeTruthy();
    expect(screen.queryByText('insertAtEnd(20)')).toBeTruthy();
  });
});
