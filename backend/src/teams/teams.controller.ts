import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Param,
  PipeTransform,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteMemberDto } from './dto/invite-member.dto';

@Injectable()
class ParseMongoIdPipe implements PipeTransform {
  transform(value: string) {
    if (!/^[a-f\d]{24}$/i.test(value)) {
      throw new BadRequestException('Invalid MongoDB ObjectId');
    }
    return value;
  }
}

@ApiTags('Teams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a standalone team' })
  createTeam(@Body() dto: CreateTeamDto, @CurrentUser() user: { id: string }) {
    return this.teamsService.createTeam(user.id, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List teams the current user belongs to' })
  getMine(@CurrentUser() user: { id: string }) {
    return this.teamsService.getMyTeams(user.id);
  }

  @Get('all')
  @ApiOperation({ summary: 'List all teams' })
  getAll(@CurrentUser() user: { id: string }) {
    return this.teamsService.getAllTeams(user.id);
  }

  @Post('request-join')
  @ApiOperation({ summary: 'Request to join a team by join code' })
  requestJoinByCode(@Body() body: { joinCode: string }, @CurrentUser() user: { id: string }) {
    return this.teamsService.requestJoinByCode(user.id, body.joinCode);
  }

  @Post(':teamId/join-request')
  @ApiOperation({ summary: 'Request to join a team' })
  requestToJoin(@Param('teamId', ParseMongoIdPipe) teamId: string, @CurrentUser() user: { id: string }) {
    return this.teamsService.requestToJoin(teamId, user.id);
  }

  @Get(':teamId/join-requests')
  @ApiOperation({ summary: 'Get pending join requests' })
  getJoinRequests(@Param('teamId', ParseMongoIdPipe) teamId: string, @CurrentUser() user: { id: string }) {
    return this.teamsService.getPendingRequests(teamId, user.id);
  }

  @Get(':teamId')
  @ApiOperation({ summary: 'Get team details' })
  getTeam(@Param('teamId', ParseMongoIdPipe) teamId: string, @CurrentUser() user: { id: string }) {
    return this.teamsService.getTeamById(teamId, user.id);
  }

  @Post(':teamId/members')
  @ApiOperation({ summary: 'Invite a member by username' })
  addMember(
    @Param('teamId', ParseMongoIdPipe) teamId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: InviteMemberDto,
  ) {
    return this.teamsService.inviteMember(teamId, user.id, dto);
  }

  @Delete(':teamId/members/:targetUserId')
  @ApiOperation({ summary: 'Remove a member from a team' })
  removeMember(
    @Param('teamId', ParseMongoIdPipe) teamId: string,
    @Param('targetUserId', ParseMongoIdPipe) targetUserId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.teamsService.removeMember(teamId, user.id, targetUserId);
  }

  @Delete(':teamId/leave')
  @ApiOperation({ summary: 'Leave a team' })
  leaveTeam(@Param('teamId', ParseMongoIdPipe) teamId: string, @CurrentUser() user: { id: string }) {
    return this.teamsService.leaveTeam(teamId, user.id);
  }

  @Delete(':teamId')
  @ApiOperation({ summary: 'Delete a team' })
  deleteTeam(@Param('teamId', ParseMongoIdPipe) teamId: string, @CurrentUser() user: { id: string }) {
    return this.teamsService.deleteTeam(teamId, user.id);
  }

  @Post(':teamId/join-requests/:targetUserId/accept')
  @ApiOperation({ summary: 'Approve a join request' })
  acceptJoinRequest(
    @Param('teamId', ParseMongoIdPipe) teamId: string,
    @Param('targetUserId', ParseMongoIdPipe) targetUserId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.teamsService.approveJoinRequest(teamId, user.id, targetUserId);
  }

  @Post(':teamId/join-requests/:targetUserId/reject')
  @ApiOperation({ summary: 'Reject a join request' })
  rejectJoinRequest(
    @Param('teamId', ParseMongoIdPipe) teamId: string,
    @Param('targetUserId', ParseMongoIdPipe) targetUserId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.teamsService.rejectJoinRequest(teamId, user.id, targetUserId);
  }

  @Post(':teamId/register/:hackathonId')
  @ApiOperation({ summary: 'Register a team to a hackathon' })
  registerToHackathon(
    @Param('teamId', ParseMongoIdPipe) teamId: string,
    @Param('hackathonId', ParseMongoIdPipe) hackathonId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.teamsService.registerToHackathon(teamId, hackathonId, user.id);
  }
}