import { CompanyRole } from '../services/companyService';

export type EffectiveCompanyRole = CompanyRole | 'guest';

export interface CompanyPermissions {
  canViewCandidates: boolean;
  canManageMembers: boolean;
  canViewReports: boolean;
  canOpenSettings: boolean;
  canGenerateInviteCode: boolean;
  canCreateChallenges: boolean;
}

export interface CompanyNavLink {
  label: string;
  to: string;
  visibleFor: EffectiveCompanyRole[];
}

const COMPANY_NAV_LINKS: CompanyNavLink[] = [
  { label: 'Overview', to: '/company/overview', visibleFor: ['owner', 'recruiter'] },
  { label: 'Challenges', to: '/company/company-challenges', visibleFor: ['owner', 'recruiter', 'member', 'guest'] },
  { label: 'Roadmaps', to: '/company/roadmaps', visibleFor: ['owner', 'recruiter', 'member', 'guest'] },
  { label: 'Candidates', to: '/company/candidates', visibleFor: ['owner', 'recruiter'] },
  { label: 'Members', to: '/company/members', visibleFor: ['owner', 'recruiter'] },
  { label: 'Teams', to: '/company/teams', visibleFor: ['owner', 'recruiter'] },
];

const ROLE_PERMISSIONS: Record<EffectiveCompanyRole, CompanyPermissions> = {
  owner: {
    canViewCandidates: true,
    canManageMembers: true,
    canViewReports: true,
    canOpenSettings: true,
    canGenerateInviteCode: true,
    canCreateChallenges: true,
  },
  recruiter: {
    canViewCandidates: true,
    canManageMembers: true,
    canViewReports: true,
    canOpenSettings: false,
    canGenerateInviteCode: true,
    canCreateChallenges: true,
  },
  member: {
    canViewCandidates: false,
    canManageMembers: false,
    canViewReports: false,
    canOpenSettings: false,
    canGenerateInviteCode: false,
    canCreateChallenges: false,
  },
  guest: {
    canViewCandidates: false,
    canManageMembers: false,
    canViewReports: false,
    canOpenSettings: false,
    canGenerateInviteCode: false,
    canCreateChallenges: false,
  },
};

export function getEffectiveCompanyRole(role?: CompanyRole | null): EffectiveCompanyRole {
  return role ?? 'guest';
}

export function getCompanyPermissions(role?: CompanyRole | null): CompanyPermissions {
  return ROLE_PERMISSIONS[getEffectiveCompanyRole(role)];
}

export function getVisibleCompanyNavLinks(role?: CompanyRole | null): CompanyNavLink[] {
  const effectiveRole = getEffectiveCompanyRole(role);
  return COMPANY_NAV_LINKS.filter((link) => link.visibleFor.includes(effectiveRole));
}
