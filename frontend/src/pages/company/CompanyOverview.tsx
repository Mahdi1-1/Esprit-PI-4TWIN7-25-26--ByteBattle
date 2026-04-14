import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { companiesService, CompanyMembership } from '../../services/companiesService';
import { challengesService } from '../../services/challengesService';
import { Briefcase, Users, CheckCircle2, TrendingUp } from 'lucide-react';

type ChallengeItem = {
  id: string;
  title?: string;
  difficulty?: string;
  tags?: string[];
  createdAt?: string;
  submissionCount?: number;
};

export function CompanyOverview() {
  const [activeMembership, setActiveMembership] = useState<CompanyMembership | null>(null);
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const memberships = await companiesService.getMyCompanies();
        const active =
          (memberships || []).find(
            (membership) => membership.status === 'active' && membership.company?.status === 'active',
          ) || null;
        setActiveMembership(active);

        if (!active?.companyId) {
          setChallenges([]);
          setTotalSubmissions(0);
          return;
        }

        const isAdmin = active.role !== 'member';
        const response = await challengesService.getCompanyChallenges();
        const rows = Array.isArray(response) ? response : [];
        setChallenges(rows);

        if (isAdmin && rows.length > 0) {
          let totalSubs = 0;
          for (const challenge of rows) {
            try {
              const resultsResponse = await challengesService.getCompanyChallengeResults(challenge.id);
              const submissions = Array.isArray(resultsResponse?.submissions) ? resultsResponse.submissions : [];
              totalSubs += submissions.length;
            } catch (e) {
              // Skip if no access or error
            }
          }
          setTotalSubmissions(totalSubs);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const avgSubmissionsPerChallenge =
    challenges.length > 0 ? Math.round((totalSubmissions / challenges.length) * 10) / 10 : 0;

  const isCompanyAdmin = activeMembership?.role !== 'member';

  return (
    <Layout>
      <CompanyNavbar
        companyName={activeMembership?.company?.name || 'Company'}
        userName="Company User"
        userRole={isCompanyAdmin ? 'admin' : 'member'}
      />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Company Dashboard
            </h1>
            <p className="text-[var(--text-secondary)]">
              Company challenges and member activity overview.
            </p>
          </div>
        </div>

        {!activeMembership?.companyId ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            You need an active company membership to access this dashboard.
          </div>
        ) : loading ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            Loading company analytics...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                label="Company Challenges"
                value={String(challenges.length)}
                icon={<Briefcase className="w-6 h-6" />}
              />
              <StatCard
                label="Total Submissions"
                value={String(totalSubmissions)}
                icon={<CheckCircle2 className="w-6 h-6" />}
              />
              <StatCard
                label="Avg Submissions/Challenge"
                value={String(avgSubmissionsPerChallenge)}
                icon={<TrendingUp className="w-6 h-6" />}
              />
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 space-y-4">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Company Challenges
              </h2>
              {challenges.length === 0 ? (
                <p className="text-[var(--text-secondary)]">
                  No challenges available. Create your first challenge to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {challenges.slice(0, 5).map((challenge) => (
                    <div
                      key={challenge.id}
                      className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4 flex items-center justify-between gap-3 flex-wrap"
                    >
                      <div>
                        <div className="font-semibold text-[var(--text-primary)]">
                          {challenge.title || 'Untitled challenge'}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          Difficulty: {challenge.difficulty || 'N/A'} · Submissions: {challenge.submissionCount || 0}
                        </div>
                      </div>
                      {isCompanyAdmin ? (
                        <Link to={`/company/challenges/${challenge.id}/results`}>
                          <Button size="sm" variant="secondary">
                            View Results
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/problem/${challenge.id}`}>
                          <Button size="sm" variant="primary">
                            Solve
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6">
      <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-2xl font-bold text-[var(--text-primary)]">{value}</div>
      <div className="text-sm text-[var(--text-secondary)] mt-1">{label}</div>
    </div>
  );
}
