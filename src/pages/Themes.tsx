import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { useTheme, ThemeName, THEME_LEVEL_REQUIREMENTS } from '../context/ThemeContext';
import { mockUser } from '../data/mockData';
import { Lock, Check, Sparkles } from 'lucide-react';

const THEME_INFO: Record<ThemeName, { name: string; description: string; preview: string[] }> = {
  cyber: {
    name: 'Cyber Arena',
    description: 'Interface néon futuriste avec effets lumineux. Style cyberpunk high-tech.',
    preview: ['#00ffff', '#8b5cf6', '#0a0e1a'],
  },
  space: {
    name: 'Space Ops',
    description: 'Mission control spatial avec tons bleus froids. Thème astronaute pro.',
    preview: ['#06b6d4', '#3b82f6', '#020617'],
  },
  samurai: {
    name: 'Samurai Dojo',
    description: 'Design minimaliste inspiré du Japon. Noir encre, rouge et or.',
    preview: ['#dc2626', '#f59e0b', '#0a0a0a'],
  },
  pixel: {
    name: 'Pixel Arcade',
    description: 'Retour aux années 8-bit avec couleurs vives et motifs pixel art.',
    preview: ['#00ff00', '#ff00ff', '#1a0033'],
  },
  mythic: {
    name: 'Mythic RPG',
    description: 'Ambiance fantasy épique avec effets magiques et badges légendaires.',
    preview: ['#a855f7', '#f59e0b', '#0f0a1a'],
  },
  sports: {
    name: 'Sports Arena',
    description: 'Style scoreboard sportif avec contrastes nets et highlights dynamiques.',
    preview: ['#0ea5e9', '#fb923c', '#0c1618'],
  },
};

export function Themes() {
  const { theme: currentTheme, setTheme, userLevel, unlockedThemes } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar 
        isLoggedIn 
        userAvatar={mockUser.avatar} 
        username={mockUser.username} 
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-20 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Thèmes & Skins</h1>
          <p className="text-[var(--text-secondary)]">
            Débloquez de nouveaux thèmes en montant de niveau
          </p>
        </div>

        {/* Current Level Progress */}
        <div className="mb-8 p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3>Niveau Actuel</h3>
              <p className="text-[var(--text-muted)]">
                Continuez à jouer pour débloquer plus de thèmes
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
    </div>
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
