import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { companiesService, CompanyMembership } from '../../services/companiesService';
import { toast } from 'react-hot-toast';

export function CompanyMembers() {
  const [activeMembership, setActiveMembership] = useState<CompanyMembership | null>(null);
  const [members, setMembers] = useState<CompanyMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const memberships = await companiesService.getMyCompanies();
      const active = (memberships || []).find(
        (membership) => membership.status === 'active' && membership.company?.status === 'active',
      ) || null;
      setActiveMembership(active);

      if (!active?.companyId) {
        setMembers([]);
        return;
      }

      const rows = await companiesService.getCompanyMembers(active.companyId);
      setMembers(rows || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Unable to load company members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visibleMembers = useMemo(
    () => members.filter((member) => member.role !== 'admin'),
    [members],
  );
  const pending = useMemo(
    () => visibleMembers.filter((member) => member.status === 'pending'),
    [visibleMembers],
  );
  const active = useMemo(
    () => visibleMembers.filter((member) => member.status === 'active'),
    [visibleMembers],
  );
  const suspended = useMemo(
    () => visibleMembers.filter((member) => member.status === 'suspended'),
    [visibleMembers],
  );

  const withAction = async (key: string, action: () => Promise<void>) => {
    try {
      setActionLoading((prev) => ({ ...prev, [key]: true }));
      await action();
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const companyId = activeMembership?.companyId;
  const isCompanyAdmin = activeMembership?.role === 'admin';

  const onApprove = async (member: CompanyMembership) => {
    if (!companyId) return;
    await withAction(`approve:${member.id}`, async () => {
      await companiesService.approveMembership(companyId, member.userId);
      toast.success('Member approved');
      await load();
    });
  };

  const onReject = async (member: CompanyMembership) => {
    if (!companyId) return;
    await withAction(`reject:${member.id}`, async () => {
      await companiesService.rejectMembership(companyId, member.userId);
      toast.success('Member rejected');
      await load();
    });
  };

  const onSuspend = async (member: CompanyMembership) => {
    if (!companyId) return;
    await withAction(`suspend:${member.id}`, async () => {
      await companiesService.suspendMembership(companyId, member.userId);
      toast.success('Member suspended');
      await load();
    });
  };

  const onRemove = async (member: CompanyMembership) => {
    if (!companyId) return;
    await withAction(`remove:${member.id}`, async () => {
      await companiesService.removeMembership(companyId, member.userId);
      toast.success('Member removed');
      await load();
    });
  };

  const onInvite = async () => {
    if (!companyId || !isCompanyAdmin) return;
    const username = inviteUsername.trim();
    if (!username) {
      toast.error('Username is required');
      return;
    }

    try {
      setInviteLoading(true);
      await companiesService.inviteUserByUsername(companyId, { username, role: 'member' });
      toast.success(`Invitation sent to @${username}`);
      setInviteUsername('');
      await load();
    } catch (e: any) {
      const message = e?.response?.data?.message || 'Unable to send invitation';
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <Layout>
      <CompanyNavbar
        companyName={activeMembership?.company?.name || 'Company'}
        userName="Company User"
        userRole={(activeMembership?.role === 'admin' ? 'admin' : 'member') as 'admin' | 'member'}
      />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Company Members</h1>
        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          Admin handles enterprise challenge management and candidate evaluation. Member participates in company activities. Pending users are sent invitations waiting for user acceptance; admins can cancel invites here. Company admins are hidden from this page.
        </div>

        {companyId && isCompanyAdmin && (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-4 space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Invite User</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Invite users by username to join your company.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <input
                value={inviteUsername}
                onChange={(event) => setInviteUsername(event.target.value)}
                placeholder="username"
                className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)]"
              />
            </div>
            <div>
              <Button variant="secondary" loading={inviteLoading} onClick={onInvite}>
                Send Invitation
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            Loading members...
          </div>
        ) : error ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--state-error)]/30 bg-[var(--state-error)]/10 p-6 text-[var(--text-primary)]">
            {Array.isArray(error) ? error[0] : error}
          </div>
        ) : !companyId ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-[var(--text-secondary)]">
            You need an active company membership to manage members.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Section
              title={`Pending (${pending.length})`}
              members={pending}
              actions={(member) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" loading={!!actionLoading[`reject:${member.id}`]} onClick={() => onReject(member)}>Cancel Invite</Button>
                </div>
              )}
            />

            <Section
              title={`Active (${active.length})`}
              members={active}
              actions={(member) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" loading={!!actionLoading[`suspend:${member.id}`]} onClick={() => onSuspend(member)}>Suspend</Button>
                  <Button size="sm" variant="destructive" loading={!!actionLoading[`remove:${member.id}`]} onClick={() => onRemove(member)}>Remove</Button>
                </div>
              )}
            />

            <Section
              title={`Suspended (${suspended.length})`}
              members={suspended}
              actions={(member) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" loading={!!actionLoading[`approve:${member.id}`]} onClick={() => onApprove(member)}>Reactivate</Button>
                  <Button size="sm" variant="destructive" loading={!!actionLoading[`remove:${member.id}`]} onClick={() => onRemove(member)}>Remove</Button>
                </div>
              )}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}

function Section({
  title,
  members,
  actions,
}: {
  title: string;
  members: CompanyMembership[];
  actions: (member: CompanyMembership) => React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-4 space-y-3">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      {members.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No members.</p>
      ) : (
        members.map((member) => (
          <div key={member.id} className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] p-3 space-y-2">
            <div>
              <div className="font-medium text-[var(--text-primary)]">{member.user?.username || member.user?.email || 'Unknown user'}</div>
              <div className="text-xs text-[var(--text-secondary)]">Role: {member.role}</div>
            </div>
            {actions(member)}
          </div>
        ))
      )}
    </div>
  );
}
