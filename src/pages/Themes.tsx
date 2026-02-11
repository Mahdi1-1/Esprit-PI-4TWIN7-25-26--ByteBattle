import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { useTheme, ThemeName, THEME_LEVEL_REQUIREMENTS } from '../context/ThemeContext';
import { mockUser } from '../data/mockData';
import { Lock, Check, Sparkles } from 'lucide-react';
import { Layout } from '../components/Layout';

const THEME_INFO: Record<ThemeName, { name: string; description: string; preview: string[]; font: string }> = {
  cyber: {
    name: 'Cyber Arena / Neon Tournament',
    description: 'Arène e-sport futuriste avec néons cyan/violet. Fonts: Orbitron + Rajdhani',
    preview: ['#00E5FF', '#8B5CF6', '#0B1020'],
    font: 'Orbitron',
  },
  space: {
    name: 'Space Ops / Mission Control',
    description: 'Centre de contrôle spatial avec étoiles animées. Fonts: Chakra Petch + Rajdhani',
    preview: ['#22D3EE', '#E879F9', '#070A1A'],
    font: 'Chakra Petch',
  },
  samurai: {
    name: 'Samurai Dojo / Code Kata',
    description: 'Design zen minimaliste, noir encre et rouge sceau. Fonts: Noto Serif JP + Noto Sans JP',
    preview: ['#DC2626', '#D4AF37', '#0B0B0D'],
    font: 'Noto Serif JP',
  },
  pixel: {
    name: 'Pixel Arcade / 8-Bit Competitive',
    description: 'Arcade rétro avec couleurs vives saturées. Font: Press Start 2P',
    preview: ['#06FFA5', '#FF006E', '#1A1A2E'],
    font: 'Press Start 2P',
  },
  mythic: {
    name: 'Mythic RPG / Guild Quests',
    description: 'Fantasy épique avec runes violettes et or. Fonts: Cinzel + Lora',
    preview: ['#6D28D9', '#F59E0B', '#0F172A'],
    font: 'Cinzel',
  },
  sports: {
    name: 'Sports Arena',
    description: 'Stade sportif dynamique avec scoreboard style. Fonts: Teko + Barlow',
    preview: ['#2563EB', '#FBBF24', '#111827'],
    font: 'Teko',
  },
};

export function Themes() {
  const { theme: currentTheme, setTheme, userLevel, unlockedThemes } = useTheme();

  return (
    <Layout>
      <Navbar 
        isLoggedIn 
        userAvatar={mockUser.avatar} 
        username={mockUser.username} 
      />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Themes & Skins</h1>
          <p className="text-[var(--text-secondary)]">
            Unlock new themes by leveling up
          </p>
        </div>

        {/* Current Level Progress */}
        <div className="mb-8 p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3>Current Level</h3>
              <p className="text-[var(--text-muted)]">
                Keep playing to unlock more themes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[var(--brand-primary)]" />
              <span className="text-h2 font-semibold text-[var(--brand-primary)]">
                {userLevel}
              </span>
            </div>
          </div>
          
          <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)]"
              style={{ width: `${(userLevel / 100) * 100}%` }}
            />
          </div>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Object.entries(THEME_INFO) as [ThemeName, typeof THEME_INFO[ThemeName]][]).map(
            ([themeKey, info]) => {
              const requiredLevel = THEME_LEVEL_REQUIREMENTS[themeKey];
              const isUnlocked = unlockedThemes.includes(themeKey);
              const isActive = currentTheme === themeKey;

              return (
                <ThemeCard
                  key={themeKey}
                  themeKey={themeKey}
                  name={info.name}
                  description={info.description}
                  preview={info.preview}
                  requiredLevel={requiredLevel}
                  currentLevel={userLevel}
                  isUnlocked={isUnlocked}
                  isActive={isActive}
                  onActivate={() => setTheme(themeKey)}
                />
              );
            }
          )}
        </div>
      </div>
    </Layout>
  );
}

function ThemeCard({
  themeKey,
  name,
  description,
  preview,
  requiredLevel,
  currentLevel,
  isUnlocked,
  isActive,
  onActivate,
}: {
  themeKey: string;
  name: string;
  description: string;
  preview: string[];
  requiredLevel: number;
  currentLevel: number;
  isUnlocked: boolean;
  isActive: boolean;
  onActivate: () => void;
}) {
  return (
    <div
      className={`
        p-6 rounded-[var(--radius-lg)] border-2 transition-all
        ${isActive
          ? 'border-[var(--brand-primary)] bg-gradient-to-br from-[var(--brand-primary)]/10 to-[var(--brand-secondary)]/10 glow'
          : isUnlocked
          ? 'border-[var(--border-default)] bg-[var(--surface-1)] hover:border-[var(--brand-primary)]'
          : 'border-[var(--border-default)] bg-[var(--surface-1)] opacity-60'
        }
      `}
    >
      {/* Preview Colors */}
      <div className="flex gap-2 mb-4">
        {preview.map((color, i) => (
          <div
            key={i}
            className="flex-1 h-16 rounded-[var(--radius-md)]"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Theme Info */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3>{name}</h3>
          {isActive && (
            <div className="flex items-center gap-1 px-2 py-1 bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] rounded text-caption font-medium">
              <Check className="w-3 h-3" />
              Actif
            </div>
          )}
        </div>
        <p className="text-caption text-[var(--text-muted)]">{description}</p>
      </div>

      {/* Action */}
      {isUnlocked ? (
        <Button
          variant={isActive ? 'secondary' : 'primary'}
          size="md"
          className="w-full"
          onClick={onActivate}
          disabled={isActive}
        >
          {isActive ? 'Activé' : 'Activer'}
        </Button>
      ) : (
        <div className="flex items-center justify-between p-3 bg-[var(--surface-2)] rounded-[var(--radius-md)]">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Lock className="w-4 h-4" />
            <span className="text-caption">
              Niveau {requiredLevel} requis
            </span>
          </div>
          <span className="text-caption font-semibold text-[var(--text-primary)]">
            {requiredLevel - currentLevel} niveaux
          </span>
        </div>
      )}
    </div>
  );
}