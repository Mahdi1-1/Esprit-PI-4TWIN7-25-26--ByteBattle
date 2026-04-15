import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Breadcrumb, FilterBar, Pagination, StatusChip } from '../../components/admin/AdminComponents';
import { challengesService } from '../../services/challengesService';
import { Search, Plus, Edit, Eye, Archive, Loader } from 'lucide-react';

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

interface CanvasChallengeDraft {
  title: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  briefMd: string;
  deliverables?: string;
  rubric?: any;
  assets?: string[];
  hints?: string[];
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
  const [canvasChallenges, setCanvasChallenges] = useState<CanvasChallenge[]>(mockChallenges);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDraft, setAiDraft] = useState<CanvasChallengeDraft | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchCanvasChallenges = async () => {
      setLoading(true);
      try {
        const res = await challengesService.getAllAdmin({ kind: 'CANVAS' });
        const data = Array.isArray(res) ? res : res.data || [];
        setCanvasChallenges(data.map(mapChallengeRow));
      } catch (err) {
        console.error('Failed to load canvas challenges:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCanvasChallenges();
  }, []);

  const mapChallengeRow = (challenge: any): CanvasChallenge => ({
    id: challenge.id,
    title: challenge.title,
    category: challenge.category || 'general',
    difficulty: challenge.difficulty || 'medium',
    duration: challenge.duration || 45,
    status: (challenge.status || 'draft').toUpperCase() as CanvasChallenge['status'],
    submissions: challenge._count?.submissions || 0,
    avgScore: challenge.avgScore || 0,
  });

  const handleGenerateDraft = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Veuillez saisir un prompt pour générer un brouillon.');
      return;
    }

    setAiError(null);
    setAiLoading(true);

    try {
      const result = await challengesService.generateDraftAdmin({ prompt: aiPrompt, kind: 'CANVAS' });
      setAiDraft(result as CanvasChallengeDraft);
      toast.success('Brouillon AI généré avec succès');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Erreur lors de la génération du brouillon AI';
      setAiError(message);
      toast.error(message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateFromDraft = async () => {
    if (!aiDraft) {
      setAiError('Aucun brouillon AI disponible pour création.');
      return;
    }

    setAiError(null);
    setAiLoading(true);

    try {
      const created = await challengesService.createCanvasChallenge({
        title: aiDraft.title,
        kind: 'CANVAS',
        category: aiDraft.category || 'general',
        difficulty: aiDraft.difficulty || 'medium',
        briefMd: aiDraft.briefMd || '',
        deliverables: aiDraft.deliverables,
        rubric: aiDraft.rubric,
        assets: aiDraft.assets || [],
        hints: aiDraft.hints || [],
        status: 'draft',
      });

      setCanvasChallenges((prev) => [mapChallengeRow(created), ...prev]);
      toast.success('Challenge canvas brouillon créé');
      setAiDraft(null);
      setAiPrompt('');
      setShowAiPanel(false);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Erreur lors de la création du challenge';
      setAiError(message);
      toast.error(message);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredChallenges = canvasChallenges.filter((c) => {
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
            <button
            type="button"
            onClick={() => setShowAiPanel((prev) => !prev)}
            className="px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2"
          >
              <Plus className="w-4 h-4" />
              Générer avec AI
            </button>
          </div>
        </div>

        {showAiPanel && (
          <div className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg p-5 space-y-4">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-[var(--text-primary)]">
                Prompt AI pour le brouillon Canvas
              </label>
              <textarea
                rows={4}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Décris le contexte, les objectifs, la cible et le résultat attendu..."
                className="w-full resize-none rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
              />
              {aiError && (
                <div className="text-sm text-red-500">{aiError}</div>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleGenerateDraft}
                  disabled={aiLoading}
                  className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {aiLoading ? <><Loader className="w-4 h-4 animate-spin" /> Génération...</> : 'Générer le brouillon AI'}
                </button>
                {aiDraft && (
                  <button
                    type="button"
                    onClick={handleCreateFromDraft}
                    disabled={aiLoading}
                    className="px-4 py-2 bg-[var(--brand-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-1)] transition-colors disabled:opacity-50"
                  >
                    Enregistrer comme brouillon
                  </button>
                )}
              </div>
            </div>

            {aiDraft && (
              <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Brouillon Canvas généré</h2>
                    <p className="text-sm text-[var(--text-secondary)]">Vérifie le draft généré puis enregistre-le comme brouillon.</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Titre</h3>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">{aiDraft.title}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Difficulté</h3>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">{aiDraft.difficulty}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Catégorie</h3>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">{aiDraft.category}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Hints</h3>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">{aiDraft.hints?.join(', ') || 'Aucun'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Brève description</h3>
                  <p className="mt-2 text-sm text-[var(--text-primary)] whitespace-pre-line">{aiDraft.briefMd}</p>
                </div>
              </div>
            )}
          </div>
        )}

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
            <option value="securite">Security</option>
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