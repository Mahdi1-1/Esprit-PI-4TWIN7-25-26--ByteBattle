import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

// ─── Badge keys ─────────────────────────────────────────────────────────────
// These must match the `key` field in the Badge collection.
// The seed script (below) creates them all on first run.

export const BADGE_KEYS = {
  // Submissions
  FIRST_BLOOD: "first_blood", // First accepted submission ever
  PROBLEM_SOLVER: "problem_solver", // 10 unique AC problems
  CENTURY: "century", // 100 unique AC problems
  EASY_RIDER: "easy_rider", // 5 easy problems solved
  MEDIUM_MASTER: "medium_master", // 10 medium problems solved
  HARD_CRUSHER: "hard_crusher", // 5 hard problems solved
  POLYGLOT: "polyglot", // AC in 4 different languages
  SPEED_DEMON: "speed_demon", // AC submission in < 100ms
  PERFECT_SCORE: "perfect_score", // First submission on a problem = AC
  NIGHT_OWL: "night_owl", // Submit between 00:00–05:00

  // Duels
  DUEL_DEBUT: "duel_debut", // First duel played
  DUEL_WINNER: "duel_winner", // First duel won
  GLADIATOR: "gladiator", // 10 duels won
  UNDEFEATED: "undefeated", // Win 5 duels in a row
  ELO_BRONZE: "elo_bronze", // Reach ELO 1400
  ELO_SILVER: "elo_silver", // Reach ELO 1600
  ELO_GOLD: "elo_gold", // Reach ELO 1800
  ELO_LEGEND: "elo_legend", // Reach ELO 2000

  // XP / Level
  LEVEL_5: "level_5", // Reach level 5
  LEVEL_10: "level_10", // Reach level 10
  LEVEL_20: "level_20", // Reach level 20
  XP_1000: "xp_1000", // Earn 1000 total XP
  XP_5000: "xp_5000", // Earn 5000 total XP

  // Community
  FIRST_POST: "first_post", // Post first discussion
  COMMENTATOR: "commentator", // Leave 10 comments
} as const;

export type BadgeKey = (typeof BADGE_KEYS)[keyof typeof BADGE_KEYS];

// ─── Catalogue ───────────────────────────────────────────────────────────────
export const BADGE_CATALOGUE: Array<{
  key: BadgeKey;
  name: string;
  rarity: string;
  ruleText: string;
  iconUrl: string;
}> = [
  // Submissions
  {
    key: "first_blood",
    name: "First Blood",
    rarity: "common",
    ruleText: "Get your first accepted submission",
    iconUrl: "/badges/first_blood.svg",
  },
  {
    key: "problem_solver",
    name: "Problem Solver",
    rarity: "common",
    ruleText: "Solve 10 different problems",
    iconUrl: "/badges/problem_solver.svg",
  },
  {
    key: "century",
    name: "Century",
    rarity: "epic",
    ruleText: "Solve 100 different problems",
    iconUrl: "/badges/century.svg",
  },
  {
    key: "easy_rider",
    name: "Easy Rider",
    rarity: "common",
    ruleText: "Solve 5 easy problems",
    iconUrl: "/badges/easy_rider.svg",
  },
  {
    key: "medium_master",
    name: "Medium Master",
    rarity: "rare",
    ruleText: "Solve 10 medium problems",
    iconUrl: "/badges/medium_master.svg",
  },
  {
    key: "hard_crusher",
    name: "Hard Crusher",
    rarity: "epic",
    ruleText: "Solve 5 hard problems",
    iconUrl: "/badges/hard_crusher.svg",
  },
  {
    key: "polyglot",
    name: "Polyglot",
    rarity: "rare",
    ruleText: "Get accepted in 4 different languages",
    iconUrl: "/badges/polyglot.svg",
  },
  {
    key: "speed_demon",
    name: "Speed Demon",
    rarity: "rare",
    ruleText: "Submit a solution that runs in under 100ms",
    iconUrl: "/badges/speed_demon.svg",
  },
  {
    key: "perfect_score",
    name: "Perfect Score",
    rarity: "rare",
    ruleText: "Solve a problem on your first submission",
    iconUrl: "/badges/perfect_score.svg",
  },
  {
    key: "night_owl",
    name: "Night Owl",
    rarity: "common",
    ruleText: "Submit code between midnight and 5am",
    iconUrl: "/badges/night_owl.svg",
  },

  // Duels
  {
    key: "duel_debut",
    name: "Duel Debut",
    rarity: "common",
    ruleText: "Play your first duel",
    iconUrl: "/badges/duel_debut.svg",
  },
  {
    key: "duel_winner",
    name: "Duel Winner",
    rarity: "common",
    ruleText: "Win your first duel",
    iconUrl: "/badges/duel_winner.svg",
  },
  {
    key: "gladiator",
    name: "Gladiator",
    rarity: "rare",
    ruleText: "Win 10 duels",
    iconUrl: "/badges/gladiator.svg",
  },
  {
    key: "undefeated",
    name: "Undefeated",
    rarity: "epic",
    ruleText: "Win 5 duels in a row",
    iconUrl: "/badges/undefeated.svg",
  },
  {
    key: "elo_bronze",
    name: "Bronze Rank",
    rarity: "common",
    ruleText: "Reach an ELO of 1400",
    iconUrl: "/badges/elo_bronze.svg",
  },
  {
    key: "elo_silver",
    name: "Silver Rank",
    rarity: "rare",
    ruleText: "Reach an ELO of 1600",
    iconUrl: "/badges/elo_silver.svg",
  },
  {
    key: "elo_gold",
    name: "Gold Rank",
    rarity: "epic",
    ruleText: "Reach an ELO of 1800",
    iconUrl: "/badges/elo_gold.svg",
  },
  {
    key: "elo_legend",
    name: "Legend",
    rarity: "legendary",
    ruleText: "Reach an ELO of 2000",
    iconUrl: "/badges/elo_legend.svg",
  },

  // XP / Level
  {
    key: "level_5",
    name: "Rising Star",
    rarity: "common",
    ruleText: "Reach level 5",
    iconUrl: "/badges/level_5.svg",
  },
  {
    key: "level_10",
    name: "Veteran",
    rarity: "rare",
    ruleText: "Reach level 10",
    iconUrl: "/badges/level_10.svg",
  },
  {
    key: "level_20",
    name: "Elite",
    rarity: "epic",
    ruleText: "Reach level 20",
    iconUrl: "/badges/level_20.svg",
  },
  {
    key: "xp_1000",
    name: "XP Grinder",
    rarity: "common",
    ruleText: "Earn 1,000 total XP",
    iconUrl: "/badges/xp_1000.svg",
  },
  {
    key: "xp_5000",
    name: "XP Master",
    rarity: "rare",
    ruleText: "Earn 5,000 total XP",
    iconUrl: "/badges/xp_5000.svg",
  },

  // Community
  {
    key: "first_post",
    name: "First Post",
    rarity: "common",
    ruleText: "Create your first discussion post",
    iconUrl: "/badges/first_post.svg",
  },
  {
    key: "commentator",
    name: "Commentator",
    rarity: "common",
    ruleText: "Leave 10 comments in the forum",
    iconUrl: "/badges/commentator.svg",
  },
];

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class BadgeEngineService {
  private readonly logger = new Logger(BadgeEngineService.name);

  constructor(private prisma: PrismaService) {}

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Called after a CODE submission is accepted */
  async onSubmissionAccepted(
    userId: string,
    submission: {
      id: string;
      challengeId: string;
      language: string;
      timeMs?: number;
      createdAt: Date;
    },
  ): Promise<string[]> {
    const awarded: string[] = [];

    // Aggregate user submission stats in one query
    const [allAcSubs, challengeAcCount, thisChallengePrevAc] =
      await Promise.all([
        this.prisma.submission.findMany({
          where: { userId, verdict: "AC" },
          select: {
            challengeId: true,
            language: true,
            timeMs: true,
            challenge: { select: { difficulty: true } },
          },
        }),
        this.prisma.submission.count({
          where: { userId, verdict: "AC" },
        }),
        this.prisma.submission.count({
          where: {
            userId,
            challengeId: submission.challengeId,
            verdict: "AC",
            id: { not: submission.id },
          },
        }),
      ]);

    const uniqueChallengesSolved = new Set(allAcSubs.map((s) => s.challengeId))
      .size;
    const uniqueLanguages = new Set(
      allAcSubs.map((s) => s.language).filter(Boolean),
    ).size;

    const easyCount = allAcSubs.filter(
      (s) => (s.challenge as any)?.difficulty === "easy",
    ).length;
    const mediumCount = allAcSubs.filter(
      (s) => (s.challenge as any)?.difficulty === "medium",
    ).length;
    const hardCount = allAcSubs.filter(
      (s) => (s.challenge as any)?.difficulty === "hard",
    ).length;

    const hour = submission.createdAt.getHours();
    const isNight = hour >= 0 && hour < 5;
    const isFastSubmission = (submission.timeMs ?? 9999) < 100;
    const isFirstAttempt = thisChallengePrevAc === 0;

    // first_blood — ever first AC
    if (challengeAcCount === 1)
      awarded.push(...(await this.award(userId, "first_blood")));

    // problem_solver — 10 unique problems
    if (uniqueChallengesSolved >= 10)
      awarded.push(...(await this.award(userId, "problem_solver")));

    // century — 100 unique problems
    if (uniqueChallengesSolved >= 100)
      awarded.push(...(await this.award(userId, "century")));

    // easy_rider
    if (easyCount >= 5)
      awarded.push(...(await this.award(userId, "easy_rider")));

    // medium_master
    if (mediumCount >= 10)
      awarded.push(...(await this.award(userId, "medium_master")));

    // hard_crusher
    if (hardCount >= 5)
      awarded.push(...(await this.award(userId, "hard_crusher")));

    // polyglot — 4 different languages
    if (uniqueLanguages >= 4)
      awarded.push(...(await this.award(userId, "polyglot")));

    // speed_demon — under 100ms
    if (isFastSubmission)
      awarded.push(...(await this.award(userId, "speed_demon")));

    // perfect_score — first attempt
    if (isFirstAttempt)
      awarded.push(...(await this.award(userId, "perfect_score")));

    // night_owl
    if (isNight) awarded.push(...(await this.award(userId, "night_owl")));

    return awarded;
  }

  /** Called after a duel ends for each participant */
  async onDuelFinished(
    userId: string,
    won: boolean,
    currentElo: number,
  ): Promise<string[]> {
    const awarded: string[] = [];

    const [totalDuels, totalWins] = await Promise.all([
      this.prisma.duel.count({
        where: {
          OR: [{ player1Id: userId }, { player2Id: userId }],
          status: "completed",
        },
      }),
      this.prisma.duel.count({ where: { winnerId: userId } }),
    ]);

    // duel_debut
    if (totalDuels === 1)
      awarded.push(...(await this.award(userId, "duel_debut")));

    if (won) {
      // duel_winner
      if (totalWins === 1)
        awarded.push(...(await this.award(userId, "duel_winner")));

      // gladiator
      if (totalWins >= 10)
        awarded.push(...(await this.award(userId, "gladiator")));

      // undefeated — last 5 duels all won
      const lastFive = await this.prisma.duel.findMany({
        where: {
          OR: [{ player1Id: userId }, { player2Id: userId }],
          status: "completed",
        },
        orderBy: { endedAt: "desc" },
        take: 5,
        select: { winnerId: true },
      });
      if (
        lastFive.length === 5 &&
        lastFive.every((d) => d.winnerId === userId)
      ) {
        awarded.push(...(await this.award(userId, "undefeated")));
      }
    }

    // ELO rank badges
    if (currentElo >= 1400)
      awarded.push(...(await this.award(userId, "elo_bronze")));
    if (currentElo >= 1600)
      awarded.push(...(await this.award(userId, "elo_silver")));
    if (currentElo >= 1800)
      awarded.push(...(await this.award(userId, "elo_gold")));
    if (currentElo >= 2000)
      awarded.push(...(await this.award(userId, "elo_legend")));

    return awarded;
  }

  /** Called after user XP/level changes */
  async onUserLevelUp(
    userId: string,
    level: number,
    xp: number,
  ): Promise<string[]> {
    const awarded: string[] = [];

    if (level >= 5) awarded.push(...(await this.award(userId, "level_5")));
    if (level >= 10) awarded.push(...(await this.award(userId, "level_10")));
    if (level >= 20) awarded.push(...(await this.award(userId, "level_20")));
    if (xp >= 1000) awarded.push(...(await this.award(userId, "xp_1000")));
    if (xp >= 5000) awarded.push(...(await this.award(userId, "xp_5000")));

    return awarded;
  }

  /** Convenience: fetch user's current level & xp then evaluate level/xp badges */
  async checkUserLevelBadges(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { level: true, xp: true },
    });
    if (!user) return [];
    return this.onUserLevelUp(userId, user.level ?? 0, user.xp ?? 0);
  }

  /** Called after a discussion is created */
  async onDiscussionCreated(userId: string): Promise<string[]> {
    const awarded: string[] = [];
    const count = await this.prisma.discussion.count({
      where: { authorId: userId },
    });
    if (count >= 1) awarded.push(...(await this.award(userId, "first_post")));
    return awarded;
  }

  /** Called after a comment is created */
  async onCommentCreated(userId: string): Promise<string[]> {
    const awarded: string[] = [];
    const count = await this.prisma.comment.count({
      where: { authorId: userId },
    });
    if (count >= 10) awarded.push(...(await this.award(userId, "commentator")));
    return awarded;
  }

  /** Get all badges earned by a user */
  async getUserBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    });
  }

  /** Seed badge catalogue into DB (idempotent) */
  async seedBadges() {
    let created = 0;
    for (const b of BADGE_CATALOGUE) {
      const existing = await this.prisma.badge.findFirst({
        where: { key: b.key },
      });
      if (existing) {
        await this.prisma.badge.update({ where: { id: existing.id }, data: b });
      } else {
        await this.prisma.badge.create({ data: b });
        created++;
      }
    }
    this.logger.log(`Badge catalogue seeded: ${created} new badges`);
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  /**
   * Awards a badge to a user if they don't already have it.
   * Returns the badge name if newly awarded, else [].
   */
  private async award(userId: string, key: BadgeKey): Promise<string[]> {
    try {
      const badge = await this.prisma.badge.findUnique({ where: { key } });
      if (!badge) return [];

      const existing = await this.prisma.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
      });
      if (existing) return [];

      await this.prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      });

      this.logger.log(`🏅 Badge awarded: [${key}] → user ${userId}`);
      return [badge.name];
    } catch (err) {
      this.logger.error(`Failed to award badge ${key} to ${userId}:`, err);
      return [];
    }
  }
}
