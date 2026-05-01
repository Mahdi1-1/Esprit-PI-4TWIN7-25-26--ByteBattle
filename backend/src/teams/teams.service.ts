import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { TeamResponseDto } from './dto/team-response.dto';
import { NotificationEmitterService } from '../notifications/notification-emitter.service';
import { NotificationCategory, NotificationPriority, NotificationType } from '../notifications/notification.constants';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationEmitter: NotificationEmitterService,
  ) {}

  private readonly maxMembers = 4;

  private generateJoinCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  private async generateUniqueJoinCode() {
    for (let i = 0; i < 10; i += 1) {
      const code = this.generateJoinCode();
      const existing = await this.prisma.userTeam.findFirst({ where: { joinCode: code } });
      if (!existing) return code;
    }

    throw new BadRequestException('Could not generate a unique join code. Please retry.');
  }

  private extractMongoId(rawId: any): string | null {
    if (!rawId) return null;
    if (typeof rawId === 'string') return rawId;
    if (typeof rawId === 'object' && typeof rawId.$oid === 'string') return rawId.$oid;
    return null;
  }

  private async repairMissingJoinCodesGlobally() {
    const collectionCandidates = ['UserTeam', 'userTeam'];

    for (const collectionName of collectionCandidates) {
      try {
        const rawResult: any = await this.prisma.$runCommandRaw({
          find: collectionName,
          filter: { $or: [{ joinCode: null }, { joinCode: { $exists: false } }] },
        });

        const docs = rawResult?.cursor?.firstBatch || [];
        for (const doc of docs) {
          const id = this.extractMongoId(doc?._id);
          if (!id) continue;

          const joinCode = await this.generateUniqueJoinCode();
          await this.prisma.userTeam.update({ where: { id }, data: { joinCode } });
        }
      } catch {
        // Ignore collection lookups that do not exist in this environment.
      }
    }
  }

  private async getUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, profileImage: true },
    });
  }

  private async buildRegisteredHackathonIdsByTeamId(teams: any[]) {
    const byTeamId: Record<string, string[]> = {};
    if (!teams.length) return byTeamId;

    const registrations = await this.prisma.hackathonTeam.findMany({
      select: {
        hackathonId: true,
        members: true,
      },
    });

    for (const team of teams) {
      const memberIds = new Set((team.members ?? []).map((member: any) => member.userId));
      const hackathonIds = registrations
        .filter((registration: any) =>
          (registration.members ?? []).some((member: any) => memberIds.has(member.userId)),
        )
        .map((registration: any) => registration.hackathonId);

      byTeamId[team.id] = Array.from(new Set(hackathonIds));
    }

    return byTeamId;
  }

  private async toDto(
    raw: any,
    requestingUserId: string,
    registeredHackathonIds: string[] = [],
  ): Promise<TeamResponseDto> {
    const dto = await TeamResponseDto.fromPrisma(raw, requestingUserId, (userId) => this.getUser(userId));
    dto.registeredHackathonIds = registeredHackathonIds;
    return dto;
  }

  private ensureCaptain(team: any, requesterId: string) {
    if (team.ownerId !== requesterId) {
      throw new BadRequestException('Only the team owner can perform this action');
    }
  }

  private async emitSystemNotification(userId: string, title: string, message: string, actionUrl = '/teams') {
    await this.notificationEmitter.emit({
      userId,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      category: NotificationCategory.SYSTEM,
      priority: NotificationPriority.MEDIUM,
      title,
      message,
      actionUrl,
    });
  }

  private async getTeamOrThrow(teamId: string) {
    const team = await this.prisma.userTeam.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return team;
  }

  private async setJoinRequests(teamId: string, nextJoinRequests: any[]) {
    return this.prisma.userTeam.update({
      where: { id: teamId },
      data: { joinRequests: nextJoinRequests },
    });
  }

  async createTeam(requesterId: string, dto: CreateTeamDto) {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Team name is required');
    }

    const existing = await this.prisma.userTeam.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new BadRequestException('A team with this name already exists');
    }

    const owner = await this.getUser(requesterId);
    const joinCode = await this.generateUniqueJoinCode();

    const created = await this.prisma.userTeam.create({
      data: {
        name,
        ownerId: requesterId,
        joinCode,
        members: [
          {
            userId: requesterId,
            username: owner?.username ?? null,
            role: 'captain',
            joinedAt: new Date(),
          },
        ],
        joinRequests: [],
      },
    });

    await this.emitSystemNotification(
      requesterId,
      'Team created',
      `Your team "${created.name}" is ready.`,
    );

    return this.toDto(created, requesterId);
  }

  async getMyTeams(userId: string) {
    await this.repairMissingJoinCodesGlobally();

    // Composite-array filters on Mongo can be inconsistent across Prisma versions,
    // so enforce ownership/membership scope explicitly.
    const teams = await this.prisma.userTeam.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const scopedTeams = teams.filter((team: any) => {
      if (team.ownerId === userId) return true;
      return (team.members ?? []).some((member: any) => member.userId === userId);
    });

    const registrationsByTeamId = await this.buildRegisteredHackathonIdsByTeamId(scopedTeams);
    return Promise.all(
      scopedTeams.map((team) => this.toDto(team, userId, registrationsByTeamId[team.id] ?? [])),
    );
  }

  async getAllTeams(userId: string) {
    await this.repairMissingJoinCodesGlobally();

    const teams = await this.prisma.userTeam.findMany({ orderBy: { createdAt: 'desc' } });
    const registrationsByTeamId = await this.buildRegisteredHackathonIdsByTeamId(teams);
    return Promise.all(teams.map((team) => this.toDto(team, userId, registrationsByTeamId[team.id] ?? [])));
  }

  async getTeamById(teamId: string, userId: string) {
    const team = await this.getTeamOrThrow(teamId);
    const registrationsByTeamId = await this.buildRegisteredHackathonIdsByTeamId([team]);
    return this.toDto(team, userId, registrationsByTeamId[team.id] ?? []);
  }

  async inviteMember(teamId: string, requesterId: string, dto: InviteMemberDto) {
    const team = await this.getTeamOrThrow(teamId);
    this.ensureCaptain(team, requesterId);

    const username = dto.username.trim();
    if (!username) {
      throw new BadRequestException('Username is required');
    }

    const target = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, profileImage: true },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    const members = team.members ?? [];
    if (members.some((member: any) => member.userId === target.id)) {
      throw new BadRequestException('User is already a member');
    }

    if (members.length >= this.maxMembers) {
      throw new BadRequestException(`Team is full (max ${this.maxMembers} members)`);
    }

    const updated = await this.prisma.userTeam.update({
      where: { id: teamId },
      data: {
        members: [
          ...members,
          {
            userId: target.id,
            username: target.username,
            role: 'member',
            joinedAt: new Date(),
          },
        ],
      },
    });

    await this.emitSystemNotification(
      requesterId,
      'Member added',
      `${target.username} was added to "${team.name}".`,
    );

    await this.notificationEmitter.emit({
      userId: target.id,
      type: NotificationType.HACKATHON_TEAM_JOINED,
      category: NotificationCategory.HACKATHON,
      priority: NotificationPriority.MEDIUM,
      title: 'Added to team',
      message: `You were added to "${team.name}".`,
      actionUrl: '/teams',
      entityId: teamId,
      entityType: 'userTeam',
    });

    return this.toDto(updated, requesterId);
  }

  async removeMember(teamId: string, requesterId: string, memberUserId: string) {
    const team = await this.getTeamOrThrow(teamId);
    this.ensureCaptain(team, requesterId);

    if (memberUserId === requesterId) {
      throw new BadRequestException('Owner cannot remove themselves. Delete the team instead.');
    }

    const members = team.members ?? [];
    if (!members.some((member: any) => member.userId === memberUserId)) {
      throw new NotFoundException('Member not found in this team');
    }

    const updated = await this.prisma.userTeam.update({
      where: { id: teamId },
      data: {
        members: members.filter((member: any) => member.userId !== memberUserId),
      },
    });

    await this.emitSystemNotification(
      requesterId,
      'Member removed',
      `A member was removed from "${team.name}".`,
    );

    await this.notificationEmitter.emit({
      userId: memberUserId,
      type: NotificationType.HACKATHON_TEAM_LEFT,
      category: NotificationCategory.HACKATHON,
      priority: NotificationPriority.MEDIUM,
      title: 'Removed from team',
      message: `You were removed from "${team.name}".`,
      actionUrl: '/teams',
      entityId: teamId,
      entityType: 'userTeam',
    });

    return this.toDto(updated, requesterId);
  }

  async leaveTeam(teamId: string, userId: string) {
    const team = await this.getTeamOrThrow(teamId);
    const members = team.members ?? [];

    if (!members.some((member: any) => member.userId === userId)) {
      throw new BadRequestException('You are not a member of this team');
    }

    if (team.ownerId === userId) {
      if (members.length > 1) {
        throw new BadRequestException('Delete the team or remove members before leaving');
      }

      await this.prisma.userTeam.delete({ where: { id: teamId } });

      await this.emitSystemNotification(
        userId,
        'Team deleted',
        `"${team.name}" was deleted.`,
      );

      return { message: 'Team deleted successfully' };
    }

    await this.prisma.userTeam.update({
      where: { id: teamId },
      data: {
        members: members.filter((member: any) => member.userId !== userId),
      },
    });

    await this.emitSystemNotification(
      userId,
      'Left team',
      `You left "${team.name}".`,
    );

    await this.notificationEmitter.emit({
      userId: team.ownerId,
      type: NotificationType.HACKATHON_TEAM_LEFT,
      category: NotificationCategory.HACKATHON,
      priority: NotificationPriority.MEDIUM,
      title: 'Member left team',
      message: `A member left "${team.name}".`,
      actionUrl: '/teams',
      entityId: teamId,
      entityType: 'userTeam',
      senderId: userId,
    });

    return { message: 'Left team successfully' };
  }

  async deleteTeam(teamId: string, requesterId: string) {
    const team = await this.getTeamOrThrow(teamId);
    this.ensureCaptain(team, requesterId);

    const memberIds = Array.from(new Set((team.members ?? []).map((member: any) => member.userId)));

    await this.prisma.userTeam.delete({ where: { id: teamId } });

    await Promise.all(
      memberIds.map((memberId: string) =>
        this.notificationEmitter.emit({
          userId: memberId,
          type: NotificationType.HACKATHON_TEAM_LEFT,
          category: NotificationCategory.HACKATHON,
          priority: NotificationPriority.MEDIUM,
          title: 'Team deleted',
          message: `"${team.name}" has been deleted.`,
          actionUrl: '/teams',
          entityId: teamId,
          entityType: 'userTeam',
          senderId: requesterId,
        }),
      ),
    );

    return { message: 'Team deleted successfully' };
  }

  async requestJoinByCode(userId: string, joinCode: string) {
    const normalized = joinCode.trim().toUpperCase();
    const team = await this.prisma.userTeam.findFirst({ where: { joinCode: normalized } });

    if (!team) {
      throw new NotFoundException('Team with this code was not found');
    }

    return this.requestToJoin(team.id, userId);
  }

  async requestToJoin(teamId: string, userId: string) {
    const team = await this.getTeamOrThrow(teamId);
    const members = team.members ?? [];

    if (members.some((member: any) => member.userId === userId)) {
      throw new BadRequestException('You are already a member of this team');
    }

    const existingPending = (team.joinRequests ?? []).find(
      (request: any) => request.userId === userId && request.status === 'pending',
    );

    if (existingPending) {
      throw new BadRequestException('You already have a pending request for this team');
    }

    const requester = await this.getUser(userId);
    const joinRequests = [
      ...((team.joinRequests ?? []).filter((request: any) => request.userId !== userId)),
      {
        userId,
        username: requester?.username ?? null,
        requestedAt: new Date(),
        status: 'pending',
      },
    ];

    await this.setJoinRequests(teamId, joinRequests);

    await this.emitSystemNotification(
      userId,
      'Join request sent',
      `Your request to join "${team.name}" was sent.`,
    );

    await this.notificationEmitter.emit({
      userId: team.ownerId,
      type: NotificationType.HACKATHON_TEAM_JOINED,
      category: NotificationCategory.HACKATHON,
      priority: NotificationPriority.MEDIUM,
      title: 'New join request',
      message: `${requester?.username ?? 'A user'} requested to join "${team.name}".`,
      actionUrl: '/teams',
      entityId: teamId,
      entityType: 'userTeam',
      senderId: userId,
      senderName: requester?.username ?? undefined,
      senderPhoto: requester?.profileImage ?? undefined,
    });

    return { message: 'Join request sent' };
  }

  async getPendingRequests(teamId: string, requesterId: string) {
    const team = await this.getTeamOrThrow(teamId);
    this.ensureCaptain(team, requesterId);

    return Promise.all(
      (team.joinRequests ?? [])
        .filter((request: any) => request.status === 'pending')
        .map(async (request: any) => {
          const user = await this.getUser(request.userId);
          return {
            userId: request.userId,
            username: user?.username ?? request.username ?? 'Unknown',
            profileImage: user?.profileImage ?? request.profileImage ?? null,
            requestedAt: request.requestedAt,
            status: request.status,
          };
        }),
    );
  }

  async approveJoinRequest(teamId: string, requesterId: string, targetUserId: string) {
    const team = await this.getTeamOrThrow(teamId);
    this.ensureCaptain(team, requesterId);

    const members = team.members ?? [];
    if (members.some((member: any) => member.userId === targetUserId)) {
      throw new BadRequestException('User is already a member');
    }

    const requests = team.joinRequests ?? [];
    const request = requests.find((item: any) => item.userId === targetUserId && item.status === 'pending');
    if (!request) {
      throw new NotFoundException('Pending join request not found');
    }

    if (members.length >= this.maxMembers) {
      throw new BadRequestException(`Team is full (max ${this.maxMembers} members)`);
    }

    const user = await this.getUser(targetUserId);
    const updated = await this.prisma.userTeam.update({
      where: { id: teamId },
      data: {
        members: [
          ...members,
          {
            userId: targetUserId,
            username: user?.username ?? request.username ?? null,
            role: 'member',
            joinedAt: new Date(),
          },
        ],
        joinRequests: requests.filter((item: any) => item.userId !== targetUserId),
      },
    });

    await this.emitSystemNotification(
      requesterId,
      'Join request approved',
      'The user has been added to your team.',
    );

    await this.notificationEmitter.emit({
      userId: targetUserId,
      type: NotificationType.HACKATHON_TEAM_JOINED,
      category: NotificationCategory.HACKATHON,
      priority: NotificationPriority.MEDIUM,
      title: 'Join request approved',
      message: `Your request to join "${team.name}" was approved.`,
      actionUrl: '/teams',
      entityId: teamId,
      entityType: 'userTeam',
      senderId: requesterId,
    });

    const registrationsByTeamId = await this.buildRegisteredHackathonIdsByTeamId([updated]);
    return this.toDto(updated, requesterId, registrationsByTeamId[updated.id] ?? []);
  }

  async rejectJoinRequest(teamId: string, requesterId: string, targetUserId: string) {
    const team = await this.getTeamOrThrow(teamId);
    this.ensureCaptain(team, requesterId);

    const exists = (team.joinRequests ?? []).some(
      (request: any) => request.userId === targetUserId && request.status === 'pending',
    );

    if (!exists) {
      throw new NotFoundException('Pending join request not found');
    }

    await this.setJoinRequests(
      teamId,
      (team.joinRequests ?? []).filter((request: any) => request.userId !== targetUserId),
    );

    await this.emitSystemNotification(
      requesterId,
      'Join request rejected',
      'The join request was rejected.',
    );

    await this.notificationEmitter.emit({
      userId: targetUserId,
      type: NotificationType.HACKATHON_TEAM_LEFT,
      category: NotificationCategory.HACKATHON,
      priority: NotificationPriority.MEDIUM,
      title: 'Join request rejected',
      message: `Your request to join "${team.name}" was rejected.`,
      actionUrl: '/teams',
      entityId: teamId,
      entityType: 'userTeam',
      senderId: requesterId,
    });

    return { message: 'Join request rejected' };
  }

  async registerToHackathon(teamId: string, hackathonId: string, requesterId: string) {
    const [team, hackathon] = await Promise.all([
      this.getTeamOrThrow(teamId),
      this.prisma.hackathon.findUnique({ where: { id: hackathonId } }),
    ]);

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    if (team.ownerId !== requesterId) {
      throw new BadRequestException('Only the team captain can register the team to a hackathon');
    }

    if (!(team.members ?? []).some((member: any) => member.userId === requesterId)) {
      throw new BadRequestException('You are not a member of this team');
    }

    if (!['lobby', 'checkin'].includes(hackathon.status)) {
      throw new BadRequestException('Hackathon registration is closed');
    }

    const teamMemberIds = new Set((team.members ?? []).map((member: any) => member.userId));
    const hackathonRegistrations = await this.prisma.hackathonTeam.findMany({
      where: {
        hackathonId,
      },
      select: {
        id: true,
        members: true,
      },
    });

    const conflictingRegistration = hackathonRegistrations.find((registration: any) =>
      (registration.members ?? []).some((member: any) => teamMemberIds.has(member.userId)),
    );

    if (conflictingRegistration) {
      throw new BadRequestException('At least one team member is already registered in this hackathon');
    }

    const policy = (hackathon.teamPolicy as any) || {};
    const minSize = Number(policy.minSize ?? 1);
    const maxSize = Number(policy.maxSize ?? this.maxMembers);

    if ((team.members ?? []).length < minSize || (team.members ?? []).length > maxSize) {
      throw new BadRequestException(
        `Team size must be between ${minSize} and ${maxSize} members for this hackathon`,
      );
    }

    const hackathonMembers = (team.members ?? []).map((member: any) => ({
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt ?? new Date(),
    }));

    const created = await this.prisma.hackathonTeam.create({
      data: {
        hackathonId,
        name: team.name,
        joinCode: this.generateJoinCode(),
        members: hackathonMembers,
        isCheckedIn: false,
        solvedCount: 0,
        penaltyTime: 0,
        score: 0,
        type: hackathon.scope === 'enterprise' ? 'enterprise' : 'open',
        companyId: hackathon.companyId ?? null,
      },
    });

    await Promise.all(
      (team.members ?? []).map((member: any) =>
        this.notificationEmitter.emit({
          userId: member.userId,
          type: NotificationType.HACKATHON_TEAM_JOINED,
          category: NotificationCategory.HACKATHON,
          priority: NotificationPriority.HIGH,
          title: 'Hackathon registration complete',
          message: `Team "${team.name}" is registered for "${hackathon.title}".`,
          actionUrl: `/hackathon/${hackathonId}/scoreboard`,
          entityId: hackathonId,
          entityType: 'hackathon',
          senderId: requesterId,
        }),
      ),
    );

    return created;
  }
}