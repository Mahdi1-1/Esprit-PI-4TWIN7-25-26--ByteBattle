import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { useCurrentCompanyId } from '../../hooks/useCurrentCompanyId';
import { companyService, Company, CompanyRole, CompanyTeam } from '../../services/companyService';
import { AlertCircle, Users, ArrowLeft, Trophy, Star, Activity } from 'lucide-react';

export function CompanyTeams() {
  const { companyId: urlCompanyId } = useParams<{ companyId: string }>();
  const companyId = useCurrentCompanyId(urlCompanyId);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [teams, setTeams] = useState<CompanyTeam[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  const currentUserRole = user?.companyRole as CompanyRole || 'guest';
  const canManage = currentUserRole === 'owner';

  const fetchData = useCallback(async () => {
    if (companyId === undefined) return;
    if (!companyId) {
      setError('You are not a member of any company');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [companyData, teamsData] = await Promise.all([
        companyService.getCompany(companyId),
        companyService.getCompanyTeams(companyId),
      ]);
      setCompany(companyData);
      setTeams(teamsData);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, [companyId, urlCompanyId]);

  useEffect(() => {
    if (companyId === undefined) return;
    fetchData();
  }, [companyId, fetchData]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !companyId || !canManage) return;

    setIsCreatingTeam(true);
    setTeamError(null);

    try {
      const created = await companyService.createCompanyTeam(companyId, { 
        name: newTeamName.trim(),
        description: newTeamDesc.trim()
      });
      setTeams([...teams, created]);
      setNewTeamName('');
      setNewTeamDesc('');
    } catch (err: any) {
      setTeamError(err?.response?.data?.message || 'Failed to create team');
    } finally {
      setIsCreatingTeam(false);
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
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Failed to load teams</h2>
            <p className="text-[var(--text-secondary)] mb-4">{error || 'Unknown error'}</p>
            <Button onClick={fetchData}>Retry</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* <CompanyNavbar companyName={company.name} userName={user?.username || 'User'} userRole={currentUserRole} /> */}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link to={`/companies/${companyId}/dashboard`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Company Teams</h1>
            <p className="text-[var(--text-secondary)]">{teams.length} total teams</p>
          </div>
        </div>

        {canManage && (
          <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Create a New Team
            </h2>
            <form onSubmit={handleCreateTeam} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Team Name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  disabled={isCreatingTeam}
                  required
                />
              </div>
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Description (Optional)"
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  disabled={isCreatingTeam}
                />
              </div>
              <Button type="submit" variant="secondary" disabled={isCreatingTeam || !newTeamName.trim()}>
                {isCreatingTeam ? 'Creating...' : 'Create Team'}
              </Button>
            </form>
            {teamError && (
              <p className="text-sm text-[var(--state-error)] mt-2">{teamError}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <div key={team.id} className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 flex flex-col hover:border-[var(--brand-primary)]/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">{team.name}</h3>
                  {team.description && (
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{team.description}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-auto grid grid-cols-3 gap-4 border-t border-[var(--border-default)] pt-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-[var(--text-secondary)] mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs">Members</span>
                  </div>
                  <span className="font-semibold text-[var(--text-primary)]">{team.stats?.memberCount || 0}</span>
                </div>
                <div className="flex flex-col items-center border-l border-[var(--border-default)] pl-4">
                  <div className="flex items-center gap-1 text-[var(--state-warning)] mb-1">
                    <Trophy className="w-4 h-4" />
                    <span className="text-xs">Avg ELO</span>
                  </div>
                  <span className="font-semibold text-[var(--text-primary)]">{team.stats?.avgElo || '-'}</span>
                </div>
                <div className="flex flex-col items-center border-l border-[var(--border-default)] pl-4">
                  <div className="flex items-center gap-1 text-[var(--brand-primary)] mb-1">
                    <Star className="w-4 h-4" />
                    <span className="text-xs">Solved</span>
                  </div>
                  <span className="font-semibold text-[var(--text-primary)]">{team.stats?.totalSolved || 0}</span>
                </div>
              </div>
            </div>
          ))}

          {teams.length === 0 && (
            <div className="col-span-full text-center py-12 text-[var(--text-secondary)]">
              No teams established yet. {canManage ? 'Create the first team above!' : ''}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
