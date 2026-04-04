import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateDiscussionDto,
  UpdateDiscussionDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './dto/discussion.dto';

@Injectable()
export class DiscussionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) { }

  // ─── Discussions ──────────────────────────────────
  async createDiscussion(userId: string, dto: CreateDiscussionDto) {
    return this.prisma.discussion.create({
      data: {
        title: dto.title,
        content: dto.content,
        category: dto.category,
        tags: dto.tags,
        authorId: userId,
        challengeId: dto.challengeId,
      },
      include: {
        author: { select: { id: true, username: true, profileImage: true } },
      },
    });
  }

  async findAllDiscussions(query: {
    page?: number;
    limit?: number;
    category?: string;
    tags?: string;
    search?: string;
    sort?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { isHidden: false };

    if (query.category) {
      where.category = query.category;
    }

    // Tags filter (from category sidebar)
    if (query.tags) {
      where.tags = { hasSome: query.tags.split(',') };
    }

    // Search filter — searches in title, content, and tags
    if (query.search) {
      const searchTerm = query.search.trim();
      if (searchTerm) {
        // If tags filter is also active, wrap everything in AND
        const searchOR = [
          { title: { contains: searchTerm, mode: 'insensitive' as const } },
          { content: { contains: searchTerm, mode: 'insensitive' as const } },
          { tags: { hasSome: [searchTerm] } },
        ];
        if (where.tags) {
          // Both tags filter + search: use AND to combine
          where.AND = [
            { tags: where.tags },
            { OR: searchOR },
          ];
          delete where.tags;
        } else {
          where.OR = searchOR;
        }
      }
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (query.sort === 'popular') orderBy = { views: 'desc' };
    if (query.sort === 'most-voted') orderBy = { upvotes: 'desc' }; // approximate
    if (query.sort === 'most-commented') orderBy = { commentCount: 'desc' };

    if (query.sort === 'unsolved') {
      where.isSolved = false;
      orderBy = { createdAt: 'desc' };
    }

    const [discussions, total] = await Promise.all([
      this.prisma.discussion.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: { select: { id: true, username: true, profileImage: true } },
        },
      }),
      this.prisma.discussion.count({ where }),
    ]);

    return { data: discussions, total, page, limit };
  }

  async getStats() {
    const totalPosts = await this.prisma.discussion.count({ where: { isHidden: false } });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentPosts = await this.prisma.discussion.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        isHidden: false,
      },
      select: { authorId: true },
      distinct: ['authorId'],
    });

    const activeUsers = recentPosts.length;

    const solvedThreads = await this.prisma.discussion.count({
      where: { isSolved: true, isHidden: false },
    });

    const thisWeek = await this.prisma.discussion.count({
      where: { createdAt: { gte: sevenDaysAgo }, isHidden: false },
    });

    return { totalPosts, activeUsers, solvedThreads, thisWeek };
  }

  async getPopularTags() {
    const result = await this.prisma.discussion.aggregateRaw({
      pipeline: [
        { $match: { isHidden: false } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]
    });

    return Array.isArray(result) ? result.map((r: any) => ({ tag: r._id, count: r.count })) : [];
  }

  async findOneDiscussion(id: string) {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, profileImage: true, level: true } },
        comments: {
          where: { isHidden: false },
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, username: true, profileImage: true, level: true } },
          },
        },
      },
    });
    if (!discussion) throw new NotFoundException('Discussion not found');

    // Increment views
    await this.prisma.discussion.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    const commentsMap = new Map();
    const tree: any[] = [];

    for (const comment of discussion.comments) {
      commentsMap.set(comment.id, { ...comment, replies: [] });
    }

    for (const comment of discussion.comments) {
      const commentWithReplies = commentsMap.get(comment.id);
      if (comment.parentCommentId && commentsMap.has(comment.parentCommentId)) {
        commentsMap.get(comment.parentCommentId).replies.push(commentWithReplies);
      } else {
        tree.push(commentWithReplies);
      }
    }

    return { ...discussion, comments: tree };
  }

  async updateDiscussion(id: string, userId: string, dto: UpdateDiscussionDto) {
    const discussion = await this.prisma.discussion.findUnique({ where: { id } });
    if (!discussion) throw new NotFoundException('Discussion not found');
    if (discussion.authorId !== userId) throw new ForbiddenException('Not the author');

    // Save the current state as a revision before applying the update
    await this.prisma.discussionRevision.create({
      data: {
        discussionId: id,
        editorId: userId,
        title: discussion.title,
        content: discussion.content,
        tags: discussion.tags,
      },
    });

    return this.prisma.discussion.update({
      where: { id },
      data: dto,
      include: {
        author: { select: { id: true, username: true, profileImage: true } },
      },
    });
  }

  async getRevisions(discussionId: string) {
    const discussion = await this.prisma.discussion.findUnique({ where: { id: discussionId } });
    if (!discussion) throw new NotFoundException('Discussion not found');

    const revisions = await this.prisma.discussionRevision.findMany({
      where: { discussionId },
      orderBy: { createdAt: 'desc' },
      include: {
        editor: { select: { id: true, username: true, profileImage: true } },
      },
    });

    return revisions;
  }

  async deleteDiscussion(id: string, userId: string) {
    const discussion = await this.prisma.discussion.findUnique({ where: { id } });
    if (!discussion) throw new NotFoundException('Discussion not found');
    if (discussion.authorId !== userId) throw new ForbiddenException('Not the author');

    // Delete all associated comments
    await this.prisma.comment.deleteMany({ where: { discussionId: id } });
    return this.prisma.discussion.delete({ where: { id } });
  }

  async voteDiscussion(id: string, userId: string, type: 'upvote' | 'downvote') {
    const discussion = await this.prisma.discussion.findUnique({ where: { id } });
    if (!discussion) throw new NotFoundException('Discussion not found');
    if (discussion.authorId === userId) throw new ForbiddenException('Cannot vote on your own discussion');

    const hasUpvoted = discussion.upvotes.includes(userId);
    const hasDownvoted = discussion.downvotes.includes(userId);

    const updateData: any = {};

    if (type === 'upvote') {
      if (hasUpvoted) {
        // Remove upvote (toggle off)
        updateData.upvotes = { set: discussion.upvotes.filter(u => u !== userId) };
      } else {
        // Add upvote, remove downvote if present
        updateData.upvotes = { push: userId };
        if (hasDownvoted) {
          updateData.downvotes = { set: discussion.downvotes.filter(d => d !== userId) };
        }
      }
    } else {
      if (hasDownvoted) {
        updateData.downvotes = { set: discussion.downvotes.filter(d => d !== userId) };
      } else {
        updateData.downvotes = { push: userId };
        if (hasUpvoted) {
          updateData.upvotes = { set: discussion.upvotes.filter(u => u !== userId) };
        }
      }
    }

    const updated = await this.prisma.discussion.update({
      where: { id },
      data: updateData,
    });

    if (type === 'upvote' && !hasUpvoted) {
      // Create notification
      await this.notificationsService.create({
        recipientId: discussion.authorId,
        actorId: userId,
        type: 'like-post',
        targetId: discussion.id,
        targetType: 'discussion',
      });
    }

    return {
      upvotes: updated.upvotes.length,
      downvotes: updated.downvotes.length,
      userVote: updated.upvotes.includes(userId) ? 'upvote' : updated.downvotes.includes(userId) ? 'downvote' : null,
    };
  }

  async toggleSolved(id: string, userId: string) {
    const discussion = await this.prisma.discussion.findUnique({ where: { id } });
    if (!discussion) throw new NotFoundException('Discussion not found');
    if (discussion.authorId !== userId) throw new ForbiddenException('Not the author');

    return this.prisma.discussion.update({
      where: { id },
      data: { isSolved: !discussion.isSolved },
    });
  }

  async toggleBestAnswer(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { discussion: true },
    });

    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.discussion.authorId !== userId) throw new ForbiddenException('Only the post author can mark best answers');

    const isCurrentlyBest = comment.isBestAnswer;
    const discussionId = comment.discussionId;

    // First, unset any existing best answer on this discussion
    if (!isCurrentlyBest) {
      await this.prisma.comment.updateMany({
        where: { discussionId, isBestAnswer: true },
        data: { isBestAnswer: false },
      });
    }

    // Toggle the best answer on the target comment
    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: { isBestAnswer: !isCurrentlyBest },
      include: {
        author: { select: { id: true, username: true, profileImage: true } },
      },
    });

    // Update the discussion's bestAnswerCommentId
    await this.prisma.discussion.update({
      where: { id: discussionId },
      data: {
        bestAnswerCommentId: !isCurrentlyBest ? commentId : null,
        isSolved: !isCurrentlyBest ? true : false,
      },
    });

    // Create notification for the comment author if marking as best answer
    if (!isCurrentlyBest && comment.authorId !== userId) {
      await this.notificationsService.create({
        recipientId: comment.authorId,
        actorId: userId,
        type: 'best-answer',
        targetId: comment.id,
        targetType: 'comment',
      });
    }

    return {
      comment: updatedComment,
      isBestAnswer: !isCurrentlyBest,
    };
  }

  async getMyPosts(userId: string, status?: string) {
    const where: any = { authorId: userId };

    if (status === 'unsolved') {
      where.isSolved = false;
    } else if (status === 'solved') {
      where.isSolved = true;
    }

    return this.prisma.discussion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true, profileImage: true } },
      },
    });
  }

  async flagDiscussion(id: string, userId: string) {
    const discussion = await this.prisma.discussion.findUnique({ where: { id } });
    if (!discussion) throw new NotFoundException('Discussion not found');

    // Check if already flagged by this user
    if (discussion.flags.includes(userId)) {
      return { flagged: true, flagCount: discussion.flags.length };
    }

    const updated = await this.prisma.discussion.update({
      where: { id },
      data: {
        flags: { push: userId },
        // Auto-hide if 5+ flags
        isHidden: discussion.flags.length >= 4 ? true : undefined,
      },
    });

    return { flagged: true, flagCount: updated.flags.length, isHidden: updated.isHidden };
  }

  async flagComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    if (comment.flags.includes(userId)) {
      return { flagged: true, flagCount: comment.flags.length };
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        flags: { push: userId },
        isHidden: comment.flags.length >= 4 ? true : undefined,
      },
    });

    return { flagged: true, flagCount: updated.flags.length, isHidden: updated.isHidden };
  }

  // ─── Comments ──────────────────────────────────
  async createComment(discussionId: string, userId: string, dto: CreateCommentDto) {
    const discussion = await this.prisma.discussion.findUnique({ where: { id: discussionId } });
    if (!discussion) throw new NotFoundException('Discussion not found');

    let parentComment: any = null;
    if (dto.parentCommentId) {
      parentComment = await this.prisma.comment.findUnique({ where: { id: dto.parentCommentId } });
      if (!parentComment) throw new NotFoundException('Parent comment not found');
      if (parentComment.parentCommentId) {
        throw new BadRequestException('Maximum comment depth is 2 (only one level of replies)');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        authorId: userId,
        discussionId,
        parentCommentId: dto.parentCommentId,
      },
      include: {
        author: { select: { id: true, username: true, profileImage: true, level: true } },
      },
    });

    // Increment comment count
    await this.prisma.discussion.update({
      where: { id: discussionId },
      data: { commentCount: { increment: 1 } },
    });

    // Create notifications
    if (dto.parentCommentId && parentComment && parentComment.authorId !== userId) {
      await this.notificationsService.create({
        recipientId: parentComment.authorId,
        actorId: userId,
        type: 'reply-comment',
        targetId: comment.id,
        targetType: 'comment',
      });
    } else if (!dto.parentCommentId && discussion.authorId !== userId) {
      await this.notificationsService.create({
        recipientId: discussion.authorId,
        actorId: userId,
        type: 'new-comment',
        targetId: discussion.id,
        targetType: 'discussion',
      });
    }

    return comment;
  }

  async updateComment(commentId: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Not the author');

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content },
      include: {
        author: { select: { id: true, username: true, profileImage: true } },
      },
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Not the author');

    // Count nested replies
    const repliesCount = await this.prisma.comment.count({
      where: { parentCommentId: commentId },
    });

    // Delete nested replies
    await this.prisma.comment.deleteMany({ where: { parentCommentId: commentId } });
    // Delete the comment
    await this.prisma.comment.delete({ where: { id: commentId } });

    // Decrement comment count (1 + replies)
    await this.prisma.discussion.update({
      where: { id: comment.discussionId },
      data: { commentCount: { decrement: 1 + repliesCount } },
    });

    return { deleted: true };
  }

  async voteComment(commentId: string, userId: string, type: 'upvote' | 'downvote') {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId === userId) throw new ForbiddenException('Cannot vote on your own comment');

    const hasUpvoted = comment.upvotes.includes(userId);
    const hasDownvoted = comment.downvotes.includes(userId);

    const updateData: any = {};

    if (type === 'upvote') {
      if (hasUpvoted) {
        updateData.upvotes = { set: comment.upvotes.filter(u => u !== userId) };
      } else {
        updateData.upvotes = { push: userId };
        if (hasDownvoted) {
          updateData.downvotes = { set: comment.downvotes.filter(d => d !== userId) };
        }
      }
    } else {
      if (hasDownvoted) {
        updateData.downvotes = { set: comment.downvotes.filter(d => d !== userId) };
      } else {
        updateData.downvotes = { push: userId };
        if (hasUpvoted) {
          updateData.upvotes = { set: comment.upvotes.filter(u => u !== userId) };
        }
      }
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: updateData,
    });

    if (type === 'upvote' && !hasUpvoted) {
      await this.prisma.notification.create({
        data: {
          recipientId: comment.authorId,
          actorId: userId,
          type: 'like-comment',
          targetId: comment.id,
          targetType: 'comment',
        },
      });
    }

    return {
      upvotes: updated.upvotes.length,
      downvotes: updated.downvotes.length,
      userVote: updated.upvotes.includes(userId) ? 'upvote' : updated.downvotes.includes(userId) ? 'downvote' : null,
    };
  }
}
