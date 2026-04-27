import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import api from '../../api/axios';
import {
  RoleChip,
  StatusChip,
  FilterBar,
  Pagination,
  EmptyState,
  TableSkeleton,
  ConfirmModal,
  Breadcrumb
} from '../../components/admin/AdminComponents';
import { type AdminUser as BaseAdminUser } from '../../data/adminData';
import { Search, Filter, MoreVertical, Ban, RotateCcw, Shield, Trash2, Eye, Check } from 'lucide-react';

interface AdminUser extends BaseAdminUser {
  flags: { anticheat: number; reports: number };
}

type Role = 'user' | 'moderator' | 'admin';

const ROLES: { value: Role; label: string; color: string; bg: string; description: string }[] = [
  {
    value: 'user',
    label: 'User',
    color: 'text-[var(--text-secondary)]',
    bg: 'bg-[var(--surface-2)]',
    description: 'Standard access — can participate in challenges, duels and discussions.',
  },
  {
    value: 'moderator',
    label: 'Moderator',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    description: 'Can manage reports, pin/remove discussions, and moderate content.',
  },
  {
    value: 'admin',
    label: 'Admin',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    description: 'Full platform access — users, challenges, hackathons, settings.',
  },
];

// ─── Role Change Modal ────────────────────────────────────────
function RoleModal({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUser;
  onClose: () => void;
  onSuccess: (userId: string, newRole: Role) => void;
}) {
  const [selected, setSelected] = useState<Role>((user.role as unknown as Role) ?? 'user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unchanged = selected === (user.role as unknown as Role);

  const handleApply = async () => {
    if (unchanged) return;
    setLoading(true);
    setError(null);
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role: selected });
      onSuccess(user.id, selected);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to change role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center shrink-0">
              <span className="text-white font-bold">{user.username[0].toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Change Role</h2>
              <p className="text-xs text-[var(--text-muted)]">{user.username} · {user.email}</p>
            </div>
          </div>
        </div>

        {/* Role list */}
        <div className="px-6 py-4 space-y-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => setSelected(r.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                selected === r.value
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10'
                  : 'border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]'
              }`}
            >
              {/* Role badge */}
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${r.bg} ${r.color} w-24 text-center`}>
                {r.label}
              </span>
              <span className="flex-1 text-xs text-[var(--text-secondary)]">{r.description}</span>
              {selected === r.value && (
                <Check className="w-4 h-4 text-[var(--brand-primary)] shrink-0" />
              )}
            </button>
          ))}
        </div>

        {error && (
          <p className="mx-6 mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={unchanged || loading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--brand-primary)] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Apply Role
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<AdminUser | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  } | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', {
        params: {
          page: currentPage,
          limit: itemsPerPage
        }
      });
      // AdminUser interface might need adjustment to match API response
      const mappedUsers = response.data.data.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status || 'active',
        level: u.level || 1,
        elo: u.elo || 1000,
        flags: { anticheat: 0, reports: 0 }, // Backend doesn't provide this yet
        lastActive: u.createdAt, // Using createdAt as placeholder
        joinedAt: u.createdAt
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleBanUser = (user: AdminUser) => {
    setConfirmModal({
      isOpen: true,
      title: 'Ban User',
      message: `Are you sure you want to ban ${user.username}? They will lose access to the platform.`,
      action: async () => {
        try {
          await api.patch(`/users/${user.id}/status`, { status: "banned" });
          fetchUsers(); // Refresh list
          setConfirmModal(null);
        } catch (error) {
          console.error("Error banning user:", error);
        }
      }
    });
  };

  const handleDeleteUser = (user: AdminUser) => {
    // Delete endpoint usually not exposed or is dangerous. Assuming logic exists or handled differently.
    // For now logging only or calling a hypothetical delete endpoint if available.
    setConfirmModal({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to permanently delete ${user.username}? This action cannot be undone.`,
      action: () => {
        console.log('Delete user:', user.id);
        setConfirmModal(null);
      }
    });
  };

  // Optimistically update role in local state after successful API call
  const handleRoleSuccess = (userId: string, newRole: Role) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole as unknown as typeof u.role } : u))
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <Breadcrumb items={[{ label: 'Admin' }, { label: 'Users' }]} />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Users Management</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {filteredUsers.length} users total
              </p>
            </div>
            <button className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity">
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <FilterBar>
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--text-muted)]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--text-muted)]" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] outline-none"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </FilterBar>

        {/* Table */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--surface-2)] border-b border-[var(--border-default)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Elo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Flags
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {user.username[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">
                            {user.username}
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <RoleChip role={user.role} />
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-[var(--text-primary)]">
                      {user.level}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-[var(--text-primary)]">
                      {user.elo}
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip status={user.status} type="user" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-xs">
                        {user.flags.anticheat > 0 && (
                          <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded border border-red-500/30">
                            AC: {user.flags.anticheat}
                          </span>
                        )}
                        {user.flags.reports > 0 && (
                          <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded border border-orange-500/30">
                            Rep: {user.flags.reports}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-1.5 hover:bg-[var(--surface-3)] rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-[var(--text-secondary)]" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowActionMenu(showActionMenu === user.id ? null : user.id)
                            }
                            className="p-1.5 hover:bg-[var(--surface-3)] rounded transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-[var(--text-secondary)]" />
                          </button>
                          {showActionMenu === user.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg shadow-lg z-10">
                              <button
                                onClick={() => {
                                  handleBanUser(user);
                                  setShowActionMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-2)] flex items-center gap-2 text-[var(--text-secondary)]"
                              >
                                <Ban className="w-4 h-4" />
                                Ban User
                              </button>
                              <button
                                onClick={() => setShowActionMenu(null)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-2)] flex items-center gap-2 text-[var(--text-secondary)]"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Reset Password
                              </button>
                              <button
                                onClick={() => {
                                  setRoleModalUser(user);
                                  setShowActionMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-2)] flex items-center gap-2 text-[var(--text-secondary)]"
                              >
                                <Shield className="w-4 h-4" />
                                Change Role
                              </button>
                              <div className="border-t border-[var(--border-default)]" />
                              <button
                                onClick={() => {
                                  handleDeleteUser(user);
                                  setShowActionMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-2)] flex items-center gap-2 text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete User
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredUsers.length}
            itemsPerPage={itemsPerPage}
          />
        </div>

        {/* Empty State */}
        {paginatedUsers.length === 0 && (
          <EmptyState
            icon="🔍"
            title="No users found"
            description="Try adjusting your search or filter criteria"
          />
        )}
      </div>

      {/* Role Modal */}
      {roleModalUser && (
        <RoleModal
          user={roleModalUser}
          onClose={() => setRoleModalUser(null)}
          onSuccess={handleRoleSuccess}
        />
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          danger={confirmModal.title.includes('Delete') || confirmModal.title.includes('Ban')}
          onConfirm={confirmModal.action}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </AdminLayout>
  );
}
