import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArrayVisualizer } from './ArrayVisualizer';

(globalThis as any).React = React;

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

function goToLastStep(container: HTMLElement) {
  const getNextButton = () => {
    const icon = container.querySelector('svg.lucide-skip-forward');
    return icon?.closest('button') as HTMLButtonElement | null;
  };

  for (let i = 0; i < 500; i++) {
    const nextBtn = getNextButton();
    if (!nextBtn || nextBtn.disabled) break;
    fireEvent.click(nextBtn);
  }
}

function readArrayCells(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll('div.w-12.h-12'))
    .map((el) => Number((el.textContent ?? '').trim()))
    .filter((n) => !Number.isNaN(n));
}

describe('ArrayVisualizer sorting', () => {
  it('bubble sort reaches sorted final frame', () => {
    const { container } = render(<ArrayVisualizer />);

    fireEvent.click(screen.getByText('Visualize'));
    goToLastStep(container);

    expect(screen.queryByText('Sorting completed!')).toBeTruthy();
    expect(readArrayCells(container)).toEqual([1, 2, 5, 8, 9]);
  });

  it('quick sort reaches sorted final frame', () => {
    const { container } = render(<ArrayVisualizer />);

    fireEvent.change(container.querySelector('select') as HTMLSelectElement, {
      target: { value: 'quick' },
    });
    fireEvent.click(screen.getByText('Visualize'));
    goToLastStep(container);

    expect(screen.queryByText('Quick Sort completed!')).toBeTruthy();
    expect(readArrayCells(container)).toEqual([1, 2, 5, 8, 9]);
  });

  it('merge sort reaches sorted final frame', () => {
    const { container } = render(<ArrayVisualizer />);

    fireEvent.change(container.querySelector('select') as HTMLSelectElement, {
      target: { value: 'merge' },
    });
    fireEvent.click(screen.getByText('Visualize'));
    goToLastStep(container);

    expect(screen.queryByText('Merge Sort completed!')).toBeTruthy();
    expect(readArrayCells(container)).toEqual([1, 2, 5, 8, 9]);
  });
});
