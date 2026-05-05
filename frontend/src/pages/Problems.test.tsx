import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Problems } from './Problems';
import { challengesService } from '../services/challengesService';

vi.mock('../components/ProblemCard', () => ({
  ProblemCard: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('../services/challengesService', () => ({
  challengesService: {
    getAll: vi.fn(),
  },
}));

const mockedGetAll = vi.mocked(challengesService.getAll);

const sampleChallenges = [
  {
    id: 'p1',
    title: 'Two Sum',
    difficulty: 'easy',
    tags: ['array', 'hashmap'],
    solveRate: 80,
    avgTime: 12,
    status: 'new',
    type: 'CODE',
  },
  {
    id: 'p2',
    title: 'Binary Tree Zigzag',
    difficulty: 'medium',
    tags: ['tree'],
    solveRate: 52,
    avgTime: 20,
    status: 'attempted',
    type: 'CODE',
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <Problems />
    </MemoryRouter>,
  );
}

describe('Problems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and renders challenges with default query params', async () => {
    mockedGetAll.mockResolvedValue({ data: sampleChallenges, total: 2 });

    renderPage();

    await waitFor(() => {
      expect(mockedGetAll).toHaveBeenCalledWith({ page: 1, limit: 20, status: 'published', kind: 'CODE' });
    });

    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByText('Binary Tree Zigzag')).toBeInTheDocument();
    expect(screen.getByText('2 problems available to improve your skills')).toBeInTheDocument();
  });

  it('refetches with selected difficulty', async () => {
    mockedGetAll.mockImplementation(async (params) => {
      if (params?.difficulty === 'medium') {
        return { data: [sampleChallenges[1]], total: 1 };
      }
      return { data: sampleChallenges, total: 2 };
    });

    const { container } = renderPage();

    await waitFor(() => {
      expect(mockedGetAll).toHaveBeenCalledWith({ page: 1, limit: 20, status: 'published', kind: 'CODE' });
    });

    const difficultyLabel = screen.getByText('Difficulty');
    const difficultySelect = difficultyLabel.parentElement?.querySelector('select');
    expect(difficultySelect).toBeTruthy();

    fireEvent.change(difficultySelect as HTMLSelectElement, { target: { value: 'medium' } });

    await waitFor(() => {
      expect(mockedGetAll).toHaveBeenLastCalledWith({
        page: 1,
        limit: 20,
        status: 'published',
        kind: 'CODE',
        difficulty: 'medium',
      });
    });

    expect(container).toBeTruthy();
  });

  it('shows empty state when API fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockedGetAll.mockRejectedValue(new Error('boom'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No problems match your search criteria.')).toBeInTheDocument();
    });

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('changes page when clicking next', async () => {
    mockedGetAll.mockResolvedValue({ data: sampleChallenges, total: 45 });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(mockedGetAll).toHaveBeenLastCalledWith({ page: 2, limit: 20, status: 'published', kind: 'CODE' });
    });

    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });
});
