import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { MetricCard } from '../../components/admin/AdminComponents';
import { adminService } from '../../services/adminService';
import {
  Users, Activity, CheckCircle, AlertTriangle, Swords, Trophy,
  Loader, MessageSquare, Code2, Shield, TrendingUp, BarChart3,
  Clock, Mic, FileText, Eye, Zap, GitBranch, PieChart, RefreshCw,
  Award, Bell, Building2, Crown, Star, Brain, UsersRound,
} from 'lucide-react';

interface DashboardData {
  users: {
    total: number; active: number; banned: number; suspended: number;
    premium: number; admins: number; moderators: number; regularUsers: number;
    newToday: number; newTodayTrend: number; newThisWeek: number;
    avgLevel: number; avgXp: number; avgElo: number;
  };
  challenges: number;
  submissions: { total: number; accepted: number; acceptRate: number };
  submissions24h: number;
  submissions24hTrend: number;
  submissions7d: number;
  submissions7dTrend: number;
  verdictRatio: Record<string, number>;
  topLanguages: { language: string; count: number }[];
  duels: { total: number; active: number; completed: number };
  hackathons: { total: number; active: number; submissions: number; teams: number };
  interviews: number;
  discussions: number;
  comments: number;
  revisions: number;
  openReports: number;
  totalReports: number;
  notifications: { total: number; unread: number };
  badges: { total: number; awarded: number };
  companies: { total: number; members: number };
  aiReviews: number;
  recentActivity: { id: string; actor: string; action: string; entityType: string; entityId: string; details: any; time: string }[];
}

const VERDICT_COLORS: Record<string, string> = {
  AC: 'var(--state-success)',
  WA: 'var(--state-error)',
  TLE: 'var(--state-warning)',
  RE: '#f59e0b',
  CE: '#a855f7',
  QUEUED: 'var(--text-muted)',
};

const VERDICT_LABELS: Record<string, string> = {
  AC: 'Accepted',
  WA: 'Wrong Answer',
  TLE: 'Time Limit',
  RE: 'Runtime Error',
  CE: 'Compile Error',
  QUEUED: 'Queued',
};

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboardStats()
      .then(setData)
      .catch((err) => console.error('Failed to load dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-[var(--text-muted)]">
          Failed to load dashboard data.
        </div>
      </AdminLayout>
    );
  }

  // Defensive defaults — backend may omit some fields
  const users = data.users ?? { total: 0, active: 0, banned: 0, suspended: 0, premium: 0, admins: 0, moderators: 0, regularUsers: 0, newToday: 0, newTodayTrend: 0, newThisWeek: 0, avgLevel: 0, avgXp: 0, avgElo: 0 };
  const submissions = data.submissions ?? { total: 0, accepted: 0, acceptRate: 0 };
  const topLanguages = data.topLanguages ?? [];
  const verdictRatio = data.verdictRatio ?? {};
  const duels = data.duels ?? { total: 0, active: 0, completed: 0 };
  const hackathons = data.hackathons ?? { total: 0, active: 0, submissions: 0, teams: 0 };
  const notifications = data.notifications ?? { total: 0, unread: 0 };
  const badges = data.badges ?? { total: 0, awarded: 0 };
  const companies = data.companies ?? { total: 0, members: 0 };
  const recentActivity = data.recentActivity ?? [];
  const topLangTotal = topLanguages.reduce((s, l) => s + l.count, 0);

  return (
    <AdminLayout>
      <div className="px-6 py-8 lg:px-10 lg:py-10 space-y-8 max-w-[1600px] mx-auto">

        {/* ═══════════════ Header ═══════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--border-default)]">
          <div className="space-y-1.5">
            <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Real-time platform KPIs · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); adminService.getDashboardStats().then(setData).finally(() => setLoading(false)); }}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg
              bg-[var(--surface-1)] border border-[var(--border-default)]
              text-[var(--text-secondary)] hover:text-[var(--brand-primary)] hover:border-[var(--brand-primary)]
              transition-all duration-200 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* ═══════════════ Row 1: Primary KPIs ═══════════════ */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] pl-1">
            Key Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-5">
            <MetricCard
              title="Total Users"
              value={users.total.toLocaleString()}
              icon={<Users className="w-4 h-4" />}
            />
            <MetricCard
              title="New Today"
              value={users.newToday}
              icon={<TrendingUp className="w-4 h-4" />}
              trend={users.newTodayTrend !== 0 ? { value: Math.abs(users.newTodayTrend), direction: users.newTodayTrend >= 0 ? 'up' : 'down' } : undefined}
            />
            <MetricCard
              title="Submissions 24h"
              value={(data.submissions24h ?? 0).toLocaleString()}
              icon={<Activity className="w-4 h-4" />}
              trend={(data.submissions24hTrend ?? 0) !== 0 ? { value: Math.abs(data.submissions24hTrend ?? 0), direction: (data.submissions24hTrend ?? 0) >= 0 ? 'up' : 'down' } : undefined}
            />
            <MetricCard
              title="Submissions 7d"
              value={(data.submissions7d ?? 0).toLocaleString()}
              icon={<BarChart3 className="w-4 h-4" />}
              trend={(data.submissions7dTrend ?? 0) !== 0 ? { value: Math.abs(data.submissions7dTrend ?? 0), direction: (data.submissions7dTrend ?? 0) >= 0 ? 'up' : 'down' } : undefined}
            />
            <MetricCard
              title="Accept Rate"
              value={`${submissions.acceptRate}%`}
              icon={<CheckCircle className="w-4 h-4" />}
              color={submissions.acceptRate > 40 ? 'success' : submissions.acceptRate > 20 ? 'warning' : 'error'}
            />
            <MetricCard
              title="Open Reports"
              value={data.openReports ?? 0}
              icon={<AlertTriangle className="w-4 h-4" />}
              color={(data.openReports ?? 0) > 10 ? 'error' : (data.openReports ?? 0) > 3 ? 'warning' : 'default'}
            />
          </div>
        </section>

        {/* ═══════════════ Row 2: Live Activity ═══════════════ */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] pl-1">
            Live Activity
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 lg:gap-4">
            {[
              { label: 'Active Users', value: users.active, icon: <Users className="w-4 h-4" />, color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Banned', value: users.banned, icon: <Shield className="w-4 h-4" />, color: 'text-red-400', bg: 'bg-red-500/10' },
              { label: 'Challenges', value: data.challenges ?? 0, icon: <Code2 className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Active Duels', value: duels.active, icon: <Swords className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Hackathons', value: hackathons.active, icon: <Trophy className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { label: 'Interviews', value: data.interviews ?? 0, icon: <Mic className="w-4 h-4" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              { label: 'Discussions', value: data.discussions ?? 0, icon: <MessageSquare className="w-4 h-4" />, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              { label: 'Unread Notifs', value: notifications.unread, icon: <Bell className="w-4 h-4" />, color: 'text-rose-400', bg: 'bg-rose-500/10' },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-4 flex flex-col items-center gap-2.5 text-center
                  hover:border-[var(--brand-primary)]/30 transition-colors duration-200"
              >
                <div className={`w-9 h-9 rounded-lg ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                  {item.icon}
                </div>
                <div className="space-y-0.5">
                  <div className="text-xl font-bold text-[var(--text-primary)] leading-none tabular-nums">
                    {(item.value ?? 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    {item.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════ Row 3: Analytics ═══════════════ */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] pl-1">
            Analytics
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">

            {/* Verdict Breakdown */}
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center">
                  <PieChart className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                </div>
                Verdict Distribution
              </h3>
              <div className="space-y-4">
                {Object.entries(verdictRatio)
                  .filter(([, v]) => v > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([verdict, pct]) => (
                  <div key={verdict} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: VERDICT_COLORS[verdict] || 'var(--text-muted)' }} />
                        <span className="text-[var(--text-secondary)] font-medium">{VERDICT_LABELS[verdict] || verdict}</span>
                      </div>
                      <span className="font-mono font-bold text-[var(--text-primary)]">{pct}%</span>
                    </div>
                    <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: VERDICT_COLORS[verdict] || 'var(--text-muted)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-[var(--border-default)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>Total submissions</span>
                <span className="font-bold text-[var(--text-primary)] tabular-nums">{submissions.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Top Languages */}
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center">
                  <GitBranch className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                </div>
                Top Languages
              </h3>
              <div className="space-y-4">
                {topLanguages.map((lang, idx) => {
                  const pct = topLangTotal > 0 ? Math.round((lang.count / topLangTotal) * 100) : 0;
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                  return (
                    <div key={lang.language} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: colors[idx % colors.length] }}
                          />
                          <span className="font-medium text-[var(--text-primary)] capitalize">{lang.language}</span>
                        </div>
                        <span className="text-[var(--text-muted)] tabular-nums">{lang.count.toLocaleString()} <span className="opacity-60">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${pct}%`, backgroundColor: colors[idx % colors.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {topLanguages.length === 0 && (
                <p className="text-xs text-[var(--text-muted)] text-center py-8">No submissions yet</p>
              )}
            </div>

            {/* User Breakdown */}
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center">
                  <UsersRound className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                </div>
                User Breakdown
              </h3>
              {/* Role distribution */}
              <div className="space-y-3 mb-5">
                {[
                  { label: 'Admins', value: users.admins ?? 0, color: '#ef4444' },
                  { label: 'Moderators', value: users.moderators ?? 0, color: '#f59e0b' },
                  { label: 'Regular Users', value: users.regularUsers ?? 0, color: '#3b82f6' },
                  { label: 'Premium', value: users.premium ?? 0, color: '#8b5cf6' },
                  { label: 'Suspended', value: users.suspended ?? 0, color: '#6b7280' },
                ].map((item) => {
                  const pctVal = users.total > 0 ? Math.round((item.value / users.total) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-[var(--text-secondary)] font-medium">{item.label}</span>
                        </div>
                        <span className="font-mono font-bold text-[var(--text-primary)]">{item.value} <span className="font-normal text-[var(--text-muted)]">({pctVal}%)</span></span>
                      </div>
                      <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pctVal}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Averages */}
              <div className="pt-4 border-t border-[var(--border-default)] grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{users.avgLevel ?? 0}</div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Avg Level</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{(users.avgXp ?? 0).toLocaleString()}</div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Avg XP</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{users.avgElo ?? 0}</div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Avg Elo</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ Row 4: Platform Overview ═══════════════ */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] pl-1">
            Platform Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">

            {/* Duels & Hackathons */}
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center">
                  <Swords className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                </div>
                Duels & Hackathons
              </h3>
              <div className="space-y-1">
                {[
                  { label: 'Total Duels', value: duels.total, sub: `${duels.completed} completed` },
                  { label: 'Total Hackathons', value: hackathons.total, sub: `${hackathons.active} active` },
                  { label: 'Hackathon Teams', value: hackathons.teams ?? 0, sub: 'registered' },
                  { label: 'Hackathon Subs', value: hackathons.submissions ?? 0, sub: 'submitted' },
                ].map((item, idx, arr) => (
                  <div key={item.label} className={`flex items-center justify-between py-3 px-1 ${idx < arr.length - 1 ? 'border-b border-[var(--border-default)]' : ''}`}>
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-[var(--text-secondary)]">{item.label}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{item.sub}</div>
                    </div>
                    <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{(item.value ?? 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Community */}
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                </div>
                Community
              </h3>
              <div className="space-y-1">
                {[
                  { label: 'Discussions', value: data.discussions ?? 0, sub: `${data.revisions ?? 0} revisions` },
                  { label: 'Comments', value: data.comments ?? 0, sub: 'total' },
                  { label: 'AI Interviews', value: data.interviews ?? 0, sub: 'sessions' },
                  { label: 'AI Reviews', value: data.aiReviews ?? 0, sub: 'code reviews' },
                ].map((item, idx, arr) => (
                  <div key={item.label} className={`flex items-center justify-between py-3 px-1 ${idx < arr.length - 1 ? 'border-b border-[var(--border-default)]' : ''}`}>
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-[var(--text-secondary)]">{item.label}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{item.sub}</div>
                    </div>
                    <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{(item.value ?? 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges & Rewards */}
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                </div>
                Badges & Rewards
              </h3>
              <div className="space-y-1">
                {[
                  { label: 'Badge Types', value: badges.total, sub: 'defined' },
                  { label: 'Badges Awarded', value: badges.awarded, sub: 'total earned' },
                  { label: 'Premium Users', value: users.premium ?? 0, sub: 'subscribers' },
                  { label: 'New Users (7d)', value: users.newThisWeek, sub: 'registrations' },
                ].map((item, idx, arr) => (
                  <div key={item.label} className={`flex items-center justify-between py-3 px-1 ${idx < arr.length - 1 ? 'border-b border-[var(--border-default)]' : ''}`}>
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-[var(--text-secondary)]">{item.label}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{item.sub}</div>
                    </div>
                    <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{(item.value ?? 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* System & Reports */}
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center">
                  <Eye className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                </div>
                System & Reports
              </h3>
              <div className="space-y-1">
                {[
                  { label: 'Open Reports', value: data.openReports ?? 0, sub: `of ${data.totalReports ?? 0} total` },
                  { label: 'Notifications Sent', value: notifications.total, sub: `${notifications.unread} unread` },
                  { label: 'Companies', value: companies.total, sub: `${companies.members} members` },
                  { label: 'Accepted Subs', value: submissions.accepted, sub: `of ${submissions.total}` },
                ].map((item, idx, arr) => (
                  <div key={item.label} className={`flex items-center justify-between py-3 px-1 ${idx < arr.length - 1 ? 'border-b border-[var(--border-default)]' : ''}`}>
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-[var(--text-secondary)]">{item.label}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{item.sub}</div>
                    </div>
                    <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{(item.value ?? 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ Row 4: Recent Audit Activity ═══════════════ */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] pl-1">
            Audit Trail
          </h2>
          <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2.5 mb-5">
              <div className="w-7 h-7 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              </div>
              Recent Activity
            </h3>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-10">No recent activity</p>
            ) : (
              <div className="space-y-1">
                {recentActivity.map((item, idx) => {
                  const actionColors: Record<string, string> = {
                    USER_ROLE_CHANGED: 'bg-amber-500',
                    USER_BANNED: 'bg-red-500',
                    CHALLENGE_CREATED: 'bg-green-500',
                    REPORT_RESOLVED: 'bg-blue-500',
                  };
                  const dotColor = Object.entries(actionColors).find(([k]) => item.action.includes(k))?.[1] || 'bg-[var(--text-muted)]';

                  return (
                    <div
                      key={item.id}
                      className={`flex items-start gap-4 py-3.5 px-2 rounded-lg hover:bg-[var(--surface-2)]/50 transition-colors duration-150 ${idx < recentActivity.length - 1 ? 'border-b border-[var(--border-default)]' : ''}`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                          <span className="font-semibold">{item.actor}</span>
                          {' '}
                          <span className="text-[var(--text-secondary)]">{item.action.toLowerCase().replace(/_/g, ' ')}</span>
                          {' '}
                          <span className="text-[var(--text-muted)]">on {item.entityType}</span>
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1">{relativeTime(item.time)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

      </div>
    </AdminLayout>
  );
}
