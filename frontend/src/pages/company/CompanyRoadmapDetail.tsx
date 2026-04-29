import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Layout } from '../../components/Layout';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { roadmapService, RoadmapDetail, RoadmapNode, RoadmapProgressStatus } from '../../services/roadmapService';
import { ArrowLeft, CheckCircle2, Circle, Clock, ChevronRight, Map, MessageSquare, BookOpen, Layers } from 'lucide-react';

export function CompanyRoadmapDetail() {
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState<RoadmapDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!roadmapId) return;

    setLoading(true);
    roadmapService
      .getRoadmapDetail(roadmapId)
      .then(setRoadmap)
      .catch((err: any) => setError(err?.response?.data?.message || 'Failed to load roadmap details'))
      .finally(() => setLoading(false));
  }, [roadmapId]);

  const handleToggleStatus = async (nodeId: string, currentStatus: RoadmapProgressStatus) => {
    if (!roadmapId) return;
    const newStatus = currentStatus === 'done' ? null : 'done';
    
    setUpdating(nodeId);
    try {
      await roadmapService.updateProgress(roadmapId, nodeId, newStatus);
      // Refresh detail to get updated progress map
      const updated = await roadmapService.getRoadmapDetail(roadmapId);
      setRoadmap(updated);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update progress');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-10 h-10 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full mb-4" />
          <p className="text-[var(--text-secondary)]">Loading pathway...</p>
        </div>
      </Layout>
    );
  }

  if (error || !roadmap) {
    return (
      <Layout>
        <div className="max-w-md mx-auto py-20 text-center px-4">
          <div className="w-16 h-16 bg-[var(--state-error)]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Map className="w-8 h-8 text-[var(--state-error)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Roadmap Not Found</h2>
          <p className="text-[var(--text-secondary)] mb-8">{error || "This roadmap might have been removed or you don't have access."}</p>
          <Button onClick={() => navigate('/company/roadmaps')}>Back to Roadmaps</Button>
        </div>
      </Layout>
    );
  }

  const nodes = roadmap.nodes || [];
  const progress = roadmap.progress || {};

  return (
    <Layout>
      <div className="min-h-screen bg-[var(--surface-1)]">
        <div className="px-4 py-8 sm:px-6 lg:px-10 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <button
              onClick={() => navigate('/company/roadmaps')}
              className="group inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to Roadmaps
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2.5 py-1 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-wider">
                    Learning Path
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">•</span>
                  <span className="text-xs text-[var(--text-muted)]">{nodes.length} Modules</span>
                </div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight sm:text-4xl">
                  {roadmap.title}
                </h1>
                {roadmap.description && (
                  <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                    {roadmap.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-4 bg-[var(--surface-2)] p-4 rounded-2xl border border-[var(--border-default)]">
                <div className="text-right">
                  <div className="text-xs text-[var(--text-muted)] font-medium mb-1 uppercase tracking-tight">Your Progress</div>
                  <div className="text-xl font-bold text-[var(--text-primary)]">
                    {Math.round((Object.values(progress).filter(v => v === 'done').length / nodes.length) * 100) || 0}%
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-[var(--brand-primary)] border-l-transparent animate-[spin_3s_linear_infinite]" />
              </div>
            </div>
          </div>

          {/* Modules List */}
          <div className="space-y-4">
            {nodes.map((node, index) => {
              const status = progress[node.id] || null;
              const isUpdating = updating === node.id;

              return (
                <div
                  key={node.id}
                  className={`relative group rounded-2xl border transition-all duration-300 ${
                    status === 'done'
                      ? 'bg-[var(--state-success)]/5 border-[var(--state-success)]/20'
                      : 'bg-[var(--surface-1)] border-[var(--border-default)] hover:border-[var(--brand-primary)]/30 hover:shadow-md'
                  }`}
                >
                  {/* Connection Line */}
                  {index < nodes.length - 1 && (
                    <div className="absolute left-[34px] top-[76px] bottom-[-20px] w-0.5 bg-[var(--border-default)] group-hover:bg-[var(--brand-primary)]/20 transition-colors z-0" />
                  )}

                  <div className="p-6 sm:p-8 flex items-start gap-6 relative z-10">
                    {/* Status Toggle */}
                    <button
                      onClick={() => handleToggleStatus(node.id, status)}
                      disabled={isUpdating}
                      className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 border-2 ${
                        status === 'done'
                          ? 'bg-[var(--state-success)] border-[var(--state-success)] text-white shadow-lg'
                          : 'bg-transparent border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]'
                      } ${isUpdating ? 'animate-pulse opacity-50' : ''}`}
                    >
                      {status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs font-bold uppercase tracking-widest ${
                          status === 'done' ? 'text-[var(--state-success)]' : 'text-[var(--brand-primary)]'
                        }`}>
                          Module {index + 1}
                        </span>
                        {node.type !== 'topic' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--surface-3)] text-[var(--text-secondary)] uppercase">
                            {node.type}
                          </span>
                        )}
                      </div>
                      
                      <h3 className={`text-xl font-semibold mb-2 transition-colors ${
                        status === 'done' ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)] group-hover:text-[var(--brand-primary)]'
                      }`}>
                        {node.title}
                      </h3>
                      
                      {node.description && (
                        <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                          {node.description}
                        </p>
                      )}

                      {/* Resources */}
                      {node.resources && node.resources.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {node.resources.map((res) => (
                            <a
                              key={res.id}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-3)] hover:border-[var(--brand-primary)]/30 transition-all"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                              {res.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="hidden sm:flex items-center gap-4 text-[var(--text-muted)] self-center">
                      <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {nodes.length === 0 && (
            <div className="text-center py-20 bg-[var(--surface-2)] rounded-3xl border border-dashed border-[var(--border-default)]">
              <Layers className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Pathway is Empty</h3>
              <p className="text-sm text-[var(--text-secondary)]">This roadmap doesn't have any modules yet.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}