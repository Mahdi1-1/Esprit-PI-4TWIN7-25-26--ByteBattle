import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ArrayVisualizer } from './ArrayVisualizer';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

function getByIcon(container: HTMLElement, iconClass: string): HTMLButtonElement {
  const icon = container.querySelector(`svg.${iconClass}`);
  if (!icon) throw new Error(`Missing icon ${iconClass}`);
  const button = icon.closest('button') as HTMLButtonElement | null;
  if (!button) throw new Error(`Missing button for icon ${iconClass}`);
  return button;
}

function getPlaybackButton(container: HTMLElement, iconClass: 'lucide-play' | 'lucide-pause'): HTMLButtonElement {
  const icon = container.querySelector(`svg.${iconClass}.w-6`);
  if (!icon) throw new Error(`Missing playback icon ${iconClass}`);
  const button = icon.closest('button') as HTMLButtonElement | null;
  if (!button) throw new Error(`Missing playback button for ${iconClass}`);
  return button;
}

function getProgressLabel(): string {
  const label = screen.getByText(/^(Ready to visualize|\d+ \/ \d+)$/);
  return (label.textContent ?? '').trim();
}

describe('ArrayVisualizer animation controls', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('play toggles to pause icon', () => {
    const { container } = render(<ArrayVisualizer />);

    fireEvent.click(screen.getByText('Visualize'));
    fireEvent.click(getPlaybackButton(container, 'lucide-play'));

    expect(container.querySelector('svg.lucide-pause.w-6')).toBeInTheDocument();
  });

  it('pause keeps current frame stable', () => {
    const { container } = render(<ArrayVisualizer />);

    fireEvent.click(screen.getByText('Visualize'));
    fireEvent.click(getPlaybackButton(container, 'lucide-play'));

    act(() => {
      vi.advanceTimersByTime(1100);
    });
    fireEvent.click(getPlaybackButton(container, 'lucide-pause'));

    const frozen = getProgressLabel();
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(getProgressLabel()).toBe(frozen);
  });

  it('step forward increments current frame and step backward decrements', () => {
    const { container } = render(<ArrayVisualizer />);

    fireEvent.click(screen.getByText('Visualize'));

    expect(getProgressLabel()).toMatch(/^1 \/ \d+$/);

    fireEvent.click(getByIcon(container, 'lucide-skip-forward'));
    expect(getProgressLabel()).toMatch(/^2 \/ \d+$/);

    fireEvent.click(getByIcon(container, 'lucide-skip-back'));
    expect(getProgressLabel()).toMatch(/^1 \/ \d+$/);
  });

  it('reset returns visualizer to idle state', () => {
    const { container } = render(<ArrayVisualizer />);

    fireEvent.click(screen.getByText('Visualize'));
    fireEvent.click(getByIcon(container, 'lucide-skip-forward'));

    fireEvent.click(screen.getByText('Reset'));

    expect(getProgressLabel()).toBe('Ready to visualize');
  });
});
