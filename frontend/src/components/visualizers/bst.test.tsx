import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { TreeVisualizer } from './TreeVisualizer';

(globalThis as any).React = React;

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('TreeVisualizer (BST)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    cleanup();
  });

  it('inserts and deletes values in BST', () => {
    render(<TreeVisualizer />);

    const input = screen.getByPlaceholderText('Enter value');
    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.click(screen.getByText('Insert'));

    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(screen.getByText('Insert'));

    fireEvent.change(input, { target: { value: '15' } });
    fireEvent.click(screen.getByText('Insert'));

    expect(screen.queryByText('insert(15)')).toBeTruthy();

    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(screen.getByText('Delete'));

    expect(screen.queryByText('delete(5)')).toBeTruthy();
    act(() => {
      vi.runOnlyPendingTimers();
    });
  });

  it('search reports found for existing node', () => {
    render(<TreeVisualizer />);

    const input = screen.getByPlaceholderText('Enter value');
    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.click(screen.getByText('Insert'));

    const searchInput = screen.getByPlaceholderText('Search value');
    fireEvent.change(searchInput, { target: { value: '10' } });
    fireEvent.click(screen.getByText('Search'));

    expect(screen.queryByText('search(10) → found')).toBeTruthy();
    act(() => {
      vi.runOnlyPendingTimers();
    });
  });
});
