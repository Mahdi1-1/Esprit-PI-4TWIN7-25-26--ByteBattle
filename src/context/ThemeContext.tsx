import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeName = 'cyber' | 'space' | 'samurai' | 'pixel' | 'mythic' | 'sports';
export type ColorScheme = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeName;
  colorScheme: ColorScheme;
  setTheme: (theme: ThemeName) => void;
  toggleColorScheme: () => void;
  userLevel: number;
  unlockedThemes: ThemeName[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_LEVEL_REQUIREMENTS: Record<ThemeName, number> = {
  cyber: 1,
  space: 20,
  samurai: 40,
  pixel: 60,
  mythic: 80,
  sports: 100,
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('cyber');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('dark');
  const [userLevel, setUserLevel] = useState(42); // Mock level for demo

  // Calculate unlocked themes based on user level
  const unlockedThemes = Object.entries(THEME_LEVEL_REQUIREMENTS)
    .filter(([_, level]) => userLevel >= level)
    .map(([theme]) => theme as ThemeName);

  // Apply theme to document
  useEffect(() => {
    const themeClass = `${theme}_${colorScheme}`;
    document.documentElement.setAttribute('data-theme', themeClass);
  }, [theme, colorScheme]);

  const setTheme = (newTheme: ThemeName) => {
    // Check if theme is unlocked
    if (userLevel >= THEME_LEVEL_REQUIREMENTS[newTheme]) {
      setThemeState(newTheme);
      localStorage.setItem('bytebattle-theme', newTheme);
    }
  };

  const toggleColorScheme = () => {
    const newScheme = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(newScheme);
    localStorage.setItem('bytebattle-color-scheme', newScheme);
  };

  // Load saved preferences on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('bytebattle-theme') as ThemeName | null;
    const savedScheme = localStorage.getItem('bytebattle-color-scheme') as ColorScheme | null;
    
    if (savedTheme && unlockedThemes.includes(savedTheme)) {
      setThemeState(savedTheme);
    }
    if (savedScheme) {
      setColorScheme(savedScheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      colorScheme, 
      setTheme, 
      toggleColorScheme, 
      userLevel,
      unlockedThemes 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export { THEME_LEVEL_REQUIREMENTS };
