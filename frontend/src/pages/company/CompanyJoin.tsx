import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../../components/Layout';
import { CompanyLayout } from '../../components/company/CompanyLayout';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { companiesService, Company, CompanyMembership } from '../../services/companiesService';
import { toast } from 'react-hot-toast';
import { Building2, Globe, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';

type MembershipStatus = CompanyMembership['status'] | 'none';

export function CompanyJoin() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [memberships, setMemberships] = useState<CompanyMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [allCompanies, myMemberships] = await Promise.all([
          companiesService.getPublicCompanies(),
          companiesService.getMyCompanies(),
        ]);
        setCompanies(allCompanies || []);
        setMemberships(myMemberships || []);
      } catch {
        toast.error('Unable to load companies');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const membershipsByCompanyId = useMemo(() => {
    const map = new Map<string, CompanyMembership>();
    memberships.forEach((m) => map.set(m.companyId, m));
    return map;
  }, [memberships]);

  const getMembershipStatus = (companyId: string): MembershipStatus => {
    return membershipsByCompanyId.get(companyId)?.status || 'none';
  };

  const activeMembership = useMemo(
    () => memberships.find((m) => m.status === 'active') || null,
    [memberships],
  );

  const handleJoin = async (companyId: string) => {
    try {
      setJoiningId(companyId);
      const result = await companiesService.joinCompany(companyId);
      setMemberships((prev) => {
        const withoutCurrent = prev.filter((m) => m.companyId !== companyId);
        return [result.membership, ...withoutCurrent];
      });
      toast.success(result.message || 'Join request sent');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Could not join company';
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <CompanyLayout>
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Join Existing Companies</h1>
          <p className="text-[var(--text-secondary)]">Browse active companies and join one according to its join policy.</p>
        </div>

        {activeMembership?.company && (
          <div className="rounded-[var(--radius-lg)] border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-[var(--text-primary)]">
              <span className="font-semibold">Membership active:</span> You are a member of <span className="font-semibold">{activeMembership.company.name}</span>.
            </div>
            <Link to="/company-space">
              <Button variant="primary" size="sm">Open Company Space</Button>
            </Link>
          </div>
        )}

        {loading ? (
          <div className="text-[var(--text-secondary)]">Loading companies...</div>
        ) : companies.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            No active companies found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {companies.map((company) => {
              const membershipStatus = getMembershipStatus(company.id);
              const isMember = membershipStatus === 'active';
              const isPending = membershipStatus === 'pending';
              const isBusy = joiningId === company.id;

              return (
                <div key={company.id} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-[var(--text-primary)]">{company.name}</h2>
                        <p className="text-xs text-[var(--text-muted)]">{company.slug}</p>
                      </div>
                    </div>
                    <Badge variant="default">{company.joinPolicy}</Badge>
                  </div>

                  <div className="text-sm text-[var(--text-secondary)] space-y-1">
                    {company.domain && (
                      <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" />{company.domain}</div>
                    )}
                    {company.website && (
                      <div className="flex items-center gap-2"><Globe className="w-4 h-4" />{company.website}</div>
                    )}
                  </div>

                  {isMember ? (
                    <div className="space-y-2">
                      <div className="flex justify-end">
                        <Badge variant="easy">Member</Badge>
                      </div>
                      <Button variant="secondary" className="w-full" disabled>
                        Already joined
                      </Button>
                    </div>
                  ) : isPending ? (
                    <Button variant="secondary" className="w-full" disabled>
                      Request pending
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-full"
                      loading={isBusy}
                      onClick={() => handleJoin(company.id)}
                    >
                      Join company
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
