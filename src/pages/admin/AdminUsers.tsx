import { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
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
import { adminUsers, AdminUser } from '../../data/adminData';
import { Search, Filter, MoreVertical, Ban, RotateCcw, Shield, Trash2, Eye } from 'lucide-react';

export function AdminUsers() {
  const [users] = useState<AdminUser[]>(adminUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  } | null>(null);
  const itemsPerPage = 10;

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
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
      action: () => {
        console.log('Ban user:', user.id);
        setConfirmModal(null);
      }
    });
  };

  const handleDeleteUser = (user: AdminUser) => {
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
              <option value="ACTIVE">Active</option>
              <option value="BANNED">Banned</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="LOCKED">Locked</option>
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
                                onClick={() => setShowActionMenu(null)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-2)] flex items-center gap-2 text-[var(--text-secondary)]"
                              >
                                <Shield className="w-4 h-4" />
                                Grant Role
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
