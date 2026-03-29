import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Optional: restrict to specific role(s). If omitted, any authenticated user can access. */
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is specified, check the user's role
  if (allowedRoles && allowedRoles.length > 0 && user) {
    const userRole = (user.role || '').toLowerCase();
    const hasAccess = allowedRoles.some((r) => r.toLowerCase() === userRole);
    if (!hasAccess) {
      return <Navigate to="/403" replace />;
    }
  }

  return <>{children}</>;
}
