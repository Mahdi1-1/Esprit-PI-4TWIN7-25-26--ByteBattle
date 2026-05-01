import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../../components/Layout';
import { CompanyLayout } from '../../components/company/CompanyLayout';
import { Link } from 'react-router';
import { Building2, CalendarDays, Clock3, FileCode2, Trophy, Users } from 'lucide-react';
import { companiesService, CompanyMembership, CompanyAnnouncement } from '../../services/companiesService';
import { challengesService } from '../../services/challengesService';
import { submissionsService } from '../../services/submissionsService';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';

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
  const [activeMembership, setActiveMembership] = useState<CompanyMembership | null>(null);
  const [companyChallenges, setCompanyChallenges] = useState<MemberChallenge[]>([]);
  const [recentSubmissionsCount, setRecentSubmissionsCount] = useState(0);
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [announcements, setAnnouncements] = useState<CompanyAnnouncement[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [memberships, recommendedChallenges, myHistory, announcementRows] = await Promise.all([
          companiesService.getMyCompanies(),
          challengesService.getRecommended(),
          submissionsService.getMyHistory({ page: 1, limit: 50, kind: 'CODE' }),
          companiesService.getMyAnnouncements(),
        ]);

        const active = (memberships || []).find((m) => m.status === 'active') || null;
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

  if (loading) {
    return (
      <CompanyLayout>
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8 text-[var(--text-secondary)]">Loading company space...</div>
      </CompanyLayout>
    );
  }

  if (!activeMembership) {
    return (
      <CompanyLayout>
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
          <div className="max-w-3xl mx-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Company Space</h1>
            <p className="text-[var(--text-secondary)] mb-6">
              You do not have an active company membership yet.
            </p>
            <Link
              to="/companies"
              className="inline-flex items-center px-4 py-2 rounded-[var(--radius-md)] bg-[var(--brand-primary)] text-white hover:opacity-90"
            >
              Browse Companies
            </Link>
          </div>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
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
        </div>

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
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">My Company Challenges</h2>
            <Link to="/problems" className="text-sm text-[var(--brand-primary)] hover:underline">Open Problem Set</Link>
          </div>
          <div className="space-y-3">
            {companyChallenges.length === 0 && (
              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text-secondary)]">
                No challenges available yet.
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
                  <Link to={`/problem/${challenge.id}`}>
                    <Button size="sm" variant="secondary">Open</Button>
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
      </div>
    </CompanyLayout>
  );
}
