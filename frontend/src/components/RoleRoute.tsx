import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';

interface RoleRouteProps {
    children: ReactNode;
    /** The role(s) allowed to access this route */
    allowedRoles: string[];
}

/**
 * Route guard that checks both authentication AND role.
 * - Not authenticated → redirect to /login
 * - Authenticated but wrong role → redirect to /403
 */
export function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[var(--text-secondary)]">Vérification des permissions...</p>
                </div>
            </div>
        );
    }

    // Not logged in → login page
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Get the user role
    const userRole = user.role?.toLowerCase?.() || '';

    // Check if user's role is in the allowed list
    const hasAccess = allowedRoles.some(
        (role) => role.toLowerCase() === userRole,
    );

    if (!hasAccess) {
        return <Navigate to="/403" replace />;
    }

    return <>{children}</>;
}
