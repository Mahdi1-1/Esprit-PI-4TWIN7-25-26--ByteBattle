import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { companiesService, CompanyMembership } from '../../services/companiesService';
import { hackathonsService } from '../../services/hackathonsService';

export function CompanyCandidateDetails() {
  const { id: candidateUserId } = useParams();

  const [activeMembership, setActiveMembership] = useState<CompanyMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hackathonId, setHackathonId] = useState('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [team, setTeam] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setHackathonId(params.get('hackathonId') || '');
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!candidateUserId) return;

      try {
        setLoading(true);
        setError(null);

        const memberships = await companiesService.getMyCompanies();
        const active = (memberships || []).find(
          (membership) => membership.status === 'active' && membership.company?.status === 'active',
        ) || null;
        setActiveMembership(active);

        if (!hackathonId) {
          setSubmissions([]);
          return;
        }

        const response = await hackathonsService.getEnterpriseCandidateSubmissions(hackathonId, candidateUserId);
        setSubmissions(Array.isArray(response?.submissions) ? response.submissions : []);
        setTeam(response?.team || null);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Unable to load candidate details');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [candidateUserId, hackathonId]);

  const groupedByChallenge = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const submission of submissions) {
      const list = map.get(submission.challengeId) || [];
      list.push(submission);
      map.set(submission.challengeId, list);
    }
    return Array.from(map.entries());
  }, [submissions]);

  const companyRole = activeMembership?.role !== 'member' ? 'admin' : 'member';

  return (
    <Layout>
      <CompanyNavbar
        companyName={activeMembership?.company?.name || 'Company'}
        userName="Company User"
        userRole={companyRole}
      />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Member Submission Details</h1>
            <p className="text-[var(--text-secondary)] mt-1">Member: {candidateUserId || 'N/A'} {team ? `• Team: ${team.name}` : ''}</p>
          </div>
          <Link to={hackathonId ? `/company/challenges/${hackathonId}/candidates` : '/company/candidates'}>
            <Button variant="secondary">Back to Candidates</Button>
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            Loading candidate submissions...
          </div>
        ) : error ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--state-error)]/30 bg-[var(--state-error)]/10 p-6 text-[var(--text-primary)]">
            {Array.isArray(error) ? error[0] : error}
          </div>
        ) : !hackathonId ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            Missing hackathon context. Open this page from the Candidates list.
          </div>
        ) : groupedByChallenge.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            No submissions found for this candidate.
          </div>
        ) : (
          <div className="space-y-4">
            {groupedByChallenge.map(([challengeId, rows]) => (
              <div key={challengeId} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-default)] bg-[var(--surface-2)]">
                  <h2 className="font-semibold text-[var(--text-primary)]">Challenge {challengeId}</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Attempt</th>
                        <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Verdict</th>
                        <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Language</th>
                        <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Tests</th>
                        <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Time</th>
                        <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Memory</th>
                        <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((submission) => (
                        <tr key={submission.id} className="border-t border-[var(--border-default)]">
                          <td className="p-3 text-[var(--text-secondary)]">#{submission.attemptNumber}</td>
                          <td className="p-3 text-[var(--text-secondary)]">{submission.verdict}</td>
                          <td className="p-3 text-[var(--text-secondary)]">{submission.language}</td>
                          <td className="p-3 text-[var(--text-secondary)]">{submission.testsPassed ?? 0}/{submission.testsTotal ?? 0}</td>
                          <td className="p-3 text-[var(--text-secondary)]">{submission.timeMs ?? 'N/A'} ms</td>
                          <td className="p-3 text-[var(--text-secondary)]">{submission.memMb ?? 'N/A'} MB</td>
                          <td className="p-3 text-[var(--text-secondary)]">{submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
