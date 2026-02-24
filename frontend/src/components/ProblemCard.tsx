import { Link } from 'react-router';
import { DifficultyBadge } from './Badge';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';

export type ProblemStatus = 'new' | 'attempted' | 'solved';
export type Difficulty = 'easy' | 'medium' | 'hard';

interface ProblemCardProps {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  solveRate: number;
  avgTime: number;
  status: ProblemStatus;
}

const statusIcons = {
  new: <Circle className="w-4 h-4 text-[var(--text-muted)]" />,
  attempted: <XCircle className="w-4 h-4 text-[var(--state-warning)]" />,
  solved: <CheckCircle2 className="w-4 h-4 text-[var(--state-success)]" />,
};

export function ProblemCard({
  id,
  title,
  difficulty,
  tags,
  solveRate,
  avgTime,
  status,
}: ProblemCardProps) {
  return (
    <Link to={`/problem/${id}`}>
      <div
        className="
          group
          p-4
          bg-[var(--surface-1)]
          border border-[var(--border-default)]
          rounded-[var(--radius-lg)]
          hover:border-[var(--brand-primary)]
          hover:shadow-md
          transition-all duration-200
          cursor-pointer
        "
      >
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className="mt-0.5">{statusIcons[status]}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors">
                {title}
              </h3>
              <DifficultyBadge difficulty={difficulty} />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="
                    px-2 py-0.5
                    text-caption
                    bg-[var(--surface-2)]
                    text-[var(--text-secondary)]
                    rounded-[var(--radius-sm)]
                  "
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-caption text-[var(--text-muted)]">
              <div className="flex items-center gap-1">
                <span>Solve Rate:</span>
                <span className="font-medium text-[var(--text-secondary)]">
                  {solveRate}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Avg Time:</span>
                <span className="font-medium text-[var(--text-secondary)]">
                  {avgTime}m
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
