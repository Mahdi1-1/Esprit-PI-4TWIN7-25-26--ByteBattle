import {
  Controller, Get, Post, Patch, Delete,
  Param, Query, Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DiscussionsService } from './discussions.service';
import {
  CreateDiscussionDto,
  UpdateDiscussionDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './dto/discussion.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Discussions')
@Controller('discussions')
export class DiscussionsController {
  constructor(private discussionsService: DiscussionsService) { }

  // ─── Discussions ──────────────────────────────────
  @Post()
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a discussion' })
  createDiscussion(@CurrentUser('id') userId: string, @Body() dto: CreateDiscussionDto) {
    return this.discussionsService.createDiscussion(userId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List discussions with pagination, search, filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'tags', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sort', required: false, description: 'newest|oldest|popular|most-voted' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
  ) {
    return this.discussionsService.findAllDiscussions({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      tags, search, sort,
    });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get discussion with comments' })
  findOne(@Param('id') id: string) {
    return this.discussionsService.findOneDiscussion(id);
  }

  @Patch(':id')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own discussion' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateDiscussionDto,
  ) {
    return this.discussionsService.updateDiscussion(id, userId, dto);
  }

  @Delete(':id')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own discussion' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.discussionsService.deleteDiscussion(id, userId);
  }

  @Post(':id/vote')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on a discussion' })
  vote(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('type') type: 'upvote' | 'downvote',
  ) {
    return this.discussionsService.voteDiscussion(id, userId, type);
  }

  // ─── Comments ──────────────────────────────────
  @Post(':id/comments')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to a discussion' })
  createComment(
    @Param('id') discussionId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.discussionsService.createComment(discussionId, userId, dto);
  }

  @Patch('comments/:commentId')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit own comment' })
  updateComment(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.discussionsService.updateComment(commentId, userId, dto);
  }

  @Delete('comments/:commentId')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own comment and its replies' })
  deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.discussionsService.deleteComment(commentId, userId);
  }

  @Post('comments/:commentId/vote')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on a comment' })
  voteComment(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
    @Body('type') type: 'upvote' | 'downvote',
  ) {
    return this.discussionsService.voteComment(commentId, userId, type);
  }
}
