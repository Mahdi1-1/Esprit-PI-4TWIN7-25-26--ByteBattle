import { Link, useNavigate } from 'react-router';
import { DifficultyBadge } from './Badge';
import { CheckCircle2, Circle, XCircle, PenTool, Code2, RotateCcw } from 'lucide-react';

export type ProblemStatus = 'new' | 'attempted' | 'solved';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ChallengeType = 'code' | 'canvas' | 'CODE' | 'CANVAS' | string;

interface ProblemCardProps {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  solveRate: number;
  avgTime: number;
  status: ProblemStatus;
  type?: ChallengeType;
}

const statusIcons = {
  new: <Circle className="w-4 h-4 text-[var(--text-muted)]" />,
  attempted: <XCircle className="w-4 h-4 text-[var(--state-warning)]" />,
  solved: <CheckCircle2 className="w-4 h-4 text-[var(--state-success)]" />,
};

/** Résout l'URL de destination selon le type/kind de challenge */
function resolveHref(id: string, type?: ChallengeType): string {
  const normalized = (type ?? '').toString().toLowerCase();
  if (normalized === 'canvas') return `/canvas/${id}/brief`;
  return `/problems/${id}`;
}

export function ProblemCard({
  id,
  title,
  difficulty,
  tags,
  solveRate,
  avgTime,
  status,
  type,
}: ProblemCardProps) {
  const href = resolveHref(id, type);
  const isCanvas = (type ?? '').toString().toLowerCase() === 'canvas';
  const isSolved = status === 'solved';
  const navigate = useNavigate();

  const cardContent = (
    <div className="flex items-start gap-3">
      {/* Status Icon */}
      <div className="mt-0.5">{statusIcons[status]}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Type badge */}
            {isCanvas ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-purple-500/15 text-purple-400 flex-shrink-0">
                <PenTool className="w-2.5 h-2.5" />
                Canvas
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex-shrink-0">
                <Code2 className="w-2.5 h-2.5" />
                Code
              </span>
            )}
            <h3 className={`font-semibold text-[var(--text-primary)] transition-colors truncate ${!isSolved ? 'group-hover:text-[var(--brand-primary)]' : ''}`}>
              {title}
            </h3>
          </div>
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
  );

  if (isSolved) {
    return (
      <div
        className="
          group
          relative
          p-6
          mb-6
          bg-[var(--surface-1)]
          border border-[var(--border-default)]
          rounded-[var(--radius-lg)]
          opacity-70
          transition-all duration-200
        "
      >
        {/* Griser et interdire le click par défaut sur la carte */}
        <div className="pointer-events-none">
          {cardContent}
        </div>

        {/* Overlay au hover avec bouton Restart */}
        <div className="absolute inset-0 z-10 flex items-center justify-end pr-6 opacity-0 group-hover:opacity-100 bg-gradient-to-l from-[var(--bg-primary)]/80 to-transparent rounded-[var(--radius-lg)] transition-all">
          <button 
            onClick={(e) => {
               e.preventDefault();
               navigate(href);
            }}
            className="px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] text-[var(--text-primary)] rounded-lg flex items-center gap-2 font-medium shadow-lg transition-colors cursor-pointer pointer-events-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Restart Problem
          </button>
        </div>
      </div>
    );
  }

  return (
    <Link to={href}>
      <div
        className="
          group
          p-6
          mb-6
          bg-[var(--surface-1)]
          border border-[var(--border-default)]
          rounded-[var(--radius-lg)]
          hover:border-[var(--brand-primary)]
          hover:shadow-md
          transition-all duration-200
          cursor-pointer
        "
      >
        {cardContent}
      </div>
    </Link>
  );
}
