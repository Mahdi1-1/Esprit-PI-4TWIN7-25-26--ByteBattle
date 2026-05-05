import { Test, TestingModule } from '@nestjs/testing';
import { HackathonMonitoringService } from './hackathon-monitoring.service';
import { PrismaService } from '../prisma/prisma.service';

let mockPrisma: any = {
  hackathon: { findUnique: jest.fn() },
  hackathonSubmission: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  hackathonTeam: { findMany: jest.fn() },
};

const mockHackathon = {
  id: 'hack-1', title: 'Test Hack', status: 'active',
  challengeIds: ['chal-1', 'chal-2'],
};

describe('HackathonMonitoringService', () => {
  let service: HackathonMonitoringService;

  beforeEach(async () => {
    // Recreate mock functions to ensure no leftover mockResolvedValueOnce queues
    const freshMockPrisma = {
      hackathon: { findUnique: jest.fn() },
      hackathonSubmission: { count: jest.fn(), findMany: jest.fn() },
      hackathonTeam: { findMany: jest.fn() },
    } as any;

    mockPrisma = freshMockPrisma;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HackathonMonitoringService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<HackathonMonitoringService>(HackathonMonitoringService);
    jest.clearAllMocks();
  });

  describe('getMonitoringData()', () => {
    it('should return null when hackathon not found', async () => {
      mockPrisma.hackathon.findUnique.mockResolvedValue(null);

      const result = await service.getMonitoringData('nonexistent');

      expect(result).toBeNull();
    });

    it('should return monitoring data with correct acceptance rate', async () => {
      mockPrisma.hackathon.findUnique.mockResolvedValue(mockHackathon);
      mockPrisma.hackathonSubmission.count
        .mockResolvedValueOnce(20)  // total submissions
        .mockResolvedValueOnce(15)  // accepted submissions
        .mockResolvedValueOnce(3)   // solved teams for chal-1
        .mockResolvedValueOnce(2);  // solved teams for chal-2

      mockPrisma.hackathonTeam.findMany.mockResolvedValue([
        { id: 'team-1', name: 'Alpha', solvedCount: 2 },
        { id: 'team-2', name: 'Beta', solvedCount: 1 },
      ]);

      mockPrisma.hackathonSubmission.findMany
        .mockResolvedValueOnce([{ id: 'sub-1' }, { id: 'sub-2' }]) // recent submissions
        .mockResolvedValueOnce([{ teamId: 'team-1' }]) // active teams (last 15 min)
        // solved teams per challenge (two challenges)
        .mockResolvedValueOnce([{ teamId: 'team-1' }])
        .mockResolvedValueOnce([{ teamId: 'team-2' }]);

      const result = await service.getMonitoringData('hack-1');

      expect(result).not.toBeNull();
      const r: any = result;
      expect(r.acceptanceRate).toBe('75.0%'); // 15/20 * 100
    });

    it('should handle 0 submissions without dividing by zero', async () => {
      mockPrisma.hackathon.findUnique.mockResolvedValue(mockHackathon);
      mockPrisma.hackathonSubmission.count.mockResolvedValue(0);
      mockPrisma.hackathonTeam.findMany.mockResolvedValue([]);
      mockPrisma.hackathonSubmission.findMany.mockResolvedValue([]);

      const result = await service.getMonitoringData('hack-1');
      const r: any = result;

      expect(r.acceptanceRate).toBe('0%');
    });

    it('should correctly classify active vs idle teams', async () => {
      mockPrisma.hackathon.findUnique.mockResolvedValue(mockHackathon);
      mockPrisma.hackathonSubmission.count.mockResolvedValue(0);
      mockPrisma.hackathonTeam.findMany.mockResolvedValue([
        { id: 'team-1', name: 'Active Team', solvedCount: 1 },
        { id: 'team-2', name: 'Idle Team', solvedCount: 0 },
      ]);
      mockPrisma.hackathonSubmission.findMany
        .mockImplementationOnce(() => Promise.resolve([])) // recent subs
        .mockImplementationOnce(() => Promise.resolve([{ teamId: 'team-1' }])) // only team-1 active recently
        .mockResolvedValue([]); // any per-challenge solvedTeams defaults to []

      const result = await service.getMonitoringData('hack-1');
      const r: any = result;

      // activeTeams/idleTeams are counts; validate teamActivity entries instead
      expect(r.teamActivity.some((t: any) => t.teamId === 'team-1' && t.isActive)).toBe(true);
      expect(r.teamActivity.some((t: any) => t.teamId === 'team-2' && !t.isActive)).toBe(true);
    });
  });
});
