import {
  Controller, Get, Post, Patch, Delete,
  Param, Query, Body, Res, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';

import { HackathonsService } from './hackathons.service';
import { HackathonSubmissionService } from './hackathon-submission.service';
import { HackathonScoreboardService } from './hackathon-scoreboard.service';
import { HackathonChatService } from './hackathon-chat.service';
import { HackathonClarificationService } from './hackathon-clarification.service';
import { HackathonAnnouncementService } from './hackathon-announcement.service';
import { HackathonMonitoringService } from './hackathon-monitoring.service';
import { HackathonAuditService } from './hackathon-audit.service';
import { HackathonPlagiarismService } from './hackathon-plagiarism.service';

import {
  CreateHackathonDto,
  UpdateHackathonDto,
  TransitionStatusDto,
  CancelHackathonDto,
} from './dto/hackathon.dto';
import { CreateHackathonTeamDto, JoinHackathonTeamDto } from './dto/team.dto';
import { SubmitCodeDto, RunCodeDto } from './dto/submission.dto';
import { CreateClarificationDto, AnswerClarificationDto } from './dto/clarification.dto';
import { CreateAnnouncementDto } from './dto/announcement.dto';
import { SendMessageDto } from './dto/chat.dto';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Hackathons')
@Controller('hackathons')
export class HackathonsController {
  constructor(
    private hackathonsService: HackathonsService,
    private submissionService: HackathonSubmissionService,
    private scoreboardService: HackathonScoreboardService,
    private chatService: HackathonChatService,
    private clarificationService: HackathonClarificationService,
    private announcementService: HackathonAnnouncementService,
    private monitoringService: HackathonMonitoringService,
    private auditService: HackathonAuditService,
    private plagiarismService: HackathonPlagiarismService,
  ) {}

  // ════════════════════════════════════════════════════════
  // PUBLIC ENDPOINTS
  // ════════════════════════════════════════════════════════

  @Public()
  @Get()
  @ApiOperation({ summary: 'List hackathons' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'scope', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('scope') scope?: string,
  ) {
    return this.hackathonsService.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      status,
      scope,
    });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get hackathon details' })
  findOne(@Param('id') id: string) {
    return this.hackathonsService.findOne(id);
  }

  @Public()
  @Get(':id/scoreboard')
  @ApiOperation({ summary: 'Get ICPC-style scoreboard (frozen for participants)' })
  getScoreboard(@Param('id') id: string) {
    return this.scoreboardService.getScoreboard(id, false);
  }

  @Public()
  @Get(':id/announcements')
  @ApiOperation({ summary: 'Get hackathon announcements' })
  getAnnouncements(@Param('id') hackathonId: string) {
    return this.announcementService.getAnnouncements(hackathonId);
  }

  // ════════════════════════════════════════════════════════
  // TEAM MANAGEMENT (authenticated users)
  // ════════════════════════════════════════════════════════

  @Post(':id/teams')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a HackathonTeam' })
  createHackathonTeam(
    @Param('id') hackathonId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateHackathonTeamDto,
  ) {
    return this.hackathonsService.createHackathonTeam(hackathonId, userId, dto);
  }

  @Post(':id/teams/join')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a HackathonTeam by join code' })
  joinTeamByCode(
    @Param('id') hackathonId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: JoinHackathonTeamDto,
  ) {
    return this.hackathonsService.joinTeamByCode(hackathonId, dto.joinCode, userId);
  }

  @Post(':id/join-solo')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join hackathon solo (auto-creates team of 1)' })
  joinSolo(
    @Param('id') hackathonId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.hackathonsService.joinSolo(hackathonId, userId);
  }

  @Post(':id/teams/:teamId/checkin')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check-in team (captain only)' })
  checkinTeam(
    @Param('id') hackathonId: string,
    @Param('teamId') teamId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.hackathonsService.checkinTeam(hackathonId, teamId, userId);
  }

  @Post(':id/teams/:teamId/leave')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave your team' })
  leaveTeam(
    @Param('id') hackathonId: string,
    @Param('teamId') teamId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.hackathonsService.leaveTeam(hackathonId, teamId, userId);
  }

  @Delete(':id/teams/:teamId/members/:userId')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a team member (captain only)' })
  removeTeamMember(
    @Param('id') hackathonId: string,
    @Param('teamId') teamId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.hackathonsService.removeTeamMember(hackathonId, teamId, userId, targetUserId);
  }

  // ════════════════════════════════════════════════════════
  // SUBMISSION & RUN (authenticated users) — T073, T074, T075
  // ════════════════════════════════════════════════════════

  @Post(':id/teams/:teamId/submit')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit code for judging' })
  submitCode(
    @Param('id') hackathonId: string,
    @Param('teamId') teamId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitCodeDto,
  ) {
    return this.submissionService.submitCode(hackathonId, teamId, userId, dto);
  }

  @Post(':id/run')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Run code without creating a submission' })
  runCode(
    @Param('id') hackathonId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: RunCodeDto,
  ) {
    return this.submissionService.runCode(hackathonId, userId, dto);
  }

  @Get(':id/teams/:teamId/submissions')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get team submissions' })
  @ApiQuery({ name: 'challengeId', required: false })
  getTeamSubmissions(
    @Param('id') hackathonId: string,
    @Param('teamId') teamId: string,
    @Query('challengeId') challengeId?: string,
  ) {
    return this.submissionService.getTeamSubmissions(hackathonId, teamId, challengeId);
  }

  // ════════════════════════════════════════════════════════
  // COMMUNICATION (authenticated users) — T076-T080, T082
  // ════════════════════════════════════════════════════════

  @Post(':id/clarifications')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a clarification request' })
  createClarification(
    @Param('id') hackathonId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateClarificationDto,
    @Body('teamId') teamId: string,
  ) {
    return this.clarificationService.createClarification(
      hackathonId,
      teamId,
      userId,
      dto.challengeId,
      dto.question,
    );
  }

  @Get(':id/clarifications')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get clarifications (own + broadcast)' })
  @ApiQuery({ name: 'teamId', required: false })
  getClarifications(
    @Param('id') hackathonId: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.clarificationService.getClarifications(hackathonId, { teamId });
  }

  @Get(':id/teams/:teamId/messages')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get team chat messages' })
  @ApiQuery({ name: 'before', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getTeamMessages(
    @Param('id') hackathonId: string,
    @Param('teamId') teamId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getMessages(hackathonId, teamId, {
      before,
      limit: limit ? +limit : undefined,
    });
  }

  @Post(':id/teams/:teamId/messages')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a team chat message' })
  sendTeamMessage(
    @Param('id') hackathonId: string,
    @Param('teamId') teamId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(hackathonId, teamId, userId, dto);
  }

  // ════════════════════════════════════════════════════════
  // ADMIN ENDPOINTS
  // ════════════════════════════════════════════════════════

  @Post()
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a hackathon (admin)' })
  create(
    @Body() dto: CreateHackathonDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.hackathonsService.create(dto, adminId);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a hackathon (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateHackathonDto) {
    return this.hackathonsService.update(id, dto);
  }

  // T068 — Transition status
  @Post(':id/transition')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transition hackathon status (admin)' })
  transitionStatus(
    @Param('id') hackathonId: string,
    @Body() dto: TransitionStatusDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.hackathonsService.transitionStatus(hackathonId, dto.status, adminId);
  }

  // T090c — Cancel
  @Post(':id/cancel')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a hackathon (admin)' })
  cancelHackathon(
    @Param('id') hackathonId: string,
    @Body() dto: CancelHackathonDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.hackathonsService.cancelHackathon(hackathonId, adminId, dto.reason);
  }

  // T090b — Delete
  @Delete(':id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a hackathon (admin)' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.hackathonsService.deleteHackathon(id, adminId);
  }

  // T077 — Answer clarification (admin)
  @Post(':id/clarifications/:clarificationId/answer')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Answer a clarification (admin)' })
  answerClarification(
    @Param('clarificationId') clarificationId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: AnswerClarificationDto,
  ) {
    return this.clarificationService.answerClarification(
      clarificationId,
      adminId,
      dto.answer,
      dto.isBroadcast,
    );
  }

  // T081 — Create announcement (admin)
  @Post(':id/announcements')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an announcement (admin)' })
  createAnnouncement(
    @Param('id') hackathonId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.announcementService.createAnnouncement(
      hackathonId,
      adminId,
      dto.content,
      dto.isPinned,
    );
  }

  // T083 — Toggle pin announcement (admin)
  @Patch(':id/announcements/:announcementId')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle pin on announcement (admin)' })
  togglePin(@Param('announcementId') announcementId: string) {
    return this.announcementService.togglePin(announcementId);
  }

  // T084 — Rejudge (admin)
  @Post(':id/rejudge')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rejudge submissions (admin)' })
  rejudge(
    @Param('id') hackathonId: string,
    @Body() body: { challengeId?: string; teamId?: string },
    @CurrentUser('id') adminId: string,
  ) {
    if (body.challengeId) {
      return this.submissionService.rejudgeProblem(hackathonId, body.challengeId);
    }
    if (body.teamId) {
      return this.submissionService.rejudgeTeam(hackathonId, body.teamId);
    }
    return { message: 'Provide challengeId or teamId' };
  }

  // T085 — Disqualify / Reinstate (admin)
  @Post(':id/teams/:teamId/disqualify')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disqualify a team (admin)' })
  disqualifyTeam(
    @Param('id') hackathonId: string,
    @Param('teamId') teamId: string,
    @CurrentUser('id') adminId: string,
    @Body('reason') reason: string,
  ) {
    return this.hackathonsService.disqualifyTeam(hackathonId, teamId, adminId, reason);
  }

  @Post(':id/teams/:teamId/reinstate')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reinstate a disqualified team (admin)' })
  reinstateTeam(
    @Param('id') hackathonId: string,
    @Param('teamId') teamId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.hackathonsService.reinstateTeam(hackathonId, teamId, adminId);
  }

  // T086 — Admin monitoring
  @Get(':id/admin/monitoring')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get real-time monitoring data (admin)' })
  getMonitoring(@Param('id') hackathonId: string) {
    return this.monitoringService.getMonitoringData(hackathonId);
  }

  // T087 — Admin audit log
  @Get(':id/admin/audit-log')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get audit log (admin)' })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getAuditLog(
    @Param('id') hackathonId: string,
    @Query('action') action?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getAuditLog(hackathonId, {
      action,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  // T088 — Admin scoreboard (always live)
  @Get(':id/admin/scoreboard')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get live scoreboard (admin, never frozen)' })
  getAdminScoreboard(@Param('id') hackathonId: string) {
    return this.scoreboardService.getScoreboard(hackathonId, true);
  }

  // T089 — Export results
  @Post(':id/export')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export hackathon results (admin)' })
  async exportResults(
    @Param('id') hackathonId: string,
    @Body('format') format: 'csv' | 'json',
    @Res() res: Response,
  ) {
    const result = await this.scoreboardService.exportResults(hackathonId, format || 'json');

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=hackathon-${hackathonId}.csv`);
      return res.send(result);
    }

    return res.json(result);
  }

  // T090 — Plagiarism scan
  @Post(':id/plagiarism-scan')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger plagiarism scan (admin)' })
  triggerPlagiarismScan(
    @Param('id') hackathonId: string,
    @Body('challengeId') challengeId: string,
  ) {
    return this.plagiarismService.checkPlagiarism(hackathonId, challengeId);
  }

  // ════════════════════════════════════════════════════════
  // LEGACY TEAM ENDPOINTS (backward compatibility)
  // ════════════════════════════════════════════════════════

  @Post(':id/legacy-teams')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Legacy] Create a team' })
  createTeam(
    @Param('id') hackathonId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: { name: string },
  ) {
    return this.hackathonsService.createTeam(hackathonId, userId, dto);
  }

  @Post('legacy-teams/:teamId/join')
  @Roles('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Legacy] Join a team' })
  joinTeam(
    @Param('teamId') teamId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.hackathonsService.joinTeam(teamId, userId);
  }
}
