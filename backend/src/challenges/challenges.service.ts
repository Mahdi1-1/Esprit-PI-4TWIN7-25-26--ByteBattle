import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// import { any } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';

import { CacheService } from '../cache/cache.service';

@Injectable()
export class ChallengesService {
  constructor(private prisma: PrismaService, private cache: CacheService) { }

  async create(dto: any) {
    return this.prisma.challenge.create({
      data: {
        title: dto.title,
        kind: dto.kind as any,
        difficulty: dto.difficulty as any,
        tags: dto.tags,
        descriptionMd: dto.statementMd || dto.descriptionMd || dto.briefMd || '', // Handle statementMd (Code) or briefMd (Canvas)
        status: (dto.status || 'draft') as any,
        allowedLanguages: dto.allowedLanguages || [],
        constraints: dto.constraints || {},
        hints: dto.hints || [], // Save hints
        tests: dto.tests && dto.tests.length > 0 ? dto.tests.map((t: any) => ({
          input: String(t.input || ''),
          expectedOutput: String(t.expectedOutput || ''),
          isHidden: Boolean(t.isHidden)
        })) : [],
        examples: dto.examples || [],
        category: dto.category || 'general',
        deliverables: dto.deliverables,
        rubric: dto.rubric,
        assets: dto.assets || [],
      },
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    kind?: string;
    difficulty?: string;
    tags?: string;
    status?: string;
    search?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.kind) where.kind = query.kind;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.status) {
      where.status = query.status;
    } else {
      where.status = 'published'; // default to published for public
    }
    if (query.tags) {
      where.tags = { hasSome: query.tags.split(',') };
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { tags: { hasSome: [query.search] } },
      ];
    }

    const [challenges, total] = await Promise.all([
      this.prisma.challenge.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          kind: true,
          difficulty: true,
          tags: true,
          status: true,
          category: true,
          createdAt: true,
          _count: { select: { submissions: true } },
        },
      }),
      this.prisma.challenge.count({ where }),
    ]);

    return { data: challenges, total, page, limit };
  }

  async findOne(id: string) {
    const cacheKey = `challenge:public:${id}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        _count: { select: { submissions: true } },
      },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');

    // Filter hidden tests for non-admin
    const publicTests = challenge.tests.filter((t) => !t.isHidden);
    const result = { ...challenge, tests: publicTests };
    
    await this.cache.set(cacheKey, result, 3600); // Cache for 1 hour
    return result;
  }

  async findOneAdmin(id: string) {
    const cacheKey = `challenge:admin:${id}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        _count: { select: { submissions: true } },
      },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');
    
    await this.cache.set(cacheKey, challenge, 3600);
    return challenge;
  }

  async update(id: string, dto: any) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id } });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const updateData: any = { ...dto };

    // Map statementMd or briefMd to descriptionMd for Prisma schema if provided
    if (updateData.statementMd !== undefined) {
      updateData.descriptionMd = updateData.statementMd;
      delete updateData.statementMd;
    }
    if (updateData.briefMd !== undefined) {
      updateData.descriptionMd = updateData.briefMd;
      delete updateData.briefMd;
    }

    if (updateData.tests && Array.isArray(updateData.tests)) {
      updateData.tests = updateData.tests.map((t: any) => ({
        input: String(t.input || ''),
        expectedOutput: String(t.expectedOutput || ''),
        isHidden: Boolean(t.isHidden)
      }));
    }

    const updated = await this.prisma.challenge.update({
      where: { id },
      data: updateData,
    });
    
    await this.cache.del(`challenge:public:${id}`);
    await this.cache.del(`challenge:admin:${id}`);
    
    return updated;
  }

  async remove(id: string) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    
    await this.cache.del(`challenge:public:${id}`);
    await this.cache.del(`challenge:admin:${id}`);
    
    return this.prisma.challenge.delete({ where: { id } });
  }

  async getRecommended(userId: string) {
    // Simple recommendation: return a few published challenges
    const challenges = await this.prisma.challenge.findMany({
      where: { status: 'published' },
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        kind: true,
        difficulty: true,
        tags: true,
        category: true,
        _count: { select: { submissions: true } },
      },
    });
    return challenges;
  }

  async getAllAdmin(query: {
    page?: number;
    limit?: number;
    kind?: string;
    difficulty?: string;
    status?: string;
    search?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.kind) where.kind = query.kind;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const [challenges, total] = await Promise.all([
      this.prisma.challenge.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { submissions: true } } },
      }),
      this.prisma.challenge.count({ where }),
    ]);

    return { data: challenges, total, page, limit };
  }
}
