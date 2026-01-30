import { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  StatusChip,
  FilterBar,
  Pagination,
  Breadcrumb,
  CodeViewer
} from '../../components/admin/AdminComponents';
import { submissions, Submission } from '../../data/adminData';
import { Search, Eye, X } from 'lucide-react';

export function AdminSubmissions() {
  const [submissionsList] = useState<Submission[]>(submissions);
  const [searchTerm, setSearchTerm] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const itemsPerPage = 15;

  const filteredSubmissions = submissionsList.filter((sub) => {
    const matchesSearch =
      sub.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.problemTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVerdict = verdictFilter === 'all' || sub.verdict === verdictFilter;
    const matchesLanguage = languageFilter === 'all' || sub.language === languageFilter;
    return matchesSearch && matchesVerdict && matchesLanguage;
  });

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowDrawer(true);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <Breadcrumb items={[{ label: 'Admin' }, { label: 'Submissions' }]} />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Submissions & Logs
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {filteredSubmissions.length} submissions total
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <FilterBar>
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by user, problem, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>

          {/* Verdict Filter */}
          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] outline-none"
          >
            <option value="all">All Verdicts</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="WRONG_ANSWER">Wrong Answer</option>
            <option value="TLE">Time Limit Exceeded</option>
            <option value="RUNTIME_ERROR">Runtime Error</option>
            <option value="COMPILATION_ERROR">Compilation Error</option>
            <option value="MEMORY_LIMIT">Memory Limit</option>
          </select>

          {/* Language Filter */}
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] outline-none"
          >
            <option value="all">All Languages</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
        </FilterBar>

        {/* Table */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--surface-2)] border-b border-[var(--border-default)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Problem
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Verdict
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Memory
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Language
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {paginatedSubmissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-mono text-[var(--text-muted)]">
                      {submission.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                      {submission.username}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {submission.problemTitle}
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip status={submission.verdict} type="verdict" />
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-[var(--text-primary)]">
                      {submission.timeMs}ms
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-[var(--text-primary)]">
                      {submission.memoryMb.toFixed(1)}MB
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {submission.language}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {new Date(submission.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewSubmission(submission)}
                        className="p-1.5 hover:bg-[var(--surface-3)] rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-[var(--text-secondary)]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredSubmissions.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>

      {/* Submission Details Drawer */}
      {showDrawer && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-3xl bg-[var(--surface-1)] border-l border-[var(--border-default)] overflow-y-auto">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-[var(--surface-1)] border-b border-[var(--border-default)] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Submission Details
                </h2>
                <p className="text-sm text-[var(--text-secondary)] font-mono">
                  {selectedSubmission.id}
                </p>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-2 hover:bg-[var(--surface-2)] rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">User</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {selectedSubmission.username}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Problem</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {selectedSubmission.problemTitle}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Verdict</div>
                  <StatusChip status={selectedSubmission.verdict} type="verdict" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Language</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {selectedSubmission.language}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Time</div>
                  <div className="text-sm font-mono font-medium text-[var(--text-primary)]">
                    {selectedSubmission.timeMs}ms
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Memory</div>
                  <div className="text-sm font-mono font-medium text-[var(--text-primary)]">
                    {selectedSubmission.memoryMb.toFixed(1)}MB
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Submitted At</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {new Date(selectedSubmission.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Code */}
              {selectedSubmission.code && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                    Submitted Code
                  </h3>
                  <CodeViewer
                    code={selectedSubmission.code}
                    language={selectedSubmission.language}
                    maxHeight="400px"
                  />
                </div>
              )}

              {/* Test Results Placeholder */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  Test Results
                </h3>
                <div className="space-y-2">
                  {[1, 2, 3].map((test) => (
                    <div
                      key={test}
                      className="flex items-center justify-between p-3 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg"
                    >
                      <span className="text-sm text-[var(--text-secondary)]">Test {test}</span>
                      <StatusChip
                        status={test === 1 ? 'ACCEPTED' : 'WRONG_ANSWER'}
                        type="verdict"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
