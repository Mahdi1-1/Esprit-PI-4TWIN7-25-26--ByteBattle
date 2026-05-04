import { Test, TestingModule } from '@nestjs/testing';
import { SandboxService } from './sandbox.service';
import { ConfigService } from '@nestjs/config';
import * as child_process from 'child_process';
import { ExecFileException } from 'child_process';
import * as fs from 'fs/promises';

jest.mock('child_process');
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
  mkdtemp: jest.fn().mockResolvedValue('/tmp/bb-sandbox-mockdir'),
  rmdir: jest.fn().mockResolvedValue(undefined),
}));

const createDockerExecMock = (
  mainStdout: string,
  mainStderr = '',
  mainError: ExecFileException | null = null,
) => {
  return (
    _cmd: string,
    args: readonly string[],
    _options: unknown,
    callback: (
      error: ExecFileException | null,
      stdout: string,
      stderr: string,
    ) => void,
  ) => {
    if (args[0] === 'stats') {
      callback(null, '0.00%|10.00MiB / 128MiB\n', '');
    } else {
      callback(mainError, mainStdout, mainStderr);
    }
    return { stdin: { write: jest.fn(), end: jest.fn() } };
  };
};

describe('SandboxService', () => {
  let service: SandboxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SandboxService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_: string, defaultValue?: unknown) => defaultValue),
          },
        },
      ],
    }).compile();

    service = module.get<SandboxService>(SandboxService);
    // Clear mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluateAgainstTests', () => {
    it('should return AC when all test cases match expected output', async () => {
      // Mock execFile to simulate successful execution
      (child_process.execFile as unknown as jest.Mock).mockImplementation(
        createDockerExecMock('hello world\n'),
      );

      const result = await service.evaluateAgainstTests(
        'javascript',
        'console.log("hello world");',
        [{ input: '', expectedOutput: 'hello world' }],
      );

      expect(result.verdict).toBe('AC');
      expect(result.passed).toBe(1);
      expect(result.total).toBe(1);
      expect(result.maxMemMb).toBeCloseTo(10.49, 2);
      expect(
        (child_process.execFile as unknown as jest.Mock).mock.calls.length,
      ).toBeGreaterThan(1);
      expect(child_process.execFile).toHaveBeenCalledWith(
        'docker',
        expect.any(Array),
        expect.any(Object),
        expect.any(Function),
      );
      expect(fs.writeFile).toHaveBeenCalled();
      expect(fs.unlink).toHaveBeenCalled();
    });

    it('should return WA when test cases fail', async () => {
      // Mock execFile to simulate wrong answer
      (child_process.execFile as unknown as jest.Mock).mockImplementation(
        createDockerExecMock('wrong output\n'),
      );

      const result = await service.evaluateAgainstTests(
        'python',
        'print("wrong output")',
        [{ input: '', expectedOutput: 'hello world' }],
      );

      expect(result.verdict).toBe('WA');
      expect(result.passed).toBe(0);
    });

    it('should return TLE on timeout', async () => {
      // Mock execFile to simulate timeout
      (child_process.execFile as unknown as jest.Mock).mockImplementation(
        (
          _cmd: string,
          args: readonly string[],
          _options: unknown,
          callback: (
            error: ExecFileException | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          if (args[0] === 'stats') {
            callback(null, '0.00%|10.00MiB / 128MiB\n', '');
          } else {
            const timeoutErr = new Error('Command failed') as ExecFileException;
            timeoutErr.killed = true;
            callback(timeoutErr, '', '');
          }
          return { stdin: { write: jest.fn(), end: jest.fn() } };
        },
      );

      const result = await service.evaluateAgainstTests(
        'cpp',
        'while(true){}',
        [{ input: '', expectedOutput: 'done' }],
      );

      expect(result.verdict).toBe('TLE');
    });

    it('should catch RE (Runtime Error)', async () => {
      // Mock execFile to simulate runtime error
      (child_process.execFile as unknown as jest.Mock).mockImplementation(
        (
          _cmd: string,
          args: readonly string[],
          _options: unknown,
          callback: (
            error: ExecFileException | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          if (args[0] === 'stats') {
            callback(null, '0.00%|10.00MiB / 128MiB\n', '');
          } else {
            const err = new Error('Command failed') as ExecFileException;
            err.code = 1;
            callback(err, '', 'Segmentation fault');
          }
          return { stdin: { write: jest.fn(), end: jest.fn() } };
        },
      );

      const result = await service.evaluateAgainstTests(
        'cpp',
        'int main() { return 1; }',
        [{ input: '', expectedOutput: 'ok' }],
      );

      expect(result.verdict).toBe('RE');
    });

    it('should detect malicious code and return RE early', async () => {
      const result = await service.evaluateAgainstTests(
        'python',
        'import subprocess; subprocess.call("rm -rf /", shell=True)',
        [{ input: '', expectedOutput: 'fail' }],
      );

      expect(result.verdict).toBe('RE');
      expect(child_process.execFile).not.toHaveBeenCalled();
    });
  });
});
