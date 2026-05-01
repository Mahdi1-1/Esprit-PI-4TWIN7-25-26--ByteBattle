interface RoadmapProgressBarProps {
  completed: number;
  total: number;
}

export function RoadmapProgressBar({ completed, total }: RoadmapProgressBarProps) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
        <span>{completed} of {total} topics completed</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
