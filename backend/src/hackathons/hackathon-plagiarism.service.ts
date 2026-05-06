import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface PlagiarismPair {
  teamA: string;
  teamB: string;
  similarity: number;
  submissionA: string;
  submissionB: string;
}

@Injectable()
export class HackathonPlagiarismService {
  private readonly logger = new Logger(HackathonPlagiarismService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * T066 — Basic anti-plagiarism check using Jaccard index on tokenized code.
   * V1 implementation: simple string similarity.
   */
  async checkPlagiarism(hackathonId: string, challengeId: string) {
    const submissions = await this.prisma.hackathonSubmission.findMany({
      where: { hackathonId, challengeId, verdict: "AC" },
      orderBy: { submittedAt: "asc" },
    });

    // Keep only earliest AC per team
    const teamBestSub = new Map<string, (typeof submissions)[0]>();
    for (const sub of submissions) {
      if (!teamBestSub.has(sub.teamId)) {
        teamBestSub.set(sub.teamId, sub);
      }
    }

    const uniqueSubs = Array.from(teamBestSub.values());
    const flaggedPairs: PlagiarismPair[] = [];

    for (let i = 0; i < uniqueSubs.length; i++) {
      for (let j = i + 1; j < uniqueSubs.length; j++) {
        const similarity = this.jaccardSimilarity(
          uniqueSubs[i].code,
          uniqueSubs[j].code,
        );
        if (similarity >= 0.8) {
          flaggedPairs.push({
            teamA: uniqueSubs[i].teamId,
            teamB: uniqueSubs[j].teamId,
            similarity: Math.round(similarity * 100),
            submissionA: uniqueSubs[i].id,
            submissionB: uniqueSubs[j].id,
          });
        }
      }
    }

    // Sort by similarity descending
    flaggedPairs.sort((a, b) => b.similarity - a.similarity);

    return {
      hackathonId,
      challengeId,
      totalCompared: uniqueSubs.length,
      flaggedPairs,
      scanDate: new Date().toISOString(),
    };
  }

  /** Tokenize code into a set of n-grams and compute Jaccard index */
  private jaccardSimilarity(codeA: string, codeB: string): number {
    const tokensA = this.tokenize(codeA);
    const tokensB = this.tokenize(codeB);

    if (tokensA.size === 0 && tokensB.size === 0) return 1;
    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersection = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) intersection++;
    }

    const union = tokensA.size + tokensB.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  /** Tokenize code into 3-grams (trigrams) after normalizing whitespace */
  private tokenize(code: string): Set<string> {
    // Normalize: lowercase, collapse whitespace, strip comments (simple)
    const normalized = code
      .toLowerCase()
      .replace(/\/\/.*/g, "") // single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, "") // multi-line comments
      .replace(/\s+/g, " ")
      .trim();

    const tokens = new Set<string>();
    for (let i = 0; i <= normalized.length - 3; i++) {
      tokens.add(normalized.substring(i, i + 3));
    }
    return tokens;
  }
}
