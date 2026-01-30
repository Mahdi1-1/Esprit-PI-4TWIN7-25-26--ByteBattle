import { Layout } from '../components/Layout';
import { User, Mail, Calendar, Trophy, Target, Award, Edit2, Settings as SettingsIcon } from 'lucide-react';
import { Link } from 'react-router';

export function Profile() {
  // Mock user data
  const user = {
    username: 'AyaCode',
    email: 'aya@bytebattle.dev',
    level: 42,
    elo: 1384,
    rank: 247,
    xp: 8450,
    xpToNext: 10000,
    joinedAt: 'June 2023',
    stats: {
      problemsSolved: 156,
      totalSubmissions: 342,
      acceptanceRate: 68.5,
      duelsWon: 23,
      duelsLost: 12,
      hackathonsParticipated: 5
    },
    badges: [
      { id: 1, name: 'First Blood', icon: '🩸', description: 'Solved your first problem' },
      { id: 2, name: 'Speed Demon', icon: '⚡', description: 'Solved a problem in under 5 minutes' },
      { id: 3, name: 'Duel Master', icon: '⚔️', description: 'Won 10 duels' },
      { id: 4, name: 'Marathon Runner', icon: '🏃', description: 'Participated in 5 hackathons' }
    ],
    recentActivity: [
      { type: 'solved', problem: 'Two Sum Arena', date: '2 hours ago' },
      { type: 'duel_won', opponent: 'NovaTeam', date: '1 day ago' },
      { type: 'level_up', level: 42, date: '3 days ago' }
    ]
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{user.username[0]}</span>
              </div>
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
          </div>

          <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--text-secondary)]">Elo Rating</span>
              <Trophy className="w-4 h-4 text-[var(--brand-primary)]" />
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{user.elo}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              Rank #{user.rank}
            </div>
          </div>

          <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--text-secondary)]">Problems Solved</span>
              <Award className="w-4 h-4 text-[var(--brand-primary)]" />
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{user.stats.problemsSolved}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              {user.stats.acceptanceRate}% acceptance
            </div>
          </div>

          <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--text-secondary)]">Duels</span>
              <Trophy className="w-4 h-4 text-[var(--brand-primary)]" />
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">
              {user.stats.duelsWon}W / {user.stats.duelsLost}L
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              {((user.stats.duelsWon / (user.stats.duelsWon + user.stats.duelsLost)) * 100).toFixed(1)}% win rate
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Badges */}
          <div className="lg:col-span-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Badges & Achievements</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {user.badges.map((badge) => (
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
            <div className="space-y-4">
              {user.recentActivity.map((activity, idx) => (
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
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Total Submissions</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{user.stats.totalSubmissions}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Acceptance Rate</div>
              <div className="text-2xl font-bold text-green-500">{user.stats.acceptanceRate}%</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Problems Solved</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{user.stats.problemsSolved}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Duels Won</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{user.stats.duelsWon}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Duels Lost</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{user.stats.duelsLost}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Hackathons</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{user.stats.hackathonsParticipated}</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
