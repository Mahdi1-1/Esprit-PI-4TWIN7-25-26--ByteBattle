import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class HackathonMonitoringService {
  private readonly logger = new Logger(HackathonMonitoringService.name);

  constructor(private prisma: PrismaService) {}

  // T061 — Aggregate monitoring data for admin dashboard
  async getMonitoringData(hackathonId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon) return null;

    const fifteenMinAgo = new Date(Date.now() - 15 * 60_000);

    const [
      totalSubmissions,
      acceptedSubmissions,
      allTeams,
      recentSubmissions,
      activeTeamIds,
    ] = await Promise.all([
      this.prisma.hackathonSubmission.count({ where: { hackathonId } }),
      this.prisma.hackathonSubmission.count({
        where: { hackathonId, verdict: "AC" },
      }),
      this.prisma.hackathonTeam.findMany({
        where: { hackathonId, isDisqualified: false },
        select: { id: true, name: true, solvedCount: true },
      }),
      this.prisma.hackathonSubmission.findMany({
        where: { hackathonId },
        orderBy: { submittedAt: "desc" },
        take: 20,
      }),
      this.prisma.hackathonSubmission.findMany({
        where: { hackathonId, submittedAt: { gte: fifteenMinAgo } },
        distinct: ["teamId"],
        select: { teamId: true },
      }),
    ]);

    const activeTeamIdSet = new Set(activeTeamIds.map((t) => t.teamId));
    const activeTeams = allTeams.filter((t) => activeTeamIdSet.has(t.id));
    const idleTeams = allTeams.filter((t) => !activeTeamIdSet.has(t.id));

    const acceptanceRate =
      totalSubmissions > 0
        ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(1)
        : "0";

    // Problems solved distribution
    const problemsSolvedDistribution: Record<string, number> = {};
    for (const cId of hackathon.challengeIds) {
      const solvedTeams = await this.prisma.hackathonSubmission.findMany({
        where: { hackathonId, challengeId: cId, verdict: "AC" },
        distinct: ["teamId"],
        select: { teamId: true },
      });
      problemsSolvedDistribution[cId] = solvedTeams.length;
    }

    return {
      hackathonId,
      status: hackathon.status,
      totalSubmissions,
      acceptedSubmissions,
      acceptanceRate: `${acceptanceRate}%`,
      totalTeams: allTeams.length,
      activeTeams: activeTeams.length,
      idleTeams: idleTeams.length,
      problemsSolvedDistribution,
      recentSubmissions,
      teamActivity: allTeams.map((t) => ({
        teamId: t.id,
        teamName: t.name,
        solvedCount: t.solvedCount,
        isActive: activeTeamIdSet.has(t.id),
      })),
    };
  }
}
