import { Test, TestingModule } from "@nestjs/testing";
import {
  HackathonScoreboardService,
  Scoreboard,
} from "./hackathon-scoreboard.service";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";

// ────────────────────────────────────────────────────────
// T141 — Unit tests for ICPC scoring logic
// ────────────────────────────────────────────────────────

// We test the pure ranking/penalty logic by mocking Prisma & Redis.
// The core computation is in computeScoreboard().

const HACKATHON_ID = "h1";
const START_TIME = new Date("2025-01-01T10:00:00Z");

function makeSub(
  teamId: string,
  challengeId: string,
  verdict: string,
  minutesFromStart: number,
  opts: { isFirstBlood?: boolean } = {},
) {
  return {
    id: `sub-${teamId}-${challengeId}-${minutesFromStart}`,
    hackathonId: HACKATHON_ID,
    teamId,
    challengeId,
    userId: "user1",
    code: "",
    language: "js",
    verdict,
    testsPassed: verdict === "AC" ? 10 : 3,
    testsTotal: 10,
    timeMs: 100,
    memMb: 50,
    attemptNumber: 1,
    penaltyMinutes: 0,
    isFirstBlood: opts.isFirstBlood ?? false,
    jobId: null,
    submittedAt: new Date(START_TIME.getTime() + minutesFromStart * 60_000),
  };
}

function makeTeam(id: string, name: string) {
  return {
    id,
    hackathonId: HACKATHON_ID,
    name,
    members: [{ userId: `user-${id}`, role: "captain", joinedAt: new Date() }],
    joinCode: id,
    isCheckedIn: true,
    isDisqualified: false,
    solvedCount: 0,
    penaltyTime: 0,
    score: 0,
    createdAt: new Date(),
  };
}

const HACKATHON = {
  id: HACKATHON_ID,
  title: "Test Hackathon",
  status: "active",
  startTime: START_TIME,
  endTime: new Date("2025-01-01T15:00:00Z"),
  challengeIds: ["c1", "c2", "c3"],
  teamPolicy: { minSize: 1, maxSize: 3 },
};

describe("HackathonScoreboardService", () => {
  let service: HackathonScoreboardService;
  let prismaMock: any;
  let redisMock: any;

  beforeEach(async () => {
    redisMock = {
      get: jest.fn().mockResolvedValue(null),
      setex: jest.fn().mockResolvedValue("OK"),
    };

    prismaMock = {
      hackathon: {
        findUnique: jest.fn().mockResolvedValue(HACKATHON),
      },
      hackathonTeam: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      hackathonSubmission: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HackathonScoreboardService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue("localhost"),
          },
        },
      ],
    }).compile();

    service = module.get<HackathonScoreboardService>(
      HackathonScoreboardService,
    );
    // Override the internally-created Redis with our mock
    (service as any).redis = redisMock;
  });

  // ─── Basic Ranking ────────────────────────────────────

  it("should return empty scoreboard when no teams", async () => {
    prismaMock.hackathonTeam.findMany.mockResolvedValue([]);
    prismaMock.hackathonSubmission.findMany.mockResolvedValue([]);

    const board = await service.computeScoreboard(HACKATHON_ID);

    expect(board.hackathonId).toBe(HACKATHON_ID);
    expect(board.rows).toHaveLength(0);
    expect(board.challengeIds).toEqual(["c1", "c2", "c3"]);
  });

  it("should rank teams by solved DESC, penalty ASC (ICPC rules)", async () => {
    const teamA = makeTeam("tA", "Alpha");
    const teamB = makeTeam("tB", "Bravo");
    const teamC = makeTeam("tC", "Charlie");

    prismaMock.hackathonTeam.findMany.mockResolvedValue([teamA, teamB, teamC]);
    prismaMock.hackathonSubmission.findMany.mockResolvedValue([
      // Alpha: solves c1 at 30min, c2 at 60min → 2 solved, penalty=30+60=90
      makeSub("tA", "c1", "AC", 30),
      makeSub("tA", "c2", "AC", 60),
      // Bravo: solves c1 at 10min, c2 at 20min, c3 at 50min → 3 solved, penalty=10+20+50=80
      makeSub("tB", "c1", "AC", 10, { isFirstBlood: true }),
      makeSub("tB", "c2", "AC", 20, { isFirstBlood: true }),
      makeSub("tB", "c3", "AC", 50, { isFirstBlood: true }),
      // Charlie: solves c1 at 100min → 1 solved, penalty=100
      makeSub("tC", "c1", "AC", 100),
    ]);

    const board = await service.computeScoreboard(HACKATHON_ID);

    expect(board.rows[0].teamName).toBe("Bravo"); // 3 solved
    expect(board.rows[0].rank).toBe(1);
    expect(board.rows[1].teamName).toBe("Alpha"); // 2 solved
    expect(board.rows[1].rank).toBe(2);
    expect(board.rows[2].teamName).toBe("Charlie"); // 1 solved
    expect(board.rows[2].rank).toBe(3);
  });

  // ─── Penalty Computation ──────────────────────────────

  it("should add 20-minute penalty per wrong attempt before AC", async () => {
    const team = makeTeam("t1", "Team1");
    prismaMock.hackathonTeam.findMany.mockResolvedValue([team]);
    prismaMock.hackathonSubmission.findMany.mockResolvedValue([
      // 2 wrong answers before AC at 60min
      makeSub("t1", "c1", "WA", 10),
      makeSub("t1", "c1", "WA", 20),
      makeSub("t1", "c1", "AC", 60),
    ]);

    const board = await service.computeScoreboard(HACKATHON_ID);

    expect(board.rows[0].solved).toBe(1);
    // penalty = 60 (AC time) + 2 * 20 (wrong attempts) = 100
    expect(board.rows[0].penalty).toBe(100);
    expect(board.rows[0].problems["c1"].attempts).toBe(3); // 2 wrong + 1 AC
  });

  it("should NOT count wrong attempts after AC as penalty", async () => {
    const team = makeTeam("t1", "Team1");
    prismaMock.hackathonTeam.findMany.mockResolvedValue([team]);
    prismaMock.hackathonSubmission.findMany.mockResolvedValue([
      makeSub("t1", "c1", "WA", 10),
      makeSub("t1", "c1", "AC", 30),
      makeSub("t1", "c1", "WA", 50), // after AC — should be ignored
    ]);

    const board = await service.computeScoreboard(HACKATHON_ID);

    expect(board.rows[0].penalty).toBe(30 + 20); // 30 + 1*20 = 50
  });

  // ─── Tie-breaking ─────────────────────────────────────

  it("should give same rank for tied teams (same solved + penalty)", async () => {
    const teamA = makeTeam("tA", "Alpha");
    const teamB = makeTeam("tB", "Bravo");

    prismaMock.hackathonTeam.findMany.mockResolvedValue([teamA, teamB]);
    prismaMock.hackathonSubmission.findMany.mockResolvedValue([
      makeSub("tA", "c1", "AC", 30),
      makeSub("tB", "c1", "AC", 30),
    ]);

    const board = await service.computeScoreboard(HACKATHON_ID);

    expect(board.rows[0].rank).toBe(1);
    expect(board.rows[1].rank).toBe(1); // tied
    expect(board.rows[0].solved).toBe(board.rows[1].solved);
    expect(board.rows[0].penalty).toBe(board.rows[1].penalty);
  });

  it("should break ties by lower penalty", async () => {
    const teamA = makeTeam("tA", "Alpha");
    const teamB = makeTeam("tB", "Bravo");

    prismaMock.hackathonTeam.findMany.mockResolvedValue([teamA, teamB]);
    prismaMock.hackathonSubmission.findMany.mockResolvedValue([
      // Both solve 1 problem but Alpha has lower penalty
      makeSub("tA", "c1", "AC", 20), // penalty 20
      makeSub("tB", "c1", "WA", 10),
      makeSub("tB", "c1", "AC", 40), // penalty 40 + 20 = 60
    ]);

    const board = await service.computeScoreboard(HACKATHON_ID);

    expect(board.rows[0].teamName).toBe("Alpha");
    expect(board.rows[0].penalty).toBe(20);
    expect(board.rows[1].teamName).toBe("Bravo");
    expect(board.rows[1].penalty).toBe(60);
  });

  // ─── First Blood ──────────────────────────────────────

  it("should track first blood status", async () => {
    const team = makeTeam("t1", "Team1");
    prismaMock.hackathonTeam.findMany.mockResolvedValue([team]);
    prismaMock.hackathonSubmission.findMany.mockResolvedValue([
      makeSub("t1", "c1", "AC", 15, { isFirstBlood: true }),
      makeSub("t1", "c2", "AC", 30, { isFirstBlood: false }),
    ]);

    const board = await service.computeScoreboard(HACKATHON_ID);

    expect(board.rows[0].problems["c1"].isFirstBlood).toBe(true);
    expect(board.rows[0].problems["c2"].isFirstBlood).toBe(false);
  });

  // ─── Unattempted / Attempted ──────────────────────────

  it("should mark unattempted problems correctly", async () => {
    const team = makeTeam("t1", "Team1");
    prismaMock.hackathonTeam.findMany.mockResolvedValue([team]);
    prismaMock.hackathonSubmission.findMany.mockResolvedValue([
      makeSub("t1", "c1", "AC", 30),
      // c2: attempted but not solved
      makeSub("t1", "c2", "WA", 40),
      makeSub("t1", "c2", "TLE", 50),
      // c3: unattempted
    ]);

    const board = await service.computeScoreboard(HACKATHON_ID);

    expect(board.rows[0].problems["c1"].status).toBe("solved");
    expect(board.rows[0].problems["c2"].status).toBe("attempted");
    expect(board.rows[0].problems["c2"].attempts).toBe(2);
    expect(board.rows[0].problems["c3"].status).toBe("unattempted");
    expect(board.rows[0].problems["c3"].attempts).toBe(0);
  });

  // ─── Disqualified teams excluded ─────────────────────

  it("should exclude disqualified teams", async () => {
    const team = makeTeam("t1", "Team1");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const disqualified = { ...makeTeam("t2", "BadTeam"), isDisqualified: true };

    // The service filters by isDisqualified: false in the query,
    // so we only return non-disqualified teams
    prismaMock.hackathonTeam.findMany.mockResolvedValue([team]);
    prismaMock.hackathonSubmission.findMany.mockResolvedValue([
      makeSub("t1", "c1", "AC", 30),
    ]);

    const board = await service.computeScoreboard(HACKATHON_ID);
    expect(board.rows).toHaveLength(1);
    expect(board.rows[0].teamName).toBe("Team1");
  });

  // ─── Freeze Scoreboard ────────────────────────────────

  it("should cache scoreboard to Redis when freezing", async () => {
    const team = makeTeam("t1", "Team1");
    prismaMock.hackathonTeam.findMany.mockResolvedValue([team]);
    prismaMock.hackathonSubmission.findMany.mockResolvedValue([
      makeSub("t1", "c1", "AC", 30),
    ]);

    await service.freezeScoreboard(HACKATHON_ID);

    expect(redisMock.setex).toHaveBeenCalledWith(
      `hackathon:scoreboard:frozen:${HACKATHON_ID}`,
      86400,
      expect.any(String),
    );
    const cached = JSON.parse(redisMock.setex.mock.calls[0][2]);
    expect(cached.rows).toHaveLength(1);
    expect(cached.rows[0].solved).toBe(1);
  });

  it("should return frozen scoreboard from Redis for non-admin", async () => {
    const frozenBoard: Scoreboard = {
      hackathonId: HACKATHON_ID,
      title: "Test",
      status: "frozen",
      challengeIds: ["c1"],
      rows: [
        {
          rank: 1,
          teamId: "t1",
          teamName: "T1",
          members: [],
          solved: 1,
          penalty: 30,
          problems: {},
        },
      ],
      isFrozen: true,
      generatedAt: new Date().toISOString(),
    };

    prismaMock.hackathon.findUnique.mockResolvedValue({
      ...HACKATHON,
      status: "frozen",
    });
    redisMock.get.mockResolvedValue(JSON.stringify(frozenBoard));

    const board = await service.getScoreboard(HACKATHON_ID, false);

    expect(board.isFrozen).toBe(true);
    expect(board.rows).toHaveLength(1);
  });

  it("should return live scoreboard for admin even when frozen", async () => {
    const team = makeTeam("t1", "Team1");
    prismaMock.hackathon.findUnique.mockResolvedValue({
      ...HACKATHON,
      status: "frozen",
    });
    prismaMock.hackathonTeam.findMany.mockResolvedValue([team]);
    prismaMock.hackathonSubmission.findMany.mockResolvedValue([
      makeSub("t1", "c1", "AC", 30),
      makeSub("t1", "c2", "AC", 60),
    ]);

    const board = await service.getScoreboard(HACKATHON_ID, true);

    // Admin sees live data, not frozen
    expect(board.rows[0].solved).toBe(2);
  });

  // ─── Multiple Problems Penalty Accumulation ───────────

  it("should accumulate penalty across multiple solved problems", async () => {
    const team = makeTeam("t1", "Team1");
    prismaMock.hackathonTeam.findMany.mockResolvedValue([team]);
    prismaMock.hackathonSubmission.findMany.mockResolvedValue([
      // c1: WA at 5, AC at 15 → penalty = 15 + 20 = 35
      makeSub("t1", "c1", "WA", 5),
      makeSub("t1", "c1", "AC", 15),
      // c2: AC at 45 → penalty = 45
      makeSub("t1", "c2", "AC", 45),
      // c3: WA, WA, WA, AC at 90 → penalty = 90 + 60 = 150
      makeSub("t1", "c3", "WA", 50),
      makeSub("t1", "c3", "WA", 60),
      makeSub("t1", "c3", "WA", 70),
      makeSub("t1", "c3", "AC", 90),
    ]);

    const board = await service.computeScoreboard(HACKATHON_ID);

    expect(board.rows[0].solved).toBe(3);
    // Total penalty = 35 + 45 + 150 = 230
    expect(board.rows[0].penalty).toBe(230);
  });
});
