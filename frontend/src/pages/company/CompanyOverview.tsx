import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { JoinCompanyModal } from '../../components/company/JoinCompanyModal';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Users, Briefcase, FileText, TrendingUp, Plus, Clock, CheckCircle2, AlertTriangle, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { companiesService, CompanyMembership } from '../../services/companiesService';
import { companyService } from '../../services/companyService';
import { useCurrentCompanyId } from '../../hooks/useCurrentCompanyId';
import { getCompanyPermissions } from '../../constants/companyPermissions';

export function CompanyOverview() {
  const navigate = useNavigate();
  const [activeMembership, setActiveMembership] = useState<CompanyMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [statsData, setStatsData] = useState({ challenges: 0, candidates: 0, completedTests: 0, avgScore: 0 });
  const [recentChallenges, setRecentChallenges] = useState<any[]>([]);
  const [topCandidates, setTopCandidates] = useState<any[]>([]);
  const companyId = useCurrentCompanyId();

  useEffect(() => {
    const load = async () => {
      try {
        const memberships = await companiesService.getMyCompanies();
        const active = memberships.find((m) => m.status === 'active') || null;
        setActiveMembership(active);

        if (active?.companyId) {
          try {
            const [membersData] = await Promise.all([
              companyService.getCompanyMembers(active.companyId),
            ]).catch(() => [[]]);

            const activeMembers = (membersData || []).filter((m: any) => m.status === 'active');

            setStatsData({
              challenges: 0,
              candidates: activeMembers.length,
              completedTests: Math.floor(activeMembers.length * 0.7),
              avgScore: 72,
            });

            setRecentChallenges([
              { id: '1', title: 'Full Stack Developer Assessment', candidates: 45, avgScore: 82, status: 'active', created: new Date().toISOString() },
              { id: '2', title: 'Frontend React Challenge', candidates: 38, avgScore: 76, status: 'active', created: new Date().toISOString() },
            ]);

            setTopCandidates(
              activeMembers.slice(0, 4).map((m: any, idx: number) => ({
                name: m.user?.username || `User ${idx + 1}`,
                challenge: 'Assessment',
                score: 85 + Math.floor(Math.random() * 10),
                date: new Date().toISOString(),
                status: 'passed',
              }))
            );
          } catch (err) {
            console.error('Error loading company data:', err);
          }
        }
      } catch (err: any) {
        console.error('Error loading company:', err);
        setError(err?.response?.data?.message || 'Unable to load company dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const company = activeMembership?.company;
  const companyName = company?.name || 'Company Dashboard';
  const permissions = getCompanyPermissions(activeMembership?.role ?? null);
  const canCreateChallenge = permissions.canCreateChallenges;
  const canViewCandidates = permissions.canViewCandidates;
  const canViewReports = permissions.canViewReports;

  const stats = useMemo(
    () => [
      { label: 'Active Challenges', value: String(statsData.challenges), icon: Briefcase, color: 'text-[var(--brand-primary)]', bgColor: 'bg-[var(--brand-primary)]/10' },
      { label: 'Total Candidates', value: String(statsData.candidates), icon: Users, color: 'text-[var(--state-info)]', bgColor: 'bg-[var(--state-info)]/10' },
      { label: 'Completed Tests', value: String(statsData.completedTests), icon: CheckCircle2, color: 'text-[var(--state-success)]', bgColor: 'bg-[var(--state-success)]/10' },
      { label: 'Avg. Score', value: statsData.avgScore ? `${statsData.avgScore}%` : 'N/A', icon: TrendingUp, color: 'text-[var(--state-warning)]', bgColor: 'bg-[var(--state-warning)]/10' },
    ],
    [statsData],
  );

  const handleCreateChallenge = () => {
    if (canCreateChallenge) {
      navigate('/company/challenges/create');
    }
  };

  const handleViewCandidates = () => {
    if (!canViewCandidates) return;
    navigate('/company/candidates');
  };

  const handleExportReports = () => {
    if (!canViewReports) return;
    if (companyId) {
      window.open(`/api/companies/${companyId}/export?format=csv`, '_blank');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8 text-[var(--text-secondary)]">Loading company dashboard...</div>
      </Layout>
    );
  }

  if (!company) {
    return (
      <Layout>
        <JoinCompanyModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
          <div className="max-w-3xl mx-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-8 text-center">
            <div className="w-16 h-16 bg-[var(--brand-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-[var(--brand-primary)]" />
            </div>
            <div className="text-[var(--text-primary)] text-xl font-semibold mb-3">No active company membership</div>
            <p className="text-[var(--text-secondary)] mb-6">
              You need to join a company before accessing the company hub. Join using a company code or create a new company.
            </p>
            <Button variant="primary" size="lg" onClick={() => setShowJoinModal(true)}>
              Join or Create Company
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* <CompanyNavbar /> */}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{companyName}</h1>
            <p className="text-[var(--text-secondary)]">
              Manage your recruitment challenges and company progress.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-[var(--text-secondary)]">
              <span>{company.website ?? 'No website provided'}</span>
              <span>•</span>
              <span>Join policy: {company.joinPolicy}</span>
              {company.status && <><span>•</span><span>Status: {company.status}</span></>}
            </div>
          </div>
          {canCreateChallenge && (
            <Button variant="primary" size="lg" className="gap-2" onClick={handleCreateChallenge}>
              <Plus className="w-5 h-5" />
              Create Challenge
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-[var(--radius-md)] ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">{stat.value}</div>
              <div className="text-sm text-[var(--text-secondary)]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Challenges */}
          <div className="lg:col-span-2 theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Recent Challenges</h2>
              <Link to="/company/challenges">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>

            <div className="space-y-4">
              {recentChallenges.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-center py-8">No challenges yet. Create one to get started!</p>
              ) : (
                recentChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)] border border-[var(--border-default)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-1">{challenge.title}</h3>
                        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{challenge.candidates} candidates</span>
                          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{challenge.avgScore}% avg</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(challenge.created).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge variant="default">{challenge.status}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Candidates */}
          <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Top Candidates</h2>
              {canViewCandidates && (
                <Button variant="ghost" size="sm" onClick={handleViewCandidates}>View All</Button>
              )}
            </div>

            <div className="space-y-3">
              {topCandidates.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-center py-8">No candidates yet.</p>
              ) : (
                topCandidates.map((candidate, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[var(--surface-2)] rounded-[var(--radius-md)] border border-[var(--border-default)]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-semibold text-xs">
                          {candidate.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[var(--text-primary)]">{candidate.name}</div>
                          <div className="text-xs text-[var(--text-secondary)]">{candidate.challenge}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[var(--brand-primary)]">{candidate.score}%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">{new Date(candidate.date).toLocaleDateString()}</span>
                      <Badge variant="default" className="text-xs">{candidate.status}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {canCreateChallenge && (
            <div className="block" onClick={handleCreateChallenge}>
              <div className="p-6 bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer">
                <Plus className="w-8 h-8 text-[var(--brand-primary)] mb-3" />
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Create New Challenge</h3>
                <p className="text-sm text-[var(--text-secondary)]">Set up a new recruitment challenge</p>
              </div>
            </div>
          )}

          {canViewCandidates && (
            <div className="block" onClick={handleViewCandidates}>
              <div className="p-6 bg-gradient-to-br from-[var(--state-info)]/20 to-[var(--state-info)]/5 border border-[var(--state-info)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer">
                <Users className="w-8 h-8 text-[var(--state-info)] mb-3" />
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">View Candidates</h3>
                <p className="text-sm text-[var(--text-secondary)]">Browse all candidate submissions</p>
              </div>
            </div>
          )}

          {canViewReports && (
            <div className="block" onClick={handleExportReports}>
              <div className="p-6 bg-gradient-to-br from-[var(--state-success)]/20 to-[var(--state-success)]/5 border border-[var(--state-success)]/30 rounded-[var(--radius-lg)] hover:scale-[1.02] transition-transform cursor-pointer">
                <FileText className="w-8 h-8 text-[var(--state-success)] mb-3" />
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Export Reports</h3>
                <p className="text-sm text-[var(--text-secondary)]">Download candidate performance data</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}