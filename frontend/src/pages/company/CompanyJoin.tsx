import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../../components/Layout';
import { companiesService, CompanyMembership } from '../../services/companiesService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Building2, Check, X } from 'lucide-react';
import { Button } from '../../components/Button';

export function CompanyJoin() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [memberships, setMemberships] = useState<CompanyMembership[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<CompanyMembership[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const [creatingCompany, setCreatingCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    slug: '',
    website: '',
    domain: '',
  });

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated) {
        setMemberships([]);
        setPendingInvitations([]);
        return;
      }

      try {
        setLoading(true);
        const [myMemberships, invitations] = await Promise.all([
          companiesService.getMyCompanies(),
          companiesService.getMyInvitations(),
        ]);

        setMemberships(myMemberships || []);
        setPendingInvitations(invitations || []);
      } catch {
        setMemberships([]);
        setPendingInvitations([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated]);

  const activeMembership = useMemo(
    () => memberships.find((membership) => membership.status === 'active' && membership.company?.status === 'active') || null,
    [memberships],
  );

  const pendingAdminAdmission = useMemo(
    () => memberships.find((membership) => membership.status === 'pending' && membership.role === 'admin') || null,
    [memberships],
  );

  const rejectedMembership = useMemo(
    () => memberships.find((membership) => membership.status === 'rejected') || null,
    [memberships],
  );

  const suspendedMembership = useMemo(
    () => memberships.find((membership) => membership.status === 'suspended' || membership.company?.status === 'suspended') || null,
    [memberships],
  );

  const canCreateCompanyRequest = !activeMembership && !pendingAdminAdmission;

  const withAction = async (key: string, action: () => Promise<void>) => {
    try {
      setActionLoading((prev) => ({ ...prev, [key]: true }));
      await action();
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleAcceptInvitation = async (invitation: CompanyMembership) => {
    await withAction(`accept:${invitation.id}`, async () => {
      try {
        const membership = await companiesService.acceptInvitation(invitation.companyId);
        toast.success(`Joined ${membership.company?.name || 'company'}`);
        navigate('/company/overview');
      } catch (error: any) {
        const message = error?.response?.data?.message || 'Could not accept invitation';
        toast.error(Array.isArray(message) ? message[0] : message);
      }
    });
  };

  const handleRejectInvitation = async (invitation: CompanyMembership) => {
    await withAction(`reject:${invitation.id}`, async () => {
      try {
        await companiesService.rejectInvitation(invitation.companyId);
        setPendingInvitations((prev) => prev.filter((item) => item.id !== invitation.id));
        toast.success('Invitation declined');
      } catch (error: any) {
        const message = error?.response?.data?.message || 'Could not reject invitation';
        toast.error(Array.isArray(message) ? message[0] : message);
      }
    });
  };

  const handleCreateCompany = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in first to request company admission.');
      return;
    }

    if (!newCompany.name.trim() || !newCompany.slug.trim()) {
      toast.error('Company name and slug are required');
      return;
    }

    try {
      setCreatingCompany(true);
      const membership = await companiesService.createCompany({
        name: newCompany.name.trim(),
        slug: newCompany.slug.trim().toLowerCase(),
        website: newCompany.website.trim() || undefined,
        domain: newCompany.domain.trim() || undefined,
      });

      setMemberships((prev) => [membership, ...prev.filter((m) => m.id !== membership.id)]);
      toast.success('Company admission request sent. Platform admin approval is required.');
      setNewCompany({ name: '', slug: '', website: '', domain: '' });
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Could not create company request';
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setCreatingCompany(false);
    }
  };

  return (
    <Layout>
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <div className="max-w-3xl mx-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 sm:p-8 shadow-lg">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
            <Building2 className="h-3.5 w-3.5" />
            Website invitations
          </div>
          <h1 className="mt-4 text-3xl font-bold text-[var(--text-primary)]">Company invitations</h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Company admins invite users by username inside the platform. Accept or reject invitations here.
          </p>

          <div className="mt-6 space-y-4">
            {!isAuthenticated && (
              <div className="rounded-[var(--radius-md)] border border-[var(--state-info)]/30 bg-[var(--state-info)]/10 px-4 py-3 text-sm text-[var(--text-secondary)]">
                Sign in first to manage your company invitations.
              </div>
            )}

            {activeMembership?.company && (
              <div className="rounded-[var(--radius-md)] border border-[var(--state-success)]/30 bg-[var(--state-success)]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
                <span className="font-semibold">Active membership:</span> {activeMembership.company.name} ({activeMembership.role})
              </div>
            )}

            {pendingAdminAdmission?.company && (
              <div className="rounded-[var(--radius-md)] border border-[var(--state-info)]/30 bg-[var(--state-info)]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
                <span className="font-semibold">Company admission pending:</span> {pendingAdminAdmission.company.name} is waiting for platform admin approval.
              </div>
            )}

            {loading && isAuthenticated && (
              <div className="text-sm text-[var(--text-secondary)]">Loading invitations...</div>
            )}

            {isAuthenticated && pendingInvitations.length === 0 && !loading && (
              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                No pending invitations right now.
              </div>
            )}

            {pendingInvitations.length > 0 && (
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4 flex items-center justify-between gap-3 flex-wrap"
                  >
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">
                        {invitation.company?.name || 'Company'}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        Role on accept: {invitation.role}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1"
                        loading={!!actionLoading[`accept:${invitation.id}`]}
                        onClick={() => handleAcceptInvitation(invitation)}
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                        loading={!!actionLoading[`reject:${invitation.id}`]}
                        onClick={() => handleRejectInvitation(invitation)}
                      >
                        <X className="w-4 h-4" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isAuthenticated && activeMembership && (
              <Button variant="secondary" onClick={() => navigate('/company/overview')}>
                Open company portal
              </Button>
            )}

            {isAuthenticated && !activeMembership && pendingAdminAdmission && (
              <div className="text-xs text-[var(--text-muted)]">
                Company portal access becomes available after platform approval.
              </div>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 sm:p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Create a company admission request</h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            For company admins. Your company will be reviewed by a platform admin before activation.
          </p>

          {!canCreateCompanyRequest ? (
            <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--state-warning)]/30 bg-[var(--state-warning)]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
              You already have an active or pending company admin flow. The company creation form is hidden until this flow is resolved.
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block space-y-2 text-sm md:col-span-2">
                  <span className="font-medium text-[var(--text-primary)]">Company name</span>
                  <input
                    value={newCompany.name}
                    onChange={(event) => setNewCompany((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="ByteBattle Labs"
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)] outline-none ring-0 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                  />
                </label>

                <label className="block space-y-2 text-sm">
                  <span className="font-medium text-[var(--text-primary)]">Slug</span>
                  <input
                    value={newCompany.slug}
                    onChange={(event) => {
                      const sanitized = event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
                      setNewCompany((prev) => ({ ...prev, slug: sanitized }));
                    }}
                    placeholder="bytebattle-labs"
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)] outline-none ring-0 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                  />
                </label>

                <label className="block space-y-2 text-sm">
                  <span className="font-medium text-[var(--text-primary)]">Domain (optional)</span>
                  <input
                    value={newCompany.domain}
                    onChange={(event) => setNewCompany((prev) => ({ ...prev, domain: event.target.value }))}
                    placeholder="bytebattle.com"
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)] outline-none ring-0 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                  />
                </label>

                <label className="block space-y-2 text-sm md:col-span-2">
                  <span className="font-medium text-[var(--text-primary)]">Website (optional)</span>
                  <input
                    value={newCompany.website}
                    onChange={(event) => setNewCompany((prev) => ({ ...prev, website: event.target.value }))}
                    placeholder="https://bytebattle.com"
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)] outline-none ring-0 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                  />
                </label>
              </div>

              <div className="mt-4 text-xs text-[var(--text-muted)]">
                After approval, your admin membership becomes active and you can invite users by username from the company portal.
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="primary"
                  loading={creatingCompany}
                  onClick={handleCreateCompany}
                  disabled={!newCompany.name.trim() || !newCompany.slug.trim()}
                >
                  Submit admission request
                </Button>
                <Button type="button" variant="secondary" onClick={() => navigate('/companies')}>
                  Stay on invitations/status
                </Button>
              </div>
            </>
          )}

          {rejectedMembership?.company && (
            <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--state-error)]/30 bg-[var(--state-error)]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
              <span className="font-semibold">Last rejected request:</span> {rejectedMembership.company.name}. You can submit a new request.
            </div>
          )}

          {suspendedMembership?.company && (
            <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--state-warning)]/30 bg-[var(--state-warning)]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
              <span className="font-semibold">Suspended:</span> {suspendedMembership.company.name}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
