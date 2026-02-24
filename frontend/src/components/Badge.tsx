import { ReactNode } from 'react';

type BadgeVariant = 
  | 'easy' | 'medium' | 'hard'
  | 'common' | 'rare' | 'epic' | 'legendary'
  | 'ACCEPTED' | 'WA' | 'TLE' | 'RE' | 'CE'
  | 'ongoing' | 'frozen' | 'finished'
  | 'default';

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  // Difficulty badges
  easy: 'bg-[var(--state-success)]/10 text-[var(--state-success)] border-[var(--state-success)]/20',
  medium: 'bg-[var(--state-warning)]/10 text-[var(--state-warning)] border-[var(--state-warning)]/20',
  hard: 'bg-[var(--state-error)]/10 text-[var(--state-error)] border-[var(--state-error)]/20',
  
  // Rarity badges (for achievements/items)
  common: 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border-default)]',
  rare: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  epic: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  legendary: 'bg-[var(--brand-secondary)]/10 text-[var(--brand-secondary)] border-[var(--brand-secondary)]/20 glow',
  
  // Verdict badges
  ACCEPTED: 'bg-[var(--score-accepted)]/10 text-[var(--score-accepted)] border-[var(--score-accepted)]/20',
  WA: 'bg-[var(--score-wrong)]/10 text-[var(--score-wrong)] border-[var(--score-wrong)]/20',
  TLE: 'bg-[var(--score-tle)]/10 text-[var(--score-tle)] border-[var(--score-tle)]/20',
  RE: 'bg-[var(--score-re)]/10 text-[var(--score-re)] border-[var(--score-re)]/20',
  CE: 'bg-[var(--score-ce)]/10 text-[var(--score-ce)] border-[var(--score-ce)]/20',
  
  // Status badges
  ongoing: 'bg-[var(--state-info)]/10 text-[var(--state-info)] border-[var(--state-info)]/20',
  frozen: 'bg-[var(--state-warning)]/10 text-[var(--state-warning)] border-[var(--state-warning)]/20',
  finished: 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border-default)]',
  
  default: 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border-default)]',
};

export function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-2 py-0.5
        text-caption
        border
        rounded-[var(--radius-sm)]
        font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Specific badge components for better DX
export function DifficultyBadge({ difficulty }: { difficulty: 'easy' | 'medium' | 'hard' }) {
  const labels = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  return <Badge variant={difficulty}>{labels[difficulty]}</Badge>;
}

export function VerdictBadge({ verdict }: { verdict: 'ACCEPTED' | 'WA' | 'TLE' | 'RE' | 'CE' }) {
  const labels = {
    ACCEPTED: 'Accepted',
    WA: 'Wrong Answer',
    TLE: 'Time Limit',
    RE: 'Runtime Error',
    CE: 'Compilation Error',
  };
  return <Badge variant={verdict}>{labels[verdict]}</Badge>;
}

export function RarityBadge({ rarity }: { rarity: 'common' | 'rare' | 'epic' | 'legendary' }) {
  return <Badge variant={rarity}>{rarity.charAt(0).toUpperCase() + rarity.slice(1)}</Badge>;
}
