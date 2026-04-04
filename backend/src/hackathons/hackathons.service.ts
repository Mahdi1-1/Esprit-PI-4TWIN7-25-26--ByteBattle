import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHackathonDto, UpdateHackathonDto } from './dto/hackathon.dto';
import { CreateHackathonTeamDto } from './dto/team.dto';
import { HackathonAuditService } from './hackathon-audit.service';

// ── helpers ──────────────────────────────────────────────
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/** Valid state-machine transitions (source → allowed targets) */
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['lobby'],
  lobby: ['draft', 'checkin', 'cancelled'],
  checkin: ['active', 'cancelled'],
  active: ['frozen', 'ended'],
  frozen: ['active', 'ended'],
  ended: ['archived'],
};

@Injectable()
export class HackathonsService {
  constructor(
    private prisma: PrismaService,
    private auditService: HackathonAuditService,
  ) {}

  // ────────────────────────────────────────────────────────
  // CRUD
  // ────────────────────────────────────────────────────────

  async create(dto: CreateHackathonDto, adminId: string) {
    const joinCode = generateJoinCode();

    // Enterprise scope enforcement (Decision #23)
    let teamPolicy = dto.teamPolicy ?? { minSize: 1, maxSize: 3 };
    if (dto.scope === 'enterprise' && dto.companyId) {
      teamPolicy = { minSize: 1, maxSize: 1 };
    }

    return this.prisma.hackathon.create({
      data: {
        title: dto.title,
        description: dto.description,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        freezeAt: dto.freezeAt ? new Date(dto.freezeAt) : undefined,
        challengeIds: dto.challengeIds || [],
        rulesMd: dto.rulesMd,
        scope: dto.scope || 'public',
        companyId: dto.companyId,
        joinCode,
        teamPolicy,
        bannerUrl: dto.bannerUrl,
        createdById: adminId,
      },
    });
  }

  async findAll(query: { page?: number; limit?: number; status?: string; scope?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.scope) where.scope = query.scope;

    const [hackathons, total] = await Promise.all([
      this.prisma.hackathon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          _count: { select: { hackathonTeams: true } },
        },
      }),
      this.prisma.hackathon.count({ where }),
    ]);

    return { data: hackathons, total, page, limit };
  }

  async findOne(id: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id },
      include: {
        hackathonTeams: {
          orderBy: { score: 'desc' },
        },
      },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');
    return hackathon;
  }

  /**
   * Get hackathon challenges with sequential unlock logic.
   * A team can only see the NEXT unsolved problem.
   * Time limit per problem depends on difficulty:
   *   easy → 15 min, medium → 25 min, hard → 40 min
   */
  async getHackathonChallenges(hackathonId: string, teamId?: string) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    if (hackathon.challengeIds.length === 0) return [];

    // Fetch all challenge details
    const challenges = await this.prisma.challenge.findMany({
      where: { id: { in: hackathon.challengeIds } },
      select: {
        id: true,
        title: true,
        difficulty: true,
        descriptionMd: true,
        tags: true,
        constraints: true,
        hints: true,
        examples: true,
        tests: true,
        allowedLanguages: true,
        category: true,
      },
    });

    // Maintain original order from challengeIds
    const orderedChallenges = hackathon.challengeIds
      .map((cId) => challenges.find((c) => c.id === cId))
      .filter(Boolean);

    // Time limits per difficulty (in minutes)
    const TIME_LIMITS: Record<string, number> = {
      easy: 15,
      medium: 25,
      hard: 40,
    };

    // If no team, return all with metadata (admin view)
    if (!teamId) {
      return orderedChallenges.map((c: any, i: number) => ({
        ...c,
        order: i,
        label: String.fromCharCode(65 + i),
        timeLimitMinutes: TIME_LIMITS[c.difficulty] || 25,
        tests: c.tests?.filter((t: any) => !t.isHidden) || [],
        locked: false,
        solved: false,
      }));
    }

    // Get team's accepted submissions
    const team = await this.prisma.hackathonTeam.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    const teamACSubs = await this.prisma.hackathonSubmission.findMany({
      where: {
        hackathonId,
        teamId,
        verdict: 'AC',
      },
      distinct: ['challengeId'],
      select: { challengeId: true, submittedAt: true },
    });

    const solvedChallengeIds = new Set(teamACSubs.map((s) => s.challengeId));

    // Sequential unlock: find the first unsolved problem index
    let firstUnsolvedIndex = orderedChallenges.length; // all solved
    for (let i = 0; i < orderedChallenges.length; i++) {
      if (!solvedChallengeIds.has(orderedChallenges[i]!.id)) {
        firstUnsolvedIndex = i;
        break;
      }
    }

    // Q5: Team-wide problem timer — auto-start timer for current unlocked unsolved problem
    const problemStartTimes: Record<string, string> = (team.problemStartTimes as Record<string, string>) || {};
    let timersUpdated = false;

    if (firstUnsolvedIndex < orderedChallenges.length) {
      const currentChallengeId = orderedChallenges[firstUnsolvedIndex]!.id;
      if (!problemStartTimes[currentChallengeId]) {
        problemStartTimes[currentChallengeId] = new Date().toISOString();
        timersUpdated = true;
      }
    }

    // Persist updated timers if changed
    if (timersUpdated) {
      await this.prisma.hackathonTeam.update({
        where: { id: teamId },
        data: { problemStartTimes },
      });
    }

    return orderedChallenges.map((c: any, i: number) => {
      const solved = solvedChallengeIds.has(c.id);
      const locked = i > firstUnsolvedIndex; // Can only see solved + current
      return {
        id: c.id,
        order: i,
        label: String.fromCharCode(65 + i),
        title: locked ? `Problem ${String.fromCharCode(65 + i)}` : c.title,
        difficulty: c.difficulty,
        descriptionMd: locked ? '' : c.descriptionMd,
        tags: locked ? [] : c.tags,
        constraints: locked ? null : c.constraints,
        hints: locked ? [] : c.hints,
        examples: locked ? [] : c.examples,
        tests: locked ? [] : (c.tests?.filter((t: any) => !t.isHidden) || []),
        allowedLanguages: c.allowedLanguages,
        category: c.category,
        timeLimitMinutes: TIME_LIMITS[c.difficulty] || 25,
        locked,
        solved,
        // Q5: Team-wide timer — startedAt is the same for all team members
        startedAt: problemStartTimes[c.id] || null,
      };
    });
  }

  async update(id: string, dto: UpdateHackathonDto) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    // Only allow edits when draft or lobby
    if (!['draft', 'lobby'].includes(hackathon.status)) {
      throw new BadRequestException('Can only edit hackathon in draft or lobby status');
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.startTime !== undefined) data.startTime = new Date(dto.startTime);
    if (dto.endTime !== undefined) data.endTime = new Date(dto.endTime);
    if (dto.freezeAt !== undefined) data.freezeAt = new Date(dto.freezeAt);
    if (dto.challengeIds !== undefined) data.challengeIds = dto.challengeIds;
    if (dto.rulesMd !== undefined) data.rulesMd = dto.rulesMd;
    if (dto.teamPolicy !== undefined) data.teamPolicy = dto.teamPolicy;
    if (dto.bannerUrl !== undefined) data.bannerUrl = dto.bannerUrl;
    if (dto.scope !== undefined) data.scope = dto.scope;

    return this.prisma.hackathon.update({ where: { id }, data });
  }

  // ────────────────────────────────────────────────────────
  // LIFECYCLE STATE MACHINE (T018–T019d)
  // ────────────────────────────────────────────────────────

  /** T018 — validate a status transition is allowed */
  private async validateTransition(hackathon: any, newStatus: string): Promise<void> {
    const current = hackathon.status;
    const allowed = VALID_TRANSITIONS[current];

    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid transition from '${current}' to '${newStatus}'`,
      );
    }

    // Extra guards per transition
    if (current === 'lobby' && newStatus === 'draft') {
      const teamCount = await this.prisma.hackathonTeam.count({
        where: { hackathonId: hackathon.id },
      });
      if (teamCount > 0) {
        throw new BadRequestException('Cannot unpublish: teams have already registered');
      }
    }

    if (newStatus === 'active') {
      const checkedIn = await this.prisma.hackathonTeam.count({
        where: { hackathonId: hackathon.id, isCheckedIn: true },
      });
      if (checkedIn === 0) {
        throw new BadRequestException('Cannot start: no teams have checked in');
      }
    }
  }

  /** T019 — transition hackathon status */
  async transitionStatus(hackathonId: string, newStatus: string, adminId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    // Auto-check-in all registered teams when admin starts the competition
    if (newStatus === 'active') {
      await this.prisma.hackathonTeam.updateMany({
        where: { hackathonId: hackathon.id, isCheckedIn: false },
        data: { isCheckedIn: true },
      });
    }

    await this.validateTransition(hackathon, newStatus);

    const updated = await this.prisma.hackathon.update({
      where: { id: hackathonId },
      data: { status: newStatus as any },
    });

    await this.auditService.log(hackathonId, adminId, 'lifecycle_change', {
      from: hackathon.status,
      to: newStatus,
    });

    return updated;
  }

  /** T019b — cancel a hackathon */
  async cancelHackathon(hackathonId: string, adminId: string, reason: string) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    if (['active', 'frozen'].includes(hackathon.status)) {
      throw new ForbiddenException(
        'Cannot cancel hackathon during active competition. End it first.',
      );
    }

    // Draft → hard delete
    if (hackathon.status === 'draft') {
      await this.prisma.hackathon.delete({ where: { id: hackathonId } });
      return { deleted: true };
    }

    // Soft delete: set status to cancelled, dissolve teams
    await this.prisma.hackathonTeam.deleteMany({ where: { hackathonId } });

    const updated = await this.prisma.hackathon.update({
      where: { id: hackathonId },
      data: { status: 'cancelled', cancelledReason: reason },
    });

    await this.auditService.log(hackathonId, adminId, 'cancel', { reason });

    return updated;
  }

  /** T019c — delete a hackathon (status-dependent rules) */
  async deleteHackathon(hackathonId: string, adminId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    switch (hackathon.status) {
      case 'draft':
        await this.prisma.hackathon.delete({ where: { id: hackathonId } });
        return { deleted: true };

      case 'lobby':
      case 'checkin':
        return this.cancelHackathon(hackathonId, adminId, 'Deleted by admin');

      case 'active':
      case 'frozen':
        throw new ForbiddenException('Cannot delete hackathon during active competition');

      case 'ended':
        const updated = await this.prisma.hackathon.update({
          where: { id: hackathonId },
          data: { status: 'archived' },
        });
        await this.auditService.log(hackathonId, adminId, 'archive', {});
        return updated;

      default:
        throw new BadRequestException('Hackathon is already cancelled or archived');
    }
  }

  async remove(id: string) {
    // Keep backward compatibility — delegates to deleteHackathon for draft
    await this.prisma.team.deleteMany({ where: { hackathonId: id } });
    await this.prisma.hackathonTeam.deleteMany({ where: { hackathonId: id } });
    return this.prisma.hackathon.delete({ where: { id } });
  }

  // ────────────────────────────────────────────────────────
  // TEAM MANAGEMENT (T023–T028) — operates on HackathonTeam
  // ────────────────────────────────────────────────────────

  /** T023 — create a HackathonTeam */
  async createHackathonTeam(
    hackathonId: string,
    userId: string,
    dto: CreateHackathonTeamDto,
  ) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');
    if (hackathon.status !== 'lobby') {
      throw new BadRequestException('Can only create teams during lobby phase');
    }

    // Decision #15: no concurrent participation
    await this.ensureNotInActiveHackathon(userId);

    // Check not already in a team for THIS hackathon
    await this.ensureNotInHackathonTeam(hackathonId, userId);

    // Enterprise enforcement (Decision #23)
    if (hackathon.scope === 'enterprise') {
      const teamCount = await this.prisma.hackathonTeam.count({ where: { hackathonId } });
      if (teamCount >= 1) {
        throw new BadRequestException('Enterprise hackathons allow only 1 team');
      }
    }

    const joinCode = generateJoinCode();

    return this.prisma.hackathonTeam.create({
      data: {
        hackathonId,
        name: dto.name,
        joinCode,
        type: hackathon.scope === 'enterprise' ? 'enterprise' : 'open',
        companyId: hackathon.companyId,
        members: [{ userId, role: 'captain', joinedAt: new Date() }],
      },
    });
  }

  /** T024 — join a HackathonTeam by joinCode */
  async joinTeamByCode(hackathonId: string, joinCode: string, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');
    if (hackathon.status !== 'lobby') {
      throw new BadRequestException('Can only join teams during lobby phase');
    }

    const team = await this.prisma.hackathonTeam.findFirst({
      where: { hackathonId, joinCode },
    });
    if (!team) throw new NotFoundException('Team not found with this join code');

    // Decision #15: no concurrent participation
    await this.ensureNotInActiveHackathon(userId);
    await this.ensureNotInHackathonTeam(hackathonId, userId);

    // Check capacity
    const policy = hackathon.teamPolicy as any;
    const maxSize = policy?.maxSize ?? 3;
    if (team.members.length >= maxSize) {
      throw new BadRequestException('Team is full');
    }

    return this.prisma.hackathonTeam.update({
      where: { id: team.id },
      data: {
        members: {
          push: { userId, role: 'member', joinedAt: new Date() },
        },
      },
    });
  }

  /** Solo join shortcut — auto-creates a team of 1 */
  async joinSolo(hackathonId: string, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    const policy = hackathon.teamPolicy as any;
    if (policy?.minSize > 1) {
      throw new BadRequestException(
        'Solo participation not allowed: minimum team size is ' + policy.minSize,
      );
    }

    // Look up user for name
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const teamName = `${user?.username ?? 'Player'} (solo)`;

    return this.createHackathonTeam(hackathonId, userId, { name: teamName });
  }

  /** T025 — captain checks in the team */
  async checkinTeam(hackathonId: string, teamId: string, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');
    if (hackathon.status !== 'checkin') {
      throw new BadRequestException('Check-in is only available during the checkin phase');
    }

    const team = await this.prisma.hackathonTeam.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    this.assertCaptain(team, userId);

    return this.prisma.hackathonTeam.update({
      where: { id: teamId },
      data: { isCheckedIn: true },
    });
  }

  /** T026 — captain removes a member */
  async removeTeamMember(
    hackathonId: string,
    teamId: string,
    userId: string,
    targetUserId: string,
  ) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');
    if (!['lobby', 'checkin'].includes(hackathon.status)) {
      throw new BadRequestException('Cannot modify team during competition');
    }

    const team = await this.prisma.hackathonTeam.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    this.assertCaptain(team, userId);

    if (userId === targetUserId) {
      throw new BadRequestException('Captain cannot remove themselves; use leave instead');
    }

    const newMembers = team.members.filter((m) => m.userId !== targetUserId);
    if (newMembers.length === team.members.length) {
      throw new NotFoundException('User is not a member of this team');
    }

    return this.prisma.hackathonTeam.update({
      where: { id: teamId },
      data: { members: newMembers },
    });
  }

  /** T027 — member (or captain) leaves the team */
  async leaveTeam(hackathonId: string, teamId: string, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');
    if (!['lobby', 'checkin'].includes(hackathon.status)) {
      throw new BadRequestException('Cannot leave team during competition');
    }

    const team = await this.prisma.hackathonTeam.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    const isCaptain = team.members.find((m) => m.userId === userId)?.role === 'captain';
    const remainingMembers = team.members.filter((m) => m.userId !== userId);

    // No members left → dissolve team
    if (remainingMembers.length === 0) {
      await this.prisma.hackathonTeam.delete({ where: { id: teamId } });
      return { message: 'Left team successfully', newCaptain: null };
    }

    // Captain succession (Decision #14): promote oldest member by joinedAt
    if (isCaptain) {
      const sorted = [...remainingMembers].sort(
        (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
      );
      sorted[0] = { ...sorted[0], role: 'captain' };
      // Rebuild with promoted captain
      const updated = remainingMembers.map((m) =>
        m.userId === sorted[0].userId ? sorted[0] : m,
      );

      await this.prisma.hackathonTeam.update({
        where: { id: teamId },
        data: { members: updated },
      });

      return { message: 'Left team successfully', newCaptain: sorted[0].userId };
    }

    await this.prisma.hackathonTeam.update({
      where: { id: teamId },
      data: { members: remainingMembers },
    });

    return { message: 'Left team successfully', newCaptain: null };
  }

  /** T028 — admin disqualify / reinstate */
  async disqualifyTeam(hackathonId: string, teamId: string, adminId: string, reason: string) {
    await this.prisma.hackathonTeam.update({
      where: { id: teamId },
      data: { isDisqualified: true },
    });
    await this.auditService.log(hackathonId, adminId, 'disqualify', { teamId, reason });
    return { disqualified: true };
  }

  async reinstateTeam(hackathonId: string, teamId: string, adminId: string) {
    await this.prisma.hackathonTeam.update({
      where: { id: teamId },
      data: { isDisqualified: false },
    });
    await this.auditService.log(hackathonId, adminId, 'reinstate', { teamId });
    return { disqualified: false };
  }

  // ────────────────────────────────────────────────────────
  // SCOREBOARD (legacy — will be replaced by hackathon-scoreboard.service in Phase 3)
  // ────────────────────────────────────────────────────────

  async getScoreboard(hackathonId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    const teams = await this.prisma.hackathonTeam.findMany({
      where: { hackathonId, isDisqualified: false },
      orderBy: [{ solvedCount: 'desc' }, { penaltyTime: 'asc' }],
    });

    return {
      hackathon: {
        id: hackathon.id,
        title: hackathon.title,
        status: hackathon.status,
        freezeAt: hackathon.freezeAt,
      },
      teams,
      isFrozen: hackathon.status === 'frozen',
    };
  }

  // Legacy team operations — kept for backward compatibility with existing Team model
  async createTeam(hackathonId: string, userId: string, dto: { name: string }) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    return this.prisma.team.create({
      data: {
        hackathonId,
        name: dto.name,
        type: 'team',
        members: [{ userId, role: 'captain' }],
      },
    });
  }

  async joinTeam(teamId: string, userId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    const alreadyMember = team.members.some((m) => m.userId === userId);
    if (alreadyMember) throw new BadRequestException('Already a member of this team');

    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: team.hackathonId },
    });
    const maxMembers = (hackathon?.teamPolicy as any)?.maxMembers || 4;
    if (team.members.length >= maxMembers) {
      throw new BadRequestException('Team is full');
    }

    return this.prisma.team.update({
      where: { id: teamId },
      data: {
        members: {
          push: { userId, role: 'member' },
        },
      },
    });
  }

  // ────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ────────────────────────────────────────────────────────

  /** Ensure a user is not participating in another active hackathon (Decision #15) */
  private async ensureNotInActiveHackathon(userId: string) {
    const activeHackathonIds = (
      await this.prisma.hackathon.findMany({
        where: { status: { in: ['lobby', 'checkin', 'active', 'frozen'] } },
        select: { id: true },
      })
    ).map((h) => h.id);

    if (activeHackathonIds.length === 0) return;

    const existingTeam = await this.prisma.hackathonTeam.findFirst({
      where: {
        hackathonId: { in: activeHackathonIds },
        members: { some: { userId } },
      },
    });

    if (existingTeam) {
      throw new BadRequestException(
        'You are already participating in another active hackathon. Leave that team first.',
      );
    }
  }

  /** Ensure a user is not already in a HackathonTeam for this hackathon */
  private async ensureNotInHackathonTeam(hackathonId: string, userId: string) {
    const existing = await this.prisma.hackathonTeam.findFirst({
      where: {
        hackathonId,
        members: { some: { userId } },
      },
    });
    if (existing) {
      throw new BadRequestException('You are already in a team for this hackathon');
    }
  }

  /** Assert that userId is the captain of the team */
  private assertCaptain(team: any, userId: string) {
    const captain = team.members.find((m: any) => m.role === 'captain');
    if (!captain || captain.userId !== userId) {
      throw new ForbiddenException('Only the team captain can perform this action');
    }
  }
}
