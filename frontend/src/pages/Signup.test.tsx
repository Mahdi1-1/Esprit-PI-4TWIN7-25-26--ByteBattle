import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Signup } from './Signup';

const mockNavigate = vi.fn();
const mockSignup = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    signup: mockSignup,
  }),
}));

describe('Signup', () => {
  it('rejects weak password', async () => {
    render(<Signup />);

    fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText('johndoe'), { target: { value: 'johndoe' } });
    fireEvent.change(screen.getByPlaceholderText('vous@exemple.com'), { target: { value: 'john@example.com' } });

    const passwordFields = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(passwordFields[0], { target: { value: 'weak' } });
    fireEvent.change(passwordFields[1], { target: { value: 'weak' } });

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Create my account' }));

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(mockSignup).not.toHaveBeenCalled();
  });
});
