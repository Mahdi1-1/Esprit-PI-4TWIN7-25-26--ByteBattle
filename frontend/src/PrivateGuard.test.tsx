import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import { PrivateGuard } from './routes';

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: { role?: string } | null;
};

let authState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
};

vi.mock('./context/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('./App', () => ({
  PageLoader: () => <div>Loading...</div>,
}));

function renderGuard() {
  const routes: RouteObject[] = [
    {
      path: '/private',
      element: <PrivateGuard />,
      children: [{ index: true, element: <div>private content</div> }],
    },
    { path: '/login', element: <div>login page</div> },
  ];
  const router = createMemoryRouter(routes, { initialEntries: ['/private'] });
  return render(<RouterProvider router={router} />);
}

describe('PrivateGuard', () => {
  it('redirects to /login when unauthenticated', async () => {
    authState = { isAuthenticated: false, isLoading: false, user: null };
    renderGuard();

    await waitFor(() => {
      expect(screen.getByText('login page')).toBeInTheDocument();
    });
  });

  it('renders protected outlet when authenticated', () => {
    authState = { isAuthenticated: true, isLoading: false, user: { role: 'user' } };
    renderGuard();

    expect(screen.getByText('private content')).toBeInTheDocument();
  });
});
