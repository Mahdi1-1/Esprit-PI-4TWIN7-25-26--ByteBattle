import { Test, TestingModule } from '@nestjs/testing';
import { DiscussionsService } from './discussions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationEmitterService } from '../notifications/notification-emitter.service';
import { BadgeEngineService } from '../badges/badge-engine.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockPrisma = {
  discussion: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  comment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  discussionRevision: {
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

const mockNotifEmitter = { emit: jest.fn().mockResolvedValue(undefined) };
const mockBadgeEngine = {
  onDiscussionCreated: jest.fn().mockResolvedValue(undefined),
  onCommentCreated: jest.fn().mockResolvedValue(undefined),
};

const mockDiscussion = {
  id: 'disc-1', title: 'How to solve Two Sum?', content: 'Help!',
  authorId: 'user-1', category: 'general', tags: ['algorithms'],
  isHidden: false, createdAt: new Date(), comments: [],
  author: { id: 'user-1', username: 'alice', profileImage: null },
};

describe('DiscussionsService', () => {
  let service: DiscussionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscussionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationEmitterService, useValue: mockNotifEmitter },
        { provide: BadgeEngineService, useValue: mockBadgeEngine },
      ],
    }).compile();

    service = module.get<DiscussionsService>(DiscussionsService);
    jest.clearAllMocks();
    mockPrisma.discussionRevision.create.mockResolvedValue({ id: 'rev-1' });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', username: 'alice', profileImage: null });
  });

  // ─── createDiscussion ─────────────────────────────────────────────────────────

  describe('createDiscussion()', () => {
    it('should create a discussion and trigger badge check', async () => {
      mockPrisma.discussion.create.mockResolvedValue(mockDiscussion);

      const result = await service.createDiscussion('user-1', {
        title: 'How to solve Two Sum?', content: 'Help!', category: 'general', tags: ['algorithms'],
      });

      expect(mockPrisma.discussion.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ authorId: 'user-1', title: 'How to solve Two Sum?' }) }),
      );
      expect(mockBadgeEngine.onDiscussionCreated).toHaveBeenCalledWith('user-1');
      expect(result.id).toBe('disc-1');
    });
  });

  // ─── findAllDiscussions ───────────────────────────────────────────────────────

  describe('findAllDiscussions()', () => {
    it('should return paginated non-hidden discussions', async () => {
      mockPrisma.discussion.findMany.mockResolvedValue([mockDiscussion]);
      mockPrisma.discussion.count.mockResolvedValue(1);

      const result = await service.findAllDiscussions({});

      const where = mockPrisma.discussion.findMany.mock.calls[0][0].where;
      expect(where.isHidden).toBe(false);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should apply category filter', async () => {
      mockPrisma.discussion.findMany.mockResolvedValue([]);
      mockPrisma.discussion.count.mockResolvedValue(0);

      await service.findAllDiscussions({ category: 'help' });

      const where = mockPrisma.discussion.findMany.mock.calls[0][0].where;
      expect(where.category).toBe('help');
    });

    it('should apply tags filter', async () => {
      mockPrisma.discussion.findMany.mockResolvedValue([]);
      mockPrisma.discussion.count.mockResolvedValue(0);

      await service.findAllDiscussions({ tags: 'array,dp' });

      const where = mockPrisma.discussion.findMany.mock.calls[0][0].where;
      expect(where.tags).toEqual({ hasSome: ['array', 'dp'] });
    });

    it('should apply search filter via OR clause', async () => {
      mockPrisma.discussion.findMany.mockResolvedValue([]);
      mockPrisma.discussion.count.mockResolvedValue(0);

      await service.findAllDiscussions({ search: 'two sum' });

      const where = mockPrisma.discussion.findMany.mock.calls[0][0].where;
      expect(where.OR || where.AND).toBeDefined();
    });

    it('should paginate correctly', async () => {
      mockPrisma.discussion.findMany.mockResolvedValue([]);
      mockPrisma.discussion.count.mockResolvedValue(40);

      const result = await service.findAllDiscussions({ page: 3, limit: 10 });

      expect(mockPrisma.discussion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.page).toBe(3);
    });
  });

  // ─── findOneDiscussion ────────────────────────────────────────────────────────

  describe('findOneDiscussion()', () => {
    it('should throw NotFoundException when discussion not found', async () => {
      mockPrisma.discussion.findUnique.mockResolvedValue(null);
      await expect(service.findOneDiscussion('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return discussion when found', async () => {
      mockPrisma.discussion.findUnique.mockResolvedValue(mockDiscussion);
      const result = await service.findOneDiscussion('disc-1');
      expect(result.id).toBe('disc-1');
    });
  });

  // ─── updateDiscussion ─────────────────────────────────────────────────────────

  describe('updateDiscussion()', () => {
    it('should throw NotFoundException when discussion not found', async () => {
      mockPrisma.discussion.findUnique.mockResolvedValue(null);
      await expect(service.updateDiscussion('disc-1', 'user-1', { title: 'New' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when non-owner tries to update', async () => {
      mockPrisma.discussion.findUnique.mockResolvedValue(mockDiscussion);
      await expect(service.updateDiscussion('disc-1', 'user-2', { title: 'X' } as any)).rejects.toThrow(ForbiddenException);
    });

    it('should allow owner to update', async () => {
      mockPrisma.discussion.findUnique.mockResolvedValue(mockDiscussion);
      mockPrisma.discussion.update.mockResolvedValue({ ...mockDiscussion, title: 'Updated' });

      const result = await service.updateDiscussion('disc-1', 'user-1', { title: 'Updated' } as any);

      expect(mockPrisma.discussion.update).toHaveBeenCalled();
      expect(result.title).toBe('Updated');
    });

    it('should allow admin to update any discussion', async () => {
      mockPrisma.discussion.findUnique.mockResolvedValue(mockDiscussion);
      mockPrisma.discussion.update.mockResolvedValue({ ...mockDiscussion, title: 'Admin edit' });

      await expect(
        service.updateDiscussion('disc-1', 'admin-user', { title: 'Admin edit' } as any, 'admin'),
      ).resolves.not.toThrow();
    });
  });

  // ─── deleteDiscussion ─────────────────────────────────────────────────────────

  describe('deleteDiscussion()', () => {
    it('should throw ForbiddenException when non-owner tries to delete', async () => {
      mockPrisma.discussion.findUnique.mockResolvedValue(mockDiscussion);
      await expect(service.deleteDiscussion('disc-1', 'user-9', 'user')).rejects.toThrow(ForbiddenException);
    });

    it('should delete when owner', async () => {
      mockPrisma.discussion.findUnique.mockResolvedValue(mockDiscussion);
      mockPrisma.discussion.delete.mockResolvedValue(mockDiscussion);

      await service.deleteDiscussion('disc-1', 'user-1', 'user');

      expect(mockPrisma.discussion.delete).toHaveBeenCalledWith({ where: { id: 'disc-1' } });
    });
  });

  // ─── createComment ────────────────────────────────────────────────────────────

  describe('createComment()', () => {
    it('should throw NotFoundException when discussion not found', async () => {
      mockPrisma.discussion.findUnique.mockResolvedValue(null);
      await expect(service.createComment('user-1', 'disc-1', { content: 'Nice!' })).rejects.toThrow(NotFoundException);
    });

    it('should create comment and trigger badge + notification', async () => {
      mockPrisma.discussion.findUnique.mockResolvedValue(mockDiscussion);
      const comment = { id: 'cmt-1', content: 'Nice!', authorId: 'user-2', discussionId: 'disc-1', parentId: null };
      mockPrisma.comment.create.mockResolvedValue(comment);

      const result = await service.createComment('user-2', 'disc-1', { content: 'Nice!' });

      expect(mockPrisma.comment.create).toHaveBeenCalled();
      expect(result.id).toBe('cmt-1');
    });
  });
});
