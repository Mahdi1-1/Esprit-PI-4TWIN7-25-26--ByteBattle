import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { Layout } from '../../components/Layout';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { VerificationBanner } from '../../components/company/VerificationBanner';
import { JoinRequestRow } from '../../components/company/JoinRequestRow';
import { useAuth } from '../../context/AuthContext';
import { useCurrentCompanyId } from '../../hooks/useCurrentCompanyId';
import { companyService, Company, CompanyRole, JoinRequest } from '../../services/companyService';
import { hiringService, Candidate, HiringDashboard, SendAIInterviewDto } from '../../services/hiringService';
import { AlertCircle, ArrowLeft, Users, Search, Brain, Calendar, User, Mail, Briefcase, ChevronRight, Star, X } from 'lucide-react';

export function CompanyHiring() {
  const { companyId: routeCompanyId } = useParams<{ companyId: string }>();
  const companyId = useCurrentCompanyId(routeCompanyId);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dashboard, setDashboard] = useState<HiringDashboard | null>(null);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSendingInterview, setIsSendingInterview] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);

  const currentUserRole = user?.companyRole as CompanyRole || null;
  const canManage = currentUserRole === 'owner' || currentUserRole === 'recruiter';

  const fetchData = useCallback(async () => {
    if (companyId === undefined) return;
    if (!companyId) {
      setError('You are not a member of any company');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [companyData, dashboardData, candidatesData, pendingRequestsData] = await Promise.all([
        companyService.getCompany(companyId),
        canManage ? hiringService.getHiringDashboard(companyId) : Promise.resolve(null),
        hiringService.getCandidates(companyId),
        canManage ? companyService.getPendingJoinRequests(companyId) : Promise.resolve([]),
      ]);
      setCompany(companyData);
      setDashboard(dashboardData);
      setCandidates(candidatesData);
      setPendingRequests(pendingRequestsData);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load hiring data');
    } finally {
      setLoading(false);
    }
  }, [companyId, canManage]);

  useEffect(() => {
    if (companyId === undefined) return;
    fetchData();
  }, [companyId, fetchData]);

  const handleSendAIInterview = async (candidateId: string, jobId?: string) => {
    if (!companyId) return;
    setIsSendingInterview(true);
    try {
      await hiringService.sendAIInterview(companyId, { candidateId, jobId });
      alert('AI Interview sent successfully!');
      setInterviewModalOpen(false);
    } catch (err) {
      console.error('Failed to send AI interview:', err);
      alert('Failed to send AI interview');
    } finally {
      setIsSendingInterview(false);
    }
  };

  const filteredCandidates = candidates.filter(c => 
    c.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinRequestAction = (requestId: string) => {
    setPendingRequests((current) => current.filter((request) => request.id !== requestId));
  };

  if (loading) {
    return (
      <Layout>
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[var(--surface-2)] rounded w-1/4"></div>
            <div className="h-64 bg-[var(--surface-2)] rounded-lg"></div>
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
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Failed to load hiring data</h2>
            <p className="text-[var(--text-secondary)] mb-4">{error || 'Unknown error'}</p>
            <Button onClick={fetchData}>Retry</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* REMOVED: CompanyNavbar component - Layout already includes navigation */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/companies/${companyId}/dashboard`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Hiring Console</h1>
              <p className="text-sm text-[var(--text-secondary)]">Manage candidates and interviews for {company.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <User className="w-4 h-4" />
            <span>{user?.username}</span>
            <span className="px-2 py-1 rounded-full bg-[var(--surface-2)] text-xs">
              {currentUserRole}
            </span>
          </div>
        </div>

        <VerificationBanner companyName={company.name} verified={company.verified} />

        {/* Dashboard Stats */}
        {dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
              <div className="text-2xl font-semibold text-[var(--text-primary)]">{dashboard.totalApplications}</div>
              <div className="text-sm text-[var(--text-secondary)]">Applications</div>
            </div>
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
              <div className="text-2xl font-semibold text-[var(--text-primary)]">{dashboard.aiInterviewsCompleted}</div>
              <div className="text-sm text-[var(--text-secondary)]">AI Interviews</div>
            </div>
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
              <div className="text-2xl font-semibold text-[var(--text-primary)]">{dashboard.humanInterviewsScheduled}</div>
              <div className="text-sm text-[var(--text-secondary)]">Human Interviews</div>
            </div>
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
              <div className="text-2xl font-semibold text-[var(--text-primary)]">{dashboard.shortlistedCandidates}</div>
              <div className="text-sm text-[var(--text-secondary)]">Shortlisted</div>
            </div>
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
              <div className="text-2xl font-semibold text-[var(--text-primary)]">{dashboard.hiredCandidates}</div>
              <div className="text-sm text-[var(--text-secondary)]">Hired</div>
            </div>
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
              <div className="text-2xl font-semibold text-[var(--state-warning)]">{dashboard.aiInterviewsPending}</div>
              <div className="text-sm text-[var(--text-secondary)]">Pending</div>
            </div>
          </div>
        )}

        {canManage && pendingRequests.length > 0 && (
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Pending Join Requests</h2>
              <Badge variant="medium">{pendingRequests.length} pending</Badge>
            </div>
            <div className="space-y-3">
              {pendingRequests.slice(0, 5).map((request) => (
                <JoinRequestRow
                  key={request.id}
                  request={request}
                  companyId={companyId!}
                  onAction={(requestId) => handleJoinRequestAction(requestId)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Candidate List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <Input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2">
              {filteredCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidate(candidate)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedCandidate?.id === candidate.id
                      ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/30'
                      : 'bg-[var(--surface-2)] border-[var(--border-default)] hover:border-[var(--brand-primary)]/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/20 flex items-center justify-center">
                      {candidate.user.profileImage ? (
                        <img src={candidate.user.profileImage} alt={candidate.user.username} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-[var(--brand-primary)]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--text-primary)]">{candidate.user.username}</div>
                      <div className="text-sm text-[var(--text-secondary)]">
                        Level {candidate.user.level} • ELO {candidate.user.elo}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-[var(--text-muted)]">
                    <span>{candidate.stats.totalSolved} solved</span>
                    <span>{candidate.stats.acceptanceRate}% acceptance</span>
                  </div>
                </div>
              ))}
              {filteredCandidates.length === 0 && (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  No candidates found
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Candidate Details */}
          <div className="lg:col-span-2">
            {selectedCandidate ? (
              <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--brand-primary)]/20 flex items-center justify-center">
                      {selectedCandidate.user.profileImage ? (
                        <img src={selectedCandidate.user.profileImage} alt={selectedCandidate.user.username} className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-[var(--brand-primary)]" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--text-primary)]">{selectedCandidate.user.username}</h2>
                      <div className="flex items-center gap-4 text-[var(--text-secondary)]">
                        <span>Level {selectedCandidate.user.level}</span>
                        <span>ELO {selectedCandidate.user.elo}</span>
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <Button variant="primary" onClick={() => setInterviewModalOpen(true)}>
                      <Brain className="w-4 h-4 mr-2" />
                      Send AI Interview
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-[var(--surface-2)] rounded-lg text-center">
                    <div className="text-2xl font-semibold text-[var(--text-primary)]">{selectedCandidate.stats.totalSolved}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Total Solved</div>
                  </div>
                  <div className="p-4 bg-[var(--surface-2)] rounded-lg text-center">
                    <div className="text-2xl font-semibold text-[var(--state-success)]">{selectedCandidate.stats.easy}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Easy</div>
                  </div>
                  <div className="p-4 bg-[var(--surface-2)] rounded-lg text-center">
                    <div className="text-2xl font-semibold text-[var(--state-warning)]">{selectedCandidate.stats.medium}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Medium</div>
                  </div>
                  <div className="p-4 bg-[var(--surface-2)] rounded-lg text-center">
                    <div className="text-2xl font-semibold text-[var(--state-error)]">{selectedCandidate.stats.hard}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Hard</div>
                  </div>
                </div>

                {selectedCandidate.user.badges && selectedCandidate.user.badges.length > 0 && (
                  <div>
                    <h3 className="font-medium text-[var(--text-primary)] mb-3">Badges</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.user.badges.map((badge) => (
                        <Badge key={badge.id} variant="default" className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {badge.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCandidate.recentSubmissions && selectedCandidate.recentSubmissions.length > 0 && (
                  <div>
                    <h3 className="font-medium text-[var(--text-primary)] mb-3">Recent Submissions</h3>
                    <div className="space-y-2">
                      {selectedCandidate.recentSubmissions.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 bg-[var(--surface-2)] rounded-lg">
                          <span className="text-[var(--text-primary)]">{sub.challengeTitle}</span>
                          <Badge variant={sub.verdict === 'ACCEPTED' ? 'ACCEPTED' : 'default'}>{sub.verdict}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {canManage && (
                  <div className="flex gap-4 pt-4 border-t border-[var(--border-default)]">
                    <Button variant="secondary">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Interview
                    </Button>
                    <Button variant="secondary">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Add to Jobs
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-center py-12">
                <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)]">Select a candidate to view profile</p>
              </div>
            )}
          </div>
        </div>

        {/* Interview Modal */}
        {interviewModalOpen && selectedCandidate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">Send AI Interview</h3>
                <Button variant="ghost" size="sm" onClick={() => setInterviewModalOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[var(--text-secondary)] mb-4">
                Send an AI-powered interview to <strong>{selectedCandidate.user.username}</strong>.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Domain (optional)</label>
                  <select className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)]">
                    <option value="">General</option>
                    <option value="FRONTEND_ENGINEERING">Frontend Engineering</option>
                    <option value="BACKEND_ENGINEERING">Backend Engineering</option>
                    <option value="FULL_STACK">Full Stack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Language</label>
                  <select className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)]">
                    <option value="FR">French</option>
                    <option value="EN">English</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <Button variant="primary" className="flex-1" onClick={() => handleSendAIInterview(selectedCandidate.id)} disabled={isSendingInterview}>
                    {isSendingInterview ? 'Sending...' : 'Send Interview'}
                  </Button>
                  <Button variant="ghost" onClick={() => setInterviewModalOpen(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}