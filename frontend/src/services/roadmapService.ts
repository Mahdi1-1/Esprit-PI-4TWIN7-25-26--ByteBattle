import api from '../api/axios';

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

export const roadmapService = {
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
