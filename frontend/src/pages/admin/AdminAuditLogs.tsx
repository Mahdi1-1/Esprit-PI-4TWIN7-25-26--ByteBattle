import { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Breadcrumb, FilterBar, Pagination, CodeViewer } from '../../components/admin/AdminComponents';
import { Search, FileCheck, Eye, X } from 'lucide-react';
import { auditLogs, AuditLog } from '../../data/adminData';

export function AdminAuditLogs() {
  const [logs] = useState<AuditLog[]>(auditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const itemsPerPage = 15;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewLog = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDrawer(true);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <Breadcrumb items={[{ label: 'Admin' }, { label: 'Audit Logs' }]} />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Audit Logs</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Track all administrative actions and changes
          </p>
        </div>

        <FilterBar>
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] outline-none"
          >
            <option value="all">All Actions</option>
            <option value="PROBLEM_PUBLISH">Problem Publish</option>
            <option value="USER_BAN">User Ban</option>
            <option value="USER_UNBAN">User Unban</option>
            <option value="PROBLEM_DELETE">Problem Delete</option>
          </select>
        </FilterBar>

        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--surface-2)] border-b border-[var(--border-default)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Admin
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Entity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Entity ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    IP Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                      {log.admin}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{log.entity}</td>
                    <td className="px-4 py-3 text-sm font-mono text-[var(--text-muted)]">
                      {log.entityId}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-[var(--text-muted)]">{log.ip}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewLog(log)}
                        className="p-1.5 hover:bg-[var(--surface-3)] rounded transition-colors"
                      >
                        <Eye className="w-4 h-4 text-[var(--text-secondary)]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredLogs.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>

      {/* Log Detail Drawer */}
      {showDrawer && selectedLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-[var(--surface-1)] border-l border-[var(--border-default)] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--surface-1)] border-b border-[var(--border-default)] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Audit Log Details</h2>
                <p className="text-sm text-[var(--text-secondary)] font-mono">{selectedLog.id}</p>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-2 hover:bg-[var(--surface-2)] rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Admin</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {selectedLog.admin}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Action</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {selectedLog.action}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Entity</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {selectedLog.entity}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Entity ID</div>
                  <div className="text-sm font-mono font-medium text-[var(--text-primary)]">
                    {selectedLog.entityId}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Timestamp</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">IP Address</div>
                  <div className="text-sm font-mono font-medium text-[var(--text-primary)]">
                    {selectedLog.ip}
                  </div>
                </div>
              </div>

              {selectedLog.before && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Before</h3>
                  <CodeViewer
                    code={JSON.stringify(selectedLog.before, null, 2)}
                    language="json"
                    maxHeight="200px"
                  />
                </div>
              )}

              {selectedLog.after && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">After</h3>
                  <CodeViewer
                    code={JSON.stringify(selectedLog.after, null, 2)}
                    language="json"
                    maxHeight="200px"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
