import { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Breadcrumb, StatusChip, FilterBar } from '../../components/admin/AdminComponents';
import { Search, Flag, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { reports, Report } from '../../data/adminData';

export function AdminReports() {
  const [reportsList] = useState<Report[]>(reports);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredReports = reportsList.filter((report) => {
    const matchesSearch =
      report.reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.target.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <Breadcrumb items={[{ label: 'Admin' }, { label: 'Reports' }]} />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Reports & Moderation
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {filteredReports.filter((r) => r.status === 'PENDING').length} pending reports
              </p>
            </div>
          </div>
        </div>

        <FilterBar>
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] outline-none"
          >
            <option value="all">All Types</option>
            <option value="abuse">Abuse</option>
            <option value="spam">Spam</option>
            <option value="plagiarism">Plagiarism</option>
            <option value="other">Other</option>
          </select>
        </FilterBar>

        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--surface-2)] border-b border-[var(--border-default)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Reporter
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Target
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {report.type === 'plagiarism' && <Flag className="w-4 h-4 text-red-500" />}
                        {report.type === 'abuse' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                        <span className="text-sm text-[var(--text-primary)]">{report.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{report.reporter}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{report.target}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)] max-w-xs truncate">
                      {report.reason}
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip status={report.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1.5 hover:bg-green-500/10 rounded transition-colors"
                          title="Resolve"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-red-500/10 rounded transition-colors"
                          title="Dismiss"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
