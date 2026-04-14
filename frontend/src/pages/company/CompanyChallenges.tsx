import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { companiesService, CompanyMembership } from '../../services/companiesService';
import { challengesService } from '../../services/challengesService';
import { CalendarDays, Plus, RefreshCw } from 'lucide-react';

type ChallengeItem = {
  id: string;
  title?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  status: string;
  kind?: 'CODE' | 'CANVAS';
  createdAt?: string;
  _count?: { submissions?: number };
};

export function CompanyChallenges() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMembership, setActiveMembership] = useState<CompanyMembership | null>(null);
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const [memberships, response] = await Promise.all([
        companiesService.getMyCompanies(),
        challengesService.getCompanyChallenges(),
      ]);

      const active = (memberships || []).find(
        (membership) => membership.status === 'active' && membership.company?.status === 'active',
      ) || null;

      setActiveMembership(active);

      if (!active?.companyId) {
        setChallenges([]);
        return;
      }

      const rows = Array.isArray(response) ? response : [];
      setChallenges(rows);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Unable to load private company challenges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(
    () => [...challenges].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
    [challenges],
  );

  const isCompanyAdmin = activeMembership?.role !== 'member';

  return (
    <Layout>
      <CompanyNavbar
        companyName={activeMembership?.company?.name || 'Company'}
        userName="Company User"
        userRole={isCompanyAdmin ? 'admin' : 'member'}
      />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Private Company Challenges</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              {isCompanyAdmin
                ? 'Create and manage private coding challenges for your company members.'
                : 'Solve private coding challenges created by your company admin.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="gap-2" onClick={load}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            {isCompanyAdmin && (
              <Link to="/company/challenges/create">
                <Button variant="primary" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Challenge
                </Button>
              </Link>
            )}
          </div>
        </div>

        {!activeMembership?.companyId ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            You need an active company membership to view private company challenges.
          </div>
        ) : loading ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            Loading challenges...
          </div>
        ) : error ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--state-error)]/30 bg-[var(--state-error)]/10 p-6 text-[var(--text-primary)]">
            {Array.isArray(error) ? error[0] : error}
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            No private challenges available right now.
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((challenge) => (
              <div key={challenge.id} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">{challenge.title || 'Untitled challenge'}</h2>
                    <div className="mt-3 flex items-center gap-4 text-xs text-[var(--text-muted)] flex-wrap">
                      <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {challenge.createdAt ? new Date(challenge.createdAt).toLocaleString() : 'N/A'}</span>
                      <span>Difficulty: {challenge.difficulty || 'N/A'}</span>
                      <span>Submissions: {challenge._count?.submissions || 0}</span>
                      <span>Status: {challenge.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCompanyAdmin ? (
                      <>
                        <Link to={`/company/challenges/${challenge.id}/results`}>
                          <Button variant="primary" size="sm">View Results</Button>
                        </Link>
                        <Link to={`/problem/${challenge.id}`}>
                          <Button variant="secondary" size="sm">View Statement</Button>
                        </Link>
                      </>
                    ) : (
                      <Link to={`/problem/${challenge.id}`}>
                        <Button variant="primary" size="sm">Solve</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
