import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { XPBar } from '../components/ProgressBar';
import { ProblemCard } from '../components/ProblemCard';
import { MatchCard } from '../components/MatchCard';
import { RarityBadge } from '../components/Badge';
import { mockProblems, mockMatches } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { Swords, Play, Users, TrendingUp } from 'lucide-react';
import { Layout } from '../components/Layout';

export function Dashboard() {
  const { user } = useAuth();
  const recommendedProblems = mockProblems.slice(0, 3);
  const recentMatches = mockMatches.slice(0, 3);

  return (
    <Layout>
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-20 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome & Quick Actions */}
            <section>
              <h2 className="mb-4">Welcome, {user?.username}! 👋</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/duel/matchmaking" className="block">
                  <div className="p-6 bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer group">
                    <Swords className="w-8 h-8 text-[var(--brand-primary)] mb-3 group-hover:animate-pulse" />
                    <h3 className="mb-1">Quick Duel</h3>
                    <p className="text-caption text-[var(--text-muted)]">
                      Challenge an opponent
                    </p>
                  </div>
                </Link>

                <Link to="/problems" className="block">
                  <div className="p-6 bg-gradient-to-br from-[var(--brand-secondary)]/20 to-[var(--brand-secondary)]/5 border border-[var(--brand-secondary)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer group">
                    <Play className="w-8 h-8 text-[var(--brand-secondary)] mb-3 group-hover:animate-pulse" />
                    <h3 className="mb-1">Solo Mode</h3>
                    <p className="text-caption text-[var(--text-muted)]">
                      Solve problems
                    </p>
                  </div>
                </Link>

                <Link to="/hackathon" className="block">
                  <div className="p-6 bg-gradient-to-br from-[var(--state-info)]/20 to-[var(--state-info)]/5 border border-[var(--state-info)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer group">
                    <Users className="w-8 h-8 text-[var(--state-info)] mb-3 group-hover:animate-pulse" />
                    <h3 className="mb-1">Hackathon</h3>
                    <p className="text-caption text-[var(--text-muted)]">
                      Join a team
                    </p>
                  </div>
                </Link>
              </div>
            </section>

            {/* Recommended Problems */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2>Recommended Problems</h2>
                <Link to="/problems">
                  <Button variant="ghost" size="sm">
                    View All
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
                <h2>Recent Matches</h2>
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    History
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
                  src={user?.avatar}
                  alt={user?.username}
                  className="w-16 h-16 rounded-full border-4 border-[var(--brand-primary)] glow"
                />
                <div className="flex-1">
                  <h3 className="mb-1">{user?.username}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-caption text-[var(--text-muted)]">
                      Elo: <span className="font-semibold text-[var(--brand-primary)]">{user?.elo}</span>
                    </span>
                  </div>
                </div>
              </div>

              <XPBar 
                current={user?.currentXP || 0} 
                max={user?.maxXP || 1000} 
                level={user?.level || 1} 
              />

              <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                <Link to="/themes">
                  <Button variant="secondary" size="sm" className="w-full">
                    <TrendingUp className="w-4 h-4" />
                    Unlock new themes
                  </Button>
                </Link>
              </div>
            </div>

            {/* Skills Radar */}
            <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
              <h3 className="mb-4">Skills</h3>
              <div className="space-y-3">
                {Object.entries(user?.skills || {}).map(([skill, value]) => (
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
              <h3 className="mb-4">Recent Badges</h3>
              <div className="space-y-3">
                {user?.badges.map((badge) => (
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
    </Layout>
  );
}