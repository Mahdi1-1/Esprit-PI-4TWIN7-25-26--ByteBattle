import { Trophy, TrendingDown, TrendingUp } from 'lucide-react';

interface MatchCardProps {
  opponent: string;
  opponentAvatar: string;
  result: 'win' | 'loss';
  eloDelta: number;
  problem: string;
  duration: number;
  date: string;
}

export function MatchCard({
  opponent,
  opponentAvatar,
  result,
  eloDelta,
  problem,
  duration,
  date,
}: MatchCardProps) {
  const isWin = result === 'win';

  return (
    <div
      className="
        p-4
        bg-[var(--surface-1)]
        border border-[var(--border-default)]
        rounded-[var(--radius-lg)]
        hover:border-[var(--border-strong)]
        transition-all duration-200
      "
    >
      <div className="flex items-center justify-between mb-3">
        {/* Opponent Info */}
        <div className="flex items-center gap-3">
          <img
            src={opponentAvatar}
            alt={opponent}
            className="w-10 h-10 rounded-full border-2 border-[var(--border-default)]"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--text-primary)]">{opponent}</span>
              {isWin && <Trophy className="w-4 h-4 text-[var(--brand-secondary)]" />}
            </div>
            <p className="text-caption text-[var(--text-muted)]">{date}</p>
          </div>
        </div>

        {/* Elo Delta */}
        <div
          className={`
            flex items-center gap-1
            px-3 py-1
            rounded-[var(--radius-md)]
            font-medium
            ${isWin 
              ? 'bg-[var(--state-success)]/10 text-[var(--state-success)]' 
              : 'bg-[var(--state-error)]/10 text-[var(--state-error)]'
            }
          `}
        >
          {isWin ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{isWin ? '+' : ''}{eloDelta}</span>
        </div>
      </div>

      {/* Match Details */}
      <div className="flex items-center gap-4 text-caption text-[var(--text-muted)]">
        <span className="font-medium text-[var(--text-secondary)]">{problem}</span>
        <span>•</span>
        <span>{duration}m {Math.floor((duration % 1) * 60)}s</span>
      </div>
    </div>
  );
}
