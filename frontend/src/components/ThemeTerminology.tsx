import { useTheme } from '../context/ThemeContext';

// Theme-specific terminology mappings
const THEME_TERMINOLOGY = {
  cyber: {
    challenges: 'Battles',
    challenge: 'Battle',
    testCases: 'Stages',
    accepted: 'KO!',
    difficulty: 'Power Level',
    streak: 'Combo',
    badges: 'Patchs',
    leaderboard: 'Arena Rankings',
  },
  space: {
    challenges: 'Missions',
    challenge: 'Mission',
    testCases: 'Checkpoints',
    accepted: 'Mission Complete',
    difficulty: 'Priority',
    streak: 'Operational Days',
    badges: 'Command Badges',
    leaderboard: 'Commander Rankings',
  },
  samurai: {
    challenges: 'Kata',
    challenge: 'Kata',
    testCases: 'Forms',
    accepted: 'Mastered',
    difficulty: 'Belt Rank',
    streak: 'Training Days',
    badges: 'Stamps',
    leaderboard: 'Dojo Rankings',
  },
  pixel: {
    challenges: 'Levels',
    challenge: 'Level',
    testCases: 'Checkpoints',
    accepted: 'STAGE CLEAR!',
    difficulty: 'Rank',
    streak: 'Combo',
    badges: 'Achievements',
    leaderboard: 'High Scores',
  },
  mythic: {
    challenges: 'Quests',
    challenge: 'Quest',
    testCases: 'Quest Objectives',
    accepted: 'Quest Complete',
    difficulty: 'Quest Rank',
    streak: 'Adventure Days',
    badges: 'Guild Emblems',
    leaderboard: 'Guild Rankings',
  },
  sports: {
    challenges: 'Matches',
    challenge: 'Match',
    testCases: 'Match Score',
    accepted: 'WIN!',
    difficulty: 'Division',
    streak: 'Win Streak',
    badges: 'Trophies',
    leaderboard: 'League Rankings',
  },
};

type TerminologyKey = keyof typeof THEME_TERMINOLOGY['cyber'];

export function useThemeTerminology() {
  const { theme } = useTheme();
  const terminology = THEME_TERMINOLOGY[theme];

  const getTerm = (key: TerminologyKey): string => {
    return terminology[key] || key;
  };

  return { getTerm, terminology };
}

// Component to display theme-specific text
interface ThemeTextProps {
  term: TerminologyKey;
  className?: string;
}

export function ThemeText({ term, className = '' }: ThemeTextProps) {
  const { getTerm } = useThemeTerminology();
  return <span className={className}>{getTerm(term)}</span>;
}
