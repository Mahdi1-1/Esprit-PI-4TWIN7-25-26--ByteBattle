import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { companiesService, CompanyMembership } from '../../services/companiesService';
import { hackathonsService } from '../../services/hackathonsService';
import { toast } from 'react-hot-toast';

type HackathonItem = {
  id: string;
  title?: string;
  companyId?: string;
};

export function CompanyExports() {
  const [activeMembership, setActiveMembership] = useState<CompanyMembership | null>(null);
  const [hackathons, setHackathons] = useState<HackathonItem[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [memberships, response] = await Promise.all([
          companiesService.getMyCompanies(),
          hackathonsService.getAll({ scope: 'enterprise', limit: 100 }),
        ]);

        const active = (memberships || []).find(
          (membership) => membership.status === 'active' && membership.company?.status === 'active',
        ) || null;
        setActiveMembership(active);

        const rows = (Array.isArray(response?.data) ? response.data : []).filter(
          (row: HackathonItem) => row.companyId === active?.companyId,
        );
        setHackathons(rows);
        setSelectedHackathonId(rows[0]?.id || '');
      } catch {
        setHackathons([]);
      }
    };

    load();
  }, []);

  const companyRole = activeMembership?.role !== 'member' ? 'admin' : 'member';

  const exportCandidatesJson = async () => {
    if (!selectedHackathonId) {
      toast.error('Select a challenge first');
      return;
    }

    try {
      setLoading(true);
      const response = await hackathonsService.getEnterpriseCandidates(selectedHackathonId);
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enterprise-candidates-${selectedHackathonId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export generated');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to export candidates';
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
        userRole={companyRole}
      />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        <div className="max-w-3xl mx-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 sm:p-8 space-y-4">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Exports & Reports</h1>
          <p className="text-[var(--text-secondary)]">Download enterprise member report data for your selected challenge.</p>

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-[var(--text-primary)]">Challenge</span>
            <select
              value={selectedHackathonId}
              onChange={(event) => setSelectedHackathonId(event.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)]"
            >
              {hackathons.map((hackathon) => (
                <option key={hackathon.id} value={hackathon.id}>{hackathon.title || 'Untitled challenge'}</option>
              ))}
            </select>
          </label>

          <Button variant="primary" loading={loading} onClick={exportCandidatesJson}>
            Export Candidates JSON
          </Button>
        </div>
      </div>
    </Layout>
  );
}
