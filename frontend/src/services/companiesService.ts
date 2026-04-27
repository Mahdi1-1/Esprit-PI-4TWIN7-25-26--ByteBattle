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
  role: 'member' | 'recruiter' | 'owner';
  status: 'pending' | 'active' | 'rejected';
  joinedAt: string;
  company?: Company;
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
  async getPublicCompanies(): Promise<Company[]> {
    const { data } = await api.get('/companies');
    return data;
  },

  async getMyCompanies(): Promise<CompanyMembership[]> {
    const { data } = await api.get('/companies/my');
    return data;
  },

  async getCurrentCompanyId(): Promise<string | null> {
    try {
      const memberships = await api.get('/companies/my');
      const active = (memberships.data || []).find((m: CompanyMembership) => m.status === 'active');
      return active?.companyId || null;
    } catch {
      return null;
    }
  },

  async joinCompany(companyId: string): Promise<{ success: boolean; membership: CompanyMembership; message: string }> {
    const { data } = await api.post(`/companies/${companyId}/join`);
    return data;
  },

  async joinByCode(code: string): Promise<{ success: boolean; membership: CompanyMembership; message: string }> {
    const { data } = await api.post('/companies/join-code', { code });
    return data;
  },

  async regenerateJoinCode(companyId: string): Promise<{ joinCode: string }> {
    const { data } = await api.post(`/companies/${companyId}/join-code/regenerate`);
    return data;
  },

  async createCompany(dto: { name: string; description?: string; website?: string; industry?: string; size?: string }): Promise<Company> {
    const { data } = await api.post('/companies', dto);
    return data;
  },

  async getMyAnnouncements(): Promise<CompanyAnnouncement[]> {
    const { data } = await api.get('/companies/my/announcements');
    return data;
  },

  async getCompany(companyId: string): Promise<Company> {
    const { data } = await api.get(`/companies/${companyId}`);
    return data;
  },

  async getCompanyMembers(companyId: string) {
    const { data } = await api.get(`/companies/${companyId}/members`);
    return data;
  },

  async getCompanyNotifications(companyId: string) {
    const { data } = await api.get(`/companies/${companyId}/notifications`);
    return data;
  },

  async getCompanyRoadmaps(companyId: string) {
    const { data } = await api.get(`/companies/${companyId}/roadmaps`);
    return data;
  },

  async getCompanyCourses(companyId: string) {
    const { data } = await api.get(`/companies/${companyId}/courses`);
    return data;
  },

  async getCompanyJobs(companyId: string) {
    const { data } = await api.get(`/companies/${companyId}/jobs`);
    return data;
  },
};
