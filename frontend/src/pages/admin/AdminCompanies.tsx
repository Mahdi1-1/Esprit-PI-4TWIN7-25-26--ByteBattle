import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { companiesService, type Company } from '../../services/companiesService';
import { Building2, CheckCircle2, XCircle, Loader, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function AdminCompanies() {
  const [pendingCompanies, setPendingCompanies] = useState<Company[]>([]);
  const [managedCompanies, setManagedCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const [pending, all] = await Promise.all([
        companiesService.getPendingCompanyAdmissions(),
        companiesService.getAdminCompanies(),
      ]);

      setPendingCompanies(Array.isArray(pending) ? pending : []);
      setManagedCompanies(
        (Array.isArray(all) ? all : []).filter((company) => company.status !== 'pending'),
      );
    } catch {
      toast.error('Unable to load company administration data');
      setPendingCompanies([]);
      setManagedCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const withAction = async (key: string, action: () => Promise<void>) => {
    try {
      setActionLoading((prev) => ({ ...prev, [key]: true }));
      await action();
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleApprove = async (company: Company) => {
    await withAction(`approve:${company.id}`, async () => {
      try {
        const updated = await companiesService.approveCompanyAdmission(company.id);
        setPendingCompanies((prev) => prev.filter((item) => item.id !== company.id));
        setManagedCompanies((prev) => [updated, ...prev.filter((item) => item.id !== company.id)]);
        toast.success(`${company.name} approved`);
      } catch (error: any) {
        const message = error?.response?.data?.message || `Failed to approve ${company.name}`;
        toast.error(Array.isArray(message) ? message[0] : message);
      }

      await loadCompanies();
    });
  };

  const handleReject = async (company: Company) => {
    await withAction(`reject:${company.id}`, async () => {
      try {
        const updated = await companiesService.rejectCompanyAdmission(company.id);
        setPendingCompanies((prev) => prev.filter((item) => item.id !== company.id));
        setManagedCompanies((prev) => [updated, ...prev.filter((item) => item.id !== company.id)]);
        toast.success(`${company.name} rejected`);
      } catch (error: any) {
        const message = error?.response?.data?.message || `Failed to reject ${company.name}`;
        toast.error(Array.isArray(message) ? message[0] : message);
      }

      await loadCompanies();
    });
  };

  const handleSuspend = async (company: Company) => {
    await withAction(`suspend:${company.id}`, async () => {
      try {
        const updated = await companiesService.suspendCompany(company.id);
        setManagedCompanies((prev) => prev.map((item) => (item.id === company.id ? updated : item)));
        toast.success(`${company.name} suspended`);
      } catch (error: any) {
        const message = error?.response?.data?.message || `Failed to suspend ${company.name}`;
        toast.error(Array.isArray(message) ? message[0] : message);
      }

      await loadCompanies();
    });
  };

  const handleReactivate = async (company: Company) => {
    await withAction(`reactivate:${company.id}`, async () => {
      try {
        const updated = await companiesService.reactivateCompany(company.id);
        setManagedCompanies((prev) => prev.map((item) => (item.id === company.id ? updated : item)));
        toast.success(`${company.name} reactivated`);
      } catch (error: any) {
        const message = error?.response?.data?.message || `Failed to reactivate ${company.name}`;
        toast.error(Array.isArray(message) ? message[0] : message);
      }

      await loadCompanies();
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Company Admissions</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Review pending company requests before activating them on the platform.
            </p>
          </div>
          <button
            type="button"
            onClick={loadCompanies}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <ShieldCheck className="w-4 h-4 text-[var(--brand-primary)]" />
            <span>
              Pending requests: {pendingCompanies.length} · Existing companies: {managedCompanies.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-10 text-center">
            <Loader className="w-6 h-6 mx-auto animate-spin text-[var(--brand-primary)]" />
            <p className="mt-3 text-sm text-[var(--text-secondary)]">Loading company administration data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Pending Admissions</h2>
              {pendingCompanies.length === 0 ? (
                <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text-secondary)]">
                  No pending company admission requests.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingCompanies.map((company) => (
              <div
                key={company.id}
                className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-lg font-semibold text-[var(--text-primary)]">{company.name}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Slug: {company.slug}</div>
                    {company.domain && (
                      <div className="text-sm text-[var(--text-secondary)]">Domain: {company.domain}</div>
                    )}
                    {company.website && (
                      <div className="text-sm text-[var(--text-secondary)]">Website: {company.website}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(company)}
                      disabled={
                        !!actionLoading[`approve:${company.id}`] ||
                        !!actionLoading[`reject:${company.id}`] ||
                        !!actionLoading[`suspend:${company.id}`] ||
                        !!actionLoading[`reactivate:${company.id}`]
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--state-success)] text-white text-sm font-medium disabled:opacity-60"
                    >
                      {actionLoading[`approve:${company.id}`] ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(company)}
                      disabled={
                        !!actionLoading[`approve:${company.id}`] ||
                        !!actionLoading[`reject:${company.id}`] ||
                        !!actionLoading[`suspend:${company.id}`] ||
                        !!actionLoading[`reactivate:${company.id}`]
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--state-error)] text-white text-sm font-medium disabled:opacity-60"
                    >
                      {actionLoading[`reject:${company.id}`] ? <Loader className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Reject
                    </button>
                  </div>
                </div>
              </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Existing Companies</h2>
              {managedCompanies.length === 0 ? (
                <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text-secondary)]">
                  No existing companies to manage.
                </div>
              ) : (
                <div className="space-y-4">
                  {managedCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-5"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-lg font-semibold text-[var(--text-primary)]">{company.name}</div>
                          <div className="text-sm text-[var(--text-secondary)]">Slug: {company.slug}</div>
                          <div className="text-sm text-[var(--text-secondary)]">Status: {company.status}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          {company.status === 'active' ? (
                            <button
                              type="button"
                              onClick={() => handleSuspend(company)}
                              disabled={
                                !!actionLoading[`approve:${company.id}`] ||
                                !!actionLoading[`reject:${company.id}`] ||
                                !!actionLoading[`suspend:${company.id}`] ||
                                !!actionLoading[`reactivate:${company.id}`]
                              }
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--state-warning)] text-white text-sm font-medium disabled:opacity-60"
                            >
                              {actionLoading[`suspend:${company.id}`] ? <Loader className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                              Suspend
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReactivate(company)}
                              disabled={
                                !!actionLoading[`approve:${company.id}`] ||
                                !!actionLoading[`reject:${company.id}`] ||
                                !!actionLoading[`suspend:${company.id}`] ||
                                !!actionLoading[`reactivate:${company.id}`]
                              }
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--state-success)] text-white text-sm font-medium disabled:opacity-60"
                            >
                              {actionLoading[`reactivate:${company.id}`] ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              Reactivate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
