import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { companiesService, CompanyMembership } from '../../services/companiesService';
import { hackathonsService } from '../../services/hackathonsService';

type EnterpriseCandidate = {
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImage?: string | null;
  };
  team: { id: string; name: string } | null;
  stats: {
    submissionCount: number;
    acceptedCount: number;
    solvedChallengeCount: number;
    attemptedChallengeCount: number;
    lastSubmissionAt: string | null;
  };
};

type HackathonItem = {
  id: string;
  title?: string;
  status: string;
  companyId?: string;
};

export function CompanyCandidatesList() {
  const { id: routeHackathonId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMembership, setActiveMembership] = useState<CompanyMembership | null>(null);
  const [hackathons, setHackathons] = useState<HackathonItem[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [candidates, setCandidates] = useState<EnterpriseCandidate[]>([]);

  const loadBase = async () => {
    const [memberships, response] = await Promise.all([
      companiesService.getMyCompanies(),
      hackathonsService.getAll({ scope: 'enterprise', limit: 100 }),
    ]);

    const active =
      (memberships || []).find(
        (membership) => membership.status === 'active' && membership.company?.status === 'active',
      ) || null;
    setActiveMembership(active);

    if (!active?.companyId) {
      setHackathons([]);
      setSelectedHackathonId('');
      return;
    }

    const rows = (Array.isArray(response?.data) ? response.data : []).filter(
      (row: HackathonItem) => row.companyId === active.companyId,
    );

    setHackathons(rows);

    const preferredId =
      routeHackathonId && rows.some((row: HackathonItem) => row.id === routeHackathonId)
        ? routeHackathonId
        : rows[0]?.id || '';

    setSelectedHackathonId(preferredId);
  };

  const loadCandidates = async (hackathonId: string) => {
    if (!hackathonId) {
      setCandidates([]);
      return;
    }

    const response = await hackathonsService.getEnterpriseCandidates(hackathonId);
    setCandidates(Array.isArray(response?.candidates) ? response.candidates : []);
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        await loadBase();
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Unable to load enterprise candidates');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [routeHackathonId]);

  useEffect(() => {
    const run = async () => {
      if (!selectedHackathonId) {
        setCandidates([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        await loadCandidates(selectedHackathonId);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Unable to load candidates for this challenge');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [selectedHackathonId]);

  const selectedHackathon = useMemo(
    () => hackathons.find((hackathon) => hackathon.id === selectedHackathonId) || null,
    [hackathons, selectedHackathonId],
  );

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
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Members</h1>
            <p className="text-[var(--text-secondary)] mt-1">Review enterprise member results by challenge.</p>
          </div>
          <Link to="/company/challenges">
            <Button variant="secondary">Back to Challenges</Button>
          </Link>
        </div>

        {!activeMembership?.companyId ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            You need an active company membership to view candidates.
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
            <label className="block text-sm space-y-2">
              <span className="font-medium text-[var(--text-primary)]">Challenge</span>
              <select
                value={selectedHackathonId}
                onChange={(event) => setSelectedHackathonId(event.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)]"
              >
                {hackathons.map((hackathon) => (
                  <option key={hackathon.id} value={hackathon.id}>
                    {(hackathon.title || 'Untitled challenge')} ({hackathon.status})
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {loading ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            Loading candidates...
          </div>
        ) : error ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--state-error)]/30 bg-[var(--state-error)]/10 p-6 text-[var(--text-primary)]">
            {Array.isArray(error) ? error[0] : error}
          </div>
        ) : !selectedHackathon ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            No enterprise challenges available.
          </div>
        ) : candidates.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            No candidates found for this challenge.
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-2)] border-b border-[var(--border-default)]">
                  <tr>
                    <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Member</th>
                    <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Team</th>
                    <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Submissions</th>
                    <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Solved</th>
                    <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Last Submission</th>
                    <th className="text-left p-3 font-semibold text-[var(--text-primary)]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate.user.id} className="border-b border-[var(--border-default)]">
                      <td className="p-3">
                        <div className="font-medium text-[var(--text-primary)]">
                          {candidate.user.firstName} {candidate.user.lastName}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          @{candidate.user.username} � {candidate.user.email}
                        </div>
                      </td>
                      <td className="p-3 text-[var(--text-secondary)]">{candidate.team?.name || 'N/A'}</td>
                      <td className="p-3 text-[var(--text-secondary)]">{candidate.stats.submissionCount}</td>
                      <td className="p-3 text-[var(--text-secondary)]">{candidate.stats.solvedChallengeCount}</td>
                      <td className="p-3 text-[var(--text-secondary)]">
                        {candidate.stats.lastSubmissionAt
                          ? new Date(candidate.stats.lastSubmissionAt).toLocaleString()
                          : 'N/A'}
                      </td>
                      <td className="p-3">
                        <Link
                          to={`/company/candidates/${candidate.user.id}?hackathonId=${encodeURIComponent(
                            selectedHackathonId,
                          )}`}
                        >
                          <Button size="sm" variant="secondary">
                            Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
