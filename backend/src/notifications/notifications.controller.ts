import {
  Controller,
  Get,
  Patch,
  Delete,
  Put,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationPreferenceService } from "./notification-preference.service";
import { NotificationEmitterService } from "./notification-emitter.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
} from "@nestjs/swagger";
import { NotificationQueryDto } from "./dto/notification-query.dto";
import { BulkNotificationDto } from "./dto/bulk-notification.dto";
import { UpdateNotificationPreferenceDto } from "./dto/notification-preference.dto";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles("user")
@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly preferenceService: NotificationPreferenceService,
    private readonly emitterService: NotificationEmitterService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get paginated notifications for the current user" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "category", required: false, type: String })
  @ApiQuery({ name: "unreadOnly", required: false, type: Boolean })
  @ApiResponse({ status: 200, description: "Paginated notifications list" })
  getAll(@Request() req, @Query() query: NotificationQueryDto) {
    return this.notificationsService.getAll(req.user.id, query);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread notification count" })
  @ApiResponse({ status: 200, description: "{ count: number }" })
  getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Get("preferences")
  @ApiOperation({
    summary:
      "Get current user notification preferences (returns defaults if not set)",
  })
  @ApiResponse({ status: 200, description: "NotificationPreference object" })
  getPreferences(@Request() req) {
    return this.preferenceService.getOrDefault(req.user.id);
  }

  @Put("preferences")
  @ApiOperation({
    summary: "Create or update notification preferences (upsert)",
  })
  @ApiBody({ type: UpdateNotificationPreferenceDto })
  @ApiResponse({ status: 200, description: "Updated NotificationPreference" })
  updatePreferences(
    @Request() req,
    @Body() dto: UpdateNotificationPreferenceDto,
  ) {
    return this.preferenceService.upsert(req.user.id, dto);
  }

  @Patch("read-all")
  @ApiOperation({ summary: "Mark all unread notifications as read" })
  @ApiResponse({ status: 200, description: "{ updated: number }" })
  markAllRead(@Request() req) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Patch("bulk/read")
  @ApiOperation({ summary: "Mark multiple notifications as read" })
  @ApiBody({ type: BulkNotificationDto })
  @ApiResponse({ status: 200, description: "{ updated: number }" })
  bulkMarkRead(@Request() req, @Body() dto: BulkNotificationDto) {
    return this.notificationsService.bulkMarkRead(dto.ids, req.user.id);
  }

  @Patch("bulk/archive")
  @ApiOperation({ summary: "Archive multiple notifications" })
  @ApiBody({ type: BulkNotificationDto })
  @ApiResponse({ status: 200, description: "{ updated: number }" })
  bulkArchive(@Request() req, @Body() dto: BulkNotificationDto) {
    return this.notificationsService.bulkArchive(dto.ids, req.user.id);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a specific notification as read" })
  @ApiParam({ name: "id", description: "Notification ObjectId" })
  @ApiResponse({ status: 200, description: "Updated notification" })
  @ApiResponse({ status: 404, description: "Notification not found" })
  markRead(@Param("id") id: string, @Request() req) {
    return this.notificationsService.markRead(id, req.user.id);
  }

  @Patch(":id/archive")
  @ApiOperation({ summary: "Archive a notification (soft delete)" })
  @ApiParam({ name: "id", description: "Notification ObjectId" })
  @ApiResponse({ status: 200, description: "{ isArchived: true }" })
  @ApiResponse({ status: 404, description: "Notification not found" })
  archive(@Param("id") id: string, @Request() req) {
    return this.notificationsService.archive(id, req.user.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Hard delete a notification" })
  @ApiParam({ name: "id", description: "Notification ObjectId" })
  @ApiResponse({ status: 200, description: "{ deleted: true }" })
  @ApiResponse({ status: 404, description: "Notification not found" })
  delete(@Param("id") id: string, @Request() req) {
    return this.notificationsService.delete(id, req.user.id);
  }

  /** Dev-only: fire a test notification to yourself */
  @Post("test")
  @ApiOperation({ summary: "[DEV] Send a test notification to yourself" })
  @ApiResponse({ status: 201, description: "Test notification emitted" })
  async sendTest(@Request() req) {
    await this.emitterService.emit({
      userId: req.user.id,
      type: "system_announcement",
      category: "system",
      priority: "high",
      title: "🔔 Test notification",
      message: "Notifications are working correctly!",
      actionUrl: "/notifications",
    });
    return { ok: true };
  }
}
