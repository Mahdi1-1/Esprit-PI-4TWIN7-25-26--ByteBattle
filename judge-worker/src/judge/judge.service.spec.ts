import { Test, TestingModule } from '@nestjs/testing';
import { JudgeService } from './judge.service';
import {
  EvaluationResult,
  ExecutionResult,
  SandboxService,
} from '../sandbox/sandbox.service';
import { PrismaService } from '../prisma/prisma.service';

describe('JudgeService', () => {
  let service: JudgeService;
  let sandbox: jest.Mocked<
    Pick<SandboxService, 'evaluateAgainstTests' | 'executeCode'>
  >;
  let prisma: {
    submission: {
      update: jest.Mock<(args: unknown) => Promise<unknown>>;
    };
  };

  const evaluationResult: EvaluationResult = {
    verdict: 'AC',
    passed: 2,
    total: 2,
    results: [],
    totalTimeMs: 25,
    maxMemMb: 12,
  };

  beforeEach(async () => {
    sandbox = {
      evaluateAgainstTests: jest.fn<SandboxService['evaluateAgainstTests']>(),
      executeCode: jest.fn<SandboxService['executeCode']>(),
    };
    prisma = {
      submission: {
        update: jest.fn((args: unknown): Promise<unknown> => {
          void args;
          return Promise.resolve(undefined);
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JudgeService,
        {
          provide: SandboxService,
          useValue: sandbox,
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<JudgeService>(JudgeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('executes tests, persists AC submission metadata and returns evaluation', async () => {
    sandbox.evaluateAgainstTests.mockResolvedValue(evaluationResult);
    prisma.submission.update.mockResolvedValue({ id: 'sub-1' });

    const result = await service.executeAndEvaluate(
      'sub-1',
      'python',
      'print(1)',
      [{ input: '', expectedOutput: '1' }],
    );

    expect(sandbox.evaluateAgainstTests).toHaveBeenCalledWith(
      'python',
      'print(1)',
      [{ input: '', expectedOutput: '1' }],
    );
    expect(prisma.submission.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: {
        verdict: 'AC',
        score: 100,
        testsPassed: 2,
        testsTotal: 2,
        timeMs: 25,
        memMb: 12,
      },
    });
    expect(result).toEqual(evaluationResult);
  });

  it('persists proportional score for non-AC verdicts', async () => {
    const partialEvaluation: EvaluationResult = {
      ...evaluationResult,
      verdict: 'WA',
      passed: 1,
      total: 3,
    };
    sandbox.evaluateAgainstTests.mockResolvedValue(partialEvaluation);
    prisma.submission.update.mockResolvedValue({ id: 'sub-2' });

    await service.executeAndEvaluate('sub-2', 'javascript', 'return 1', []);

    expect(prisma.submission.update).toHaveBeenCalledWith({
      where: { id: 'sub-2' },
      data: {
        verdict: 'WA',
        score: 33,
        testsPassed: 1,
        testsTotal: 3,
        timeMs: 25,
        memMb: 12,
      },
    });
  });

  it('runs code through the sandbox with empty stdin', async () => {
    const executionResult: ExecutionResult = {
      stdout: 'hello\n',
      stderr: '',
      exitCode: 0,
      timeMs: 10,
      memMb: 8,
      timedOut: false,
    };
    sandbox.executeCode.mockResolvedValue(executionResult);

    await expect(
      service.runCode('javascript', 'console.log("hello")'),
    ).resolves.toBe(executionResult);
    expect(sandbox.executeCode).toHaveBeenCalledWith(
      'javascript',
      'console.log("hello")',
      '',
    );
  });

  it('evaluates code without persisting a submission', async () => {
    sandbox.evaluateAgainstTests.mockResolvedValue(evaluationResult);

    const tests = [{ input: '1', expectedOutput: '1' }];
    await expect(
      service.evaluateOnly('cpp', 'int main(){}', tests),
    ).resolves.toBe(evaluationResult);

    expect(sandbox.evaluateAgainstTests).toHaveBeenCalledWith(
      'cpp',
      'int main(){}',
      tests,
    );
    expect(prisma.submission.update).not.toHaveBeenCalled();
  });
});
