import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { companiesService, CompanyMembership } from '../../services/companiesService';
import { challengesService } from '../../services/challengesService';

type ChallengeItem = {
  id: string;
  title?: string;
  difficulty?: string;
};

type ChallengeSubmission = {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  verdict: string;
  score?: number;
  language?: string;
  createdAt: string;
};

type ChallengeResults = {
  challenge: ChallengeItem;
  submissions: ChallengeSubmission[];
};

export function CompanyCandidates() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMembership, setActiveMembership] = useState<CompanyMembership | null>(null);
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [results, setResults] = useState<ChallengeResults | null>(null);

  const loadChallenges = async () => {
    try {
      const response = await challengesService.getCompanyChallenges();
      const rows = Array.isArray(response) ? response : [];
      setChallenges(rows);
      return rows;
    } catch (e: any) {
      throw new Error(e?.response?.data?.message || 'Unable to load company challenges');
    }
  };

  const loadResults = async (challengeId: string) => {
    if (!challengeId) {
      setResults(null);
      return;
    }

    try {
      const response = await challengesService.getCompanyChallengeResults(challengeId);
      setResults(response || null);
    } catch (e: any) {
      throw new Error(e?.response?.data?.message || 'Unable to load challenge results');
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const memberships = await companiesService.getMyCompanies();
        const active =
          (memberships || []).find(
            (membership) => membership.status === 'active' && membership.company?.status === 'active',
          ) || null;
        setActiveMembership(active);

        if (!active?.companyId) {
          setChallenges([]);
          setSelectedChallengeId('');
          setResults(null);
          return;
        }

        const rows = await loadChallenges();
        const preferredId = rows[0]?.id || '';
        setSelectedChallengeId(preferredId);
      } catch (e: any) {
        setError(e?.message || 'Unable to load data');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!selectedChallengeId) {
        setResults(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        await loadResults(selectedChallengeId);
      } catch (e: any) {
        setError(e?.message || 'Unable to load challenge results');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [selectedChallengeId]);

  const groupedByMember = useMemo(() => {
    if (!results?.submissions) return [];
    
    const map = new Map<string, ChallengeSubmission[]>();
    results.submissions.forEach((submission) => {
      const userId = submission.user.id;
      if (!map.has(userId)) {
        map.set(userId, []);
      }
      map.get(userId)!.push(submission);
    });
    
    return Array.from(map.entries()).map(([userId, subs]) => ({
      userId,
      user: subs[0].user,
      submissions: subs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }));
  }, [results?.submissions]);

  const companyRole = activeMembership?.role !== 'member' ? 'admin' : 'member';

  return (
    <Layout>
      <CompanyNavbar
        companyName={activeMembership?.company?.name || 'Company'}
        userName="Company User"
        userRole={companyRole}
      />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Member Submissions</h1>
            <p className="text-[var(--text-secondary)] mt-1">Review member submissions and results by challenge.</p>
          </div>
          <Link to="/company/challenges">
            <Button variant="secondary">Back to Challenges</Button>
          </Link>
        </div>

        {!activeMembership?.companyId ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            You need an active company membership to view member submissions.
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
            <label className="block text-sm space-y-2">
              <span className="font-medium text-[var(--text-primary)]">Challenge</span>
              <select
                value={selectedChallengeId}
                onChange={(event) => setSelectedChallengeId(event.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)]"
              >
                <option value="">Select a challenge...</option>
                {challenges.map((challenge) => (
                  <option key={challenge.id} value={challenge.id}>
                    {challenge.title || 'Untitled challenge'} (Difficulty: {challenge.difficulty || 'N/A'})
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {loading ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            Loading submissions...
          </div>
        ) : error ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--state-error)]/30 bg-[var(--state-error)]/10 p-6 text-[var(--text-primary)]">
            {error}
          </div>
        ) : !selectedChallengeId ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            No challenges available or select a challenge to view submissions.
          </div>
        ) : groupedByMember.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            No submissions found for this challenge yet.
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByMember.map(({ userId, user, submissions }) => (
              <div key={userId} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] overflow-hidden">
                <div className="bg-[var(--surface-2)] px-6 py-4 border-b border-[var(--border-default)]">
                  <div className="font-semibold text-[var(--text-primary)]">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    @{user.username} · {user.email}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--surface-2)] border-b border-[var(--border-default)]">
                      <tr>
                        <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Submission Date</th>
                        <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Verdict</th>
                        <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Score</th>
                        <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Language</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((submission) => (
                        <tr key={submission.id} className="border-b border-[var(--border-default)]">
                          <td className="p-3 text-[var(--text-secondary)]">
                            {new Date(submission.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                submission.verdict === 'ACCEPTED'
                                  ? 'bg-[var(--state-success)]/20 text-[var(--state-success)]'
                                  : 'bg-[var(--state-error)]/20 text-[var(--state-error)]'
                              }`}
                            >
                              {submission.verdict || 'PENDING'}
                            </span>
                          </td>
                          <td className="p-3 text-[var(--text-secondary)]">
                            {submission.score !== undefined ? `${submission.score}%` : 'N/A'}
                          </td>
                          <td className="p-3 text-[var(--text-secondary)]">
                            {submission.language || 'N/A'}
                          </td>
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
