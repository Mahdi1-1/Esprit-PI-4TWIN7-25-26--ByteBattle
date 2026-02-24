import { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  StatusChip,
  MetricCard,
  Breadcrumb,
  CodeViewer
} from '../../components/admin/AdminComponents';
import { systemMetrics, jobQueue, JobQueue } from '../../data/adminData';
import { Activity, Clock, AlertTriangle, CheckCircle, RefreshCw, Eye, X } from 'lucide-react';

export function AdminMonitoring() {
  const [jobs] = useState<JobQueue[]>(jobQueue);
  const [selectedJob, setSelectedJob] = useState<JobQueue | null>(null);
  const [showJobDrawer, setShowJobDrawer] = useState(false);

  const statusCounts = {
    pending: jobs.filter((j) => j.status === 'pending').length,
    active: jobs.filter((j) => j.status === 'active').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    failed: jobs.filter((j) => j.status === 'failed').length
  };

  const handleViewJob = (job: JobQueue) => {
    setSelectedJob(job);
    setShowJobDrawer(true);
  };

  const handleRetryJob = (job: JobQueue) => {
    console.log('Retry job:', job.id);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <Breadcrumb items={[{ label: 'Admin' }, { label: 'Monitoring' }]} />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                System Monitoring
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Monitor services, jobs, and system health
              </p>
            </div>
            <button className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Services Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Services Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemMetrics.map((metric) => (
              <div
                key={metric.service}
                className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {metric.service}
                  </h3>
                  <StatusChip status={metric.status} type="service" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[var(--text-muted)]">Uptime</div>
                    <div className="text-[var(--text-primary)] font-semibold mt-0.5">
                      {metric.uptime}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--text-muted)]">Response</div>
                    <div className="text-[var(--text-primary)] font-semibold mt-0.5">
                      {metric.responseTime}ms
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--text-muted)]">Error Rate</div>
                    <div className="text-[var(--text-primary)] font-semibold mt-0.5">
                      {metric.errorRate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--text-muted)]">Last Check</div>
                    <div className="text-[var(--text-primary)] font-semibold mt-0.5">
                      {new Date(metric.lastCheck).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Job Queue Stats */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Job Queue</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Pending"
              value={statusCounts.pending}
              icon={<Clock className="w-4 h-4" />}
              color={statusCounts.pending > 20 ? 'warning' : 'default'}
            />
            <MetricCard
              title="Active"
              value={statusCounts.active}
              icon={<Activity className="w-4 h-4" />}
              color="default"
            />
            <MetricCard
              title="Completed"
              value={statusCounts.completed}
              icon={<CheckCircle className="w-4 h-4" />}
              color="success"
            />
            <MetricCard
              title="Failed"
              value={statusCounts.failed}
              icon={<AlertTriangle className="w-4 h-4" />}
              color={statusCounts.failed > 5 ? 'error' : 'default'}
            />
          </div>
        </div>

        {/* Job Queue Table */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-default)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent Jobs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--surface-2)] border-b border-[var(--border-default)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Job ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Attempts
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-[var(--text-primary)]">
                      {job.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {job.type.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip status={job.status} type="job" />
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {job.attempts}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewJob(job)}
                          className="p-1.5 hover:bg-[var(--surface-3)] rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-[var(--text-secondary)]" />
                        </button>
                        {job.status === 'failed' && (
                          <button
                            onClick={() => handleRetryJob(job)}
                            className="p-1.5 hover:bg-[var(--surface-3)] rounded transition-colors"
                            title="Retry"
                          >
                            <RefreshCw className="w-4 h-4 text-[var(--text-secondary)]" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Job Details Drawer */}
      {showJobDrawer && selectedJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-[var(--surface-1)] border-l border-[var(--border-default)] overflow-y-auto">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-[var(--surface-1)] border-b border-[var(--border-default)] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Job Details</h2>
                <p className="text-sm text-[var(--text-secondary)] font-mono">{selectedJob.id}</p>
              </div>
              <button
                onClick={() => setShowJobDrawer(false)}
                className="p-2 hover:bg-[var(--surface-2)] rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Type</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {selectedJob.type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Status</span>
                  <StatusChip status={selectedJob.status} type="job" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Attempts</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {selectedJob.attempts}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Created</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {new Date(selectedJob.createdAt).toLocaleString()}
                  </span>
                </div>
                {selectedJob.completedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Completed</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {new Date(selectedJob.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Payload */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                  Payload
                </h3>
                <CodeViewer
                  code={JSON.stringify(selectedJob.payload, null, 2)}
                  language="json"
                  maxHeight="200px"
                />
              </div>

              {/* Error */}
              {selectedJob.error && (
                <div>
                  <h3 className="text-sm font-semibold text-red-500 mb-2">Error</h3>
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-500">
                    {selectedJob.error}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {selectedJob.status === 'failed' && (
                  <button
                    onClick={() => handleRetryJob(selectedJob)}
                    className="flex-1 px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Job
                  </button>
                )}
                <button
                  onClick={() => setShowJobDrawer(false)}
                  className="flex-1 px-4 py-2 border border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
