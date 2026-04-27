import { AdminLayout } from '../../components/admin/AdminLayout';
import { Breadcrumb, MetricCard } from '../../components/admin/AdminComponents';
import { Shield, AlertTriangle, Users, Code, Eye } from 'lucide-react';

export function AdminAnticheat() {
  const stats = {
    suspiciousSubmissions: 12,
    plagiarismDetected: 5,
    focusViolations: 23,
    bannedUsers: 3
  };

  const suspiciousUsers = [
    { username: 'NovaTeam', similarity: 89, submissions: 3, flagged: true },
    { username: 'CodeCopy', similarity: 95, submissions: 2, flagged: true },
    { username: 'TestUser', similarity: 76, submissions: 1, flagged: false }
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <Breadcrumb items={[{ label: 'Admin' }, { label: 'Anti-cheat' }]} />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Anti-cheat Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)]">Monitor suspicious activity and plagiarism</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Suspicious Submissions"
            value={stats.suspiciousSubmissions}
            icon={<AlertTriangle className="w-4 h-4" />}
            color={stats.suspiciousSubmissions > 10 ? 'warning' : 'default'}
          />
          <MetricCard
            title="Plagiarism Detected"
            value={stats.plagiarismDetected}
            icon={<Code className="w-4 h-4" />}
            color={stats.plagiarismDetected > 0 ? 'error' : 'default'}
          />
          <MetricCard
            title="Focus Violations"
            value={stats.focusViolations}
            icon={<Eye className="w-4 h-4" />}
            color="warning"
          />
          <MetricCard
            title="Banned Users"
            value={stats.bannedUsers}
            icon={<Users className="w-4 h-4" />}
          />
        </div>

        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Plagiarism Detection</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--surface-2)] border-b border-[var(--border-default)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Similarity Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Submissions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {suspiciousUsers.map((user) => (
                  <tr key={user.username} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                      {user.username}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[200px] h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              user.similarity > 85
                                ? 'bg-red-500'
                                : user.similarity > 70
                                ? 'bg-orange-500'
                                : 'bg-yellow-500'
                            }`}
                            style={{ width: `${user.similarity}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          {user.similarity}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{user.submissions}</td>
                    <td className="px-4 py-3">
                      {user.flagged ? (
                        <span className="px-2 py-0.5 text-xs bg-red-500/10 text-red-500 border border-red-500/30 rounded">
                          FLAGGED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs bg-gray-500/10 text-gray-500 border border-gray-500/30 rounded">
                          MONITORING
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1 text-xs border border-[var(--border-default)] rounded hover:bg-[var(--surface-2)] transition-colors">
                          View Comparison
                        </button>
                        <button className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                          Flag
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Focus Tracking</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Users with excessive tab switches during challenges
          </p>
          <div className="text-sm text-[var(--text-muted)]">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-center">Focus tracking data will appear here</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
