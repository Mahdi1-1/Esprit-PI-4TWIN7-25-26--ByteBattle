import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import { AdminGuard } from './routes';

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
      path: '/admin',
      element: <AdminGuard />,
      children: [{ index: true, element: <div>admin content</div> }],
    },
    { path: '/', element: <div>home page</div> },
    { path: '/login', element: <div>login page</div> },
  ];
  const router = createMemoryRouter(routes, { initialEntries: ['/admin'] });
  return render(<RouterProvider router={router} />);
}

describe('AdminGuard', () => {
  it('redirects non-admin users away from admin route', async () => {
    authState = { isAuthenticated: true, isLoading: false, user: { role: 'user' } };
    renderGuard();

    await waitFor(() => {
      expect(screen.getByText('home page')).toBeInTheDocument();
    });
  });

  it('allows admin users', () => {
    authState = { isAuthenticated: true, isLoading: false, user: { role: 'admin' } };
    renderGuard();

    expect(screen.getByText('admin content')).toBeInTheDocument();
  });
});
