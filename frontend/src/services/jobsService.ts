import api from '../api/axios';

export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship';
export type JobStatus = 'active' | 'closed';

export interface CompanyJob {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requirements: string[];
  salaryRange?: string;
  location?: string;
  type: JobType;
  status: JobStatus;
  applicants: string[];
  createdAt: string;
  company?: {
    id: string;
    name: string;
    logo?: string;
  };
}

export interface JobApplication {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    profileImage?: string;
    level: number;
    elo: number;
    solvedCount?: number;
  };
  jobId: string;
  status: 'pending' | 'shortlisted' | 'rejected' | 'hired';
  appliedAt: string;
  notes?: string;
}

export interface CreateJobDto {
  title: string;
  description: string;
  requirements: string[];
  salaryRange?: string;
  location?: string;
  type: JobType;
}

export interface PublicJob extends CompanyJob {}

export const jobsService = {
  async getCompanyJobs(companyId: string): Promise<CompanyJob[]> {
    const { data } = await api.get(`/companies/${companyId}/jobs`);
    return data;
  },

  async getJob(jobId: string): Promise<CompanyJob> {
    const { data } = await api.get(`/jobs/${jobId}`);
    return data;
  },

  async createJob(companyId: string, dto: CreateJobDto): Promise<CompanyJob> {
    const { data } = await api.post(`/companies/${companyId}/jobs`, dto);
    return data;
  },

  async updateJob(jobId: string, dto: {
    title?: string;
    description?: string;
    requirements?: string[];
    salaryRange?: string;
    location?: string;
    type?: JobType;
    status?: JobStatus;
  }): Promise<CompanyJob> {
    const { data } = await api.patch(`/jobs/${jobId}`, dto);
    return data;
  },

  async deleteJob(jobId: string): Promise<void> {
    await api.delete(`/jobs/${jobId}`);
  },

  async applyToJob(jobId: string): Promise<void> {
    await api.post(`/jobs/${jobId}/apply`);
  },

  async getJobApplications(jobId: string): Promise<JobApplication[]> {
    const { data } = await api.get(`/jobs/${jobId}/applications`);
    return data;
  },

  async updateApplicationStatus(jobId: string, userId: string, status: 'shortlisted' | 'rejected' | 'hired', notes?: string): Promise<JobApplication> {
    const { data } = await api.patch(`/jobs/${jobId}/applications/${userId}/status`, { status, notes });
    return data;
  },

  async getPublicJobs(filters?: { companyId?: string; type?: JobType; location?: string; search?: string }): Promise<PublicJob[]> {
    const params = new URLSearchParams();
    if (filters?.companyId) params.append('companyId', filters.companyId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.search) params.append('search', filters.search);
    const { data } = await api.get(`/jobs/public?${params.toString()}`);
    return data;
  },

  async getAllPublicJobs(page = 1, limit = 20): Promise<{ jobs: PublicJob[]; total: number }> {
    const { data } = await api.get(`/jobs/public?page=${page}&limit=${limit}`);
    return data;
  },
};