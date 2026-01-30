import { Button } from '../components/Button';

export function ThemeShowcaseComponents() {
  return (
    <div className="min-h-screen p-8 bg-[var(--bg-primary)]">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-brand-text">
            ByteBattle Theme System
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Chaque thème a des formes, styles et détails visuels uniques
          </p>
        </div>

        {/* Button Showcase */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Boutons Thématiques
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Primary</h3>
              <Button variant="primary" className="w-full">
                Engage
              </Button>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Secondary</h3>
              <Button variant="secondary" className="w-full">
                Cancel
              </Button>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Ghost</h3>
              <Button variant="ghost" className="w-full">
                Details
              </Button>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Destructive</h3>
              <Button variant="destructive" className="w-full">
                Delete
              </Button>
            </div>
          </div>
        </section>

        {/* Card Showcase */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Cards Thématiques
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Card */}
            <div className="theme-card corner-brackets relative bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--brand-primary)]">
                  CHALLENGE-001
                </span>
                <span className="px-3 py-1 text-xs border border-[var(--brand-primary)] rounded-full">
                  Medium
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Two Sum Problem
              </h3>
              <p className="text-sm text-[var(--text-secondary)] line-clamp-3">
                Given an array of integers, return indices of two numbers that add up to target.
              </p>
              <div className="pt-4">
                <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-brand"
                    style={{ width: '75%' }}
                  />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Progress: 75%
                </p>
              </div>
            </div>

            {/* Card with Icon */}
            <div className="theme-card relative bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4">
              <div className="w-12 h-12 rounded-lg gradient-brand flex items-center justify-center text-2xl mb-2">
                ⚡
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Fast Execution
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Test your code against optimized benchmarks and compete for the fastest solution.
              </p>
              <Button variant="primary" size="sm" className="w-full">
                Start Challenge
              </Button>
            </div>

            {/* Stats Card */}
            <div className="theme-card corner-brackets relative bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
                YOUR STATS
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-primary)]">Challenges Solved</span>
                  <span className="text-xl font-bold text-[var(--brand-primary)]">42</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-primary)]">Win Rate</span>
                  <span className="text-xl font-bold text-[var(--state-success)]">87%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-primary)]">Rank</span>
                  <span className="text-xl font-bold gradient-brand-text">Elite</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Theme-Specific Features */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Caractéristiques Visuelles par Thème
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cyber/Space: Corner Brackets */}
            <div className="theme-card corner-brackets relative bg-[var(--surface-1)] border-[var(--border-default)] p-6">
              <h3 className="font-bold text-[var(--text-primary)] mb-2">
                Cyber & Space: Corner Brackets
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Les thèmes Cyber Arena et Space Ops utilisent des brackets de coins qui s'illuminent au survol.
              </p>
            </div>

            {/* Samurai: Top Line */}
            <div className="theme-card relative bg-[var(--surface-1)] border-[var(--border-default)] p-6">
              <h3 className="font-bold text-[var(--text-primary)] mb-2">
                Samurai: Zen Minimalism
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Le thème Samurai utilise des lignes minimales et des transitions lentes pour un effet zen.
              </p>
            </div>

            {/* Pixel: Notched Corners */}
            <div className="theme-card relative bg-[var(--surface-1)] border-[var(--border-default)] p-6">
              <h3 className="font-bold text-[var(--text-primary)] mb-2">
                Pixel: 8-bit Notches
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Le thème Pixel Arcade a des coins coupés en style 8-bit avec des ombres dures.
              </p>
            </div>

            {/* Mythic/Sports: Clipped Corners */}
            <div className="theme-card relative bg-[var(--surface-1)] border-[var(--border-default)] p-6">
              <h3 className="font-bold text-[var(--text-primary)] mb-2">
                Mythic & Sports: Clipped Corners
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Les thèmes Mythic RPG et Sports Arena utilisent des coins coupés en diagonal pour un look dynamique.
              </p>
            </div>
          </div>
        </section>

        {/* Typography Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Typographie Thématique
          </h2>
          <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-8 space-y-6">
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Font Title</p>
              <p className="font-title text-3xl text-[var(--text-primary)]">
                The Quick Brown Fox Jumps
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Font UI</p>
              <p className="font-ui text-xl text-[var(--text-primary)]">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Font Code</p>
              <p className="font-code text-sm text-[var(--brand-primary)]">
                const theme = useTheme();
              </p>
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Palette de Couleurs
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-[var(--brand-primary)]"></div>
              <p className="text-xs text-center text-[var(--text-secondary)]">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-[var(--brand-secondary)]"></div>
              <p className="text-xs text-center text-[var(--text-secondary)]">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-[var(--state-success)]"></div>
              <p className="text-xs text-center text-[var(--text-secondary)]">Success</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-[var(--state-warning)]"></div>
              <p className="text-xs text-center text-[var(--text-secondary)]">Warning</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-[var(--state-error)]"></div>
              <p className="text-xs text-center text-[var(--text-secondary)]">Error</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-[var(--state-info)]"></div>
              <p className="text-xs text-center text-[var(--text-secondary)]">Info</p>
            </div>
          </div>
        </section>

        {/* Visual Effects */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Effets Visuels
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full gradient-brand glow-pulse mb-4"></div>
              <h3 className="font-bold text-[var(--text-primary)] mb-2">Glow Pulse</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Animation de pulsation lumineuse
              </p>
            </div>
            <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 text-center">
              <div className="h-16 flex items-center justify-center mb-4">
                <span className="text-3xl gradient-brand-text font-title">BYTE</span>
              </div>
              <h3 className="font-bold text-[var(--text-primary)] mb-2">Gradient Text</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Texte avec dégradé de marque
              </p>
            </div>
            <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 text-center glow-hover">
              <div className="h-16 flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-[var(--brand-primary)]"></div>
              </div>
              <h3 className="font-bold text-[var(--text-primary)] mb-2">Hover Glow</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Effet lumineux au survol
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
