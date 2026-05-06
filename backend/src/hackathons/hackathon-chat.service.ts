import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SendMessageDto } from "./dto/chat.dto";

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
    const team = await this.prisma.hackathonTeam.findUnique({
      where: { id: teamId },
    });
    if (!team) throw new NotFoundException("Team not found");

    const isMember = team.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException("Not a member of this team");

    const message = await this.prisma.hackathonMessage.create({
      data: {
        hackathonId,
        teamId,
        userId,
        content: dto.content,
        codeSnippet: dto.codeSnippet,
        codeLanguage: dto.codeLanguage,
      },
    });

    // Q4: Enrich with sender username
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    return { ...message, username: user?.username || "Unknown" };
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

    const messages = await this.prisma.hackathonMessage.findMany({
      where,
      orderBy: { sentAt: "desc" },
      take: limit,
    });

    // Q4: Enrich all messages with sender usernames
    if (messages.length === 0) return messages;

    const userIds = [...new Set(messages.map((m) => m.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true },
    });
    const usernameMap = new Map(users.map((u) => [u.id, u.username]));

    return messages.map((m) => ({
      ...m,
      username: usernameMap.get(m.userId) || "Unknown",
    }));
  }
}
