import { useState, useEffect } from 'react';
import { SearchInput, Select } from '../components/Input';
import { ProblemCard } from '../components/ProblemCard';

import { Filter, Loader } from 'lucide-react';
import { Layout } from '../components/Layout';
import { challengesService } from '../services/challengesService';

export function Problems() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [status, setStatus] = useState('all');
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchChallenges = async () => {
      setLoading(true);
      try {
        const params: any = { page, limit: 20, status: 'published', kind: 'CODE' };
        if (difficulty !== 'all') params.difficulty = difficulty;
        if (search) params.search = search;
        const result = await challengesService.getAll(params);
        setChallenges(result.data);
        setTotal(result.total);
      } catch (error) {
        console.error('Failed to load challenges:', error);
        setChallenges([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, [page, difficulty, search]);

  const filteredProblems = challenges;
  const displayProblems = filteredProblems.filter((problem: any) => {
    const matchesSearch = !search || problem.title?.toLowerCase().includes(search.toLowerCase()) ||
      (problem.tags || []).some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesDifficulty = difficulty === 'all' || problem.difficulty === difficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <Layout>
      
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Problem Catalog</h1>
          <p className="text-[var(--text-secondary)]">
            {total} problems available to improve your skills
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-[var(--text-muted)]" />
            <h3>Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SearchInput
              label="Search"
              placeholder="Search by title or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select
              label="Difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              options={[
                { value: 'all', label: 'All' },
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' },
              ]}
            />

            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All' },
                { value: 'new', label: 'New' },
                { value: 'attempted', label: 'Attempted' },
                { value: 'solved', label: 'Solved' },
              ]}
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Problems"
            value={total}
            color="var(--state-success)"
          />
          <StatCard
            label="Showing"
            value={displayProblems.length}
            total={total}
            color="var(--state-warning)"
          />
          <StatCard
            label="Page"
            value={page}
            total={Math.ceil(total / 20)}
            color="var(--text-muted)"
          />
          <StatCard
            label="Filters Active"
            value={(difficulty !== 'all' ? 1 : 0) + (search ? 1 : 0)}
            color="var(--brand-primary)"
          />
        </div>

        {/* Problems List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
          </div>
        ) : displayProblems.length > 0 ? (
          <div className="space-y-3">
            {displayProblems.map((problem: any) => (
              <ProblemCard key={problem.id} {...problem} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[var(--text-muted)]">
              No problems match your search criteria.
            </p>
          </div>
        )}

        {/* Pagination */}
        {displayProblems.length > 0 && total > 20 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-[var(--text-muted)]">Page {page} of {Math.ceil(total / 20)}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 20)}
              className="px-4 py-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({
  label,
  value,
  total,
  suffix = '',
  color
}: {
  label: string;
  value: number;
  total?: number;
  suffix?: string;
  color: string;
}) {
  return (
    <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
      <p className="text-caption text-[var(--text-muted)] mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-h2 font-semibold" style={{ color }}>
          {value}{suffix}
        </span>
        {total && (
          <span className="text-[var(--text-muted)]">/ {total}</span>
        )}
      </div>
    </div>
  );
}