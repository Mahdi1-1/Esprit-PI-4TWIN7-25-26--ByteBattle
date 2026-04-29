import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { randomBytes } from 'crypto';
import { writeFile, unlink, mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

// ── Types ────────────────────────────────────────────────────

export interface ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    timeMs: number;
    memMb: number;
    cpuPercent?: number;
    timedOut: boolean;
}

export interface TestResult {
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    timeMs: number;
    stderr?: string;
    exitCode?: number;
    timedOut?: boolean;
}

export interface EvaluationResult {
    passed: number;
    total: number;
    results: TestResult[];
    verdict: string;  // 'AC' | 'WA' | 'TLE' | 'RE' | 'CE'
    totalTimeMs: number;
    maxMemMb: number;
}

// ── Language configuration ───────────────────────────────────

interface LangConfig {
    image: string;
    fileExt: string;
    /** Command to produce inside the container. Receives the filename. */
    buildCmd: (filename: string) => string[];
}

const LANGUAGE_MAP: Record<string, LangConfig> = {
    javascript: {
        image: 'bytebattle-sandbox-node',
        fileExt: '.js',
        buildCmd: (f) => [f],                        // node <file>
    },
    typescript: {
        image: 'bytebattle-sandbox-typescript',
        fileExt: '.ts',
        buildCmd: (f) => [f],                        // ts-node <file>
    },
    python: {
        image: 'bytebattle-sandbox-python',
        fileExt: '.py',
        buildCmd: (f) => [f],                        // python3 <file>
    },
    cpp: {
        image: 'bytebattle-sandbox-cpp',
        fileExt: '.cpp',
        buildCmd: (f) => [`g++ -O2 -std=c++17 -o /tmp/a.out ${f} && /tmp/a.out`],
    },
    c: {
        image: 'bytebattle-sandbox-c',
        fileExt: '.c',
        buildCmd: (f) => [`gcc -O2 -std=c17 -o /tmp/a.out ${f} -lm && /tmp/a.out`],
    },
    java: {
        image: 'bytebattle-sandbox-java',
        fileExt: '.java',
        buildCmd: (f) => [`cp ${f} /tmp/Solution.java && javac /tmp/Solution.java && java -cp /tmp Solution`],
    },
    go: {
        image: 'bytebattle-sandbox-go',
        fileExt: '.go',
        buildCmd: (f) => [`cp ${f} /tmp/main.go && cd /tmp && go run main.go`],
    },
    rust: {
        image: 'bytebattle-sandbox-rust',
        fileExt: '.rs',
        buildCmd: (f) => [`rustc -o /tmp/a.out ${f} && /tmp/a.out`],
    },
};

// ── Dangerous code patterns ──────────────────────────────────

const DANGEROUS_PATTERNS: { pattern: RegExp; description: string }[] = [
    // Fork bombs
    { pattern: /:\(\)\{.*\|.*&\s*\};\s*:/, description: 'Bash fork bomb detected' },
    { pattern: /fork\s*\(/, description: 'fork() system call detected' },
    // Reverse shells
    { pattern: /\/dev\/tcp\//, description: 'TCP device access (reverse shell)' },
    { pattern: /socket\s*\.\s*connect/i, description: 'Socket connect (network access)' },
    { pattern: /net\.connect|net\.createConnection/, description: 'Node.js net module usage' },
    // Process/system escape — JavaScript / TypeScript
    { pattern: /child_process/, description: 'child_process module (sandbox escape)' },
    { pattern: /require\s*\(\s*['"]child_process/, description: 'Requiring child_process' },
    // Process/system escape — Python
    { pattern: /os\s*\.\s*system\s*\(/, description: 'os.system() call (Python)' },
    { pattern: /subprocess/, description: 'subprocess module (Python)' },
    // Process/system escape — Java
    { pattern: /Runtime\s*\.\s*getRuntime\s*\(\s*\)\s*\.\s*exec/, description: 'Runtime.exec() (Java sandbox escape)' },
    { pattern: /ProcessBuilder/, description: 'ProcessBuilder (Java sandbox escape)' },
    // Process/system escape — Go
    { pattern: /os\/exec/, description: 'os/exec package (Go sandbox escape)' },
    { pattern: /syscall\./, description: 'syscall package (Go sandbox escape)' },
    // Process/system escape — Rust
    { pattern: /std::process::Command/, description: 'std::process::Command (Rust sandbox escape)' },
    // Shell commands
    { pattern: /exec\s*\(\s*['"].*rm\s/, description: 'Shell exec with rm command' },
    // File system escape
    { pattern: /\/etc\/passwd/, description: 'Attempt to read /etc/passwd' },
    { pattern: /\/proc\/self/, description: 'Attempt to access /proc/self' },
];

// ── Service ──────────────────────────────────────────────────

@Injectable()
export class SandboxService {
    private readonly logger = new Logger(SandboxService.name);
    private readonly timeoutMs: number;
    private readonly memoryLimit: string;
    private readonly cpuLimit: string;

    constructor(private config: ConfigService) {
        // Utilise Number() pour forcer la conversion, car .get<number> ne convertit pas automatiquement les strings du .env
        const rawTimeout = this.config.get('SANDBOX_TIMEOUT_MS', 10000);
        this.timeoutMs = Number(rawTimeout);

        this.memoryLimit = this.config.get<string>('SANDBOX_MEMORY_LIMIT', '128m');
        this.cpuLimit = this.config.get<string>('SANDBOX_CPU_LIMIT', '0.5');

        // Optionnel : Ajoute un log pour vérifier la valeur au démarrage
        this.logger.log(`Sandbox initialized: Timeout=${this.timeoutMs}ms, Memory=${this.memoryLimit}, CPU=${this.cpuLimit}`);
    }

    // ────────────────────────────────────────────────────────────
    // Public API
    // ────────────────────────────────────────────────────────────

    /**
     * Execute arbitrary user code and return stdout/stderr.
     * Used by the "Run" button (no test-case evaluation).
     */
    async executeCode(
        language: string,
        code: string,
        stdin = '',
    ): Promise<ExecutionResult> {
        // 1. Security pre-scan
        const threat = this.analyseCode(code);
        if (threat) {
            return {
                stdout: '',
                stderr: `⛔ Security violation: ${threat}`,
                exitCode: 1,
                timeMs: 0,
                memMb: 0,
                timedOut: false,
            };
        }

        // 2. Resolve language config
        const langCfg = this.getLangConfig(language);

        // 3. Write code to a temp file on the host
        const { dir, filePath, fileName } = await this.writeTempFile(code, langCfg.fileExt);

        try {
            return await this.runContainer(langCfg, dir, fileName, stdin);
        } finally {
            // Clean up temp files
            await this.cleanup(filePath, dir);
        }
    }

    /**
     * Evaluate user code against an array of test cases.
     * Returns per-test results + aggregate verdict.
     */
    async evaluateAgainstTests(
        language: string,
        code: string,
        tests: { input: string; expectedOutput: string }[],
    ): Promise<EvaluationResult> {
        // Security pre-scan
        const threat = this.analyseCode(code);
        if (threat) {
            return {
                passed: 0,
                total: tests.length,
                results: [],
                verdict: 'RE',
                totalTimeMs: 0,
                maxMemMb: 0,
            };
        }

        const langCfg = this.getLangConfig(language);
        const { dir, filePath, fileName } = await this.writeTempFile(code, langCfg.fileExt);

        const results: TestResult[] = [];
        let totalTime = 0;
        let maxMem = 0;
        let verdict = 'AC';

        try {
            for (const test of tests) {
                const exec = await this.runContainer(langCfg, dir, fileName, test.input);

                const actualOutput = exec.stdout.trim();
                const expected = test.expectedOutput.trim();
                const passed = actualOutput === expected;

                results.push({
                    input: test.input,
                    expectedOutput: expected,
                    actualOutput,
                    passed,
                    timeMs: exec.timeMs,
                    stderr: (exec.stderr || '').trim(),
                    exitCode: exec.exitCode,
                    timedOut: exec.timedOut,
                });

                totalTime += exec.timeMs;
                maxMem = Math.max(maxMem, exec.memMb);

                // Determine verdict (first non-AC wins)
                if (verdict === 'AC') {
                    if (exec.timedOut) verdict = 'TLE';
                    else if (exec.exitCode !== 0 && !passed) verdict = 'RE';
                    else if (!passed) verdict = 'WA';
                }
            }
        } finally {
            await this.cleanup(filePath, dir);
        }

        const passed = results.filter((r) => r.passed).length;
        return { passed, total: tests.length, results, verdict, totalTimeMs: totalTime, maxMemMb: maxMem };
    }

    // ────────────────────────────────────────────────────────────
    // Internals
    // ────────────────────────────────────────────────────────────

    /** Analyse code for known dangerous patterns. Returns description if found. */
    private analyseCode(code: string): string | null {
        for (const { pattern, description } of DANGEROUS_PATTERNS) {
            if (pattern.test(code)) {
                this.logger.warn(`Security threat detected: ${description}`);
                return description;
            }
        }
        return null;
    }

    private async getDockerStats(containerName: string): Promise<{ cpu: number; memoryMb: number } | null> {
        return new Promise((resolve) => {
            execFile(
                'docker',
                ['stats', '--no-stream', '--format', '{{.CPUPerc}}|{{.MemUsage}}', containerName],
                { timeout: 2000, encoding: 'utf-8' },
                (error, stdout, stderr) => {
                    if (error || !stdout) {
                        if (error) {
                            this.logger.debug(`Docker stats failed for ${containerName}: ${error.message} ${stderr || ''}`);
                        }
                        return resolve(null);
                    }

                    const line = stdout.trim();
                    const [cpuRaw, memRaw] = line.split('|');
                    if (!cpuRaw || !memRaw) {
                        return resolve(null);
                    }

                    const cpu = parseFloat(cpuRaw.replace('%', '').replace('<', '').trim());
                    const memoryStr = memRaw.split('/')[0].trim();
                    const memoryMb = this.parseMemoryString(memoryStr);

                    if (Number.isNaN(cpu) || Number.isNaN(memoryMb)) {
                        return resolve(null);
                    }

                    resolve({ cpu, memoryMb });
                },
            );
        });
    }

    private parseMemoryString(value: string): number {
        const match = value.match(/^([\d,.]+)\s*([KMGTP]i?B)$/i);
        if (!match) {
            return NaN;
        }

        const amount = parseFloat(match[1].replace(',', '.'));
        const unit = match[2].toUpperCase();
        const multiplier: Record<string, number> = {
            B: 1 / 1024 / 1024,
            KB: 1 / 1024,
            KIB: 1 / 1024,
            MB: 1,
            MIB: 1.048576,
            GB: 1024,
            GIB: 1024 * 1.048576,
            TB: 1024 * 1024,
            TIB: 1024 * 1024 * 1.048576,
        };

        return amount * (multiplier[unit] ?? NaN);
    }

    /** Resolve a language string to its Docker configuration. */
    private getLangConfig(language: string): LangConfig {
        const key = language.toLowerCase().trim();
        // Normalise common aliases
        const aliasMap: Record<string, string> = {
            // JavaScript
            'js': 'javascript', 'node': 'javascript', 'nodejs': 'javascript',
            // TypeScript
            'ts': 'typescript',
            // Python
            'py': 'python', 'python3': 'python',
            // C++
            'c++': 'cpp', 'cxx': 'cpp', 'cplusplus': 'cpp',
            // C
            'gcc': 'c',
            // Java
            'java': 'java',
            // Go
            'golang': 'go',
            // Rust
            'rs': 'rust',
        };

        const normalised = aliasMap[key] || key;
        const cfg = LANGUAGE_MAP[normalised];
        if (!cfg) {
            throw new Error(`Unsupported language: "${language}". Supported: ${Object.keys(LANGUAGE_MAP).join(', ')}`);
        }
        return cfg;
    }

    /** Write user code to a temporary file and return the paths. */
    private async writeTempFile(code: string, ext: string) {
        const dir = await mkdtemp(join(tmpdir(), 'bb-sandbox-'));
        const fileName = `solution${ext}`;
        const filePath = join(dir, fileName);
        await writeFile(filePath, code, 'utf-8');
        return { dir, filePath, fileName };
    }

    /** Clean up the temporary file and directory. */
    private async cleanup(filePath: string, dir: string) {
        try {
            await unlink(filePath);
            const { rmdir } = await import('fs/promises');
            await rmdir(dir);
        } catch {
            // Best-effort cleanup, not critical
        }
    }

    /**
     * Run a Docker container with full security constraints.
     *
     * Docker flags explained:
     *   --rm              Remove container after exit
     *   --network none    Complete network isolation
     *   --read-only       Root filesystem is read-only
     *   --memory          RAM limit (default 128MB)
     *   --cpus            CPU fraction limit (default 0.5)
     *   --pids-limit 64   Prevent fork bombs
     *   --tmpfs           Writable /tmp for code execution (32MB max)
     *   --user            Run as non-root sandboxuser
     *   -v                Bind-mount the code file (read-only)
     *   -i                Accept stdin for test input
     */
    private runContainer(
        langCfg: LangConfig,
        hostDir: string,
        fileName: string,
        stdin: string,
    ): Promise<ExecutionResult> {
        // Mount code to /sandbox/ (read-only) — separate from /tmp (tmpfs scratch space)
        // This avoids the tmpfs at /tmp shadowing the bind-mounted code file.
        const containerCodePath = `/sandbox/${fileName}`;
        const cmd = langCfg.buildCmd(containerCodePath);

        const containerName = `bb-sandbox-${Date.now()}-${randomBytes(4).toString('hex')}`;
        const args = [
            'run', '--rm',
            '--network', 'none',
            '--read-only',
            '--memory', this.memoryLimit,
            '--cpus', this.cpuLimit,
            '--pids-limit', '64',
            '--tmpfs', '/tmp:rw,nosuid,size=32m',
            '--name', containerName,
            '-v', `${hostDir}/${fileName}:${containerCodePath}:ro`,
            '-i',
            langCfg.image,
            ...cmd,
        ];

        const startTime = Date.now();

        this.logger.debug(`Docker cmd: docker ${args.join(' ')}`);
        this.logger.debug(`Stdin: ${stdin ? JSON.stringify(stdin.substring(0, 200)) : '(empty)'}`);

        return new Promise<ExecutionResult>((resolve) => {
            let maxMemMb = 0;
            let maxCpu = 0;
            const statsPromise = this.getDockerStats(containerName).then((stats) => {
                if (!stats) return;
                maxMemMb = Math.max(maxMemMb, stats.memoryMb);
                maxCpu = Math.max(maxCpu, stats.cpu);
            }).catch(() => {
                // Ignore stats collection failures and continue.
            });

            const child = execFile('docker', args, {
                timeout: this.timeoutMs,
                maxBuffer: 1024 * 1024, // 1 MB output cap
                encoding: 'utf-8',
            }, async (error, stdout, stderr) => {
                const timeMs = Date.now() - startTime;
                const timedOut = error?.killed === true;
                const exitCode = timedOut ? 124 : (error as any)?.code ?? 0;

                this.logger.debug(`Docker result: exitCode=${exitCode}, timedOut=${timedOut}, timeMs=${timeMs}`);
                this.logger.debug(`Docker stdout: ${(stdout || '').substring(0, 300) || '(empty)'}`);
                if (stderr) this.logger.debug(`Docker stderr: ${(stderr || '').substring(0, 300)}`);
                if (error) this.logger.warn(`Docker error object: ${error.message}`);

                await statsPromise;
                resolve({
                    stdout: stdout || '',
                    stderr: timedOut ? 'Time limit exceeded' : (stderr || ''),
                    exitCode: typeof exitCode === 'number' ? exitCode : 1,
                    timeMs,
                    memMb: parseFloat(maxMemMb.toFixed(2)),
                    cpuPercent: parseFloat(maxCpu.toFixed(2)),
                    timedOut,
                });
            });

            // Pipe stdin to the container
            // Convert literal \n sequences (from JSON/DB storage) to real newlines
            // Always write to stdin (even if empty) before calling end() to prevent EOFError
            if (stdin !== undefined && stdin !== null) {
                const normalizedStdin = stdin.replace(/\\n/g, '\n');
                child.stdin?.write(normalizedStdin);
            }
            child.stdin?.end();
        });
    }
}
