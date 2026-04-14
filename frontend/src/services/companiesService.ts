import api from '../api/axios';

export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  website?: string;
  domain?: string;
  status: string;
  joinPolicy: 'open' | 'approval' | 'invite_only';
}

export interface CompanyMembership {
  id: string;
  companyId: string;
  userId: string;
  role: 'member' | 'recruiter' | 'admin';
  status: 'pending' | 'active' | 'rejected' | 'suspended';
  joinedAt: string;
  user?: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImage?: string | null;
  };
  company?: Company;
}

export interface CreateCompanyPayload {
  name: string;
  slug: string;
  website?: string;
  domain?: string;
  logoUrl?: string;
  joinPolicy?: 'open' | 'approval' | 'invite_only';
}

export interface InviteUserToCompanyPayload {
  username: string;
  role?: 'member';
}

export interface UpdateCompanyPayload {
  name?: string;
  website?: string;
  domain?: string;
  logoUrl?: string;
  joinPolicy?: 'open' | 'approval' | 'invite_only';
}

export interface CompanyAnnouncement {
  id: string;
  type: 'hackathon_announcement';
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  hackathonId: string;
  companyId: string | null;
}

export const companiesService = {
  async createCompany(payload: CreateCompanyPayload): Promise<CompanyMembership> {
    const { data } = await api.post('/companies', payload);
    return data;
  },

  async getMyCompanies(): Promise<CompanyMembership[]> {
    const { data } = await api.get('/companies/my');
    return data;
  },

  async getMyInvitations(): Promise<CompanyMembership[]> {
    const { data } = await api.get('/companies/my/invitations');
    return data;
  },

  async inviteUserByUsername(companyId: string, payload: InviteUserToCompanyPayload): Promise<CompanyMembership> {
    const { data } = await api.post(`/companies/${companyId}/invitations`, payload);
    return data;
  },

  async updateCompany(companyId: string, payload: UpdateCompanyPayload): Promise<Company> {
    const { data } = await api.patch(`/companies/${companyId}`, payload);
    return data;
  },

  async acceptInvitation(companyId: string): Promise<CompanyMembership> {
    const { data } = await api.post(`/companies/${companyId}/invitations/accept`);
    return data;
  },

  async rejectInvitation(companyId: string): Promise<CompanyMembership> {
    const { data } = await api.post(`/companies/${companyId}/invitations/reject`);
    return data;
  },

  async leaveCompany(companyId: string): Promise<{ success: boolean }> {
    const { data } = await api.post(`/companies/${companyId}/leave`);
    return data;
  },

  async getCompanyMembers(companyId: string): Promise<CompanyMembership[]> {
    const { data } = await api.get(`/companies/${companyId}/members`);
    return data;
  },

  async approveMembership(companyId: string, userId: string): Promise<CompanyMembership> {
    const { data } = await api.post(`/companies/${companyId}/members/${userId}/approve`);
    return data;
  },

  async rejectMembership(companyId: string, userId: string): Promise<CompanyMembership> {
    const { data } = await api.post(`/companies/${companyId}/members/${userId}/reject`);
    return data;
  },

  async suspendMembership(companyId: string, userId: string): Promise<CompanyMembership> {
    const { data } = await api.post(`/companies/${companyId}/members/${userId}/suspend`);
    return data;
  },

  async removeMembership(companyId: string, userId: string): Promise<{ success: boolean }> {
    const { data } = await api.delete(`/companies/${companyId}/members/${userId}`);
    return data;
  },

  async updateMemberRole(
    companyId: string,
    userId: string,
    role: CompanyMembership['role'],
  ): Promise<CompanyMembership> {
    const { data } = await api.patch(`/companies/${companyId}/members/${userId}/role`, { role });
    return data;
  },

  async getMyAnnouncements(): Promise<CompanyAnnouncement[]> {
    const { data } = await api.get('/companies/my/announcements');
    return data;
  },

  async getPendingCompanyAdmissions(): Promise<Company[]> {
    const { data } = await api.get('/companies/admin/pending');
    return data;
  },

  async getAdminCompanies(status?: string): Promise<Company[]> {
    const { data } = await api.get('/companies/admin', { params: { status } });
    return data;
  },

  async approveCompanyAdmission(companyId: string): Promise<Company> {
    const { data } = await api.post(`/companies/admin/${companyId}/approve`);
    return data;
  },

  async rejectCompanyAdmission(companyId: string): Promise<Company> {
    const { data } = await api.post(`/companies/admin/${companyId}/reject`);
    return data;
  },

  async suspendCompany(companyId: string): Promise<Company> {
    const { data } = await api.post(`/companies/admin/${companyId}/suspend`);
    return data;
  },

  async reactivateCompany(companyId: string): Promise<Company> {
    const { data } = await api.post(`/companies/admin/${companyId}/reactivate`);
    return data;
  },
};
