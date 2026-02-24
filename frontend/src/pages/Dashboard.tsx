import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { XPBar } from '../components/ProgressBar';
import { ProblemCard } from '../components/ProblemCard';
import { MatchCard } from '../components/MatchCard';
import { RarityBadge } from '../components/Badge';
import { mockProblems, mockMatches } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Swords, Play, Users, TrendingUp } from 'lucide-react';
import { Layout } from '../components/Layout';

export function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const recommendedProblems = mockProblems.slice(0, 3);
  const recentMatches = mockMatches.slice(0, 3);

  return (
    <Layout>
      <Navbar />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome & Quick Actions */}
            <section>
              <h2 className="mb-4">{t('dashboard.welcome')}, {user?.username}! 👋</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/duel/matchmaking" className="block">
                  <div className="p-6 bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer group">
                    <Swords className="w-8 h-8 text-[var(--brand-primary)] mb-3 group-hover:animate-pulse" />
                    <h3 className="mb-1">{t('dashboard.quickduel')}</h3>
                    <p className="text-caption text-[var(--text-muted)]">
                      {t('dashboard.quickduel.desc')}
                    </p>
                  </div>
                </Link>

                <Link to="/problems" className="block">
                  <div className="p-6 bg-gradient-to-br from-[var(--brand-secondary)]/20 to-[var(--brand-secondary)]/5 border border-[var(--brand-secondary)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer group">
                    <Play className="w-8 h-8 text-[var(--brand-secondary)] mb-3 group-hover:animate-pulse" />
                    <h3 className="mb-1">{t('dashboard.solo')}</h3>
                    <p className="text-caption text-[var(--text-muted)]">
                      {t('dashboard.solo.desc')}
                    </p>
                  </div>
                </Link>

                <Link to="/hackathon" className="block">
                  <div className="p-6 bg-gradient-to-br from-[var(--state-info)]/20 to-[var(--state-info)]/5 border border-[var(--state-info)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer group">
                    <Users className="w-8 h-8 text-[var(--state-info)] mb-3 group-hover:animate-pulse" />
                    <h3 className="mb-1">{t('dashboard.hackathon')}</h3>
                    <p className="text-caption text-[var(--text-muted)]">
                      {t('dashboard.hackathon.desc')}
                    </p>
                  </div>
                </Link>
              </div>
            </section>

            {/* Recommended Problems */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2>{t('dashboard.recommended')}</h2>
                <Link to="/problems">
                  <Button variant="ghost" size="sm">
                    {t('dashboard.viewall')}
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {recommendedProblems.map((problem) => (
                  <ProblemCard 
                    // @ts-ignore
                    key={problem.id}
                    id={problem.id}
                    title={problem.title}
                    difficulty={problem.difficulty as any}
                    tags={problem.tags}
                    solveRate={problem.solveRate}
                    avgTime={problem.avgTime}
                    status={problem.status as any} 
                  />
                ))}
              </div>
            </section>

            {/* Recent Matches */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2>{t('dashboard.recent')}</h2>
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    {t('dashboard.history')}
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {recentMatches.map((match) => (
                  <MatchCard 
                    // @ts-ignore
                    key={match.id}
                    opponent={match.opponent}
                    opponentAvatar={match.opponentAvatar}
                    result={match.result as any}
                    eloDelta={match.eloDelta}
                    problem={match.problem}
                    duration={match.duration}
                    date={match.date}
                  />
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
                    {t('dashboard.unlock')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Skills Radar */}
            <div className="p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
              <h3 className="mb-4">{t('dashboard.skills')}</h3>
              <div className="space-y-3">
                {user?.skills && Object.entries(user.skills).map(([skill, value]) => (
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
              <h3 className="mb-4">{t('dashboard.badges')}</h3>
              <div className="space-y-3">
                {user?.badges && user.badges.map((badge) => (
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