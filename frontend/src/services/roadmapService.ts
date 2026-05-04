import api from '../api/axios';

// ─── Legacy types (used by old CompanyRoadmaps/CompanyRoadmapStepList) ───────
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

// ─── New Visual Roadmap Builder types (used by CompanyRoadmapBuilder/Detail) ──
export type RoadmapNodeType = 'topic' | 'subtopic' | 'resource';
export type RoadmapNodeStyle = 'required' | 'optional' | 'alternative';
export type RoadmapProgressStatus = 'done' | 'in_progress' | 'skipped' | null;

export interface RoadmapSummary {
  id: string;
  title: string;
  description?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
  completionPercentage: number;
}

export interface RoadmapResource {
  id: string;
  nodeId: string;
  title: string;
  url: string;
  type: string;
}

export interface RoadmapNode {
  id: string;
  title: string;
  description?: string;
  type: RoadmapNodeType;
  style: RoadmapNodeStyle;
  positionX: number;
  positionY: number;
  resources: RoadmapResource[];
}

export interface RoadmapEdge {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface RoadmapDetail {
  id: string;
  title: string;
  description?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  progress: Record<string, Exclude<RoadmapProgressStatus, null>>;
}

// ─── Service ──────────────────────────────────────────────────────────────────
export const roadmapService = {
  // ── Legacy company-scoped endpoints ────────────────────────────────────────
  async getCompanyRoadmaps(companyId: string): Promise<CompanyRoadmap[]> {
    const { data } = await api.get(`/companies/${companyId}/roadmaps`);
    return data;
  },

  async getRoadmap(roadmapId: string): Promise<CompanyRoadmap> {
    const { data } = await api.get(`/roadmaps/${roadmapId}`);
    return data;
  },

  async createRoadmapForCompany(companyId: string, dto: {
    title: string;
    description?: string;
    type: 'platform' | 'custom';
    challengeIds?: string[];
    visibility: 'public' | 'employees_only';
  }): Promise<CompanyRoadmap> {
    const { data } = await api.post(`/companies/${companyId}/roadmaps`, dto);
    return data;
  },

  async assignRoadmapToUsers(roadmapId: string, userIds: string[], dueDate?: string): Promise<void> {
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

  // ── New visual builder endpoints (my-company scoped) ──────────────────────
  async getRoadmaps(): Promise<RoadmapSummary[]> {
    const { data } = await api.get('/companies/my-company/roadmaps');
    return data;
  },

  async getRoadmapDetail(roadmapId: string): Promise<RoadmapDetail> {
    const { data } = await api.get('/companies/my-company/roadmaps/' + roadmapId);
    return data;
  },

  async updateProgress(roadmapId: string, nodeId: string, status: RoadmapProgressStatus) {
    const { data } = await api.patch('/companies/my-company/roadmaps/' + roadmapId + '/progress', {
      nodeId,
      status,
    });
    return data as { nodeId: string; status: RoadmapProgressStatus; completionPercentage: number };
  },

  async createRoadmap(dto: { title: string; description?: string }) {
    const { data } = await api.post('/companies/my-company/roadmaps', dto);
    return data as RoadmapSummary;
  },

  async updateRoadmap(roadmapId: string, dto: { title?: string; description?: string; isPublished?: boolean }) {
    const { data } = await api.patch('/companies/my-company/roadmaps/' + roadmapId, dto);
    return data as RoadmapSummary;
  },

  async deleteRoadmap(roadmapId: string) {
    await api.delete('/companies/my-company/roadmaps/' + roadmapId);
  },

  async createNode(roadmapId: string, dto: {
    title: string;
    description?: string;
    type: RoadmapNodeType;
    style: RoadmapNodeStyle;
    positionX: number;
    positionY: number;
  }) {
    const { data } = await api.post('/companies/my-company/roadmaps/' + roadmapId + '/nodes', dto);
    return data as RoadmapNode;
  },

  async updateNode(roadmapId: string, nodeId: string, dto: Partial<{
    title: string;
    description: string;
    type: RoadmapNodeType;
    style: RoadmapNodeStyle;
    positionX: number;
    positionY: number;
  }>) {
    const { data } = await api.patch('/companies/my-company/roadmaps/' + roadmapId + '/nodes/' + nodeId, dto);
    return data as RoadmapNode;
  },

  async deleteNode(roadmapId: string, nodeId: string) {
    await api.delete('/companies/my-company/roadmaps/' + roadmapId + '/nodes/' + nodeId);
  },

  async createEdge(roadmapId: string, sourceId: string, targetId: string) {
    const { data } = await api.post('/companies/my-company/roadmaps/' + roadmapId + '/edges', { sourceId, targetId });
    return data as RoadmapEdge;
  },

  async deleteEdge(roadmapId: string, edgeId: string) {
    await api.delete('/companies/my-company/roadmaps/' + roadmapId + '/edges/' + edgeId);
  },

  async createResource(roadmapId: string, nodeId: string, dto: { title: string; url: string; type: string }) {
    const { data } = await api.post('/companies/my-company/roadmaps/' + roadmapId + '/nodes/' + nodeId + '/resources', dto);
    return data as RoadmapResource;
  },

  async deleteResource(roadmapId: string, nodeId: string, resourceId: string) {
    await api.delete('/companies/my-company/roadmaps/' + roadmapId + '/nodes/' + nodeId + '/resources/' + resourceId);
  },
};
