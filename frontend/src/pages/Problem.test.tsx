import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Problem } from './Problem';
import { challengesService } from '../services/challengesService';
import { toast } from 'react-hot-toast';

vi.mock('react-router', () => ({
  useParams: () => ({ id: 'problem-1' }),
  Link: ({ children, to }: { children: any; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock('../services/challengesService', () => ({
  challengesService: {
    getById: vi.fn(),
  },
}));

vi.mock('../services/submissionsService', () => ({
  submissionsService: {
    getById: vi.fn(),
    runCode: vi.fn(),
    submitCode: vi.fn(),
    getAiReview: vi.fn(),
  },
}));

vi.mock('../services/adminService', () => ({
  adminService: {},
}));

vi.mock('../services/hintsService', () => ({
  hintsService: {
    recommendLevel: vi.fn(),
    generateHint: vi.fn(),
  },
}));

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    close: vi.fn(),
  })),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('../context/EditorThemeContext', () => ({
  useEditorTheme: () => ({ editorTheme: 'vs-dark' }),
  defineMonacoThemes: vi.fn(),
}));

vi.mock('../hooks/useAnticheat', () => ({
  useAnticheat: () => ({
    focusLostCount: 0,
    totalFocusLostTime: 0,
    isFullScreen: true,
  }),
}));

vi.mock('@monaco-editor/react', () => ({
  default: ({ defaultValue }: { defaultValue?: string }) => (
    <div data-testid="editor">{defaultValue}</div>
  ),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
  },
}));

const mockedGetById = vi.mocked(challengesService.getById);
const mockedToastError = vi.mocked(toast.error);

describe('Problem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and renders problem details', async () => {
    mockedGetById.mockResolvedValue({
      id: 'problem-1',
      title: 'Two Sum',
      difficulty: 'easy',
      tags: ['array'],
      descriptionMd: 'Find two numbers that add to target.',
      allowedLanguages: ['javascript'],
      tests: [],
      examples: [],
      constraints: {},
      hints: [],
    });

    render(<Problem />);

    await waitFor(() => {
      expect(screen.getAllByText('Two Sum').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Statement')).toBeInTheDocument();
    expect(screen.getByText('Find two numbers that add to target.')).toBeInTheDocument();
    expect(screen.getByTestId('editor').textContent).toContain("const lines = require('fs')");
  });

  it('shows not found state when challenge load fails', async () => {
    mockedGetById.mockRejectedValue(new Error('load failed'));

    render(<Problem />);

    await waitFor(() => {
      expect(screen.getByText('Problem not found')).toBeInTheDocument();
    });

    expect(mockedToastError).toHaveBeenCalledWith('Error while loading problem');
  });
});
