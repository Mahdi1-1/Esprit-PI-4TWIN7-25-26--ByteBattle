import { Test, TestingModule } from '@nestjs/testing';
import { JudgeProcessor } from './judge.processor';
import { JudgeService } from './judge.service';
import { ConfigService } from '@nestjs/config';

const mockJudgeService = {
  executeAndEvaluate: jest.fn(),
  runCode: jest.fn(),
  evaluateOnly: jest.fn(),
};

const mockConfig = {
  get: jest.fn().mockImplementation((key: string, fallback?: any) => {
    if (key === 'JUDGE_WORKER_CONCURRENCY') return 5;
    return fallback;
  }),
};

const makeJob = (name: string, data: any) => ({
  id: `job-${Math.random().toString(36).slice(2)}`,
  name,
  data,
});

describe('JudgeProcessor', () => {
  let processor: JudgeProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JudgeProcessor,
        { provide: JudgeService, useValue: mockJudgeService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    processor = module.get<JudgeProcessor>(JudgeProcessor);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  // ─── execute-code ──────────────────────────────────────────────────────────

  describe('process() — execute-code jobs', () => {
    const baseData = {
      submissionId: 'sub-1',
      language: 'python3',
      code: 'print("hello")',
      tests: [{ input: '', expectedOutput: 'hello' }],
    };

    it('should call judgeService.executeAndEvaluate with correct args', async () => {
      const result = { verdict: 'AC', passed: 1, total: 1 };
      mockJudgeService.executeAndEvaluate.mockResolvedValue(result);

      const ret = await processor.process(makeJob('execute-code', baseData) as any);

      expect(mockJudgeService.executeAndEvaluate).toHaveBeenCalledWith(
        'sub-1', 'python3', 'print("hello")', baseData.tests,
      );
      expect(ret).toEqual(result);
    });

    it('should re-throw when executeAndEvaluate throws', async () => {
      mockJudgeService.executeAndEvaluate.mockRejectedValue(new Error('Sandbox timeout'));

      await expect(
        processor.process(makeJob('execute-code', baseData) as any),
      ).rejects.toThrow('Sandbox timeout');
    });
  });

  // ─── run-code ──────────────────────────────────────────────────────────────

  describe('process() — run-code jobs', () => {
    it('should call judgeService.runCode with language and code', async () => {
      const execResult = { stdout: 'hello', stderr: '', timeMs: 42, memMb: 8, exitCode: 0 };
      mockJudgeService.runCode.mockResolvedValue(execResult);

      const ret = await processor.process(
        makeJob('run-code', { language: 'javascript', code: 'console.log("hello")' }) as any,
      );

      expect(mockJudgeService.runCode).toHaveBeenCalledWith('javascript', 'console.log("hello")');
      expect(ret.stdout).toBe('hello');
    });
  });

  // ─── evaluate-code ─────────────────────────────────────────────────────────

  describe('process() — evaluate-code jobs', () => {
    it('should call judgeService.evaluateOnly with language, code and tests', async () => {
      const evalResult = { verdict: 'WA', passed: 1, total: 3 };
      mockJudgeService.evaluateOnly.mockResolvedValue(evalResult);

      const ret = await processor.process(
        makeJob('evaluate-code', {
          language: 'cpp',
          code: 'int main(){}',
          tests: [{ input: '1', expectedOutput: '2' }],
        }) as any,
      );

      expect(mockJudgeService.evaluateOnly).toHaveBeenCalledWith(
        'cpp', 'int main(){}', [{ input: '1', expectedOutput: '2' }],
      );
      expect(ret.verdict).toBe('WA');
    });
  });

  // ─── unknown job type ──────────────────────────────────────────────────────

  describe('process() — unknown job type', () => {
    it('should throw an error for unrecognised job name', async () => {
      await expect(
        processor.process(makeJob('unknown-job-type', {}) as any),
      ).rejects.toThrow('Unknown job type: unknown-job-type');
    });

    it('should not call any service method for unknown job', async () => {
      await expect(
        processor.process(makeJob('mystery', {}) as any),
      ).rejects.toThrow();

      expect(mockJudgeService.executeAndEvaluate).not.toHaveBeenCalled();
      expect(mockJudgeService.runCode).not.toHaveBeenCalled();
      expect(mockJudgeService.evaluateOnly).not.toHaveBeenCalled();
    });
  });

  // ─── concurrent jobs ───────────────────────────────────────────────────────

  describe('process() — concurrent jobs', () => {
    it('should process multiple jobs independently without state leakage', async () => {
      const result1 = { verdict: 'AC', passed: 3 };
      const result2 = { verdict: 'WA', passed: 1 };

      mockJudgeService.executeAndEvaluate
        .mockResolvedValueOnce(result1)
        .mockResolvedValueOnce(result2);

      const [r1, r2] = await Promise.all([
        processor.process(makeJob('execute-code', { submissionId: 's1', language: 'python3', code: 'x', tests: [] }) as any),
        processor.process(makeJob('execute-code', { submissionId: 's2', language: 'javascript', code: 'y', tests: [] }) as any),
      ]);

      expect(r1.verdict).toBe('AC');
      expect(r2.verdict).toBe('WA');
      expect(mockJudgeService.executeAndEvaluate).toHaveBeenCalledTimes(2);
    });
  });
});
