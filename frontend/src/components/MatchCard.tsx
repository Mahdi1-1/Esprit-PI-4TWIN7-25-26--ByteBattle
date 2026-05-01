import { Trophy, TrendingDown, TrendingUp } from 'lucide-react';

interface MatchCardProps {
  opponent: string;
  opponentAvatar: string;
  result: 'win' | 'loss' | 'draw';
  eloDelta?: number;
  problem: string;
  duration: number;
  date: string;
  difficulty?: string;
  score?: string;
  tests?: string;
}

export function MatchCard({
  opponent,
  opponentAvatar,
  result,
  eloDelta,
  problem,
  duration,
  date,
  difficulty,
  score,
  tests,
}: MatchCardProps) {
  const isWin = result === 'win';
  const isLoss = result === 'loss';
  const isDraw = result === 'draw';

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
              {isDraw && <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">Draw</span>}
            </div>
            <p className="text-caption text-[var(--text-muted)]">{date}</p>
          </div>
        </div>

        {/* Elo Delta */}
        {typeof eloDelta === 'number' && (
          <div
            className={`
              flex items-center gap-1
              px-3 py-1
              rounded-[var(--radius-md)]
              font-medium
              ${isWin
                ? 'bg-[var(--state-success)]/10 text-[var(--state-success)]'
                : isLoss
                  ? 'bg-[var(--state-error)]/10 text-[var(--state-error)]'
                  : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
              }
            `}
          >
            {isWin ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{isWin && eloDelta > 0 ? '+' : ''}{eloDelta}</span>
          </div>
        )}
      </div>

      {/* Match Details */}
      <div className="flex items-center gap-4 text-caption text-[var(--text-muted)]">
        <span className="font-medium text-[var(--text-secondary)]">{problem}</span>
        {difficulty && (
          <>
            <span>•</span>
            <span className="capitalize">{difficulty.toLowerCase()}</span>
          </>
        )}
        {score && (
          <>
            <span>•</span>
            <span>{score}</span>
          </>
        )}
        {tests && (
          <>
            <span>•</span>
            <span>{tests}</span>
          </>
        )}
        <span>•</span>
        <span>{duration}m {Math.floor((duration % 1) * 60)}s</span>
      </div>
    </div>
  );
}
