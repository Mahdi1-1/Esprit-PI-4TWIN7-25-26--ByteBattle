import api from '../api/axios';

export interface Candidate {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    profileImage?: string;
    level: number;
    elo: number;
    solvedCount?: number;
    badges?: {
      id: string;
      name: string;
      iconUrl: string;
    }[];
  };
  stats: {
    totalSolved: number;
    easy: number;
    medium: number;
    hard: number;
    totalSubmissions: number;
    acceptanceRate: number;
  };
  recentSubmissions?: {
    id: string;
    challengeTitle: string;
    verdict: string;
    createdAt: string;
  }[];
  appliedJobs?: {
    jobId: string;
    jobTitle: string;
    appliedAt: string;
    status: string;
  }[];
}

export interface AIInterviewResult {
  id: string;
  interviewId: string;
  verdict: 'HIRE' | 'MAYBE' | 'NO_HIRE';
  confidence: number;
  feedbackSummary: string;
  transcript?: {
    role: 'ai' | 'candidate';
    content: string;
    timestamp: string;
  }[];
  createdAt: string;
}

export interface HumanInterview {
  id: string;
  candidateId: string;
  jobId?: string;
  scheduledAt: string;
  duration: number;
  calendlyLink?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface HiringDashboard {
  totalApplications: number;
  aiInterviewsCompleted: number;
  aiInterviewsPending: number;
  humanInterviewsScheduled: number;
  shortlistedCandidates: number;
  hiredCandidates: number;
}

export interface SendAIInterviewDto {
  candidateId: string;
  jobId?: string;
  customQuestions?: string[];
  domain?: string;
  language?: string;
}

export interface ScheduleHumanInterviewDto {
  candidateId: string;
  jobId?: string;
  scheduledAt: string;
  duration: number;
  calendlyLink?: string;
  notes?: string;
}

export const hiringService = {
  async getCandidates(companyId: string, filters?: {
    search?: string;
    skills?: string[];
    eloMin?: number;
    eloMax?: number;
  }): Promise<Candidate[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.skills?.length) params.append('skills', filters.skills.join(','));
    if (filters?.eloMin) params.append('eloMin', filters.eloMin.toString());
    if (filters?.eloMax) params.append('eloMax', filters.eloMax.toString());
    const { data } = await api.get(`/companies/${companyId}/hiring/candidates?${params.toString()}`);
    return data;
  },

  async getCandidateProfile(candidateId: string): Promise<Candidate> {
    const { data } = await api.get(`/hiring/candidates/${candidateId}`);
    return data;
  },

  async sendAIInterview(companyId: string, dto: SendAIInterviewDto): Promise<{ interviewId: string }> {
    const { data } = await api.post(`/companies/${companyId}/hiring/interviews/ai`, dto);
    return data;
  },

  async getAIInterviewResult(interviewId: string): Promise<AIInterviewResult> {
    const { data } = await api.get(`/hiring/interviews/ai/${interviewId}/result`);
    return data;
  },

  async scheduleHumanInterview(companyId: string, dto: ScheduleHumanInterviewDto): Promise<HumanInterview> {
    const { data } = await api.post(`/companies/${companyId}/hiring/interviews/human`, dto);
    return data;
  },

  async getHumanInterviews(companyId: string): Promise<HumanInterview[]> {
    const { data } = await api.get(`/companies/${companyId}/hiring/interviews/human`);
    return data;
  },

  async getHiringDashboard(companyId: string): Promise<HiringDashboard> {
    const { data } = await api.get(`/companies/${companyId}/hiring/dashboard`);
    return data;
  },

  async shortlistCandidate(candidateId: string, jobId: string): Promise<void> {
    await api.post(`/hiring/candidates/${candidateId}/shortlist`, { jobId });
  },

  async rejectCandidate(candidateId: string, jobId: string, reason?: string): Promise<void> {
    await api.post(`/hiring/candidates/${candidateId}/reject`, { jobId, reason });
  },

  async hireCandidate(candidateId: string, jobId: string): Promise<void> {
    await api.post(`/hiring/candidates/${candidateId}/hire`, { jobId });
  },
};