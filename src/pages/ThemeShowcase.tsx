import { useTheme } from '../context/ThemeContext';
import { Layout } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { mockUser } from '../data/mockData';
import { Button } from '../components/Button';

export function ThemeShowcase() {
  const { theme, colorScheme } = useTheme();

  return (
    <Layout>
      <Navbar 
        isLoggedIn 
        userAvatar={mockUser.avatar} 
        username={mockUser.username} 
      />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        {/* Theme Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 gradient-brand-text uppercase tracking-wider">
            {getThemeTitle(theme)}
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            {getThemeSubtitle(theme)}
          </p>
        </div>

        {/* Color Palette */}
        <section className="mb-12">
          <h2 className="mb-6">Palette de Couleurs</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <ColorSwatch color="var(--bg-primary)" label="BG Primary" />
            <ColorSwatch color="var(--surface-1)" label="Surface" />
            <ColorSwatch color="var(--brand-primary)" label="Primary" />
            <ColorSwatch color="var(--brand-secondary)" label="Secondary" />
            <ColorSwatch color="var(--state-success)" label="Success" />
            <ColorSwatch color="var(--state-error)" label="Error" />
          </div>
        </section>

        {/* Typography Showcase */}
        <section className="mb-12 p-8 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
          <h2 className="mb-6">Typographie</h2>
          <div className="space-y-4">
            <div>
              <p className="text-caption text-[var(--text-muted)] mb-2">Titre H1 (var(--font-title))</p>
              <h1 className="font-title uppercase tracking-wide">The Quick Brown Fox</h1>
            </div>
            <div>
              <p className="text-caption text-[var(--text-muted)] mb-2">Titre H2 (var(--font-title))</p>
              <h2 className="font-title">The Quick Brown Fox</h2>
            </div>
            <div>
              <p className="text-caption text-[var(--text-muted)] mb-2">Body Text (var(--font-ui))</p>
              <p className="font-ui">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
            <div>
              <p className="text-caption text-[var(--text-muted)] mb-2">Code (var(--font-code))</p>
              <code className="font-code text-[var(--brand-primary)]">
                function hello() {'{ return "world"; }'}
              </code>
            </div>
          </div>
        </section>

        {/* Components Showcase */}
        <section className="mb-12">
          <h2 className="mb-6">Composants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card Example */}
            <div className="p-6 bg-[var(--surface-1)] border-2 border-[var(--border-default)] rounded-[var(--radius-lg)] hover:border-[var(--brand-primary)] transition-all glow-hover">
              <h3 className="mb-2">Card Component</h3>
              <p className="text-[var(--text-secondary)] mb-4">
                Hover to see the glow effect
              </p>
              <Button variant="primary" size="sm">Action</Button>
            </div>

            {/* Gradient Card */}
            <div className="p-6 bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-secondary)]/10 border-2 border-[var(--brand-primary)]/30 rounded-[var(--radius-lg)]">
              <h3 className="mb-2 gradient-brand-text">Gradient Card</h3>
              <p className="text-[var(--text-secondary)] mb-4">
                With brand gradient background
              </p>
              <Button variant="secondary" size="sm">Secondary</Button>
            </div>

            {/* Stats Card */}
            <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
              <p className="text-caption text-[var(--text-muted)] mb-2">Total Battles</p>
              <p className="text-h1 gradient-brand-text font-bold">1,337</p>
              <div className="mt-4 h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div 
                  className="h-full gradient-brand"
                  style={{ width: '75%' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Effects Showcase */}
        <section className="mb-12 p-8 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
          <h2 className="mb-6">Effets Spéciaux</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] rounded-full glow-pulse" />
              <p className="text-caption text-[var(--text-muted)]">Pulsing Glow</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-[var(--surface-2)] border-2 border-[var(--brand-primary)] rounded-[var(--radius-lg)]">
                <div className="relative w-full h-full overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--brand-primary)]/30 to-transparent"
                    style={{ 
                      animation: 'shimmer 2s infinite',
                    }}
                  />
                </div>
              </div>
              <p className="text-caption text-[var(--text-muted)]">Shimmer Effect</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-[var(--surface-2)] rounded-[var(--radius-lg)] flex items-center justify-center overflow-hidden">
                <span className="text-2xl gradient-brand-text font-bold font-title">42</span>
              </div>
              <p className="text-caption text-[var(--text-muted)]">Gradient Text</p>
            </div>
          </div>
        </section>

        {/* Buttons Showcase */}
        <section className="p-8 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
          <h2 className="mb-6">Boutons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" size="lg">Primary Large</Button>
            <Button variant="primary" size="md">Primary Medium</Button>
            <Button variant="primary" size="sm">Primary Small</Button>
            <Button variant="secondary" size="md">Secondary</Button>
            <Button variant="ghost" size="md">Ghost</Button>
            <Button variant="destructive" size="md">Destructive</Button>
            <Button variant="primary" size="md" disabled>Disabled</Button>
            <Button variant="primary" size="md" loading>Loading</Button>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="text-center">
      <div 
        className="w-full h-24 rounded-[var(--radius-md)] border-2 border-[var(--border-default)] mb-2"
        style={{ backgroundColor: color }}
      />
      <p className="text-caption text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

function getThemeTitle(theme: string): string {
  const titles: Record<string, string> = {
    cyber: 'Cyber Arena',
    space: 'Space Ops',
    samurai: 'Samurai Dojo',
    pixel: 'Pixel Arcade',
    mythic: 'Mythic RPG',
    sports: 'Sports Arena',
  };
  return titles[theme] || theme;
}

function getThemeSubtitle(theme: string): string {
  const subtitles: Record<string, string> = {
    cyber: 'Neon Tournament - Arène e-sport futuriste',
    space: 'Mission Control - Centre de contrôle spatial',
    samurai: 'Code Kata - Discipline martiale du code',
    pixel: '8-Bit Competitive - Arcade rétro vibrante',
    mythic: 'Guild Quests - Fantasy épique RPG',
    sports: 'Digital Stadium - Compétition sportive',
  };
  return subtitles[theme] || '';
}
