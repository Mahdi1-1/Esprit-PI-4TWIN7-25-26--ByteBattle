import { AdminLayout } from '../../components/admin/AdminLayout';
import { MetricCard, StatusChip } from '../../components/admin/AdminComponents';
import { dashboardKPIs, systemMetrics } from '../../data/adminData';
import { Clock, Activity, CheckCircle, AlertTriangle, Swords, Trophy } from 'lucide-react';

export function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Overview Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Monitor platform health and key metrics
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Submissions (24h)"
            value={dashboardKPIs.submissions24h.toLocaleString()}
            icon={<Activity className="w-4 h-4" />}
            trend={{ value: 12.5, direction: 'up' }}
          />
          <MetricCard
            title="Submissions (7d)"
            value={dashboardKPIs.submissions7d.toLocaleString()}
            icon={<Activity className="w-4 h-4" />}
          />
          <MetricCard
            title="Avg Judge Time"
            value={`${dashboardKPIs.avgJudgeTime}ms`}
            icon={<Clock className="w-4 h-4" />}
            color={dashboardKPIs.avgJudgeTime > 300 ? 'warning' : 'success'}
          />
          <MetricCard
            title="Queue Pending"
            value={dashboardKPIs.queuePending}
            icon={<AlertTriangle className="w-4 h-4" />}
            color={dashboardKPIs.queuePending > 20 ? 'warning' : 'default'}
          />
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Queue Failed"
            value={dashboardKPIs.queueFailed}
            icon={<AlertTriangle className="w-4 h-4" />}
            color={dashboardKPIs.queueFailed > 5 ? 'error' : 'default'}
          />
          <MetricCard
            title="Acceptance Rate"
            value={`${dashboardKPIs.verdictRatio.ACCEPTED.toFixed(1)}%`}
            icon={<CheckCircle className="w-4 h-4" />}
            color="success"
          />
          <MetricCard
            title="Active Duels"
            value={dashboardKPIs.activeDuels}
            icon={<Swords className="w-4 h-4" />}
          />
          <MetricCard
            title="Active Hackathons"
            value={dashboardKPIs.activeHackathons}
            icon={<Trophy className="w-4 h-4" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Verdict Breakdown */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Verdict Breakdown</h2>
            <div className="space-y-3">
              {Object.entries(dashboardKPIs.verdictRatio).map(([verdict, percentage]) => (
                <div key={verdict} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">{verdict.replace('_', ' ')}</span>
                    <span className="font-semibold text-[var(--text-primary)]">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">System Health</h2>
            <div className="space-y-4">
              {systemMetrics.map((metric) => (
                <div key={metric.service} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{metric.service}</span>
                      <StatusChip status={metric.status} type="service" />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                      <span>Uptime: {metric.uptime}%</span>
                      <span>Response: {metric.responseTime}ms</span>
                      <span>Errors: {metric.errorRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[
              {
                time: '2 min ago',
                user: 'ModTeam',
                action: 'banned user',
                target: 'SpamBot',
                type: 'warning'
              },
              {
                time: '15 min ago',
                user: 'SysAdmin',
                action: 'published problem',
                target: 'Two Sum Arena',
                type: 'success'
              },
              {
                time: '1 hour ago',
                user: 'System',
                action: 'Judge latency increased',
                target: '234ms (threshold: 200ms)',
                type: 'error'
              },
              {
                time: '2 hours ago',
                user: 'SysAdmin',
                action: 'started hackathon',
                target: 'Winter CodeFest 2026',
                type: 'info'
              }
            ].map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 pb-3 border-b border-[var(--border-default)] last:border-0">
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    activity.type === 'success'
                      ? 'bg-green-500'
                      : activity.type === 'error'
                      ? 'bg-red-500'
                      : activity.type === 'warning'
                      ? 'bg-orange-500'
                      : 'bg-blue-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)]">
                    <span className="font-medium">{activity.user}</span> {activity.action}{' '}
                    <span className="font-medium">{activity.target}</span>
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
