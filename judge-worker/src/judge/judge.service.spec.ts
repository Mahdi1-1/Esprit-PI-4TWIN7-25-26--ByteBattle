import { Test, TestingModule } from '@nestjs/testing';
import { JudgeService } from './judge.service';
import { SandboxService } from '../sandbox/sandbox.service';
import { PrismaService } from '../prisma/prisma.service';

describe('JudgeService', () => {
  let service: JudgeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JudgeService,
        {
          provide: SandboxService,
          useValue: {
            evaluateAgainstTests: jest.fn(),
            executeCode: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            submission: {
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<JudgeService>(JudgeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
