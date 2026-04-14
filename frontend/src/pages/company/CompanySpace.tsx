import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../../components/Layout';
import { Link } from 'react-router';
import { CalendarDays, Clock3, FileCode2, Trophy, Users, UserCheck, UserX, Ban, Trash2, ShieldCheck, UserPlus } from 'lucide-react';
import { companiesService, CompanyMembership, CompanyAnnouncement } from '../../services/companiesService';
import { challengesService } from '../../services/challengesService';
import { submissionsService } from '../../services/submissionsService';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { toast } from 'react-hot-toast';

type MemberChallenge = {
  id: string;
  title: string;
  status: 'not_started' | 'submitted' | 'reviewed';
  dueDate?: string;
};

function statusLabel(status: MemberChallenge['status']) {
  switch (status) {
    case 'not_started':
      return 'Not started';
    case 'submitted':
      return 'Submitted';
    case 'reviewed':
      return 'Reviewed';
    default:
      return status;
  }
}

export function CompanySpace() {
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<CompanyMembership[]>([]);
  const [activeMembership, setActiveMembership] = useState<CompanyMembership | null>(null);
  const [companyChallenges, setCompanyChallenges] = useState<MemberChallenge[]>([]);
  const [recentSubmissionsCount, setRecentSubmissionsCount] = useState(0);
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [announcements, setAnnouncements] = useState<CompanyAnnouncement[]>([]);
  const [companyMembers, setCompanyMembers] = useState<CompanyMembership[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [memberSearch, setMemberSearch] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteRole] = useState<'member'>('member');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [memberships, recommendedChallenges, myHistory, announcementRows] = await Promise.all([
          companiesService.getMyCompanies(),
          challengesService.getRecommended(),
          submissionsService.getMyHistory({ page: 1, limit: 50, kind: 'CODE' }),
          companiesService.getMyAnnouncements(),
        ]);

        setMemberships(memberships || []);
        const active = (memberships || []).find((m) => m.status === 'active' && m.company?.status === 'active') || null;
        setActiveMembership(active);

        const submissions = Array.isArray(myHistory?.data) ? myHistory.data : [];
        setRecentSubmissionsCount(submissions.length);

        if (submissions.length > 0) {
          const scores = submissions
            .map((s: any) => Number(s.score || 0))
            .filter((n: number) => !Number.isNaN(n));
          if (scores.length > 0) {
            const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
            setAverageScore(Math.round(avg));
          }
        }

        const submissionByChallenge = new Map<string, any>();
        submissions.forEach((s: any) => {
          if (!s.challengeId) return;
          if (!submissionByChallenge.has(s.challengeId)) {
            submissionByChallenge.set(s.challengeId, s);
          }
        });

        const challenges = (recommendedChallenges || []).slice(0, 6).map((c: any) => {
          const sub = submissionByChallenge.get(c.id);
          const status: MemberChallenge['status'] = sub
            ? sub.verdict
              ? 'reviewed'
              : 'submitted'
            : 'not_started';

          return {
            id: c.id,
            title: c.title,
            status,
          };
        });

        setCompanyChallenges(challenges);
        setAnnouncements(announcementRows || []);

        if (active?.companyId && active.role === 'admin') {
          setMembersLoading(true);
          try {
            const members = await companiesService.getCompanyMembers(active.companyId);
            setCompanyMembers(members || []);
          } catch {
            setCompanyMembers([]);
          } finally {
            setMembersLoading(false);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const stats = useMemo(() => {
    const completed = companyChallenges.filter((c) => c.status === 'submitted' || c.status === 'reviewed').length;
    const reviewed = companyChallenges.filter((c) => c.status === 'reviewed').length;
    return {
      activeChallenges: companyChallenges.length,
      completed,
      reviewed,
      avgScore: averageScore,
    };
  }, [companyChallenges, averageScore]);

  const isCompanyAdmin = activeMembership?.role === 'admin';

  const pendingMembership = useMemo(
    () => memberships.find((member) => member.status === 'pending') || null,
    [memberships],
  );

  const rejectedMembership = useMemo(
    () => memberships.find((member) => member.status === 'rejected') || null,
    [memberships],
  );

  const suspendedMembership = useMemo(
    () => memberships.find((member) => member.status === 'suspended' || member.company?.status === 'suspended') || null,
    [memberships],
  );

  const pendingMembers = useMemo(
    () => companyMembers.filter((member) => member.status === 'pending'),
    [companyMembers],
  );

  const activeMembers = useMemo(
    () => companyMembers.filter((member) => member.status === 'active'),
    [companyMembers],
  );

  const suspendedMembers = useMemo(
    () => companyMembers.filter((member) => member.status === 'suspended'),
    [companyMembers],
  );

  const filteredActiveMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    if (!query) return activeMembers;

    return activeMembers.filter((member) => {
      const username = member.user?.username?.toLowerCase() || '';
      const email = member.user?.email?.toLowerCase() || '';
      const fullName = `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim().toLowerCase();
      return username.includes(query) || email.includes(query) || fullName.includes(query);
    });
  }, [activeMembers, memberSearch]);

  const withAction = async (key: string, action: () => Promise<void>) => {
    try {
      setActionLoading((prev) => ({ ...prev, [key]: true }));
      await action();
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleInviteUser = async () => {
    if (!activeMembership?.companyId) return;
    const username = inviteUsername.trim();
    if (!username) {
      toast.error('Username is required');
      return;
    }

    await withAction('invite-user', async () => {
      const invitedMembership = await companiesService.inviteUserByUsername(activeMembership.companyId, {
        username,
        role: inviteRole,
      });

      applyMembershipUpdate(invitedMembership);
      setInviteUsername('');
      toast.success(`Invitation sent to ${invitedMembership.user?.username || username}`);
    });
  };

  const applyMembershipUpdate = (nextMembership: CompanyMembership) => {
    setCompanyMembers((prev) => {
      const idx = prev.findIndex((member) => member.id === nextMembership.id);
      if (idx === -1) {
        return [nextMembership, ...prev];
      }
      const copy = [...prev];
      copy[idx] = nextMembership;
      return copy;
    });
  };

  const handleApprove = async (member: CompanyMembership) => {
    if (!activeMembership?.companyId) return;
    await withAction(`approve:${member.id}`, async () => {
      const updated = await companiesService.approveMembership(activeMembership.companyId, member.userId);
      applyMembershipUpdate(updated);
      toast.success(`${member.user?.username || 'Member'} approved`);
    });
  };

  const handleReject = async (member: CompanyMembership) => {
    if (!activeMembership?.companyId) return;
    await withAction(`reject:${member.id}`, async () => {
      const updated = await companiesService.rejectMembership(activeMembership.companyId, member.userId);
      applyMembershipUpdate(updated);
      toast.success(`${member.user?.username || 'Member'} rejected`);
    });
  };

  const handleSuspend = async (member: CompanyMembership) => {
    if (!activeMembership?.companyId) return;
    await withAction(`suspend:${member.id}`, async () => {
      const updated = await companiesService.suspendMembership(activeMembership.companyId, member.userId);
      applyMembershipUpdate(updated);
      toast.success(`${member.user?.username || 'Member'} suspended`);
    });
  };

  const handleRemove = async (member: CompanyMembership) => {
    if (!activeMembership?.companyId) return;
    await withAction(`remove:${member.id}`, async () => {
      await companiesService.removeMembership(activeMembership.companyId, member.userId);
      setCompanyMembers((prev) => prev.filter((item) => item.id !== member.id));
      toast.success(`${member.user?.username || 'Member'} removed`);
    });
  };

  const handleRoleChange = async (member: CompanyMembership, role: CompanyMembership['role']) => {
    if (!activeMembership?.companyId) return;
    await withAction(`role:${member.id}`, async () => {
      const updated = await companiesService.updateMemberRole(activeMembership.companyId, member.userId, role);
      applyMembershipUpdate(updated);
      toast.success(`${member.user?.username || 'Member'} role updated`);
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8 text-[var(--text-secondary)]">Loading company space...</div>
      </Layout>
    );
  }

  if (!activeMembership) {
    return (
      <Layout>
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
          <div className="max-w-3xl mx-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Company Space</h1>
            {pendingMembership ? (
              <p className="text-[var(--text-secondary)] mb-6">
                {pendingMembership.role === 'admin'
                  ? 'Your company admission request is pending platform admin approval.'
                  : 'Your request to join a company is pending company admin approval.'}
              </p>
            ) : rejectedMembership ? (
              <p className="text-[var(--text-secondary)] mb-6">
                Your latest company request was rejected. You can submit a new request or ask for a new invite.
              </p>
            ) : suspendedMembership ? (
              <p className="text-[var(--text-secondary)] mb-6">
                Your company membership is currently suspended. Contact a company admin for reactivation.
              </p>
            ) : (
              <p className="text-[var(--text-secondary)] mb-6">
                You do not have an active company membership yet.
              </p>
            )}

            {pendingMembership?.company && (
              <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--state-info)]/30 bg-[var(--state-info)]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
                <span className="font-semibold">Pending:</span> {pendingMembership.company.name}
              </div>
            )}

            {rejectedMembership?.company && (
              <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--state-error)]/30 bg-[var(--state-error)]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
                <span className="font-semibold">Rejected:</span> {rejectedMembership.company.name}
              </div>
            )}

            {suspendedMembership?.company && (
              <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--state-warning)]/30 bg-[var(--state-warning)]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
                <span className="font-semibold">Suspended:</span> {suspendedMembership.company.name}
              </div>
            )}

            <Link
              to="/companies"
              className="inline-flex items-center px-4 py-2 rounded-[var(--radius-md)] bg-[var(--brand-primary)] text-white hover:opacity-90"
            >
              Open company join and admission page
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{activeMembership.company?.name || 'Company Space'}</h1>
              <p className="text-[var(--text-secondary)] mt-1">Member workspace for company challenges and updates.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="easy">Member</Badge>
              <Badge variant="default">{activeMembership.role}</Badge>
            </div>
          </div>
          <div className="mt-4 text-sm text-[var(--text-secondary)]">
            Joined on {new Date(activeMembership.joinedAt).toLocaleDateString()}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              to={`/discussion?companyId=${encodeURIComponent(activeMembership.companyId)}`}
              className="inline-flex items-center px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
            >
              Company Forum
            </Link>
            <Link
              to={`/discussion/new?companyId=${encodeURIComponent(activeMembership.companyId)}`}
              className="inline-flex items-center px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--brand-primary)] text-sm text-white hover:opacity-90"
            >
              New Company Post
            </Link>
          </div>
        </div>

        {isCompanyAdmin && (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">Invite by username</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Send in-platform invitations directly to existing users.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_150px_auto] gap-3 items-end">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Username</label>
                <input
                  value={inviteUsername}
                  onChange={(event) => setInviteUsername(event.target.value)}
                  placeholder="john_doe"
                  className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Role</label>
                <div className="mt-1 h-[42px] w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 flex items-center text-sm text-[var(--text-primary)]">
                  member
                </div>
              </div>

              <Button variant="primary" onClick={handleInviteUser} loading={actionLoading['invite-user']}>
                <UserPlus className="w-4 h-4" />
                Invite
              </Button>
            </div>

            <div className="mt-3 text-xs text-[var(--text-muted)]">
              Invited users will see invitations on the company invitations page and can accept or decline.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm"><FileCode2 className="w-4 h-4" /> Active Challenges</div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-2">{stats.activeChallenges}</div>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm"><Clock3 className="w-4 h-4" /> Recent Submissions</div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-2">{recentSubmissionsCount}</div>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm"><Trophy className="w-4 h-4" /> Completed</div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-2">{stats.completed}</div>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm"><Users className="w-4 h-4" /> Avg Score</div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-2">{stats.avgScore !== null ? `${stats.avgScore}%` : 'N/A'}</div>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">My Company Hackathons</h2>
            <Link to="/company/challenges" className="text-sm text-[var(--brand-primary)] hover:underline">Open Enterprise Challenges</Link>
          </div>
          <div className="space-y-3">
            {companyChallenges.length === 0 && (
              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text-secondary)]">
                No enterprise hackathons available yet.
              </div>
            )}
            {companyChallenges.map((challenge) => (
              <div key={challenge.id} className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-medium text-[var(--text-primary)]">{challenge.title}</div>
                  {challenge.dueDate && (
                    <div className="mt-1 text-xs text-[var(--text-secondary)] flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5" />
                      Due {new Date(challenge.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={challenge.status === 'reviewed' ? 'easy' : challenge.status === 'submitted' ? 'medium' : 'default'}>
                    {statusLabel(challenge.status)}
                  </Badge>
                  <Link to={`/company/challenges/${challenge.id}`}>
                    <Button size="sm" variant="secondary">Open Challenge</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Company Announcements</h2>
          {announcements.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-sm">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="font-medium text-[var(--text-primary)]">{a.title}</div>
                    <div className="flex items-center gap-2">
                      {a.isPinned && <Badge variant="medium">Pinned</Badge>}
                      <span className="text-xs text-[var(--text-muted)]">{new Date(a.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {isCompanyAdmin && (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[var(--brand-primary)]" />
                Company Admin
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="default">Pending: {pendingMembers.length}</Badge>
                <Badge variant="easy">Active: {activeMembers.length}</Badge>
                <Badge variant="medium">Suspended: {suspendedMembers.length}</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">Pending Requests</h3>
              {membersLoading ? (
                <p className="text-sm text-[var(--text-secondary)]">Loading member requests...</p>
              ) : pendingMembers.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">No pending requests.</p>
              ) : (
                <div className="space-y-3">
                  {pendingMembers.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4 flex items-center justify-between gap-3 flex-wrap"
                    >
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">{member.user?.username || member.user?.email || 'Unknown user'}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Requested {new Date(member.joinedAt).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1"
                          loading={!!actionLoading[`approve:${member.id}`]}
                          onClick={() => handleApprove(member)}
                        >
                          <UserCheck className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          loading={!!actionLoading[`reject:${member.id}`]}
                          onClick={() => handleReject(member)}
                        >
                          <UserX className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">Members</h3>
              <div className="mb-3">
                <input
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Search by username, email, or full name"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                />
              </div>
              {membersLoading ? (
                <p className="text-sm text-[var(--text-secondary)]">Loading members...</p>
              ) : filteredActiveMembers.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">No active members yet.</p>
              ) : (
                <div className="space-y-3">
                  {filteredActiveMembers.map((member) => {
                    const isSelf = member.userId === activeMembership.userId;
                    return (
                      <div
                        key={member.id}
                        className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4 flex items-center justify-between gap-3 flex-wrap"
                      >
                        <div>
                          <div className="font-medium text-[var(--text-primary)]">{member.user?.username || member.user?.email || 'Unknown user'}</div>
                          <div className="text-xs text-[var(--text-secondary)]">Joined {new Date(member.joinedAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <select
                            value={member.role}
                            disabled={isSelf || !!actionLoading[`role:${member.id}`]}
                            onChange={(event) => handleRoleChange(member, event.target.value as CompanyMembership['role'])}
                            className="h-8 px-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-1)] text-sm text-[var(--text-primary)]"
                          >
                            <option value="member">member</option>
                            <option value="admin">admin</option>
                          </select>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="gap-1"
                            disabled={isSelf}
                            loading={!!actionLoading[`suspend:${member.id}`]}
                            onClick={() => handleSuspend(member)}
                          >
                            <Ban className="w-4 h-4" />
                            Suspend
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            disabled={isSelf}
                            loading={!!actionLoading[`remove:${member.id}`]}
                            onClick={() => handleRemove(member)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">Suspended Members</h3>
              {membersLoading ? (
                <p className="text-sm text-[var(--text-secondary)]">Loading suspended members...</p>
              ) : suspendedMembers.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">No suspended members.</p>
              ) : (
                <div className="space-y-3">
                  {suspendedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4 flex items-center justify-between gap-3 flex-wrap"
                    >
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">{member.user?.username || member.user?.email || 'Unknown user'}</div>
                        <div className="text-xs text-[var(--text-secondary)]">Role: {member.role}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1"
                          loading={!!actionLoading[`approve:${member.id}`]}
                          onClick={() => handleApprove(member)}
                        >
                          <UserCheck className="w-4 h-4" />
                          Reactivate
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          loading={!!actionLoading[`remove:${member.id}`]}
                          onClick={() => handleRemove(member)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
