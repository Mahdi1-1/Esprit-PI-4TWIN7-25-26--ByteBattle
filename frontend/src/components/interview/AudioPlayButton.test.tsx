import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AudioPlayButton } from './AudioPlayButton';

describe('AudioPlayButton', () => {
  it('plays when message is not current', () => {
    const onPlay = vi.fn();
    const onPause = vi.fn();
    const onResume = vi.fn();

    render(
      <AudioPlayButton
        isCurrentMessage={false}
        state="paused"
        onPlay={onPlay}
        onPause={onPause}
        onResume={onResume}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Play message' }));

    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPause).not.toHaveBeenCalled();
    expect(onResume).not.toHaveBeenCalled();
  });

  it('pauses when current message is playing', () => {
    const onPause = vi.fn();

    render(
      <AudioPlayButton
        isCurrentMessage={true}
        state="playing"
        onPlay={vi.fn()}
        onPause={onPause}
        onResume={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Play message' }));

    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('resumes when current message is paused', () => {
    const onResume = vi.fn();

    render(
      <AudioPlayButton
        isCurrentMessage={true}
        state="paused"
        onPlay={vi.fn()}
        onPause={vi.fn()}
        onResume={onResume}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Play message' }));

    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('disables interaction while loading', () => {
    render(
      <AudioPlayButton
        isCurrentMessage={true}
        state="loading"
        onPlay={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Play message' })).toBeDisabled();
  });
});
