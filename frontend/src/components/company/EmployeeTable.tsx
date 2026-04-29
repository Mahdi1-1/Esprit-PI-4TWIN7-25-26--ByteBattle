import { useState, useMemo } from 'react';
import { Avatar } from '../ui/avatar';
import { Button } from '../Button';
import { Input } from '../Input';
import { 
  Search, 
  MoreHorizontal, 
  ChevronDown, 
  User, 
  Shield, 
  Crown,
  Trash2,
  ArrowUpDown
} from 'lucide-react';
import { CompanyMember, CompanyRole, CompanyTeam, companyService } from '../../services/companyService';

interface EmployeeTableProps {
  members: CompanyMember[];
  teams: CompanyTeam[];
  companyId: string;
  currentUserRole: CompanyRole;
  onMemberRemoved: (memberId: string) => void;
  onRoleChanged: (memberId: string, newRole: CompanyRole) => void;
  onTeamAssigned: (memberId: string, teamId: string | null) => void;
}

const roleLabels: Record<CompanyRole, string> = {
  owner: 'Owner',
  recruiter: 'Recruiter',
  member: 'Employee'
};

const roleColors: Record<CompanyRole, string> = {
  owner: 'bg-[var(--brand-primary)]/20 text-[var(--brand-primary)]',
  recruiter: 'bg-[var(--state-info)]/20 text-[var(--state-info)]',
  member: 'bg-[var(--text-muted)]/20 text-[var(--text-secondary)]'
};

export function EmployeeTable({ members, teams, companyId, currentUserRole, onMemberRemoved, onRoleChanged, onTeamAssigned }: EmployeeTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<CompanyRole | 'all'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'username' | 'elo' | 'level'>('username');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const canManage = currentUserRole === 'owner' || currentUserRole === 'recruiter';
  const isOwner = currentUserRole === 'owner';

  const filteredMembers = useMemo(() => {
    return members
      .filter(member => {
        const matchesSearch = member.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
        const matchesRole = roleFilter === 'all' || member.role === roleFilter;
        const matchesTeam = teamFilter === 'all' || member.teamId === teamFilter || (teamFilter === 'none' && !member.teamId);
        return matchesSearch && matchesRole && matchesTeam;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'username') {
          comparison = (a.user?.username || '').localeCompare(b.user?.username || '');
        } else if (sortBy === 'elo') {
          comparison = (a.user?.elo || 0) - (b.user?.elo || 0);
        } else if (sortBy === 'level') {
          comparison = (a.user?.level || 0) - (b.user?.level || 0);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [members, searchQuery, roleFilter, teamFilter, sortBy, sortOrder]);

  const handleSort = (column: 'username' | 'elo' | 'level') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleRoleChange = async (member: CompanyMember, newRole: CompanyRole) => {
    if (member.role === newRole) return;
    setActionLoading(member.id);
    try {
      await companyService.updateMemberRole(companyId, member.userId, newRole);
      onRoleChanged(member.id, newRole);
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setActionLoading(null);
      setOpenDropdownId(null);
    }
  };

  const handleRemove = async (member: CompanyMember) => {
    if (!confirm(`Are you sure you want to remove ${member.user?.username || 'this user'} from the company?`)) return;
    setActionLoading(member.id);
    try {
      await companyService.removeMember(companyId, member.userId);
      onMemberRemoved(member.id);
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setActionLoading(null);
      setOpenDropdownId(null);
    }
  };

  const getRoleIcon = (role: CompanyRole) => {
    if (role === 'owner') return <Crown className="w-3 h-3" />;
    if (role === 'recruiter') return <Shield className="w-3 h-3" />;
    return <User className="w-3 h-3" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as CompanyRole | 'all')}
          className="px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
        >
          <option value="all">All Roles</option>
          <option value="owner">Owners</option>
          <option value="recruiter">Recruiters</option>
          <option value="member">Employees</option>
        </select>
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
        >
          <option value="all">All Teams</option>
          <option value="none">No Team</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="text-left p-4 text-sm font-medium text-[var(--text-secondary)]">
                <button 
                  className="flex items-center gap-1 hover:text-[var(--text-primary)]"
                  onClick={() => handleSort('username')}
                >
                  Employee
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left p-4 text-sm font-medium text-[var(--text-secondary)]">Role</th>
              <th className="text-left p-4 text-sm font-medium text-[var(--text-secondary)]">Team</th>
              <th className="text-left p-4 text-sm font-medium text-[var(--text-secondary)]">
                <button 
                  className="flex items-center gap-1 hover:text-[var(--text-primary)]"
                  onClick={() => handleSort('level')}
                >
                  Level
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left p-4 text-sm font-medium text-[var(--text-secondary)]">
                <button 
                  className="flex items-center gap-1 hover:text-[var(--text-primary)]"
                  onClick={() => handleSort('elo')}
                >
                  ELO
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left p-4 text-sm font-medium text-[var(--text-secondary)]">Solved</th>
              {canManage && <th className="text-right p-4 text-sm font-medium text-[var(--text-secondary)]">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id} className="border-b border-[var(--border-default)] hover:bg-[var(--surface-2)]">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {member.user?.profileImage ? (
                      <img 
                        src={member.user.profileImage} 
                        alt={member.user.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)]/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-[var(--brand-primary)]" />
                      </div>
                    )}
                    <span className="font-medium text-[var(--text-primary)]">{member.user?.username || 'Unknown User'}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleColors[member.role]}`}>
                    {getRoleIcon(member.role)}
                    {roleLabels[member.role]}
                  </span>
                </td>
                <td className="p-4 text-[var(--text-primary)]">
                  {member.team?.name || <span className="text-[var(--text-muted)]">Unassigned</span>}
                </td>
                <td className="p-4 text-[var(--text-primary)]">{member.user?.level || '-'}</td>
                <td className="p-4 text-[var(--text-primary)]">{member.user?.elo || '-'}</td>
                <td className="p-4 text-[var(--text-secondary)]">{member.user?.solvedCount || 0}</td>
                {canManage && (
                  <td className="p-4 text-right">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpenDropdownId(openDropdownId === member.id ? null : member.id)}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === member.id ? (
                          <span className="w-4 h-4 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <MoreHorizontal className="w-4 h-4" />
                        )}
                      </Button>
                      {openDropdownId === member.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-lg z-10">
                          {member.role !== 'owner' && (
                            <>
                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-2)] text-[var(--text-primary)] flex items-center gap-2"
                                onClick={() => handleRoleChange(member, 'recruiter')}
                                disabled={!isOwner && member.role === 'recruiter'}
                              >
                                <Shield className="w-4 h-4" />
                                Make Recruiter
                              </button>
                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-2)] text-[var(--text-primary)] flex items-center gap-2"
                                onClick={() => handleRoleChange(member, 'member')}
                              >
                                <User className="w-4 h-4" />
                                Make Employee
                              </button>
                            </>
                          )}
                          {isOwner && member.role !== 'owner' && (
                            <button
                              className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--surface-2)] text-[var(--state-error)] flex items-center gap-2"
                              onClick={() => handleRemove(member)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          )}
                          {canManage && teams.length > 0 && (
                            <>
                              <div className="border-t border-[var(--border-default)] my-1" />
                              <div className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)]">Assign Team</div>
                              {member.teamId && (
                                <button
                                  className="w-full px-4 py-1 flex items-center gap-2 text-left text-sm hover:bg-[var(--surface-2)] text-[var(--text-primary)]"
                                  onClick={async () => {
                                    setActionLoading(member.id);
                                    try {
                                      await companyService.assignMemberToTeam(companyId, member.userId, null);
                                      onTeamAssigned(member.id, null);
                                    } catch(e) { console.error(e); }
                                    finally { setActionLoading(null); setOpenDropdownId(null); }
                                  }}
                                >
                                  Clear Team
                                </button>
                              )}
                              {teams.map(t => (
                                <button
                                  key={t.id}
                                  className={`w-full px-4 py-1 text-left text-sm hover:bg-[var(--surface-2)] ${member.teamId === t.id ? 'font-bold text-[var(--brand-primary)]' : 'text-[var(--text-primary)]'} flex justify-between items-center`}
                                  onClick={async () => {
                                    setActionLoading(member.id);
                                    try {
                                      await companyService.assignMemberToTeam(companyId, member.userId, t.id);
                                      onTeamAssigned(member.id, t.id);
                                    } catch(e) { console.error(e); }
                                    finally { setActionLoading(null); setOpenDropdownId(null); }
                                  }}
                                >
                                  {t.name}
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-8 text-[var(--text-secondary)]">
          No employees found matching your criteria.
        </div>
      )}
    </div>
  );
}