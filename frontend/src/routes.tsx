import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import { useAuth } from './context/AuthContext';
import { PageLoader } from './App';
import { ThemeEffects } from './components/ThemeEffects';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { Toaster } from 'react-hot-toast';

// Lazy-load Navbar — 130 kB, not needed before first paint
const Navbar = lazy(() => import('./components/Navbar').then(m => ({ default: m.Navbar })));

// ─── Shell global ───
export function AppShell() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text-1)]">
      <ThemeEffects />
      {!isAdminRoute && (
        <Suspense fallback={<div className="h-16" aria-hidden="true" />}>
          <Navbar />
        </Suspense>
      )}
      <Outlet />
      <NotificationToastContainer />
      <Toaster position="bottom-right" />
    </div>
  );
}

// ─── Wrapper Suspense ───
export function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// ─── Guards ───
export function PrivateGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export function AdminGuard() {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role?.toLowerCase() !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

/**
 * Allows moderator + admin roles.
 * Matches the backend hierarchical RBAC: admin > moderator > user.
 */
export function ModeratorGuard() {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = user?.role?.toLowerCase();
  if (role !== 'admin' && role !== 'moderator') return <Navigate to="/" replace />;
  return <Outlet />;
}

export function PublicGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
}