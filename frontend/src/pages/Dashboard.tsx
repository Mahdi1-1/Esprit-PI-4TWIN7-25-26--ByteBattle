import { Link } from 'react-router';
import { Button } from '../components/Button';
import { XPBar } from '../components/ProgressBar';
import { ProblemCard } from '../components/ProblemCard';
import { MatchCard } from '../components/MatchCard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Swords, Play, Users, TrendingUp, Loader } from 'lucide-react';
import { Layout } from '../components/Layout';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { profileService } from '../services/profileService';
import { BadgeGrid, BadgeData } from '../components/BadgeCard';

export function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [recommendedProblems, setRecommendedProblems] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // En attendant que ces routes backend soient créées conformément aux spécifications
        // On effectue des requêtes réelles. Si elles échouent (404), on set des tableaux vides
        const [problemsRes, matchesRes, badgesRes] = await Promise.allSettled([
          api.get('/challenges/recommended'), // Route for upcoming FR-07
          api.get('/users/me/history'), // Route for upcoming E2 - User Profile history
          api.get('/badges/user/me'),
        ]);

        if (problemsRes.status === 'fulfilled') {
          const data = problemsRes.value.data;
          // Backend may return a paginated object { data: [...] } or a plain array
          const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
          setRecommendedProblems(arr.slice(0, 3));
        }

        if (matchesRes.status === 'fulfilled') {
          const data = matchesRes.value.data;
          const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
          setRecentMatches(arr.slice(0, 3));
        }

        if (badgesRes.status === 'fulfilled') {
          const data = badgesRes.value.data;
          const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
          setBadges(arr);
        }

      } catch (error) {
        console.error('Error while loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <Layout>


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
                {loading ? (
                  <div className="flex justify-center p-8"><Loader className="animate-spin text-[var(--brand-primary)]" /></div>
                ) : recommendedProblems.length > 0 ? (
                  recommendedProblems.map((problem) => (
                    <ProblemCard
                      key={problem._id || problem.id}
                      id={problem._id || problem.id}
                      title={problem.title}
                      difficulty={problem.difficulty as any}
                      tags={problem.tags}
                      solveRate={problem.solveRate || 0}
                      avgTime={problem.avgTime || 0}
                      status={problem.status || 'new'}
                    />
                  ))
                ) : (
                  <div className="text-center p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] text-[var(--text-muted)]">
                    Aucun problème recommandé pour le moment.
                  </div>
                )}
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
                  src={profileService.getPhotoUrl(user?.profileImage, user?.username)}
                  alt={user?.username}
                  referrerPolicy="no-referrer"
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
                current={user?.xp || 0}
                max={1000 * (user?.level || 1)}
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
                {Object.entries({ Algorithm: 75, DataStructures: 60, DynamicProgramming: 45, Graph: 55, Debug: 80, CleanCode: 65 } as Record<string, number>).map(([skill, value]) => (
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
              <div className="flex items-center justify-between mb-4">
                <h3>{t('dashboard.badges')}</h3>
                {badges.length > 0 && (
                  <Link to="/profile" className="text-xs text-[var(--brand-primary)] hover:underline">
                    View all {badges.length} →
                  </Link>
                )}
              </div>
              <BadgeGrid
                badges={badges}
                size="sm"
                limit={6}
                emptyMessage="Complete challenges to earn badges!"
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}