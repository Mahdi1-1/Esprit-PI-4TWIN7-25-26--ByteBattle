import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { DiscussionsService } from "./discussions.service";
import {
  CreateDiscussionDto,
  UpdateDiscussionDto,
  CreateCommentDto,
  UpdateCommentDto,
} from "./dto/discussion.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Discussions")
@Controller("discussions")
export class DiscussionsController {
  constructor(private discussionsService: DiscussionsService) {}

  // ─── Discussions ──────────────────────────────────
  @Post()
  @Roles("user")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a discussion" })
  createDiscussion(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateDiscussionDto,
  ) {
    return this.discussionsService.createDiscussion(userId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: "List discussions with pagination, search, filters",
  })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "tags", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({
    name: "sort",
    required: false,
    description: "newest|oldest|popular|most-voted",
  })
  findAll(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("tags") tags?: string,
    @Query("search") search?: string,
    @Query("sort") sort?: string,
  ) {
    return this.discussionsService.findAllDiscussions({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      tags,
      search,
      sort,
    });
  }

  // ─── Stats & Tags ──────────────────────────────────
  @Public()
  @Get("stats")
  @ApiOperation({ summary: "Get discussion forum stats" })
  getStats() {
    return this.discussionsService.getStats();
  }

  @Public()
  @Get("tags/popular")
  @ApiOperation({ summary: "Get popular tags" })
  getPopularTags() {
    return this.discussionsService.getPopularTags();
  }

  @Get("my-posts")
  @Roles("user")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my discussions" })
  getMyPosts(
    @CurrentUser("id") userId: string,
    @Query("status") status?: string,
  ) {
    return this.discussionsService.getMyPosts(userId, status);
  }

  @Public()
  @Get(":id/revisions")
  @ApiOperation({ summary: "Get edit history of a discussion" })
  getRevisions(@Param("id") id: string) {
    return this.discussionsService.getRevisions(id);
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get discussion with comments" })
  findOne(@Param("id") id: string) {
    return this.discussionsService.findOneDiscussion(id);
  }

  @Patch(":id")
  @Roles("user")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update discussion (author, moderator, or admin)" })
  update(
    @Param("id") id: string,
    @CurrentUser() user: { id: string; role: string },
    @Body() dto: UpdateDiscussionDto,
  ) {
    return this.discussionsService.updateDiscussion(
      id,
      user.id,
      dto,
      user.role,
    );
  }

  @Delete(":id")
  @Roles("user")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete discussion (author, moderator, or admin)" })
  remove(
    @Param("id") id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.discussionsService.deleteDiscussion(id, user.id, user.role);
  }

  @Post(":id/vote")
  @Roles("user")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Vote on a discussion" })
  vote(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body("type") type: "upvote" | "downvote",
  ) {
    return this.discussionsService.voteDiscussion(id, userId, type);
  }

  @Patch(":id/solve")
  @Roles("user")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Toggle solved on own discussion" })
  toggleSolved(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.discussionsService.toggleSolved(id, userId);
  }

  @Post(":id/flag")
  @Roles("user")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Flag a discussion" })
  flagDiscussion(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.discussionsService.flagDiscussion(id, userId);
  }

  // ─── Comments ──────────────────────────────────
  @Post(":id/comments")
  @Roles("user")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add a comment to a discussion" })
  createComment(
    @Param("id") discussionId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.discussionsService.createComment(discussionId, userId, dto);
  }

  @Patch("comments/:commentId")
  @Roles("user")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Edit comment (author, moderator, or admin)" })
  updateComment(
    @Param("commentId") commentId: string,
    @CurrentUser() user: { id: string; role: string },
    @Body() dto: UpdateCommentDto,
  ) {
    return this.discussionsService.updateComment(
      commentId,
      user.id,
      dto,
      user.role,
    );
  }

  @Delete("comments/:commentId")
  @Roles("user")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Delete comment and replies (author, moderator, or admin)",
  })
  deleteComment(
    @Param("commentId") commentId: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.discussionsService.deleteComment(commentId, user.id, user.role);
  }

  @Post("comments/:commentId/vote")
  @Roles("user")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Vote on a comment" })
  voteComment(
    @Param("commentId") commentId: string,
    @CurrentUser("id") userId: string,
    @Body("type") type: "upvote" | "downvote",
  ) {
    return this.discussionsService.voteComment(commentId, userId, type);
  }

  @Patch("comments/:commentId/best-answer")
  @Roles("user")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Toggle best answer on a comment" })
  toggleBestAnswer(
    @Param("commentId") commentId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.discussionsService.toggleBestAnswer(commentId, userId);
  }

  @Post("comments/:commentId/flag")
  @Roles("user")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Flag a comment" })
  flagComment(
    @Param("commentId") commentId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.discussionsService.flagComment(commentId, userId);
  }
}
