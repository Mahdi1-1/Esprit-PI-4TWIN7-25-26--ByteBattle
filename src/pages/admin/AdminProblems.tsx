import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  StatusChip,
  FilterBar,
  Pagination,
  EmptyState,
  Breadcrumb
} from '../../components/admin/AdminComponents';
import { problems, Problem } from '../../data/adminData';
import { Search, Plus, Edit, Copy, Archive, Eye, MoreVertical } from 'lucide-react';

export function AdminProblems() {
  const navigate = useNavigate();
  const [problemsList] = useState<Problem[]>(problems);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const itemsPerPage = 10;

  const filteredProblems = problemsList.filter((problem) => {
    const matchesSearch =
      problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      problem.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      problem.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDifficulty = difficultyFilter === 'all' || problem.difficulty === difficultyFilter;
    const matchesStatus = statusFilter === 'all' || problem.status === statusFilter;
    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProblems.length / itemsPerPage);
  const paginatedProblems = filteredProblems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-500';
      case 'medium':
        return 'text-orange-500';
      case 'hard':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <Breadcrumb items={[{ label: 'Admin' }, { label: 'Problems' }]} />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Problems Management
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {filteredProblems.length} problems total
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/problems/new')}
              className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Problem
            </button>
          </div>
        </div>

        {/* Filters */}
        <FilterBar>
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by title, slug, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>

          {/* Difficulty Filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] outline-none"
          >
            <option value="all">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </FilterBar>

        {/* Table */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--surface-2)] border-b border-[var(--border-default)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Limits
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {paginatedProblems.map((problem) => (
                  <tr
                    key={problem.id}
                    className="hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {problem.title}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] font-mono">
                          {problem.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {problem.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-[var(--surface-3)] text-[var(--text-secondary)] rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {problem.tags.length > 2 && (
                          <span className="px-2 py-0.5 text-xs text-[var(--text-muted)]">
                            +{problem.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-[var(--text-secondary)] space-y-0.5">
                        <div>Time: {problem.timeLimit}ms</div>
                        <div>Mem: {problem.memoryLimit}MB</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip status={problem.status} type="problem" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-[var(--text-secondary)] space-y-0.5">
                        <div>{problem.submissions.toLocaleString()} submissions</div>
                        <div className="text-green-500">{problem.acceptanceRate.toFixed(1)}% accepted</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/problems/${problem.id}/edit`)}
                          className="p-1.5 hover:bg-[var(--surface-3)] rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-[var(--text-secondary)]" />
                        </button>
                        <button
                          onClick={() => navigate(`/problem/${problem.slug}`)}
                          className="p-1.5 hover:bg-[var(--surface-3)] rounded transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4 text-[var(--text-secondary)]" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowActionMenu(
                                showActionMenu === problem.id ? null : problem.id
                              )
                            }
                            className="p-1.5 hover:bg-[var(--surface-3)] rounded transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-[var(--text-secondary)]" />
                          </button>
                          {showActionMenu === problem.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg shadow-lg z-10">
                              <button
                                onClick={() => setShowActionMenu(null)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-2)] flex items-center gap-2 text-[var(--text-secondary)]"
                              >
                                <Copy className="w-4 h-4" />
                                Duplicate
                              </button>
                              <button
                                onClick={() => setShowActionMenu(null)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-2)] flex items-center gap-2 text-[var(--text-secondary)]"
                              >
                                <Archive className="w-4 h-4" />
                                {problem.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
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
            totalItems={filteredProblems.length}
            itemsPerPage={itemsPerPage}
          />
        </div>

        {/* Empty State */}
        {paginatedProblems.length === 0 && (
          <EmptyState
            icon="🔍"
            title="No problems found"
            description="Try adjusting your search or filter criteria"
            action={{
              label: 'Create Problem',
              onClick: () => navigate('/admin/problems/new')
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
