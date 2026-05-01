import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { Layout } from '../../components/Layout';
import { CompanyLayout } from '../../components/company/CompanyLayout';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { CompanyStatsCard } from '../../components/company/CompanyStatsCard';
import { JoinRequestRow } from '../../components/company/JoinRequestRow';
import { EmployeeTable } from '../../components/company/EmployeeTable';
import { VerificationBanner } from '../../components/company/VerificationBanner';
import { useAuth } from '../../context/AuthContext';
import { useCurrentCompanyId } from '../../hooks/useCurrentCompanyId';
import { companyService, Company, CompanyMember, JoinRequest, DashboardStats, ActivityItem, CompanyRole } from '../../services/companyService';
import { Users, Briefcase, FileText, TrendingUp, Plus, Clock, AlertCircle, Megaphone, GraduationCap, BriefcaseBusiness, Trophy } from 'lucide-react';

interface DashboardData {
  company: Company;
  stats: DashboardStats;
  members: CompanyMember[];
  pendingRequests: JoinRequest[];
  recentActivity: ActivityItem[];
}

export function CompanyDashboard() {
  const { companyId: routeCompanyId } = useParams<{ companyId: string }>();
  const companyId = useCurrentCompanyId(routeCompanyId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const currentUserRole = user?.companyRole as CompanyRole || null;
  const isAdmin = currentUserRole === 'owner' || currentUserRole === 'recruiter';

  const fetchDashboardData = useCallback(async (cid: string) => {
    if (!cid) return;
    try {
      const [company, members, pendingRequests] = await Promise.all([
        companyService.getCompany(cid),
        companyService.getCompanyMembers(cid),
        isAdmin ? companyService.getPendingJoinRequests(cid) : Promise.resolve([]),
      ]);

      setData({
        company,
        stats: {
          employeesCount: members.filter(m => m.status === 'active').length,
          pendingRequestsCount: pendingRequests.length,
          activeHackathonsCount: 0,
          activeJobsCount: 0,
        },
        members: members.filter(m => m.status === 'active'),
        pendingRequests,
        recentActivity: [],
      });
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (companyId === undefined) return;

    async function load() {
      if (!companyId) {
        setError('You are not a member of any company');
        setLoading(false);
        return;
      }
      fetchDashboardData(companyId);
    }

    load();
  }, [companyId, fetchDashboardData]);

  const handleJoinRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    if (!companyId || !data) return;
    try {
      const updatedRequests = data.pendingRequests.filter(r => r.id !== requestId);
      setData({
        ...data,
        pendingRequests: updatedRequests,
        stats: {
          ...data.stats,
          pendingRequestsCount: updatedRequests.length,
        },
      });
    } catch (err) {
      console.error('Failed to process join request:', err);
      if (companyId) {
        fetchDashboardData(companyId);
      }
    }
  };

  const stats = useMemo(() => [
    { label: 'Employees', value: data?.stats.employeesCount || 0, icon: Users, color: 'text-[var(--brand-primary)]', bgColor: 'bg-[var(--brand-primary)]/10' },
    { label: 'Pending Requests', value: data?.stats.pendingRequestsCount || 0, icon: Clock, color: 'text-[var(--state-warning)]', bgColor: 'bg-[var(--state-warning)]/10' },
    { label: 'Active Hackathons', value: data?.stats.activeHackathonsCount || 0, icon: Trophy, color: 'text-[var(--state-info)]', bgColor: 'bg-[var(--state-info)]/10' },
    { label: 'Active Jobs', value: data?.stats.activeJobsCount || 0, icon: BriefcaseBusiness, color: 'text-[var(--state-success)]', bgColor: 'bg-[var(--state-success)]/10' },
  ], [data?.stats]);

  const quickActions = useMemo(() => [
    { label: 'Create Hackathon', icon: Trophy, link: `/companies/${companyId}/hackathons/create`, requiresVerified: true },
    { label: 'Post Job', icon: BriefcaseBusiness, link: `/companies/${companyId}/jobs/create`, requiresVerified: true },
    { label: 'Create Roadmap', icon: GraduationCap, link: `/companies/${companyId}/roadmaps/create`, requiresVerified: false },
    { label: 'Create Course', icon: FileText, link: `/companies/${companyId}/courses/create`, requiresVerified: false },
  ], [companyId]);

  const topEmployees = useMemo(() => {
    if (!data?.members) return [];
    return [...data.members]
      .filter((m) => m.user && m.status === 'active')
      .sort((a, b) => ((b.user?.elo || 0) - (a.user?.elo || 0)))
      .slice(0, 5);
  }, [data?.members]);

  if (loading) {
    return (
      <CompanyLayout>
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[var(--surface-2)] rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-[var(--surface-2)] rounded-[var(--radius-lg)]"></div>
              ))}
            </div>
          </div>
        </div>
      </CompanyLayout>
    );
  }

  if (error || !data) {
    return (
      <CompanyLayout>
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="w-12 h-12 text-[var(--state-error)] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Failed to load dashboard</h2>
            <p className="text-[var(--text-secondary)] mb-4">{error || 'Unknown error'}</p>
            <Button onClick={fetchDashboardData}>Retry</Button>
          </div>
        </div>
      </CompanyLayout>
    );
  }

  const { company, members, pendingRequests } = data;

  return (
    <CompanyLayout>
      
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        <VerificationBanner 
          companyName={company.name}
          verified={company.verified}
          onRequestVerification={() => window.location.href = `/companies/${companyId}/verify`}
        />

        <div className="flex flex-col gap-4 lg:flex-row items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{company.name}</h1>
            <p className="text-[var(--text-secondary)]">
              Manage your company members, roadmaps, courses, and recruitment.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-[var(--text-secondary)]">
              {company.website && <span>{company.website}</span>}
              {company.industry && <><span>•</span><span>{company.industry}</span></>}
              <span>•</span><span>Join policy: {company.joinPolicy}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <CompanyStatsCard key={idx} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {isAdmin && pendingRequests.length > 0 && (
            <div className="lg:col-span-2 theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Pending Join Requests</h2>
                <Badge variant="warning">{pendingRequests.length} pending</Badge>
              </div>
              <div className="space-y-3">
                {pendingRequests.slice(0, 5).map((request) => (
                  <JoinRequestRow
                    key={request.id}
                    request={request}
                    companyId={companyId!}
                    onAction={handleJoinRequestAction}
                  />
                ))}
                {pendingRequests.length > 5 && (
                  <Link to={`/companies/${companyId}/join-requests`}>
                    <Button variant="ghost" size="sm" className="w-full">
                      View all {pendingRequests.length} requests
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className={isAdmin && pendingRequests.length > 0 ? '' : 'lg:col-span-3'}>
            <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Employee Leaderboard</h2>
                <Link to={`/companies/${companyId}/members`}>
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
              <div className="space-y-3">
                {topEmployees.map((member, idx) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-[var(--surface-2)] rounded-[var(--radius-md)]">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? 'bg-[var(--brand-primary)] text-white' :
                        idx === 1 ? 'bg-[var(--state-warning)] text-white' :
                        idx === 2 ? 'bg-[var(--state-info)] text-white' :
                        'bg-[var(--surface-1)] text-[var(--text-muted)]'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                          <div className="font-medium text-[var(--text-primary)]">{member.user?.username || 'Unknown'}</div>
                          <div className="text-xs text-[var(--text-muted)]">Level {member.user?.level || 0}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[var(--brand-primary)]">{member.user?.elo || 0}</div>
                      <div className="text-xs text-[var(--text-muted)]">ELO</div>
                    </div>
                  </div>
                ))}
                {topEmployees.length === 0 && (
                  <div className="text-center py-4 text-[var(--text-muted)]">No employees yet</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const isBlocked = action.requiresVerified && !company.verified;
              return (
                <Link 
                  key={action.label} 
                  to={isBlocked ? '#' : action.link}
                  onClick={(e) => isBlocked && e.preventDefault()}
                  className={`block p-6 rounded-[var(--radius-lg)] border transition-all ${
                    isBlocked 
                      ? 'opacity-50 cursor-not-allowed bg-[var(--surface-2)] border-[var(--border-default)]' 
                      : 'bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-primary)]/5 border-[var(--brand-primary)]/30 hover:scale-[1.02]'
                  }`}
                >
                  <action.icon className={`w-8 h-8 mb-3 ${isBlocked ? 'text-[var(--text-muted)]' : 'text-[var(--brand-primary)]'}`} />
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">{action.label}</h3>
                  {isBlocked && (
                    <p className="text-xs text-[var(--state-warning)]">Requires company verification</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}