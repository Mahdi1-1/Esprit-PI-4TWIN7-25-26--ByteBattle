import type { ThemeName } from './ThemeContext';

// Kept in a separate file so ThemeContext.tsx only exports React components/hooks
// and stays compatible with Vite Fast Refresh.
export const THEME_LEVEL_REQUIREMENTS: Record<ThemeName, number> = {
  samurai: 1,
  space: 20,
  cyber: 40,
  pixel: 60,
  mythic: 80,
  sports: 100,
};
