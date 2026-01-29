import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { XPBar } from '../components/ProgressBar';
import { ProblemCard } from '../components/ProblemCard';
import { MatchCard } from '../components/MatchCard';
import { RarityBadge } from '../components/Badge';
import { mockUser, mockProblems, mockMatches } from '../data/mockData';
import { Swords, Play, Users, TrendingUp } from 'lucide-react';

export function Dashboard() {
  const recommendedProblems = mockProblems.slice(0, 3);
  const recentMatches = mockMatches.slice(0, 3);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar 
        isLoggedIn 
        userAvatar={mockUser.avatar} 
        username={mockUser.username} 
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-20 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome & Quick Actions */}
            <section>
              <h2 className="mb-4">Bienvenue, {mockUser.username}! 👋</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/duel/matchmaking" className="block">
                  <div className="p-6 bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer group">
                    <Swords className="w-8 h-8 text-[var(--brand-primary)] mb-3 group-hover:animate-pulse" />
                    <h3 className="mb-1">Duel Rapide</h3>
                    <p className="text-caption text-[var(--text-muted)]">
                      Affrontez un adversaire
                    </p>
                  </div>
                </Link>

                <Link to="/problems" className="block">
                  <div className="p-6 bg-gradient-to-br from-[var(--brand-secondary)]/20 to-[var(--brand-secondary)]/5 border border-[var(--brand-secondary)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer group">
                    <Play className="w-8 h-8 text-[var(--brand-secondary)] mb-3 group-hover:animate-pulse" />
                    <h3 className="mb-1">Mode Solo</h3>
                    <p className="text-caption text-[var(--text-muted)]">
                      Résolvez des problèmes
                    </p>
                  </div>
                </Link>

                <Link to="/hackathon" className="block">
                  <div className="p-6 bg-gradient-to-br from-[var(--state-info)]/20 to-[var(--state-info)]/5 border border-[var(--state-info)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer group">
                    <Users className="w-8 h-8 text-[var(--state-info)] mb-3 group-hover:animate-pulse" />
                    <h3 className="mb-1">Hackathon</h3>
                    <p className="text-caption text-[var(--text-muted)]">
                      Rejoindre une équipe
                    </p>
                  </div>
                </Link>
              </div>
            </section>

            {/* Recommended Problems */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2>Problèmes Recommandés</h2>
                <Link to="/problems">
                  <Button variant="ghost" size="sm">
                    Voir tout
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {recommendedProblems.map((problem) => (
                  <ProblemCard key={problem.id} {...problem} />
                ))}
              </div>
            </section>

            {/* Recent Matches */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2>Matchs Récents</h2>
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    Historique
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {recentMatches.map((match) => (
                  <MatchCard key={match.id} {...match} />
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={mockUser.avatar}
                  alt={mockUser.username}
                  className="w-16 h-16 rounded-full border-4 border-[var(--brand-primary)] glow"
                />
                <div className="flex-1">
                  <h3 className="mb-1">{mockUser.username}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-caption text-[var(--text-muted)]">
                      Elo: <span className="font-semibold text-[var(--brand-primary)]">{mockUser.elo}</span>
                    </span>
                  </div>
                </div>
              </div>

              <XPBar 
                current={mockUser.currentXP} 
                max={mockUser.maxXP} 
                level={mockUser.level} 
              />

              <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                <Link to="/themes">
                  <Button variant="secondary" size="sm" className="w-full">
                    <TrendingUp className="w-4 h-4" />
                    Débloquer de nouveaux thèmes
                  </Button>
                </Link>
              </div>
            </div>

            {/* Skills Radar */}
            <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
              <h3 className="mb-4">Compétences</h3>
              <div className="space-y-3">
                {Object.entries(mockUser.skills).map(([skill, value]) => (
                  <div key={skill}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-caption text-[var(--text-secondary)]">
                        {skill.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-caption font-medium text-[var(--text-primary)]">
                        {value}%
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)]"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
              <h3 className="mb-4">Badges Récents</h3>
              <div className="space-y-3">
                {mockUser.badges.map((badge) => (
                  <div
                    key={badge.name}
                    className="flex items-start gap-3 p-3 bg-[var(--surface-2)] rounded-[var(--radius-md)]"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center glow">
                      🏆
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-[var(--text-primary)]">
                          {badge.name}
                        </span>
                        <RarityBadge rarity={badge.rarity} />
                      </div>
                      <p className="text-caption text-[var(--text-muted)]">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
