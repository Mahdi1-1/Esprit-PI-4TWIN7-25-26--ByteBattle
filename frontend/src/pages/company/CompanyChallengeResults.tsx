import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { companiesService, CompanyMembership } from '../../services/companiesService';
import { challengesService } from '../../services/challengesService';

type ChallengeSubmission = {
  id: string;
  verdict?: string;
  score?: number;
  language?: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export function CompanyChallengeResults() {
  const { id } = useParams<{ id: string }>();
  const [activeMembership, setActiveMembership] = useState<CompanyMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const [memberships, data] = await Promise.all([
          companiesService.getMyCompanies(),
          challengesService.getCompanyChallengeResults(id),
        ]);

        const active = (memberships || []).find(
          (membership) => membership.status === 'active' && membership.company?.status === 'active',
        ) || null;

        setActiveMembership(active);
        setChallengeTitle(data?.challenge?.title || 'Challenge');
        setSubmissions(Array.isArray(data?.submissions) ? data.submissions : []);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Unable to load challenge results');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const groupedByMember = useMemo(() => {
    const map = new Map<string, ChallengeSubmission[]>();
    submissions.forEach((submission) => {
      const list = map.get(submission.user.id) || [];
      list.push(submission);
      map.set(submission.user.id, list);
    });
    return Array.from(map.entries());
  }, [submissions]);

  const isCompanyAdmin = activeMembership?.role !== 'member';

  return (
    <Layout>
      <CompanyNavbar
        companyName={activeMembership?.company?.name || 'Company'}
        userName="Company User"
        userRole={isCompanyAdmin ? 'admin' : 'member'}
      />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Member Results</h1>
            <p className="text-[var(--text-secondary)] mt-1">{challengeTitle}</p>
          </div>
          <Link to="/company/challenges">
            <Button variant="secondary">Back to Challenges</Button>
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            Loading member submissions...
          </div>
        ) : error ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--state-error)]/30 bg-[var(--state-error)]/10 p-6 text-[var(--text-primary)]">
            {Array.isArray(error) ? error[0] : error}
          </div>
        ) : groupedByMember.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            No submissions found for this challenge yet.
          </div>
        ) : (
          <div className="space-y-4">
            {groupedByMember.map(([memberId, rows]) => {
              const member = rows[0].user;
              return (
                <div key={memberId} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--border-default)] bg-[var(--surface-2)]">
                    <div className="font-semibold text-[var(--text-primary)]">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">@{member.username} - {member.email}</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-[var(--border-default)]">
                        <tr>
                          <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Submitted At</th>
                          <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Verdict</th>
                          <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Score</th>
                          <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Language</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((submission) => (
                          <tr key={submission.id} className="border-b border-[var(--border-default)]">
                            <td className="p-3 text-[var(--text-secondary)]">{new Date(submission.createdAt).toLocaleString()}</td>
                            <td className="p-3 text-[var(--text-secondary)]">{submission.verdict || 'N/A'}</td>
                            <td className="p-3 text-[var(--text-secondary)]">{submission.score ?? 0}</td>
                            <td className="p-3 text-[var(--text-secondary)]">{submission.language || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
