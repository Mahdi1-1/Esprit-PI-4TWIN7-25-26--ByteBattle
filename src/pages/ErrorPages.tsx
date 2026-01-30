import { Link } from 'react-router';
import { Home, AlertTriangle, Lock, RefreshCw, Inbox, ServerCrash } from 'lucide-react';

// 404 Not Found
export function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] mb-4">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-6xl font-bold text-[var(--text-primary)] mb-2">404</h1>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Page Not Found</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-1)] transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

// 403 Permission Denied
export function PermissionDenied() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 mb-4">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-6xl font-bold text-[var(--text-primary)] mb-2">403</h1>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Access Denied</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            You don't have permission to access this resource. Contact an administrator if you believe this is an error.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Loading Page
export function LoadingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] mb-4 animate-pulse">
          <RefreshCw className="w-10 h-10 text-white animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Loading...</h2>
        <p className="text-[var(--text-secondary)]">Please wait while we load your content</p>
      </div>
    </div>
  );
}

// Empty State Page
export function EmptyStatePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--surface-2)] mb-4">
            <Inbox className="w-10 h-10 text-[var(--text-muted)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Nothing Here Yet</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            There's no content to display at the moment. Check back later or explore other sections.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

// Error Page (500)
export function ErrorPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 mb-4">
            <ServerCrash className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-6xl font-bold text-[var(--text-primary)] mb-2">500</h1>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Server Error</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Something went wrong on our end. We're working to fix it. Please try again later.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-1)] transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
