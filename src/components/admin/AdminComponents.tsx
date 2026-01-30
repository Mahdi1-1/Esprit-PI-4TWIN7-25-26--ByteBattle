import { ReactNode } from 'react';
import { UserRole, UserStatus, ProblemStatus, Verdict, HackathonStatus, ServiceStatus } from '../../data/adminData';

// Role Chip
interface RoleChipProps {
  role: UserRole;
}

export function RoleChip({ role }: RoleChipProps) {
  const colors: Record<UserRole, string> = {
    SUPER_ADMIN: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    ADMIN: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    MODERATOR: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    MENTOR: 'bg-green-500/10 text-green-500 border-green-500/30',
    ENTERPRISE_MANAGER: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30',
    USER: 'bg-gray-500/10 text-gray-500 border-gray-500/30'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${colors[role]}`}>
      {role.replace('_', ' ')}
    </span>
  );
}

// Status Chip
interface StatusChipProps {
  status: UserStatus | ProblemStatus | HackathonStatus | ServiceStatus | string;
  type?: 'user' | 'problem' | 'hackathon' | 'service' | 'verdict' | 'job';
}

export function StatusChip({ status, type = 'user' }: StatusChipProps) {
  const getColor = () => {
    switch (status) {
      // User/General
      case 'ACTIVE':
      case 'PUBLISHED':
      case 'HEALTHY':
      case 'ACCEPTED':
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/30';
      
      case 'BANNED':
      case 'DOWN':
      case 'COMPILATION_ERROR':
      case 'RUNTIME_ERROR':
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      
      case 'SUSPENDED':
      case 'LOCKED':
      case 'ARCHIVED':
      case 'FINISHED':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
      
      case 'DRAFT':
      case 'UPCOMING':
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      
      case 'ONGOING':
      case 'FROZEN':
      case 'active':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      
      case 'DEGRADED':
      case 'WRONG_ANSWER':
      case 'TLE':
      case 'MEMORY_LIMIT':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${getColor()}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// Metric Card
interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: 'default' | 'success' | 'warning' | 'error';
}

export function MetricCard({ title, value, icon, trend, color = 'default' }: MetricCardProps) {
  const colors = {
    default: 'border-[var(--border-default)]',
    success: 'border-green-500/30',
    warning: 'border-orange-500/30',
    error: 'border-red-500/30'
  };

  return (
    <div className={`bg-[var(--surface-1)] border ${colors[color]} rounded-lg p-4`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">{title}</span>
        {icon && <span className="text-[var(--text-muted)]">{icon}</span>}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-[var(--text-primary)]">{value}</span>
        {trend && (
          <span className={`text-xs font-medium ${trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}

// Empty State
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="text-6xl mb-4 opacity-50">{icon}</div>}
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      {description && <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-md">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Loading Skeleton
export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className="h-8 bg-[var(--surface-2)] rounded animate-pulse"
              style={{ flex: j === 0 ? 2 : 1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Code Viewer
interface CodeViewerProps {
  code: string;
  language?: string;
  maxHeight?: string;
}

export function CodeViewer({ code, language = 'python', maxHeight = '400px' }: CodeViewerProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-default)] bg-[var(--surface-1)]">
        <span className="text-xs text-[var(--text-secondary)] font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
        >
          Copy
        </button>
      </div>
      <pre
        className="p-4 overflow-auto text-sm font-mono text-[var(--text-primary)]"
        style={{ maxHeight }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Filter Bar
interface FilterBarProps {
  children: ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg">
      {children}
    </div>
  );
}

// Pagination
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-default)]">
      <div className="text-sm text-[var(--text-secondary)]">
        {totalItems && itemsPerPage && (
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border border-[var(--border-default)] rounded hover:bg-[var(--surface-2)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 text-sm rounded ${
                  currentPage === page
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'border border-[var(--border-default)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border border-[var(--border-default)] rounded hover:bg-[var(--surface-2)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// Confirm Modal
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg max-w-md w-full p-6 space-y-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)]">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-[var(--border-default)] rounded hover:bg-[var(--surface-2)] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded transition-colors ${
              danger
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-[var(--brand-primary)] text-white hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Breadcrumb
interface BreadcrumbProps {
  items: { label: string; href?: string }[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-4">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <span>/</span>}
          {item.href ? (
            <a href={item.href} className="hover:text-[var(--brand-primary)] transition-colors">
              {item.label}
            </a>
          ) : (
            <span className="text-[var(--text-primary)] font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
