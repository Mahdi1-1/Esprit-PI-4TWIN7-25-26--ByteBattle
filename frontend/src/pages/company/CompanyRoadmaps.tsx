import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../../components/Layout';
import { roadmapService, RoadmapSummary } from '../../services/roadmapService';
import { useAuth } from '../../context/AuthContext';
import {
  Plus,
  X,
  Map,
  Loader2,
  ArrowRight,
  Pencil,
  Layers,
  ChevronRight,
  Search,
  Filter,
  TrendingUp,
  Users,
  BookOpen,
  Zap,
  Clock,
  Star,
  BarChart3,
  Target,
  CheckCircle2,
  ArrowUpRight,
  Eye,
  EyeOff,
  Grid,
  List,
} from 'lucide-react';

const ROADMAP_DRAFT_STORAGE_KEY = 'company-roadmap-draft-id';

/* ──────────────────── Progress Ring ──────────────────── */
function ProgressRing({ pct, size = 40 }: { pct: number; size?: number }) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const color =
    pct === 100
      ? 'var(--state-success)'
      : pct >= 60
        ? 'var(--brand-primary)'
        : pct > 0
          ? 'var(--brand-secondary)'
          : 'var(--border-default)';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[var(--text-primary)]">
        {pct}%
      </span>
    </div>
  );
}

/* ──────────────────── Create Modal ──────────────────── */
function CreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (t: string, d: string) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const submit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onCreate(title.trim(), description.trim());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        ref={modalRef}
        className="relative w-full max-w-md overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] shadow-lg"
      >
        <div className="border-b border-[var(--border-default)] p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Create New Roadmap
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Design a structured learning pathway for your team
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                Title
              </label>
              <input
                autoFocus
                placeholder="e.g., Frontend Engineering Path"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--brand-primary)] focus:bg-[var(--surface-1)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                Description <span className="text-[var(--text-muted)]">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Describe what this roadmap covers and its goals..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-none rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--brand-primary)] focus:bg-[var(--surface-1)]"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-[var(--border-default)] bg-[var(--surface-2)] p-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-3)]"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!title.trim() || loading}
            className="flex-1 rounded-lg bg-[var(--brand-primary)] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              'Create Roadmap'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────── Stat Card ──────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: any;
  label: string;
  value: number | string;
  trend?: number;
}) {
  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
        </div>
        <div className="rounded-lg bg-[var(--surface-3)] p-2">
          <Icon className="h-4 w-4 text-[var(--text-secondary)]" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <TrendingUp className={`h-3 w-3 ${trend >= 0 ? 'text-[var(--state-success)]' : 'text-[var(--state-error)]'}`} />
          <span className={trend >= 0 ? 'text-[var(--state-success)]' : 'text-[var(--state-error)]'}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          <span className="text-[var(--text-muted)]">from last month</span>
        </div>
      )}
    </div>
  );
}

/* ──────────────────── Roadmap Card ──────────────────── */
function RoadmapCard({
  roadmap,
  onClick,
  canManage,
  onEdit,
}: {
  roadmap: RoadmapSummary;
  onClick: () => void;
  canManage: boolean;
  onEdit: (e: React.MouseEvent) => void;
}) {
  const pct = roadmap.completionPercentage;
  const done = Math.round((pct / 100) * roadmap.nodeCount);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] transition-all hover:border-[var(--brand-primary)]/30 hover:shadow-sm"
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {roadmap.isPublished ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--state-success)]/10 px-2 py-0.5 text-xs font-medium text-[var(--state-success)]">
                  <Eye className="h-3 w-3" />
                  Published
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]">
                  <EyeOff className="h-3 w-3" />
                  Draft
                </span>
              )}
              <span className="text-xs text-[var(--text-muted)]">
                {roadmap.nodeCount} nodes
              </span>
            </div>

            <h3 className="mb-1.5 truncate text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)]">
              {roadmap.title}
            </h3>

            {roadmap.description && (
              <p className="mb-3 line-clamp-2 text-sm text-[var(--text-secondary)]">
                {roadmap.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--state-success)]" />
                  <span className="font-medium text-[var(--text-primary)]">{done}</span>
                  <span>completed</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canManage && (
                  <button
                    onClick={onEdit}
                    className="rounded p-1 text-[var(--text-muted)] opacity-0 transition-all hover:bg-[var(--surface-3)] hover:text-[var(--brand-primary)] group-hover:opacity-100"
                    title="Edit roadmap"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                <ArrowUpRight className="h-4 w-4 text-[var(--text-muted)] transition-colors group-hover:text-[var(--brand-primary)]" />
              </div>
            </div>
          </div>

          <div className="ml-4">
            <ProgressRing pct={pct} />
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Progress</span>
            <span className="font-medium text-[var(--text-primary)]">{pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(pct, 2)}%`,
                backgroundColor: pct === 100
                  ? 'var(--state-success)'
                  : pct >= 60
                    ? 'var(--brand-primary)'
                    : 'var(--brand-secondary)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────── Empty State ──────────────────── */
function EmptyState({ canManage, onCreateClick }: { canManage: boolean; onCreateClick: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-1)] p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--surface-3)]">
        <Map className="h-6 w-6 text-[var(--text-muted)]" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
        No roadmaps yet
      </h3>
      <p className="mx-auto mb-6 max-w-md text-sm text-[var(--text-secondary)]">
        {canManage
          ? 'Create structured learning pathways to guide your team\'s development and track progress.'
          : 'Your company hasn\'t published any learning roadmaps yet.'}
      </p>
      {canManage && (
        <button
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-primary-dark)]"
        >
          <Plus className="h-4 w-4" />
          Create First Roadmap
        </button>
      )}
    </div>
  );
}

/* ──────────────────── Filter Tabs ──────────────────── */
type FilterType = 'all' | 'published' | 'drafts';

function FilterTabs({
  active,
  onChange,
  counts,
}: {
  active: FilterType;
  onChange: (f: FilterType) => void;
  counts: { all: number; published: number; drafts: number };
}) {
  const tabs: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'published', label: 'Published', count: counts.published },
    { key: 'drafts', label: 'Drafts', count: counts.drafts },
  ];

  return (
    <div className="flex gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            active === tab.key
              ? 'bg-[var(--surface-3)] text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {tab.label}
          <span className={`rounded px-1.5 py-0.5 text-xs ${
            active === tab.key
              ? 'bg-[var(--surface-1)] text-[var(--text-primary)]'
              : 'bg-[var(--surface-3)] text-[var(--text-muted)]'
          }`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ──────────────────── View Toggle ──────────────────── */
function ViewToggle({ view, onChange }: { view: 'grid' | 'list'; onChange: (v: 'grid' | 'list') => void }) {
  return (
    <div className="flex gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-1">
      <button
        onClick={() => onChange('grid')}
        className={`rounded-md p-1.5 transition-colors ${
          view === 'grid'
            ? 'bg-[var(--surface-3)] text-[var(--text-primary)]'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
        title="Grid view"
      >
        <Grid className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange('list')}
        className={`rounded-md p-1.5 transition-colors ${
          view === 'list'
            ? 'bg-[var(--surface-3)] text-[var(--text-primary)]'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
        title="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ──────────────────── Main Page ──────────────────── */
export function CompanyRoadmaps() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const canManage = user?.companyRole === 'owner' || user?.companyRole === 'recruiter';

  useEffect(() => {
    roadmapService
      .getRoadmaps()
      .then(setRoadmaps)
      .catch((e: any) => setError(e?.response?.data?.message || 'Unable to load roadmaps'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (title: string, description: string) => {
    const created = await roadmapService.createRoadmap({
      title,
      description: description || undefined,
    });
    localStorage.setItem(ROADMAP_DRAFT_STORAGE_KEY, created.id);
    navigate(`/company/roadmaps/${created.id}/build`);
  };

  const published = roadmaps.filter((r) => r.isPublished);
  const drafts = roadmaps.filter((r) => !r.isPublished);

  const filteredRoadmaps = roadmaps
    .filter((r) => {
      if (filter === 'published') return r.isPublished;
      if (filter === 'drafts') return !r.isPublished;
      return true;
    })
    .filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    });

  const avgCompletion =
    roadmaps.length > 0
      ? Math.round(roadmaps.reduce((a, r) => a + r.completionPercentage, 0) / roadmaps.length)
      : 0;

  const totalNodes = roadmaps.reduce((a, r) => a + r.nodeCount, 0);

  return (
    <Layout>
      <div className="min-h-screen bg-[var(--surface-1)]">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {/* ── Header ── */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <Map className="h-4 w-4" />
                  <span>Learning Platform</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="font-medium text-[var(--text-primary)]">Roadmaps</span>
                </div>
                <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
                  Learning Roadmaps
                </h1>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Design and manage structured learning pathways for your team
                </p>
              </div>

              {canManage && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-primary-dark)]"
                >
                  <Plus className="h-4 w-4" />
                  New Roadmap
                </button>
              )}
            </div>
          </div>

          {/* ── Stats ── */}
          {!loading && roadmaps.length > 0 && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={BookOpen}
                label="Total Roadmaps"
                value={roadmaps.length}
              />
              <StatCard
                icon={Eye}
                label="Published"
                value={published.length}
              />
              <StatCard
                icon={Layers}
                label="Total Nodes"
                value={totalNodes}
              />
              <StatCard
                icon={BarChart3}
                label="Avg Progress"
                value={`${avgCompletion}%`}
              />
            </div>
          )}

          {/* ── Toolbar ── */}
          {!loading && roadmaps.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <FilterTabs
                  active={filter}
                  onChange={setFilter}
                  counts={{
                    all: roadmaps.length,
                    published: published.length,
                    drafts: drafts.length,
                  }}
                />

                <div className="flex items-center gap-3">
                  <div className="relative flex-1 sm:max-w-[240px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      placeholder="Search roadmaps..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:bg-[var(--surface-1)]"
                    />
                  </div>
                  <ViewToggle view={view} onChange={setView} />
                </div>
              </div>
            </div>
          )}

          {/* ── Content ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
              </div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Loading roadmaps...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-[var(--state-error)]/20 bg-[var(--state-error)]/5 p-6">
              <div className="mb-3 flex items-center gap-2">
                <X className="h-5 w-5 text-[var(--state-error)]" />
                <p className="font-medium text-[var(--state-error)]">Failed to load roadmaps</p>
              </div>
              <p className="mb-4 text-sm text-[var(--text-secondary)]">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)]"
              >
                Try Again
              </button>
            </div>
          ) : roadmaps.length === 0 ? (
            <EmptyState canManage={canManage} onCreateClick={() => setShowCreate(true)} />
          ) : filteredRoadmaps.length === 0 ? (
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-8 text-center">
              <Search className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
              <p className="mb-1 font-medium text-[var(--text-primary)]">No matching roadmaps</p>
              <p className="mb-4 text-sm text-[var(--text-secondary)]">
                Try adjusting your search or filters
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
                className="rounded-lg bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)]"
              >
                Clear Filters
              </button>
            </div>
          ) : view === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRoadmaps.map((r) => (
                <RoadmapCard
                  key={r.id}
                  roadmap={r}
                  onClick={() => navigate(`/company/roadmaps/${r.id}`)}
                  canManage={canManage}
                  onEdit={(e) => {
                    e.stopPropagation();
                    navigate(`/company/roadmaps/${r.id}/build`);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRoadmaps.map((r) => (
                <div
                  key={r.id}
                  onClick={() => navigate(`/company/roadmaps/${r.id}`)}
                  className="cursor-pointer rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-4 transition-colors hover:border-[var(--brand-primary)]/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {r.title}
                        </h3>
                        {r.isPublished ? (
                          <span className="rounded-full bg-[var(--state-success)]/10 px-2 py-0.5 text-xs font-medium text-[var(--state-success)]">
                            Published
                          </span>
                        ) : (
                          <span className="rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]">
                            Draft
                          </span>
                        )}
                      </div>
                      {r.description && (
                        <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
                          {r.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-xs text-[var(--text-muted)]">
                        <span>{r.nodeCount} nodes</span>
                        <span>•</span>
                        <span>{Math.round((r.completionPercentage / 100) * r.nodeCount)} completed</span>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-4">
                      <ProgressRing pct={r.completionPercentage} size={36} />
                      <ArrowUpRight className="h-4 w-4 text-[var(--text-muted)]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Footer Spacer ── */}
          <div className="h-8" />
        </div>
      </div>

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </Layout>
  );
}