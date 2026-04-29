import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { RoadmapStepList } from '../../components/company/RoadmapStepList';
import { VerificationBanner } from '../../components/company/VerificationBanner';
import { useAuth } from '../../context/AuthContext';
import { companyService, Company, CompanyRoadmap, CompanyRole } from '../../services/companyService';
import { useCurrentCompanyId } from '../../hooks/useCurrentCompanyId';
import { AlertCircle, Plus, ArrowLeft, Lock, Unlock, Users, BookOpen, Trash2, Edit } from 'lucide-react';

export function CompanyRoadmaps() {
  const { companyId: routeCompanyId } = useParams<{ companyId: string }>();
  const companyId = useCurrentCompanyId(routeCompanyId);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [roadmaps, setRoadmaps] = useState<CompanyRoadmap[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<CompanyRoadmap | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoadmap, setNewRoadmap] = useState({ title: '', description: '', visibility: 'employees_only' as const, type: 'custom' as const });

  const currentUserRole = user?.companyRole as CompanyRole || null;
  const canManage = currentUserRole === 'owner' || currentUserRole === 'recruiter';

  const fetchData = useCallback(async () => {
    const cid = companyId || routeCompanyId;
    if (!cid) return;
    setLoading(true);
    try {
      const [companyData, roadmapsData] = await Promise.all([
        companyService.getCompany(cid),
        companyService.getCompanyRoadmaps(cid),
      ]);
      setCompany(companyData);
      setRoadmaps(roadmapsData);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load roadmaps');
    } finally {
      setLoading(false);
    }
  }, [companyId, routeCompanyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateRoadmap = async () => {
    const cid = companyId || routeCompanyId;
    if (!cid || !newRoadmap.title.trim()) return;
    try {
      const created = await companyService.createRoadmap(cid, {
        ...newRoadmap,
        type: newRoadmap.type as 'platform' | 'custom',
        visibility: newRoadmap.visibility as 'public' | 'employees_only',
      });
      setRoadmaps([...roadmaps, created]);
      setIsCreating(false);
      setNewRoadmap({ title: '', description: '', visibility: 'employees_only', type: 'custom' });
    } catch (err) {
      console.error('Failed to create roadmap:', err);
    }
  };

  const handleDeleteRoadmap = async (roadmapId: string) => {
    if (!companyId || !confirm('Are you sure you want to delete this roadmap?')) return;
    try {
      await companyService.deleteRoadmap(companyId, roadmapId);
      setRoadmaps(roadmaps.filter(r => r.id !== roadmapId));
      if (selectedRoadmap?.id === roadmapId) setSelectedRoadmap(null);
    } catch (err) {
      console.error('Failed to delete roadmap:', err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[var(--surface-2)] rounded w-1/4"></div>
            <div className="h-64 bg-[var(--surface-2)] rounded-[var(--radius-lg)]"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !company) {
    return (
      <Layout>
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="w-12 h-12 text-[var(--state-error)] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Failed to load roadmaps</h2>
            <p className="text-[var(--text-secondary)] mb-4">{error || 'Unknown error'}</p>
            <Button onClick={fetchData}>Retry</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* <CompanyNavbar companyName={company.name} userName={user?.username || 'User'} userRole={currentUserRole || 'member'} /> */}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link to={`/companies/${companyId}/dashboard`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Roadmaps</h1>
            <p className="text-[var(--text-secondary)]">{roadmaps.length} roadmaps</p>
          </div>
        </div>

        <VerificationBanner companyName={company.name} verified={company.verified} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">All Roadmaps</h2>
              {canManage && (
                <Button variant="primary" size="sm" onClick={() => setIsCreating(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Create
                </Button>
              )}
            </div>

            {isCreating && (
              <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)] border border-[var(--border-default)] space-y-4">
                <Input
                  placeholder="Roadmap title"
                  value={newRoadmap.title}
                  onChange={(e) => setNewRoadmap({ ...newRoadmap, title: e.target.value })}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newRoadmap.description}
                  onChange={(e) => setNewRoadmap({ ...newRoadmap, description: e.target.value })}
                />
                <select
                  value={newRoadmap.visibility}
                  onChange={(e) => setNewRoadmap({ ...newRoadmap, visibility: e.target.value as 'public' | 'employees_only' })}
                  className="w-full px-3 py-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                >
                  <option value="employees_only">Employees Only</option>
                  <option value="public">Public</option>
                </select>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={handleCreateRoadmap} disabled={!newRoadmap.title.trim()}>
                    Create
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {roadmaps.map((roadmap) => (
                <div
                  key={roadmap.id}
                  onClick={() => setSelectedRoadmap(roadmap)}
                  className={`p-4 rounded-[var(--radius-md)] border cursor-pointer transition-colors ${
                    selectedRoadmap?.id === roadmap.id
                      ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/30'
                      : 'bg-[var(--surface-2)] border-[var(--border-default)] hover:border-[var(--brand-primary)]/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)]">{roadmap.title}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">{roadmap.challengeIds.length} challenges</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={roadmap.visibility === 'public' ? 'default' : 'secondary'}>
                        {roadmap.visibility === 'public' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      </Badge>
                      {canManage && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteRoadmap(roadmap.id); }}>
                          <Trash2 className="w-4 h-4 text-[var(--state-error)]" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {roadmaps.length === 0 && (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  No roadmaps yet. Create one to get started.
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedRoadmap ? (
              <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6">
                <RoadmapStepList
                  roadmap={selectedRoadmap}
                  currentUserId={user?.id}
                  isEditable={canManage}
                />
                {canManage && (
                  <div className="mt-6 flex gap-4">
                    <Button variant="primary">
                      <Users className="w-4 h-4 mr-2" />
                      Assign to Employees
                    </Button>
                    <Button variant="secondary">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Roadmap
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 text-center py-12">
                <BookOpen className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)]">Select a roadmap to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}