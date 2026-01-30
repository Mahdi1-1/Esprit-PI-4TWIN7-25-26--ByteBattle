import { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Breadcrumb, FilterBar, Pagination, StatusChip } from '../../components/admin/AdminComponents';
import { Search, Plus, Edit, Eye, Archive } from 'lucide-react';

interface CanvasChallenge {
  id: string;
  title: string;
  category: 'architecture-logique' | 'architecture-physique' | 'dataflow' | 'securite';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  duration: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  submissions: number;
  avgScore: number;
}

const mockChallenges: CanvasChallenge[] = [
  {
    id: 'canvas-001',
    title: 'Chat Temps Réel WebSocket',
    category: 'architecture-logique',
    difficulty: 'medium',
    duration: 45,
    status: 'PUBLISHED',
    submissions: 234,
    avgScore: 78
  },
  {
    id: 'canvas-002',
    title: 'Système Notification Event-Driven',
    category: 'dataflow',
    difficulty: 'hard',
    duration: 60,
    status: 'PUBLISHED',
    submissions: 156,
    avgScore: 72
  },
  {
    id: 'canvas-003',
    title: 'Déploiement 3-Tiers + CDN',
    category: 'architecture-physique',
    difficulty: 'easy',
    duration: 30,
    status: 'DRAFT',
    submissions: 0,
    avgScore: 0
  }
];

export function AdminCanvasChallenges() {
  const [challenges] = useState<CanvasChallenge[]>(mockChallenges);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredChallenges = challenges.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredChallenges.length / itemsPerPage);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <Breadcrumb items={[{ label: 'Admin' }, { label: 'Canvas Challenges' }]} />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Canvas Challenges
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {filteredChallenges.length} challenges total
              </p>
            </div>
            <button className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Challenge
            </button>
          </div>
        </div>

        <FilterBar>
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search challenges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] outline-none"
          >
            <option value="all">All Categories</option>
            <option value="architecture-logique">Architecture Logique</option>
            <option value="architecture-physique">Architecture Physique</option>
            <option value="dataflow">Dataflow</option>
            <option value="securite">Sécurité</option>
          </select>
        </FilterBar>

        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--surface-2)] border-b border-[var(--border-default)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Difficulty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Submissions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {filteredChallenges.map((challenge) => (
                  <tr key={challenge.id} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                      {challenge.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {challenge.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {challenge.difficulty.toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {challenge.duration} min
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip status={challenge.status} type="problem" />
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {challenge.submissions}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 hover:bg-[var(--surface-3)] rounded transition-colors">
                          <Edit className="w-4 h-4 text-[var(--text-secondary)]" />
                        </button>
                        <button className="p-1.5 hover:bg-[var(--surface-3)] rounded transition-colors">
                          <Eye className="w-4 h-4 text-[var(--text-secondary)]" />
                        </button>
                        <button className="p-1.5 hover:bg-[var(--surface-3)] rounded transition-colors">
                          <Archive className="w-4 h-4 text-[var(--text-secondary)]" />
                        </button>
                      </div>
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
            totalItems={filteredChallenges.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
