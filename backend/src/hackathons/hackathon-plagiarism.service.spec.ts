import { Test, TestingModule } from '@nestjs/testing';
import { HackathonPlagiarismService } from './hackathon-plagiarism.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  hackathonSubmission: { findMany: jest.fn() },
};

const makeSub = (id: string, teamId: string, code: string) => ({
  id, teamId, hackathonId: 'hack-1', challengeId: 'chal-1',
  verdict: 'AC', code, submittedAt: new Date(),
});

describe('HackathonPlagiarismService', () => {
  let service: HackathonPlagiarismService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HackathonPlagiarismService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<HackathonPlagiarismService>(HackathonPlagiarismService);
    jest.clearAllMocks();
  });

  describe('checkPlagiarism()', () => {
    it('should return empty flaggedPairs when no submissions', async () => {
      mockPrisma.hackathonSubmission.findMany.mockResolvedValue([]);

      const result = await service.checkPlagiarism('hack-1', 'chal-1');

      expect(result.flaggedPairs).toHaveLength(0);
      expect(result.totalCompared).toBe(0);
    });

    it('should return empty flaggedPairs for a single team', async () => {
      mockPrisma.hackathonSubmission.findMany.mockResolvedValue([
        makeSub('s1', 'team-1', 'def solve(): return 42'),
      ]);

      const result = await service.checkPlagiarism('hack-1', 'chal-1');

      expect(result.flaggedPairs).toHaveLength(0);
      expect(result.totalCompared).toBe(1);
    });

    it('should flag pairs with similarity >= 80%', async () => {
      const identicalCode = 'def solve(n):\n  return n * 2\n# comment\nprint(solve(5))';
      mockPrisma.hackathonSubmission.findMany.mockResolvedValue([
        makeSub('s1', 'team-1', identicalCode),
        makeSub('s2', 'team-2', identicalCode), // exact copy → similarity = 100%
      ]);

      const result = await service.checkPlagiarism('hack-1', 'chal-1');

      expect(result.flaggedPairs.length).toBeGreaterThanOrEqual(1);
      expect(result.flaggedPairs[0].similarity).toBeGreaterThanOrEqual(80);
    });

    it('should NOT flag pairs with similarity < 80%', async () => {
      mockPrisma.hackathonSubmission.findMany.mockResolvedValue([
        makeSub('s1', 'team-1', 'def solve(a, b): return a + b'),
        makeSub('s2', 'team-2', 'function merge(arr) { return arr.reduce((a,b) => a+b, 0); }'),
      ]);

      const result = await service.checkPlagiarism('hack-1', 'chal-1');

      expect(result.flaggedPairs).toHaveLength(0);
    });

    it('should only keep the earliest AC per team', async () => {
      const now = Date.now();
      const early = new Date(now - 10000);
      const late = new Date(now);

      mockPrisma.hackathonSubmission.findMany.mockResolvedValue([
        { ...makeSub('s1', 'team-1', 'code-a'), submittedAt: early },
        { ...makeSub('s2', 'team-1', 'code-a-v2'), submittedAt: late }, // same team, later → ignored
        { ...makeSub('s3', 'team-2', 'code-b'), submittedAt: early },
      ]);

      const result = await service.checkPlagiarism('hack-1', 'chal-1');

      // Only 2 unique teams compared
      expect(result.totalCompared).toBe(2);
    });

    it('should sort flagged pairs by similarity descending', async () => {
      const codeA = 'x '.repeat(100);
      const codeB = ('x '.repeat(90) + 'y '.repeat(10));
      const codeC = 'x '.repeat(95) + 'z '.repeat(5);

      mockPrisma.hackathonSubmission.findMany.mockResolvedValue([
        makeSub('s1', 'team-1', codeA),
        makeSub('s2', 'team-2', codeB),
        makeSub('s3', 'team-3', codeC),
      ]);

      const result = await service.checkPlagiarism('hack-1', 'chal-1');

      if (result.flaggedPairs.length > 1) {
        for (let i = 0; i < result.flaggedPairs.length - 1; i++) {
          expect(result.flaggedPairs[i].similarity).toBeGreaterThanOrEqual(result.flaggedPairs[i + 1].similarity);
        }
      }
    });
  });
});
