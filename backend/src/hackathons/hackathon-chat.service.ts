import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/chat.dto';

@Injectable()
export class HackathonChatService {
  constructor(private prisma: PrismaService) {}

  // T039 — Send a team chat message
  async sendMessage(
    hackathonId: string,
    teamId: string,
    userId: string,
    dto: SendMessageDto,
  ) {
    // Validate team membership
    const team = await this.prisma.hackathonTeam.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    const isMember = team.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('Not a member of this team');

    return this.prisma.hackathonMessage.create({
      data: {
        hackathonId,
        teamId,
        userId,
        content: dto.content,
        codeSnippet: dto.codeSnippet,
        codeLanguage: dto.codeLanguage,
      },
    });
  }

  // T040 — Get messages with cursor-based pagination
  async getMessages(
    hackathonId: string,
    teamId: string,
    options: { before?: string; limit?: number } = {},
  ) {
    const limit = options.limit || 50;

    const where: any = { hackathonId, teamId };
    if (options.before) {
      where.sentAt = { lt: new Date(options.before) };
    }

    return this.prisma.hackathonMessage.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: limit,
    });
  }
}
