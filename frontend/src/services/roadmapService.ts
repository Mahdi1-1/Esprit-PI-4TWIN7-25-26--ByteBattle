import api from '../api/axios';

export interface Challenge {
  id: string;
  title: string;
  difficulty: string;
  tags: string[];
}

export interface CompanyRoadmap {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  type: 'platform' | 'custom';
  challengeIds: string[];
  order: number;
  visibility: 'public' | 'employees_only';
  createdAt: string;
  challenges?: Challenge[];
}

export interface RoadmapAssignment {
  id: string;
  roadmapId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    profileImage?: string;
  };
  assignedBy: string;
  assignedAt: string;
  completedAt?: string;
  progress: number;
}

export const roadmapService = {
  async getCompanyRoadmaps(companyId: string): Promise<CompanyRoadmap[]> {
    const { data } = await api.get(`/companies/${companyId}/roadmaps`);
    return data;
  },

  async getRoadmap(roadmapId: string): Promise<CompanyRoadmap> {
    const { data } = await api.get(`/roadmaps/${roadmapId}`);
    return data;
  },

  async createRoadmap(companyId: string, dto: {
    title: string;
    description?: string;
    type: 'platform' | 'custom';
    challengeIds?: string[];
    visibility: 'public' | 'employees_only';
  }): Promise<CompanyRoadmap> {
    const { data } = await api.post(`/companies/${companyId}/roadmaps`, dto);
    return data;
  },

  async updateRoadmap(roadmapId: string, dto: {
    title?: string;
    description?: string;
    challengeIds?: string[];
    visibility?: 'public' | 'employees_only';
    order?: number;
  }): Promise<CompanyRoadmap> {
    const { data } = await api.patch(`/roadmaps/${roadmapId}`, dto);
    return data;
  },

  async deleteRoadmap(roadmapId: string): Promise<void> {
    await api.delete(`/roadmaps/${roadmapId}`);
  },

  async assignRoadmap(roadmapId: string, userIds: string[], dueDate?: string): Promise<void> {
    await api.post(`/roadmaps/${roadmapId}/assign`, { userIds, dueDate });
  },

  async getRoadmapAssignments(roadmapId: string): Promise<RoadmapAssignment[]> {
    const { data } = await api.get(`/roadmaps/${roadmapId}/assignments`);
    return data;
  },

  async updateAssignmentProgress(assignmentId: string, progress: number): Promise<RoadmapAssignment> {
    const { data } = await api.patch(`/roadmaps/assignments/${assignmentId}/progress`, { progress });
    return data;
  },

  async getAvailableChallenges(): Promise<Challenge[]> {
    const { data } = await api.get('/challenges?status=published');
    return data;
  },
};