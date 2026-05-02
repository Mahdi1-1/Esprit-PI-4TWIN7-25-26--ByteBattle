import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HackathonsService } from './hackathons.service';
import { PrismaService } from '../prisma/prisma.service';
import { HackathonAuditService } from './hackathon-audit.service';
import { NotificationEmitterService } from '../notifications/notification-emitter.service';

// ──────────────────────────────────────────────────────────────────────────────
// Unit tests — HackathonsService.getHackathonChallenges()
//
// Covers spec-010 requirements:
//   • WS1: returns full challenge data (descriptionMd, examples, hints, tests)
//   • WS2: sequential unlock — firstUnsolvedIndex logic, locked content stripping
//   • WS3: TIME_LIMITS map (easy=15, medium=25, hard=40), startedAt per challenge
//   • Q5:  team-wide timer auto-start persisted to DB when first accessed
//   • RBAC: admin view (no teamId) returns all unlocked
// ──────────────────────────────────────────────────────────────────────────────

const HACKATHON_ID = 'h1';
const TEAM_ID = 'team1';

// ── Factories ──────────────────────────────────────────────────────────────────

function makeHackathon(overrides: any = {}) {
  return {
    id: HACKATHON_ID,
    title: 'ByteBattle Cup',
    status: 'active',
    challengeIds: ['c1', 'c2', 'c3'],
    ...overrides,
  };
}

function makeChallenge(id: string, overrides: any = {}) {
  const label = id === 'c1' ? 'A' : id === 'c2' ? 'B' : 'C';
  return {
    id,
    title: `Challenge ${label}`,
    difficulty: overrides.difficulty ?? 'medium',
    descriptionMd: `Description for ${label}`,
    tags: ['dp', 'array'],
    constraints: { time: '2s', memory: '256MB' },
    hints: [`Hint for ${label}`],
    examples: [{ input: '1', expectedOutput: '1', explanation: 'trivial' }],
    tests: [
      { input: '1', expectedOutput: '1', isHidden: false },
      { input: '2', expectedOutput: '4', isHidden: true },
    ],
    allowedLanguages: ['javascript', 'python'],
    category: 'algorithms',
    ...overrides,
  };
}

function makeTeam(overrides: any = {}) {
  return {
    id: TEAM_ID,
    hackathonId: HACKATHON_ID,
    problemStartTimes: null,
    anticheatViolations: 0,
    ...overrides,
  };
}

function makeACSubmission(challengeId: string) {
  return { challengeId, submittedAt: new Date() };
}

// ── Test Suite ─────────────────────────────────────────────────────────────────

describe('HackathonsService — getHackathonChallenges()', () => {
  let service: HackathonsService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      hackathon: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      challenge: {
        findMany: jest.fn(),
      },
      hackathonTeam: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      hackathonSubmission: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HackathonsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: HackathonAuditService, useValue: { log: jest.fn() } },
        { provide: NotificationEmitterService, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<HackathonsService>(HackathonsService);
  });

  // ── Error cases ─────────────────────────────────────────────────────────────

  describe('Error cases', () => {
    it('should throw NotFoundException when hackathon does not exist', async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(null);

      await expect(
        service.getHackathonChallenges('nonexistent', TEAM_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return empty array when hackathon has no challengeIds', async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon({ challengeIds: [] }));

      const result = await service.getHackathonChallenges(HACKATHON_ID, TEAM_ID);

      expect(result).toEqual([]);
      expect(prismaMock.challenge.findMany).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when team does not exist', async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
      prismaMock.challenge.findMany.mockResolvedValue([
        makeChallenge('c1'), makeChallenge('c2'), makeChallenge('c3'),
      ]);
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(null);

      await expect(
        service.getHackathonChallenges(HACKATHON_ID, TEAM_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Admin view (no teamId) ───────────────────────────────────────────────────

  describe('Admin view — no teamId', () => {
    beforeEach(() => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
      prismaMock.challenge.findMany.mockResolvedValue([
        makeChallenge('c1', { difficulty: 'easy' }),
        makeChallenge('c2', { difficulty: 'medium' }),
        makeChallenge('c3', { difficulty: 'hard' }),
      ]);
    });

    it('should return all 3 challenges with locked=false, solved=false', async () => {
      const result = await service.getHackathonChallenges(HACKATHON_ID);

      expect(result).toHaveLength(3);
      expect(result.every((c: any) => c.locked === false)).toBe(true);
      expect(result.every((c: any) => c.solved === false)).toBe(true);
    });

    it('should assign labels A, B, C in order', async () => {
      const result = await service.getHackathonChallenges(HACKATHON_ID);

      expect(result[0].label).toBe('A');
      expect(result[1].label).toBe('B');
      expect(result[2].label).toBe('C');
    });

    it('should return correct timeLimitMinutes per difficulty — WS3 TIME_LIMITS', async () => {
      const result = await service.getHackathonChallenges(HACKATHON_ID);

      expect(result[0].timeLimitMinutes).toBe(15); // easy
      expect(result[1].timeLimitMinutes).toBe(25); // medium
      expect(result[2].timeLimitMinutes).toBe(40); // hard
    });

    it('should filter hidden tests (isHidden=true) from admin view', async () => {
      const result = await service.getHackathonChallenges(HACKATHON_ID);

      result.forEach((c: any) => {
        expect(c.tests.every((t: any) => t.isHidden !== true)).toBe(true);
      });
    });

    it('should not call hackathonTeam queries for admin view', async () => {
      await service.getHackathonChallenges(HACKATHON_ID);

      expect(prismaMock.hackathonTeam.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.hackathonSubmission.findMany).not.toHaveBeenCalled();
    });

    it('should preserve challengeIds order even if DB returns them out of order', async () => {
      // DB returns c3, c1, c2 — should be reordered to c1, c2, c3
      prismaMock.challenge.findMany.mockResolvedValue([
        makeChallenge('c3'), makeChallenge('c1'), makeChallenge('c2'),
      ]);

      const result = await service.getHackathonChallenges(HACKATHON_ID);

      expect(result[0].id).toBe('c1');
      expect(result[1].id).toBe('c2');
      expect(result[2].id).toBe('c3');
    });
  });

  // ── WS2: Sequential unlock logic ────────────────────────────────────────────

  describe('WS2 — Sequential unlock logic', () => {
    beforeEach(() => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
      prismaMock.challenge.findMany.mockResolvedValue([
        makeChallenge('c1', { difficulty: 'easy' }),
        makeChallenge('c2', { difficulty: 'medium' }),
        makeChallenge('c3', { difficulty: 'hard' }),
      ]);
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam());
      prismaMock.hackathonTeam.update.mockResolvedValue(makeTeam());
    });

    it('should lock problems B and C when team has no solved problems', async () => {
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([]); // no AC subs

      const result = await service.getHackathonChallenges(HACKATHON_ID, TEAM_ID);

      expect(result[0].locked).toBe(false); // A — unlocked (current)
      expect(result[1].locked).toBe(true);  // B — locked
      expect(result[2].locked).toBe(true);  // C — locked
    });

    it('should unlock B and lock C when A is solved', async () => {
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([makeACSubmission('c1')]);

      const result = await service.getHackathonChallenges(HACKATHON_ID, TEAM_ID);

      expect(result[0].locked).toBe(false); // A — solved, unlocked
      expect(result[0].solved).toBe(true);
      expect(result[1].locked).toBe(false); // B — current, unlocked
      expect(result[1].solved).toBe(false);
      expect(result[2].locked).toBe(true);  // C — still locked
    });

    it('should unlock all problems when all are solved', async () => {
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([
        makeACSubmission('c1'), makeACSubmission('c2'), makeACSubmission('c3'),
      ]);

      const result = await service.getHackathonChallenges(HACKATHON_ID, TEAM_ID);

      expect(result.every((c: any) => c.locked === false)).toBe(true);
      expect(result.every((c: any) => c.solved === true)).toBe(true);
    });

    it('should strip content from locked problems — WS2 scénario 5', async () => {
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([]); // only A unlocked

      const result = await service.getHackathonChallenges(HACKATHON_ID, TEAM_ID);

      // B (index 1) — locked
      expect(result[1].descriptionMd).toBe('');
      expect(result[1].tags).toEqual([]);
      expect(result[1].hints).toEqual([]);
      expect(result[1].examples).toEqual([]);
      expect(result[1].tests).toEqual([]);
      expect(result[1].constraints).toBeNull();

      // C (index 2) — locked
      expect(result[2].title).toBe('Problem C');
    });

    it('should show full content for unlocked (current) problem', async () => {
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([]); // A is current

      const result = await service.getHackathonChallenges(HACKATHON_ID, TEAM_ID);

      expect(result[0].descriptionMd).toBe('Description for A');
      expect(result[0].tags).toEqual(['dp', 'array']);
      expect(result[0].hints).toHaveLength(1);
      expect(result[0].examples).toHaveLength(1);
    });

    it('should return correct label for locked problems (A, B, C)', async () => {
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([]);

      const result = await service.getHackathonChallenges(HACKATHON_ID, TEAM_ID);

      expect(result[2].label).toBe('C');
      expect(result[2].title).toBe('Problem C'); // locked title format
    });

    it('should filter hidden tests from unlocked problems', async () => {
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([]);

      const result = await service.getHackathonChallenges(HACKATHON_ID, TEAM_ID);

      // Problem A is unlocked — its tests should have isHidden filtered out
      expect(result[0].tests.every((t: any) => t.isHidden !== true)).toBe(true);
      expect(result[0].tests).toHaveLength(1); // only the non-hidden test
    });
  });

  // ── WS3: TIME_LIMITS per difficulty ─────────────────────────────────────────

  describe('WS3 — timeLimitMinutes per difficulty', () => {
    it.each([
      ['easy', 15],
      ['medium', 25],
      ['hard', 40],
    ])('should set timeLimitMinutes=%i for difficulty=%s', async (difficulty, expected) => {
      prismaMock.hackathon.findUnique.mockResolvedValue(
        makeHackathon({ challengeIds: ['c1'] }),
      );
      prismaMock.challenge.findMany.mockResolvedValue([makeChallenge('c1', { difficulty })]);
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam());
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([]);
      prismaMock.hackathonTeam.update.mockResolvedValue(makeTeam());

      const result = await service.getHackathonChallenges(HACKATHON_ID, TEAM_ID);

      expect(result[0].timeLimitMinutes).toBe(expected);
    });

    it('should fallback to 25 minutes for unknown difficulty', async () => {
      prismaMock.hackathon.findUnique.mockResolvedValue(
        makeHackathon({ challengeIds: ['c1'] }),
      );
      prismaMock.challenge.findMany.mockResolvedValue([
        makeChallenge('c1', { difficulty: 'extreme' }),
      ]);
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam());
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([]);
      prismaMock.hackathonTeam.update.mockResolvedValue(makeTeam());

      const result = await service.getHackathonChallenges(HACKATHON_ID, TEAM_ID);

      expect(result[0].timeLimitMinutes).toBe(25);
    });
  });

  // ── Q5: Team-wide timer auto-start ─────────────────────────────────────────

  describe('Q5 — Team-wide timer (problemStartTimes)', () => {
    beforeEach(() => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
      prismaMock.challenge.findMany.mockResolvedValue([
        makeChallenge('c1'), makeChallenge('c2'), makeChallenge('c3'),
      ]);
    });

    it('should auto-set startedAt for the current unsolved problem and persist to DB', async () => {
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(
        makeTeam({ problemStartTimes: null }),
      );
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([]); // no AC — c1 is current
      prismaMock.hackathonTeam.update.mockResolvedValue(makeTeam());

      const beforeCall = new Date().toISOString();
      await service.getHackathonChallenges(HACKATHON_ID, TEAM_ID);
      const afterCall = new Date().toISOString();

      // Should have persisted problemStartTimes to DB
      expect(prismaMock.hackathonTeam.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: TEAM_ID },
          data: expect.objectContaining({
            problemStartTimes: expect.objectContaining({
              c1: expect.any(String),
            }),
          }),
        }),
      );

      // The persisted ISO timestamp should be within the test window
      const call = prismaMock.hackathonTeam.update.mock.calls[0][0];
      const ts = call.data.problemStartTimes.c1;
      expect(ts >= beforeCall).toBe(true);
      expect(ts <= afterCall).toBe(true);
    });

    it('should NOT update DB if startedAt already exists for current problem', async () => {
      const existingTime = '2026-03-31T10:00:00.000Z';
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(
        makeTeam({ problemStartTimes: { c1: existingTime } }),
      );
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([]);

      await service.getHackathonChallenges(HACKATHON_ID, TEAM_ID);

      // No DB write — timer already started
      expect(prismaMock.hackathonTeam.update).not.toHaveBeenCalled();
    });

    it('should return startedAt from team.problemStartTimes for the unlocked problem', async () => {
      const startTime = '2026-03-31T10:00:00.000Z';
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(
        makeTeam({ problemStartTimes: { c1: startTime } }),
      );
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([]);

      const result = await service.getHackathonChallenges(HACKATHON_ID, TEAM_ID);

      expect(result[0].startedAt).toBe(startTime);
    });

    it('should return startedAt=null for locked problems', async () => {
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(
        makeTeam({ problemStartTimes: { c1: '2026-03-31T10:00:00.000Z' } }),
      );
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([]);

      const result = await service.getHackathonChallenges(HACKATHON_ID, TEAM_ID);

      // B and C are locked — no startedAt exposed
      expect(result[1].startedAt).toBeNull();
      expect(result[2].startedAt).toBeNull();
    });

    it('should auto-start timer for B when A is already solved', async () => {
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(
        makeTeam({ problemStartTimes: { c1: '2026-03-31T09:00:00.000Z' } }), // c1 started, solved
      );
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([makeACSubmission('c1')]);
      prismaMock.hackathonTeam.update.mockResolvedValue(makeTeam());

      await service.getHackathonChallenges(HACKATHON_ID, TEAM_ID);

      // Should persist c2 start time (c1 was already set)
      expect(prismaMock.hackathonTeam.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            problemStartTimes: expect.objectContaining({ c2: expect.any(String) }),
          }),
        }),
      );
    });

    it('should NOT auto-start timer when all problems are solved', async () => {
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(
        makeTeam({ problemStartTimes: { c1: 'x', c2: 'y', c3: 'z' } }),
      );
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([
        makeACSubmission('c1'), makeACSubmission('c2'), makeACSubmission('c3'),
      ]);

      await service.getHackathonChallenges(HACKATHON_ID, TEAM_ID);

      // All solved — no timer update needed
      expect(prismaMock.hackathonTeam.update).not.toHaveBeenCalled();
    });
  });

  // ── Response shape ────────────────────────────────────────────────────────────

  describe('Response shape — WS1 fields', () => {
    beforeEach(() => {
      prismaMock.hackathon.findUnique.mockResolvedValue(makeHackathon());
      prismaMock.challenge.findMany.mockResolvedValue([makeChallenge('c1')]);
      prismaMock.hackathonTeam.findUnique.mockResolvedValue(makeTeam({ problemStartTimes: { c1: 'ts' } }));
      prismaMock.hackathonSubmission.findMany.mockResolvedValue([]);
    });

    it('should include all required fields in each challenge response', async () => {
      const result = await service.getHackathonChallenges(
        makeHackathon({ challengeIds: ['c1'] }).id, TEAM_ID,
      );

      const c = result[0];
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('order');
      expect(c).toHaveProperty('label');
      expect(c).toHaveProperty('title');
      expect(c).toHaveProperty('difficulty');
      expect(c).toHaveProperty('descriptionMd');
      expect(c).toHaveProperty('tags');
      expect(c).toHaveProperty('constraints');
      expect(c).toHaveProperty('hints');
      expect(c).toHaveProperty('examples');
      expect(c).toHaveProperty('tests');
      expect(c).toHaveProperty('allowedLanguages');
      expect(c).toHaveProperty('category');
      expect(c).toHaveProperty('timeLimitMinutes');
      expect(c).toHaveProperty('locked');
      expect(c).toHaveProperty('solved');
      expect(c).toHaveProperty('startedAt');
    });
  });
});
