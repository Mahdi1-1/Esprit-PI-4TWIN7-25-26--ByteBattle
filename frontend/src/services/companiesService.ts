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

  async joinCompany(companyId: string): Promise<{ success: boolean; membership: CompanyMembership; message: string }> {
    const { data } = await api.post(`/companies/${companyId}/join`);
    return data;
  },

  async getMyAnnouncements(): Promise<CompanyAnnouncement[]> {
    const { data } = await api.get('/companies/my/announcements');
    return data;
  },
};
