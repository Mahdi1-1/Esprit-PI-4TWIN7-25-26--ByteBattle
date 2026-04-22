import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { EmployeeTable } from '../../components/company/EmployeeTable';
import { VerificationBanner } from '../../components/company/VerificationBanner';
import { useAuth } from '../../context/AuthContext';
import { useCurrentCompanyId } from '../../hooks/useCurrentCompanyId';
import { companyService, Company, CompanyMember, CompanyRole, CompanyTeam } from '../../services/companyService';
import { AlertCircle, UserPlus, Search, ArrowLeft, Users } from 'lucide-react';


export function CompanyMembers() {
  const { companyId: urlCompanyId } = useParams<{ companyId: string }>();
  const companyId = useCurrentCompanyId(urlCompanyId);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [teams, setTeams] = useState<CompanyTeam[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [newTeamName, setNewTeamName] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  const currentUserRole = user?.companyRole as CompanyRole || null;
  const canInvite = currentUserRole === 'owner' || currentUserRole === 'recruiter';
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
      const [companyData, membersData, teamsData] = await Promise.all([
        companyService.getCompany(companyId),
        companyService.getCompanyMembers(companyId),
        companyService.getCompanyTeams(companyId),
      ]);
      setCompany(companyData);
      setMembers(membersData);
      setTeams(teamsData);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [companyId, urlCompanyId]);

  useEffect(() => {
    if (companyId === undefined) return;
    fetchData();
  }, [companyId, fetchData]);

  const handleMemberRemoved = (memberId: string) => {
    setMembers(members.filter(m => m.id !== memberId));
  };

  const handleRoleChanged = (memberId: string, newRole: CompanyRole) => {
    setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
  };

  const handleTeamAssigned = (memberId: string, teamId: string | null) => {
    setMembers(members.map(m => {
      if (m.id === memberId) {
        const team = teams.find(t => t.id === teamId);
        return { ...m, teamId: teamId || undefined, team };
      }
      return m;
    }));
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !companyId || !canManage) return;

    setIsCreatingTeam(true);
    setTeamError(null);

    try {
      const created = await companyService.createCompanyTeam(companyId, { name: newTeamName.trim() });
      setTeams([...teams, created]);
      setNewTeamName('');
    } catch (err: any) {
      setTeamError(err?.response?.data?.message || 'Failed to create team');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !companyId) return;
    
    setIsInviting(true);
    setInviteError(null);
    
    try {
      await companyService.inviteMember(companyId, inviteEmail.trim());
      setInviteEmail('');
      alert('Invitation sent successfully!');
    } catch (err: any) {
      setInviteError(err?.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
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
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Failed to load members</h2>
            <p className="text-[var(--text-secondary)] mb-4">{error || 'Unknown error'}</p>
            <Button onClick={fetchData}>Retry</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const activeMembers = members.filter(m => m.status === 'active');

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
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Company Members</h1>
            <p className="text-[var(--text-secondary)]">{activeMembers.length} members</p>
          </div>
        </div>

        <VerificationBanner 
          companyName={company.name}
          verified={company.verified}
        />

        {canInvite && (
          <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Invite New Members
            </h2>
            <form onSubmit={handleInvite} className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={isInviting}
                />
              </div>
              <Button type="submit" variant="primary" disabled={isInviting || !inviteEmail.trim()}>
                {isInviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </form>
            {inviteError && (
              <p className="text-sm text-[var(--state-error)] mt-2">{inviteError}</p>
            )}
          </div>
        )}

        {canManage && (
          <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Create a New Team
            </h2>
            <form onSubmit={handleCreateTeam} className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="E.g. Frontend Engineering, Marketing..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
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

        <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6">
          <EmployeeTable
            members={activeMembers}
            teams={teams}
            companyId={companyId!}
            currentUserRole={currentUserRole || 'member'}
            onMemberRemoved={handleMemberRemoved}
            onRoleChanged={handleRoleChanged}
            onTeamAssigned={handleTeamAssigned}
          />
        </div>
      </div>
    </Layout>
  );
}