import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { hackathonsService } from '../../services/hackathonsService';
import { companiesService, CompanyMembership } from '../../services/companiesService';

export function CompanyChallengeDetails() {
  const { id } = useParams();
  const [activeMembership, setActiveMembership] = useState<CompanyMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hackathon, setHackathon] = useState<any>(null);

  const isCompanyAdmin = activeMembership?.role !== 'member';

  const getParticipationLink = (status?: string) => {
    if (['active', 'frozen'].includes(status || '')) {
      return `/hackathon/${id}/workspace`;
    }

    if (['ended', 'archived'].includes(status || '')) {
      return `/hackathon/${id}/results`;
    }

    return `/hackathon/${id}/scoreboard`;
  };

  const getParticipationLabel = (status?: string) => {
    if (['active', 'frozen'].includes(status || '')) return 'Enter Workspace';
    if (status === 'lobby') return 'Open Registration';
    if (status === 'checkin') return 'Open Check-in';
    if (['ended', 'archived'].includes(status || '')) return 'View Results';
    return 'Open Scoreboard';
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const [memberships, data] = await Promise.all([
          companiesService.getMyCompanies(),
          hackathonsService.getById(id),
        ]);

        const active = (memberships || []).find(
          (membership) => membership.status === 'active' && membership.company?.status === 'active',
        ) || null;
        setActiveMembership(active);
        setHackathon(data);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Unable to load challenge details');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  return (
    <Layout>
      <CompanyNavbar
        companyName={activeMembership?.company?.name || 'Company'}
        userName="Company User"
        userRole={isCompanyAdmin ? 'admin' : 'member'}
      />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        {loading ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            Loading challenge details...
          </div>
        ) : error ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--state-error)]/30 bg-[var(--state-error)]/10 p-6 text-[var(--text-primary)]">
            {Array.isArray(error) ? error[0] : error}
          </div>
        ) : !hackathon ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            Challenge not found.
          </div>
        ) : (
          <div className="max-w-4xl mx-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">{hackathon.title || 'Untitled challenge'}</h1>
            <p className="text-[var(--text-secondary)] mt-2">{hackathon.description || 'No description'}</p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-3">
                <div className="text-[var(--text-muted)]">Status</div>
                <div className="font-medium text-[var(--text-primary)]">{hackathon.status}</div>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-3">
                <div className="text-[var(--text-muted)]">Scope</div>
                <div className="font-medium text-[var(--text-primary)]">{hackathon.scope}</div>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-3">
                <div className="text-[var(--text-muted)]">Start</div>
                <div className="font-medium text-[var(--text-primary)]">{hackathon.startTime ? new Date(hackathon.startTime).toLocaleString() : 'N/A'}</div>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-3">
                <div className="text-[var(--text-muted)]">End</div>
                <div className="font-medium text-[var(--text-primary)]">{hackathon.endTime ? new Date(hackathon.endTime).toLocaleString() : 'N/A'}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={getParticipationLink(hackathon.status)}>
                <Button variant="primary">{getParticipationLabel(hackathon.status)}</Button>
              </Link>
              {isCompanyAdmin && (
                <Link to={`/company/challenges/${hackathon.id}/candidates`}>
                  <Button variant="secondary">View Candidates</Button>
                </Link>
              )}
              <Link to="/company/challenges">
                <Button variant="secondary">Back to Challenges</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
