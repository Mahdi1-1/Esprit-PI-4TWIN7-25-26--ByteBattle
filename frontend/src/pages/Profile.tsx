import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { Mail, Calendar, Trophy, Target, Award, Edit2, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { AvatarManager } from '../components/Avatar/AvatarManager';
import { useAuth } from '../context/AuthContext';
import { profileService, ProfileStats as ProfileStatsResponse } from '../services/profileService';
import { Link } from 'react-router';

export function Profile() {
  const { user: authUser } = useAuth();
  const [stats, setStats] = useState<ProfileStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Fetch profile stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const data = await profileService.getProfileStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch profile stats:', error);
        setStatsError('Failed to load statistics');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Real user data fallback with default safe values
  const user = {
    username: authUser?.username || 'User',
    email: authUser?.email || '',
    bio: authUser?.bio || '',
    profileImage: authUser?.profileImage ?? null,
    joinedAt: authUser?.createdAt ? new Date(authUser.createdAt).toLocaleDateString() : 'Recently',
    level: authUser?.level || 1,
    xp: authUser?.xp || 0,
    xpToNext: 1000 * (authUser?.level || 1),
    elo: authUser?.elo || 1200,
    badges: [] as any[],
    recentActivity: [] as any[],
    stats: stats || {
      elo: 1200,
      xp: 0,
      level: 1,
      duelsWon: 0,
      duelsLost: 0,
      duelsTotal: 0,
      winRate: 0,
      challengesSolved: 0,
      discussionsCount: 0,
      commentsCount: 0,
      leaderboardPosition: 0,
      totalUsers: 0,
      joinedAt: new Date().toISOString(),
      lastLogin: null
    }
  };

  return (
    <Layout>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">

        {/* Header avec Avatar Manager intégré */}
        <div className="bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-800 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Target className="w-64 h-64 text-blue-500" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
              <h1 className="text-2xl md:text-3xl font-bold font-title text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Profil & Avatar 3D
              </h1>
            </div>

            {/* On enveloppe l'AvatarManager pour limiter sa taille et le rendre plus élégant */}
            <div className="w-full">
              <AvatarManager />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Card */}
          <div className="lg:col-span-2 space-y-8">
            {/* User Info */}
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <img
                    src={profileService.getPhotoUrl(user.profileImage, user.username)}
                    alt={user.username}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-full border-4 border-[var(--brand-primary)] object-cover bg-[var(--surface-2)]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
                    }}
                  />
                  {/* User Info */}
                  <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{user.username}</h1>
                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Joined {user.joinedAt}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    to="/settings"
                    className="px-4 py-2 border border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    Settings
                  </Link>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-secondary)]">Level</span>
                  <Target className="w-4 h-4 text-[var(--brand-primary)]" />
                </div>
                {statsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                    <span className="text-sm text-[var(--text-muted)]">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">{user.level}</div>
                    <div className="w-full bg-[var(--surface-2)] rounded-full h-2 mt-2">
                      <div
                        className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] h-2 rounded-full"
                        style={{ width: `${(user.xp / user.xpToNext) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">
                      {user.xp} / {user.xpToNext} XP
                    </div>
                  </>
                )}
              </div>

              <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-secondary)]">Elo Rating</span>
                  <Trophy className="w-4 h-4 text-[var(--brand-primary)]" />
                </div>
                {statsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                    <span className="text-sm text-[var(--text-muted)]">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-[var(--text-primary)]">{user.stats.elo}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">
                      Rank #{user.stats.leaderboardPosition || '-'} of {user.stats.totalUsers || 0}
                    </div>
                  </>
                )}
              </div>

              <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-secondary)]">Challenges Solved</span>
                  <Award className="w-4 h-4 text-[var(--brand-primary)]" />
                </div>
                {statsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                    <span className="text-sm text-[var(--text-muted)]">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-[var(--text-primary)]">{user.stats.challengesSolved}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">
                      {user.stats.winRate.toFixed(1)}% win rate
                    </div>
                  </>
                )}
              </div>

              <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-secondary)]">Duels</span>
                  <Trophy className="w-4 h-4 text-[var(--brand-primary)]" />
                </div>
                {statsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                    <span className="text-sm text-[var(--text-muted)]">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-[var(--text-primary)]">
                      {user.stats.duelsWon}W / {user.stats.duelsLost}L
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">
                      {user.stats.winRate.toFixed(1)}% win rate
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Badges */}
              <div className="lg:col-span-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Badges & Achievements</h2>
                {user.badges.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {user.badges.map((badge: any) => (
                      <div
                        key={badge.id}
                        className="p-4 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-center hover:border-[var(--brand-primary)] transition-colors"
                      >
                        <div className="text-4xl mb-2">{badge.icon}</div>
                        <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">{badge.name}</div>
                        <div className="text-xs text-[var(--text-muted)]">{badge.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-[var(--text-muted)] italic">Aucun badge obtenu pour le moment.</div>
                )}
                <Link
                  to="/achievements"
                  className="mt-4 inline-flex items-center text-sm text-[var(--brand-primary)] hover:underline"
                >
                  View all achievements →
                </Link>
              </div>

              {/* Recent Activity */}
              <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Recent Activity</h2>
                {user.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {user.recentActivity.map((activity: any, idx) => (
                      <div key={idx} className="flex items-start gap-3 pb-4 border-b border-[var(--border-default)] last:border-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center flex-shrink-0">
                          {activity.type === 'solved' && '✓'}
                          {activity.type === 'duel_won' && '⚔️'}
                          {activity.type === 'level_up' && '⬆️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--text-primary)]">
                            {activity.type === 'solved' && `Solved ${activity.problem}`}
                            {activity.type === 'duel_won' && `Won duel against ${activity.opponent}`}
                            {activity.type === 'level_up' && `Reached level ${activity.level}`}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-1">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-[var(--text-muted)] italic">Aucune activité récente.</div>
                )}
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Statistics</h2>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-1">Duels Won</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{user.stats.duelsWon}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-1">Duels Lost</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{user.stats.duelsLost}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-1">Win Rate</div>
                    <div className="text-2xl font-bold text-green-500">{user.stats.winRate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-1">Challenges Solved</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{user.stats.challengesSolved}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-1">Discussions</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{user.stats.discussionsCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-1">Comments</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{user.stats.commentsCount}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
