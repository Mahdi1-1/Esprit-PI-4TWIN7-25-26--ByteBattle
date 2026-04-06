import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

// Rarity → color mapping
const RARITY_STYLES: Record<string, { border: string; bg: string; label: string; glow: string }> = {
  common:    { border: 'border-[var(--border-default)]',  bg: 'bg-[var(--surface-2)]',          label: 'text-[var(--text-muted)]',             glow: '' },
  rare:      { border: 'border-blue-500/60',              bg: 'bg-blue-950/30',                  label: 'text-blue-400',                        glow: 'hover:shadow-[0_0_10px_2px_rgba(59,130,246,0.25)]' },
  epic:      { border: 'border-purple-500/60',            bg: 'bg-purple-950/30',                label: 'text-purple-400',                      glow: 'hover:shadow-[0_0_10px_2px_rgba(168,85,247,0.25)]' },
  legendary: { border: 'border-yellow-500/60',            bg: 'bg-yellow-950/30',                label: 'text-yellow-400',                      glow: 'hover:shadow-[0_0_14px_4px_rgba(234,179,8,0.30)]' },
};

// Icon mapping for badge keys
const BADGE_ICONS: Record<string, string> = {
  first_blood:    '🩸',
  problem_solver: '🧩',
  century:        '💯',
  easy_rider:     '🟢',
  medium_master:  '🟡',
  hard_crusher:   '🔴',
  polyglot:       '🌐',
  speed_demon:    '⚡',
  perfect_score:  '🎯',
  night_owl:      '🦉',
  duel_debut:     '⚔️',
  duel_winner:    '🏆',
  gladiator:      '🛡️',
  undefeated:     '🔥',
  elo_bronze:     '🥉',
  elo_silver:     '🥈',
  elo_gold:       '🥇',
  elo_legend:     '👑',
  level_5:        '⭐',
  level_10:       '🌟',
  level_20:       '💫',
  xp_1000:        '📈',
  xp_5000:        '🚀',
  first_post:     '📝',
  commentator:    '💬',
};

export interface BadgeData {
  id: string;
  earnedAt: string;
  badge: {
    id: string;
    key: string;
    name: string;
    rarity: string;
    ruleText: string;
    iconUrl: string;
  };
}

interface BadgeCardProps {
  data: BadgeData;
  size?: 'sm' | 'md' | 'lg';
}

export function BadgeCard({ data, size = 'md' }: BadgeCardProps) {
  const { badge, earnedAt } = data;
  const style = RARITY_STYLES[badge.rarity] ?? RARITY_STYLES.common;
  const icon = BADGE_ICONS[badge.key] ?? '🏅';

  const sizeClasses = {
    sm:  'p-3 gap-1',
    md:  'p-4 gap-2',
    lg:  'p-5 gap-3',
  }[size];

  const iconSize = { sm: 'text-2xl', md: 'text-3xl', lg: 'text-4xl' }[size];
  const nameSize = { sm: 'text-xs',  md: 'text-sm',  lg: 'text-base' }[size];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
              flex flex-col items-center text-center
              border rounded-[var(--radius-lg)]
              transition-all duration-200 cursor-default
              ${style.border} ${style.bg} ${style.glow}
              ${sizeClasses}
            `}
          >
            <span className={iconSize}>{icon}</span>
            <span className={`${nameSize} font-semibold text-[var(--text-primary)] leading-tight mt-1`}>
              {badge.name}
            </span>
            <span className={`text-[0.65rem] capitalize ${style.label}`}>{badge.rarity}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-center space-y-1 max-w-[200px]">
          <div className="font-semibold">{badge.name}</div>
          <div className="text-xs opacity-80">{badge.ruleText}</div>
          <div className={`text-xs capitalize font-medium ${style.label}`}>{badge.rarity}</div>
          <div className="text-xs opacity-60">
            Earned {new Date(earnedAt).toLocaleDateString()}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface BadgeGridProps {
  badges: BadgeData[];
  emptyMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  limit?: number;
}

export function BadgeGrid({ badges, emptyMessage = 'No badges earned yet.', size = 'md', limit }: BadgeGridProps) {
  const displayed = limit ? badges.slice(0, limit) : badges;

  if (badges.length === 0) {
    return <p className="text-sm text-[var(--text-muted)] italic">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {displayed.map(b => (
        <BadgeCard key={b.id} data={b} size={size} />
      ))}
    </div>
  );
}
