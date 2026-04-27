interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'success' | 'warning';
}

export function ProgressBar({
  current,
  total,
  label,
  showPercentage = false,
  variant = 'default',
}: ProgressBarProps) {
  const percentage = Math.min((current / total) * 100, 100);

  const variantColors = {
    default: 'bg-[var(--brand-primary)]',
    success: 'bg-[var(--state-success)]',
    warning: 'bg-[var(--state-warning)]',
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-caption text-[var(--text-secondary)]">{label}</span>
          )}
          {showPercentage && (
            <span className="text-caption font-medium text-[var(--text-primary)]">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
        <div
          className={`h-full ${variantColors[variant]} transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function XPBar({ current, max, level }: { current: number; max: number; level: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
          Level {level}
        </span>
        <span className="text-caption text-[var(--text-muted)]">
          {current.toLocaleString()} / {max.toLocaleString()} XP
        </span>
      </div>
      <div className="relative h-3 bg-[var(--surface-2)] rounded-full overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] glow transition-all duration-500 ease-out"
          style={{ width: `${(current / max) * 100}%` }}
        />
      </div>
    </div>
  );
}
