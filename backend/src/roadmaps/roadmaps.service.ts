import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type RoadmapProgressStatus = 'done' | 'in_progress' | 'skipped';

@Injectable()
export class RoadmapsService {
  constructor(private prisma: PrismaService) {}

  private async validateCompanyRoadmap(companyId: string, roadmapId: string) {
    const roadmap = await this.prisma.roadmap.findUnique({
      where: { id: roadmapId },
      include: { company: true },
    });

    if (!roadmap || roadmap.companyId !== companyId) {
      throw new NotFoundException('Roadmap not found for this company');
    }

    return roadmap;
  }

  async getPublishedRoadmaps(companyId: string, userId: string) {
    const roadmaps = await this.prisma.roadmap.findMany({
      where: { companyId, isPublished: true },
      include: {
        nodes: { select: { id: true } },
        progress: { where: { userId }, select: { status: true, nodeId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return roadmaps.map((roadmap) => {
      const nodeCount = roadmap.nodes.length;
      const doneCount = roadmap.progress.filter((progress) => progress.status === 'done').length;
      return {
        id: roadmap.id,
        title: roadmap.title,
        description: roadmap.description,
        isPublished: roadmap.isPublished,
        createdAt: roadmap.createdAt,
        updatedAt: roadmap.updatedAt,
        nodeCount,
        completionPercentage: nodeCount === 0 ? 0 : Math.round((doneCount / nodeCount) * 100),
      };
    });
  }

  async getRoadmapDetail(companyId: string, roadmapId: string, userId: string) {
    const roadmap = await this.prisma.roadmap.findUnique({
      where: { id: roadmapId },
      include: {
        nodes: {
          orderBy: { createdAt: 'asc' },
          include: { resources: true },
        },
        edges: true,
      },
    });

    if (!roadmap || roadmap.companyId !== companyId) {
      throw new NotFoundException('Roadmap not found for this company');
    }

    const progressEntries = await this.prisma.roadmapProgress.findMany({
      where: { roadmapId, userId },
      select: { nodeId: true, status: true },
    });

    const progress = progressEntries.reduce((acc, entry) => {
      acc[entry.nodeId] = entry.status as RoadmapProgressStatus;
      return acc;
    }, {} as Record<string, RoadmapProgressStatus>);

    return {
      id: roadmap.id,
      title: roadmap.title,
      description: roadmap.description,
      isPublished: roadmap.isPublished,
      createdAt: roadmap.createdAt,
      updatedAt: roadmap.updatedAt,
      nodes: roadmap.nodes.map((node) => ({
        id: node.id,
        title: node.title,
        description: node.description,
        type: node.type,
        style: node.style,
        positionX: node.positionX,
        positionY: node.positionY,
        resources: node.resources.map((resource) => ({
          id: resource.id,
          nodeId: resource.nodeId,
          title: resource.title,
          url: resource.url,
          type: resource.type,
        })),
      })),
      edges: roadmap.edges.map((edge) => ({
        id: edge.id,
        sourceId: edge.sourceId,
        targetId: edge.targetId,
      })),
      progress,
    };
  }

  async getCompletionPercentage(roadmapId: string, userId: string) {
    const totalNodes = await this.prisma.roadmapNode.count({ where: { roadmapId } });
    if (totalNodes === 0) {
      return 0;
    }

    const doneCount = await this.prisma.roadmapProgress.count({
      where: { roadmapId, userId, status: 'done' },
    });

    return Math.round((doneCount / totalNodes) * 100);
  }

  async patchProgress(companyId: string, roadmapId: string, userId: string, nodeId: string, status: RoadmapProgressStatus | null) {
    await this.validateCompanyRoadmap(companyId, roadmapId);

    const node = await this.prisma.roadmapNode.findUnique({ where: { id: nodeId } });
    if (!node || node.roadmapId !== roadmapId) {
      throw new NotFoundException('Roadmap node not found');
    }

    if (!status) {
      await this.prisma.roadmapProgress.deleteMany({ where: { roadmapId, nodeId, userId } });
    } else {
      await this.prisma.roadmapProgress.upsert({
        where: { userId_nodeId: { userId, nodeId } },
        create: { userId, roadmapId, nodeId, status },
        update: { status },
      });
    }

    return {
      nodeId,
      status,
      completionPercentage: await this.getCompletionPercentage(roadmapId, userId),
    };
  }

  async createRoadmap(companyId: string, createdById: string, dto: { title: string; description?: string }) {
    return this.prisma.roadmap.create({
      data: {
        companyId,
        title: dto.title,
        description: dto.description || null,
        createdById,
      },
    });
  }

  async updateRoadmap(companyId: string, roadmapId: string, dto: { title?: string; description?: string; isPublished?: boolean }) {
    await this.validateCompanyRoadmap(companyId, roadmapId);
    return this.prisma.roadmap.update({
      where: { id: roadmapId },
      data: {
        title: dto.title,
        description: dto.description,
        isPublished: dto.isPublished,
      },
    });
  }

  async deleteRoadmap(companyId: string, roadmapId: string) {
    await this.validateCompanyRoadmap(companyId, roadmapId);
    await this.prisma.roadmap.delete({ where: { id: roadmapId } });
    return { success: true };
  }

  async createNode(companyId: string, roadmapId: string, dto: { title: string; description?: string; type: string; style: string; positionX: number; positionY: number }) {
    await this.validateCompanyRoadmap(companyId, roadmapId);
    return this.prisma.roadmapNode.create({
      data: {
        roadmapId,
        title: dto.title,
        description: dto.description || null,
        type: dto.type,
        style: dto.style,
        positionX: dto.positionX,
        positionY: dto.positionY,
      },
    });
  }

  async updateNode(companyId: string, roadmapId: string, nodeId: string, dto: { title?: string; description?: string; type?: string; style?: string; positionX?: number; positionY?: number }) {
    await this.validateCompanyRoadmap(companyId, roadmapId);
    const node = await this.prisma.roadmapNode.findUnique({ where: { id: nodeId } });
    if (!node || node.roadmapId !== roadmapId) {
      throw new NotFoundException('Roadmap node not found');
    }
    return this.prisma.roadmapNode.update({
      where: { id: nodeId },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        style: dto.style,
        positionX: dto.positionX,
        positionY: dto.positionY,
      },
    });
  }

  async deleteNode(companyId: string, roadmapId: string, nodeId: string) {
    await this.validateCompanyRoadmap(companyId, roadmapId);
    const node = await this.prisma.roadmapNode.findUnique({ where: { id: nodeId } });
    if (!node || node.roadmapId !== roadmapId) {
      throw new NotFoundException('Roadmap node not found');
    }
    await this.prisma.roadmapNode.delete({ where: { id: nodeId } });
    return { success: true };
  }

  async createEdge(companyId: string, roadmapId: string, dto: { sourceId: string; targetId: string }) {
    await this.validateCompanyRoadmap(companyId, roadmapId);

    const [sourceNode, targetNode] = await Promise.all([
      this.prisma.roadmapNode.findUnique({ where: { id: dto.sourceId } }),
      this.prisma.roadmapNode.findUnique({ where: { id: dto.targetId } }),
    ]);

    if (!sourceNode || !targetNode || sourceNode.roadmapId !== roadmapId || targetNode.roadmapId !== roadmapId) {
      throw new BadRequestException('Source and target nodes must belong to the same roadmap');
    }

    return this.prisma.roadmapEdge.create({
      data: {
        roadmapId,
        sourceId: dto.sourceId,
        targetId: dto.targetId,
      },
    });
  }

  async deleteEdge(companyId: string, roadmapId: string, edgeId: string) {
    await this.validateCompanyRoadmap(companyId, roadmapId);
    const edge = await this.prisma.roadmapEdge.findUnique({ where: { id: edgeId } });
    if (!edge || edge.roadmapId !== roadmapId) {
      throw new NotFoundException('Roadmap edge not found');
    }
    await this.prisma.roadmapEdge.delete({ where: { id: edgeId } });
    return { success: true };
  }

  async createResource(companyId: string, roadmapId: string, nodeId: string, dto: { title: string; url: string; type: string }) {
    await this.validateCompanyRoadmap(companyId, roadmapId);
    const node = await this.prisma.roadmapNode.findUnique({ where: { id: nodeId } });
    if (!node || node.roadmapId !== roadmapId) {
      throw new NotFoundException('Roadmap node not found');
    }

    return this.prisma.roadmapResource.create({
      data: {
        nodeId,
        title: dto.title,
        url: dto.url,
        type: dto.type,
      },
    });
  }

  async deleteResource(companyId: string, roadmapId: string, nodeId: string, resourceId: string) {
    await this.validateCompanyRoadmap(companyId, roadmapId);
    const resource = await this.prisma.roadmapResource.findUnique({ where: { id: resourceId } });
    if (!resource || resource.nodeId !== nodeId) {
      throw new NotFoundException('Roadmap resource not found');
    }
    const node = await this.prisma.roadmapNode.findUnique({ where: { id: nodeId } });
    if (!node || node.roadmapId !== roadmapId) {
      throw new NotFoundException('Roadmap node not found');
    }
    await this.prisma.roadmapResource.delete({ where: { id: resourceId } });
    return { success: true };
  }
}
