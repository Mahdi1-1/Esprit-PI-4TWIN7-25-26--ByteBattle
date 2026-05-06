import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { HackathonSubmissionService } from "./hackathon-submission.service";
import { PrismaService } from "../prisma/prisma.service";
import { QueueService } from "../queue/queue.service";

// ──────────────────────────────────────────────────────────────────────────────
// Unit tests — HackathonSubmissionService.submitCode()
//
// Covers spec-010 requirements:
//   • Q1: Sequential problem enforcement — preceding problems must be solved
//   • Q7: Solved problem read-only — no re-submission after AC verdict
//   • T025: Challenge must belong to the hackathon
//   • Rate limiting guard (pre-existing, regression coverage)
// ──────────────────────────────────────────────────────────────────────────────

const HACKATHON_ID = "h1";
const TEAM_ID = "team1";
const USER_ID = "user1";

// ── Factories ──────────────────────────────────────────────────────────────────

function makeHackathon(overrides: any = {}) {
  return {
    id: HACKATHON_ID,
    status: "active",
    challengeIds: ["c1", "c2", "c3"],
    startTime: new Date("2026-01-01T10:00:00Z"),
    endTime: new Date("2026-01-01T16:00:00Z"),
    ...overrides,
  };
}

function makeTeam(overrides: any = {}) {
  return {
    id: TEAM_ID,
    hackathonId: HACKATHON_ID,
    isDisqualified: false,
    members: [{ userId: USER_ID }],
    ...overrides,
  };
}

function makeChallenge(id = "c2") {
  return {
    id,
    title: `Challenge ${id}`,
    tests: [
      { input: "1", expectedOutput: "1", isHidden: false },
      { input: "2", expectedOutput: "4", isHidden: false },
    ],
  };
}

function makeSubmitDto(overrides: any = {}) {
  return {
    challengeId: "c2",
    code: "console.log(1)",
    language: "javascript",
    ...overrides,
  };
}

function makeACSubmission(challengeId: string) {
  return {
    id: `ac-${challengeId}`,
    challengeId,
    submittedAt: new Date("2026-01-01T10:30:00Z"),
    verdict: "AC",
  };
}

// ── Test Suite ─────────────────────────────────────────────────────────────────

describe("HackathonSubmissionService — submitCode()", () => {
  let service: HackathonSubmissionService;
  let prismaMock: any;
  let queueMock: any;

  beforeEach(async () => {
    prismaMock = {
      hackathon: {
        findUnique: jest.fn(),
      },
      hackathonTeam: {
        findUnique: jest.fn(),
      },
      hackathonSubmission: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      challenge: {
        findUnique: jest.fn(),
      },
    };

    queueMock = {
      addCodeExecutionJob: jest.fn().mockResolvedValue("job-123"),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HackathonSubmissionService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: QueueService, useValue: queueMock },
      ],
    }).compile();

    service = module.get<HackathonSubmissionService>(
      HackathonSubmissionService,
    );
  });

  // ── Precondition helpers ─────────────────────────────────────────────────────

  function setupHappyPath(
    challengeId = "c2",
    solvedChallengeIds: string[] = ["c1"],
  ) {
    prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
    prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam());
    // No existing AC for target challenge (Q7 passes)
    prismaMock.hackathonSubmission.findFirst.mockResolvedValueOnce(null);
    // All preceding solved (Q1 passes)
    prismaMock.hackathonSubmission.findMany.mockResolvedValue(
      solvedChallengeIds.map(makeACSubmission),
    );
    // No recent rate-limit submission
    prismaMock.hackathonSubmission.findFirst.mockResolvedValue(null);
    prismaMock.challenge.findUnique.mockResolvedValue(
      makeChallenge(challengeId),
    );
    prismaMock.hackathonSubmission.create.mockResolvedValue({
      id: "sub1",
      challengeId,
      verdict: "queued",
    });
    prismaMock.hackathonSubmission.update.mockResolvedValue({
      id: "sub1",
      jobId: "job-123",
    });
  }

  // ── Q7: Solved problem read-only guard ───────────────────────────────────────

  describe("Q7 — Already-solved problem guard", () => {
    it("should throw BadRequestException when team already has AC for challengeId", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam());
      // Existing AC found → should be blocked
      prismaMock.hackathonSubmission.findFirst.mockResolvedValue(
        makeACSubmission("c2"), // team already solved c2
      );

      await expect(
        service.submitCode(
          HACKATHON_ID,
          TEAM_ID,
          USER_ID,
          makeSubmitDto({ challengeId: "c2" }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should include "already solved" in the error message', async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam());
      prismaMock.hackathonSubmission.findFirst.mockResolvedValue(
        makeACSubmission("c2"),
      );

      await expect(
        service.submitCode(
          HACKATHON_ID,
          TEAM_ID,
          USER_ID,
          makeSubmitDto({ challengeId: "c2" }),
        ),
      ).rejects.toThrow(/already solved/i);
    });

    it("should allow submission when no prior AC exists for the challenge", async () => {
      setupHappyPath("c2", ["c1"]);
      // findFirst called twice: first for Q7 check (returns null), second for rate-limit (returns null)
      prismaMock.hackathonSubmission.findFirst
        .mockResolvedValueOnce(null) // Q7: no existing AC
        .mockResolvedValueOnce(null); // rate-limit: no recent sub

      const result = await service.submitCode(
        HACKATHON_ID,
        TEAM_ID,
        USER_ID,
        makeSubmitDto({ challengeId: "c2" }),
      );

      expect(result).toBeDefined();
      expect(prismaMock.hackathonSubmission.create).toHaveBeenCalled();
    });

    it("should check Q7 before Q1 — solved guard fires first", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam());
      prismaMock.hackathonSubmission.findFirst.mockResolvedValue(
        makeACSubmission("c2"),
      );

      // Even though Q1 preceding check would also fail, Q7 fires first
      const err = await service
        .submitCode(
          HACKATHON_ID,
          TEAM_ID,
          USER_ID,
          makeSubmitDto({ challengeId: "c2" }),
        )
        .catch((e) => e);

      expect(err).toBeInstanceOf(BadRequestException);
      // Q7 fires before any findMany call for Q1
      expect(prismaMock.hackathonSubmission.findMany).not.toHaveBeenCalled();
    });
  });

  // ── Q1: Sequential problem enforcement ──────────────────────────────────────

  describe("Q1 — Sequential problem enforcement", () => {
    it("should throw BadRequestException when trying to submit C2 without solving C1", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam());
      prismaMock.hackathonSubmission.findFirst.mockResolvedValue(null); // Q7: no AC
      // Q1: c1 NOT in solved set
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([]); // 0 preceding solved

      await expect(
        service.submitCode(
          HACKATHON_ID,
          TEAM_ID,
          USER_ID,
          makeSubmitDto({ challengeId: "c2" }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should include "previous problems" in the Q1 error message', async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam());
      prismaMock.hackathonSubmission.findFirst.mockResolvedValue(null);
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([]);

      await expect(
        service.submitCode(
          HACKATHON_ID,
          TEAM_ID,
          USER_ID,
          makeSubmitDto({ challengeId: "c2" }),
        ),
      ).rejects.toThrow(/previous problems/i);
    });

    it("should allow submission to C1 without any prerequisites", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam());
      prismaMock.hackathonSubmission.findFirst
        .mockResolvedValueOnce(null) // Q7
        .mockResolvedValueOnce(null); // rate-limit
      // C1 is index 0 — no preceding challenges to check
      prismaMock.challenge.findUnique.mockResolvedValue(makeChallenge("c1"));
      prismaMock.hackathonSubmission.create.mockResolvedValue({
        id: "sub1",
        verdict: "queued",
      });
      prismaMock.hackathonSubmission.update.mockResolvedValue({
        id: "sub1",
        jobId: "job-1",
      });

      const result = await service.submitCode(
        HACKATHON_ID,
        TEAM_ID,
        USER_ID,
        makeSubmitDto({ challengeId: "c1" }),
      );

      expect(result).toBeDefined();
      // No preceding check needed for first problem
      expect(prismaMock.hackathonSubmission.findMany).not.toHaveBeenCalled();
    });

    it("should allow submission to C3 when C1 and C2 are solved", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam());
      prismaMock.hackathonSubmission.findFirst
        .mockResolvedValueOnce(null) // Q7: c3 not solved
        .mockResolvedValueOnce(null); // rate-limit
      // Q1: both c1 and c2 are solved
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([
        makeACSubmission("c1"),
        makeACSubmission("c2"),
      ]);
      prismaMock.challenge.findUnique.mockResolvedValue(makeChallenge("c3"));
      prismaMock.hackathonSubmission.create.mockResolvedValue({
        id: "sub1",
        verdict: "queued",
      });
      prismaMock.hackathonSubmission.update.mockResolvedValue({
        id: "sub1",
        jobId: "job-1",
      });

      const result = await service.submitCode(
        HACKATHON_ID,
        TEAM_ID,
        USER_ID,
        makeSubmitDto({ challengeId: "c3" }),
      );

      expect(result).toBeDefined();
    });

    it("should throw when submitting C3 with only C1 solved (C2 not solved)", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam());
      prismaMock.hackathonSubmission.findFirst.mockResolvedValue(null); // Q7: c3 not solved
      // Q1: only c1 solved, c2 is missing
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([
        makeACSubmission("c1"),
      ]);

      await expect(
        service.submitCode(
          HACKATHON_ID,
          TEAM_ID,
          USER_ID,
          makeSubmitDto({ challengeId: "c3" }),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── T025: Challenge not in hackathon ─────────────────────────────────────────

  describe("T025 — Challenge must belong to hackathon", () => {
    it("should throw BadRequestException when challengeId is not in hackathon.challengeIds", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon()); // challengeIds = [c1, c2, c3]
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam());
      prismaMock.hackathonSubmission.findFirst.mockResolvedValue(null); // Q7: no AC

      await expect(
        service.submitCode(
          HACKATHON_ID,
          TEAM_ID,
          USER_ID,
          makeSubmitDto({ challengeId: "c999" }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should include meaningful message for challenge not in hackathon", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam());
      prismaMock.hackathonSubmission.findFirst.mockResolvedValue(null);

      await expect(
        service.submitCode(
          HACKATHON_ID,
          TEAM_ID,
          USER_ID,
          makeSubmitDto({ challengeId: "c999" }),
        ),
      ).rejects.toThrow(/not part of this hackathon/i);
    });
  });

  // ── Precondition guards ───────────────────────────────────────────────────────

  describe("Precondition guards", () => {
    it("should throw NotFoundException when hackathon does not exist", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(null);

      await expect(
        service.submitCode(HACKATHON_ID, TEAM_ID, USER_ID, makeSubmitDto()),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when hackathon is not active or frozen", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(
        makeHackathon({ status: "ended" }),
      );
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam());

      await expect(
        service.submitCode(HACKATHON_ID, TEAM_ID, USER_ID, makeSubmitDto()),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException when team does not exist", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(null);

      await expect(
        service.submitCode(HACKATHON_ID, TEAM_ID, USER_ID, makeSubmitDto()),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when team is disqualified", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(
        makeTeam({ isDisqualified: true }),
      );

      await expect(
        service.submitCode(HACKATHON_ID, TEAM_ID, USER_ID, makeSubmitDto()),
      ).rejects.toThrow(BadRequestException);
    });

    it("should allow submission during frozen phase", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(
        makeHackathon({ status: "frozen" }),
      );
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam());
      prismaMock.hackathonSubmission.findFirst
        .mockResolvedValueOnce(null) // Q7
        .mockResolvedValueOnce(null); // rate-limit
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([
        makeACSubmission("c1"),
      ]);
      prismaMock.challenge.findUnique.mockResolvedValue(makeChallenge("c2"));
      prismaMock.hackathonSubmission.create.mockResolvedValue({
        id: "sub1",
        verdict: "queued",
      });
      prismaMock.hackathonSubmission.update.mockResolvedValue({
        id: "sub1",
        jobId: "job-1",
      });

      const result = await service.submitCode(
        HACKATHON_ID,
        TEAM_ID,
        USER_ID,
        makeSubmitDto({ challengeId: "c2" }),
      );

      expect(result).toBeDefined();
    });
  });

  // ── Rate limiting (regression) ────────────────────────────────────────────────

  describe("Rate limiting (regression)", () => {
    it("should throw BadRequestException with retry-after when rate limited", async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam());
      prismaMock.hackathonSubmission.findFirst
        .mockResolvedValueOnce(null) // Q7: no AC
        // Q1: c2 submitted, c1 is solved
        .mockResolvedValueOnce({
          // rate-limit: recent submission exists
          id: "recent-sub",
          submittedAt: new Date(Date.now() - 20_000), // 20s ago
        });
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([
        makeACSubmission("c1"),
      ]);

      await expect(
        service.submitCode(
          HACKATHON_ID,
          TEAM_ID,
          USER_ID,
          makeSubmitDto({ challengeId: "c2" }),
        ),
      ).rejects.toThrow(/Rate limited/i);
    });
  });
});
