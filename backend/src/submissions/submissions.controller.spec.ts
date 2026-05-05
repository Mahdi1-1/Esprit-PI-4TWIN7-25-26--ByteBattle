import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

const mockSubmissionsService = {
  create: jest.fn(),
  runCode: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  generateAiReview: jest.fn(),
  getUserHistory: jest.fn(),
  saveDraft: jest.fn(),
  findDraft: jest.fn(),
  deleteDraft: jest.fn(),
};

describe('SubmissionsController', () => {
  let controller: SubmissionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionsController],
      providers: [{ provide: SubmissionsService, useValue: mockSubmissionsService }],
    }).compile();

    controller = module.get<SubmissionsController>(SubmissionsController);
    jest.clearAllMocks();
  });

  describe('submitCode()', () => {
    it('should call submissionsService.create with userId and dto', async () => {
      const dto = { challengeId: 'c1', kind: 'CODE', language: 'python3', code: 'print(1)' };
      mockSubmissionsService.create.mockResolvedValue({ id: 'sub-1', verdict: 'queued' });

      const result = await controller.submitCode('user-1', dto as any);

      expect(mockSubmissionsService.create).toHaveBeenCalledWith('user-1', dto);
      expect(result.verdict).toBe('queued');
    });
  });

  describe('runCode()', () => {
    it('should call submissionsService.runCode with userId and dto', async () => {
      const dto = { challengeId: 'c1', language: 'python3', code: 'print(1)' };
      mockSubmissionsService.runCode.mockResolvedValue({ verdict: 'AC', passed: 1, total: 1 });

      const result = await controller.runCode('user-1', dto as any);

      expect(mockSubmissionsService.runCode).toHaveBeenCalledWith('user-1', dto);
      expect(result.verdict).toBe('AC');
    });
  });

  describe('getMyHistory()', () => {
    it('should call getUserHistory with userId and pagination', async () => {
      mockSubmissionsService.getUserHistory.mockResolvedValue({ data: [], total: 0 });
      await controller.getMyHistory('user-1', 2, 10, 'CODE', 'AC');
      expect(mockSubmissionsService.getUserHistory).toHaveBeenCalledWith('user-1', { page: 2, limit: 10, kind: 'CODE', verdict: 'AC' });
    });
  });
});
