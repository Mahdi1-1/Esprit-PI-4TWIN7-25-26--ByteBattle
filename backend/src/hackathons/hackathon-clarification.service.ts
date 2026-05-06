import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class HackathonClarificationService {
  constructor(private prisma: PrismaService) {}

  // T041 — Create a clarification request
  async createClarification(
    hackathonId: string,
    teamId: string,
    userId: string,
    challengeId: string | undefined,
    question: string,
  ) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundException("Hackathon not found");
    if (!["active", "frozen"].includes(hackathon.status)) {
      throw new BadRequestException(
        "Clarifications only allowed during active or frozen phases",
      );
    }

    return this.prisma.hackathonClarification.create({
      data: {
        hackathonId,
        teamId,
        userId,
        challengeId,
        question,
        status: "pending",
      },
    });
  }

  // T042 — Admin answers a clarification
  async answerClarification(
    clarificationId: string,
    adminId: string,
    answer: string,
    isBroadcast: boolean,
  ) {
    const clar = await this.prisma.hackathonClarification.findUnique({
      where: { id: clarificationId },
    });
    if (!clar) throw new NotFoundException("Clarification not found");

    return this.prisma.hackathonClarification.update({
      where: { id: clarificationId },
      data: {
        answer,
        answeredById: adminId,
        answeredAt: new Date(),
        status: "answered",
        isBroadcast,
      },
    });
  }

  // T043 — Get clarifications (context-dependent)
  async getClarifications(
    hackathonId: string,
    options: { teamId?: string; isAdmin?: boolean } = {},
  ) {
    if (options.isAdmin) {
      // Admin sees all
      return this.prisma.hackathonClarification.findMany({
        where: { hackathonId },
        orderBy: { createdAt: "desc" },
      });
    }

    // Participant: own team's + all broadcast answered
    const [ownClarifications, broadcastClarifications] = await Promise.all([
      this.prisma.hackathonClarification.findMany({
        where: { hackathonId, teamId: options.teamId },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.hackathonClarification.findMany({
        where: {
          hackathonId,
          isBroadcast: true,
          status: "answered",
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Merge & deduplicate
    const seen = new Set<string>();
    const merged: typeof ownClarifications = [];
    for (const c of [...ownClarifications, ...broadcastClarifications]) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        merged.push(c);
      }
    }

    return merged.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
}
