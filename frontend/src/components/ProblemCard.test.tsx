import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ProblemCard } from './ProblemCard';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ProblemCard', () => {
  it('links unsolved code challenge to problem page', () => {
    render(
      <MemoryRouter>
        <ProblemCard
          id="abc123"
          title="Two Sum"
          difficulty="easy"
          tags={["array"]}
          solveRate={80}
          avgTime={10}
          status="new"
          type="CODE"
        />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/problems/abc123');
    expect(screen.getByText('Code')).toBeInTheDocument();
  });

  it('navigates to canvas brief on restart for solved canvas challenge', () => {
    render(
      <MemoryRouter>
        <ProblemCard
          id="canvas9"
          title="Wireframe Sprint"
          difficulty="medium"
          tags={["ux"]}
          solveRate={61}
          avgTime={18}
          status="solved"
          type="CANVAS"
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Restart Problem' }));

    expect(mockNavigate).toHaveBeenCalledWith('/canvas/canvas9/brief');
    expect(screen.getByText('Canvas')).toBeInTheDocument();
  });
});
