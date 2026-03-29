import { Loader, AlertTriangle, RefreshCw } from 'lucide-react';
import { Layout } from './Layout';
import { Navbar } from './Navbar';
import { Button } from './Button';
import { Skeleton } from './ui/skeleton';

/** Full-page loading skeleton for hackathon pages */
export function HackathonPageSkeleton() {
  return (
    <Layout>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Status bar skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Content cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6 space-y-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

/** Workspace-style loading skeleton with split panes */
export function WorkspaceSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* Top bar */}
      <div className="h-12 flex items-center justify-between px-4 bg-[var(--surface-1)] border-b border-[var(--border-default)]">
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-24" />
      </div>

      <div className="flex-1 flex">
        {/* Problem sidebar */}
        <div className="w-12 bg-[var(--surface-1)] border-r border-[var(--border-default)] p-2 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-8 rounded" />
          ))}
        </div>

        {/* Editor area */}
        <div className="flex-1 p-4 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="flex-1 h-64 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>

        {/* Right panel */}
        <div className="w-72 bg-[var(--surface-1)] border-l border-[var(--border-default)] p-4 space-y-4">
          <Skeleton className="h-6 w-24" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Admin dashboard skeleton */
export function AdminDashboardSkeleton() {
  return (
    <Layout>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-4 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6 space-y-4">
          <Skeleton className="h-6 w-48 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-[var(--border-subtle)]">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

/** Error state for hackathon pages */
export function HackathonError({
  title = 'Something went wrong',
  message = 'Failed to load hackathon data. Please try again.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Layout>
      <Navbar />
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <AlertTriangle className="w-12 h-12 text-[var(--state-error)] mb-4" />
        <h2 className="text-h3 text-[var(--text-primary)] mb-2">{title}</h2>
        <p className="text-body text-[var(--text-muted)] mb-6 max-w-md">{message}</p>
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </Layout>
  );
}

/** Empty state for hackathon lists/sections */
export function HackathonEmpty({
  icon: Icon = Loader,
  title = 'Nothing here yet',
  message = '',
  action,
}: {
  icon?: React.ElementType;
  title?: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-10 h-10 text-[var(--text-muted)] mb-4" />
      <h3 className="text-h4 text-[var(--text-secondary)] mb-1">{title}</h3>
      {message && <p className="text-caption text-[var(--text-muted)] mb-4 max-w-sm">{message}</p>}
      {action}
    </div>
  );
}
