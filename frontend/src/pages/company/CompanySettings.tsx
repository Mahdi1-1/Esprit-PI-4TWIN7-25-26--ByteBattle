import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { companiesService, CompanyMembership } from '../../services/companiesService';
import { toast } from 'react-hot-toast';

export function CompanySettings() {
  const [activeMembership, setActiveMembership] = useState<CompanyMembership | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [domain, setDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [joinPolicy, setJoinPolicy] = useState<'open' | 'approval' | 'invite_only'>('approval');

  useEffect(() => {
    const load = async () => {
      try {
        const memberships = await companiesService.getMyCompanies();
        const active = (memberships || []).find(
          (membership) => membership.status === 'active' && membership.company?.status === 'active',
        ) || null;

        setActiveMembership(active);

        if (active?.company) {
          setName(active.company.name || '');
          setWebsite(active.company.website || '');
          setDomain(active.company.domain || '');
          setLogoUrl(active.company.logoUrl || '');
          setJoinPolicy((active.company.joinPolicy || 'approval') as 'open' | 'approval' | 'invite_only');
        }
      } catch {
        setActiveMembership(null);
      }
    };

    load();
  }, []);

  const handleSave = async () => {
    if (!activeMembership?.companyId) {
      toast.error('No active company found');
      return;
    }

    try {
      setLoading(true);
      const updated = await companiesService.updateCompany(activeMembership.companyId, {
        name: name.trim() || undefined,
        website: website.trim() || undefined,
        domain: domain.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        joinPolicy,
      });

      setActiveMembership((prev) => {
        if (!prev) return prev;
        return { ...prev, company: updated };
      });

      toast.success('Company settings updated');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to update company settings';
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <CompanyNavbar
        companyName={activeMembership?.company?.name || 'Company'}
        userName="Company User"
        userRole={activeMembership?.role !== 'member' ? 'admin' : 'member'}
      />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        <div className="max-w-3xl mx-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 sm:p-8 space-y-4">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Company Settings</h1>

          {!activeMembership?.companyId ? (
            <p className="text-[var(--text-secondary)]">Active company membership is required.</p>
          ) : (
            <>
              <label className="block space-y-2 text-sm">
                <span className="font-medium text-[var(--text-primary)]">Company name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)]" />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block space-y-2 text-sm">
                  <span className="font-medium text-[var(--text-primary)]">Website</span>
                  <input value={website} onChange={(event) => setWebsite(event.target.value)} className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)]" />
                </label>

                <label className="block space-y-2 text-sm">
                  <span className="font-medium text-[var(--text-primary)]">Domain</span>
                  <input value={domain} onChange={(event) => setDomain(event.target.value)} className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)]" />
                </label>
              </div>

              <label className="block space-y-2 text-sm">
                <span className="font-medium text-[var(--text-primary)]">Logo URL</span>
                <input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)]" />
              </label>

              <label className="block space-y-2 text-sm">
                <span className="font-medium text-[var(--text-primary)]">Join policy</span>
                <select
                  value={joinPolicy}
                  onChange={(event) => setJoinPolicy(event.target.value as 'open' | 'approval' | 'invite_only')}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)]"
                >
                  <option value="open">open</option>
                  <option value="approval">approval</option>
                  <option value="invite_only">invite_only</option>
                </select>
              </label>

              <div className="pt-2">
                <Button variant="primary" loading={loading} onClick={handleSave}>Save Changes</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
