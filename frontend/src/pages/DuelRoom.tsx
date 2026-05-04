import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import { Button } from '../components/Button';
import { DifficultyBadge } from '../components/Badge';
import { useEditorTheme, defineMonacoThemes } from '../context/EditorThemeContext';
import { Clock, Send, Loader, AlertTriangle, Lightbulb } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { toast } from 'react-hot-toast';
import { GameTheme, GameResult } from '../types/game.types';
import { useAnticheat } from '../hooks/useAnticheat';
import { getSocketNamespaceUrl } from '../config/runtime';

type Tab = 'statement' | 'status';

const LANGUAGES = [
  { value: 'python', label: 'Python 3' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

const CODE_TEMPLATES: Record<string, string> = {
  python: `import sys\n\ndef solution(lines):\n    # Parse input lines and print output\n    pass\n\nif __name__ == "__main__":\n    data = sys.stdin.read().splitlines()\n    solution(data)\n`,
  javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');\n\nfunction solution(lines) {\n  // Parse input lines and print output\n}\n\nsolution(lines);\n`,
  typescript: `import * as fs from 'fs';\n\nconst lines: string[] = fs.readFileSync('/dev/stdin', 'utf8').trim().split('\\n');\n\nfunction solution(lines: string[]): void {\n  // Parse input lines and print output\n}\n\nsolution(lines);\n`,
  cpp: `#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n\n    string line;\n    vector<string> lines;\n    while (getline(cin, line)) lines.push_back(line);\n\n    // Parse input lines and print output\n    return 0;\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    // Parse stdin and print output\n    return 0;\n}\n`,
  java: `import java.io.*;\nimport java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) throws Exception {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        List<String> lines = new ArrayList<>();\n        String line;\n        while ((line = br.readLine()) != null) lines.add(line);\n\n        // Parse input lines and print output\n    }\n}\n`,
  go: `package main\n\nimport (\n\t"bufio"\n\t"fmt"\n\t"os"\n)\n\nfunc main() {\n\tscanner := bufio.NewScanner(os.Stdin)\n\tvar lines []string\n\tfor scanner.Scan() {\n\t\tlines = append(lines, scanner.Text())\n\t}\n\n\t_ = lines\n\tfmt.Println()\n}\n`,
  rust: `use std::io::{self, BufRead};\n\nfn main() {\n    let stdin = io::stdin();\n    let lines: Vec<String> = stdin.lock().lines()\n        .map(|l| l.expect("Could not read line"))\n        .collect();\n\n    let _ = lines;\n}\n`,
};

export function DuelRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [duelState, setDuelState] = useState<any>(null);
  const [code, setCode] = useState('// Write your solution here');
  const [language, setLanguage] = useState('javascript');
  const { editorTheme } = useEditorTheme();
  const [testResult, setTestResult] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<Tab>('statement');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const initializedEditorRef = useRef(false);

  const normalizeTimeLimitSeconds = (raw: any): number => {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return 1800;
    // Legacy convention: values like 10/45/60 are minutes.
    return n <= 300 ? n * 60 : n;
  };

  const computeTimeRemaining = (state: any): number => {
    const timeLimitSec = normalizeTimeLimitSeconds(state?.timeLimit);
    const startedAtRaw = state?.startedAt;

    if (!startedAtRaw) return timeLimitSec;

    const startedAtMs = typeof startedAtRaw === 'number'
      ? startedAtRaw
      : new Date(startedAtRaw).getTime();

    if (!Number.isFinite(startedAtMs) || startedAtMs <= 0) return timeLimitSec;

    const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
    return Math.max(0, timeLimitSec - Math.max(0, elapsed));
  };

  // ── Anticheat (same as solo) ─────────────────────────────────────────────
  const { focusLostCount, totalFocusLostTime, isFullScreen } = useAnticheat({
    autoFullscreen: true,
    blockCopyPaste: true,
    onFocusLost: (count) => {
      // Emit suspicious activity to the server so the opponent & admin can see it
      if (socket) {
        socket.emit('anticheat_event', {
          duelId: id,
          type: 'focus_lost',
          count,
        });
      }
    },
  });

  useEffect(() => {
    const existingToken = localStorage.getItem('token');
    if (!existingToken) {
      navigate('/login');
      return;
    }

    const newSocket = io(getSocketNamespaceUrl('/duels'), {
      auth: { token: `Bearer ${existingToken}` },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_duel', { duelId: id });
    });

    newSocket.on('duel_state_update', (state) => {
      setDuelState(state);

      if (!initializedEditorRef.current) {
        const firstAllowedLanguage = state?.challenge?.allowedLanguages?.[0] || 'javascript';
        setLanguage(firstAllowedLanguage);
        setCode(CODE_TEMPLATES[firstAllowedLanguage] || '// Write your solution here');
        initializedEditorRef.current = true;
      }

      if (state.status === 'active') {
        setTimeRemaining(computeTimeRemaining(state));
      } else if (state.status === 'ready' || state.status === 'waiting') {
        setTimeRemaining(normalizeTimeLimitSeconds(state?.timeLimit));
      }
    });

    newSocket.on('duel_started', (data) => {
      toast.success('The duel has started!');
      setActiveTab('statement');
    });

    newSocket.on('test_result', (result) => {
      const firstFailedTest = Array.isArray(result?.results)
        ? result.results.find((t: any) => !t.passed)
        : null;

      setTestResult({
        verdict: result?.verdict || 'N/A',
        testsPassed: result?.testsPassed || result?.passed || 0,
        testsTotal: result?.testsTotal || result?.total || 0,
        timeMs: result?.timeMs || result?.totalTimeMs || 0,
        memMb: result?.memMb || result?.maxMemMb || 0,
        stdout: result?.stdout || result?.results?.[0]?.actualOutput || '',
        stderr: result?.stderr || firstFailedTest?.stderr || '',
        firstFailedTest,
      });
      setIsRunning(false);
      if (result.verdict === 'AC') {
        toast.success('All tests passed! AI analysis in progress...');
      } else {
        toast.error(`Execution finished: ${result.verdict}`);
      }
    });

    newSocket.on('duel_ended', (data) => {
      setIsRunning(false);

      const themes = Object.values(GameTheme);
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];

      // To capture the most recent players' stated during duel_ending, we can check `data` or fallback currently displayed `duelState`
      // For now, since duelState requires latest ref in closure, we could assume standard defaults if not available in data itself.

      const isWinner = data.winnerId === user?.id;

      navigate(`/duel/${id}/result`, {
        state: {
          endGameData: {
            result: isWinner ? GameResult.VICTORY : GameResult.DEFEAT,
            theme: randomTheme,
            player: {
              score: Math.round(data?.scores?.player1 || 0), // Normally we should parse the right player score, but for demo let's assume
              maxScore: 100,
              testsPassed: 10,
              totalTests: 10,
              timeElapsed: 120,
              maxTime: 600,
              accuracy: 100,
              streakBest: 0,
              challengesCompleted: 1,
              totalChallenges: 1,
              rank: 'A',
              xpGained: isWinner ? 50 : 10,
              xpLost: 0,
              level: 5,
              levelProgress: 80,
            },
            opponent: {
              name: 'Adversaire',
              avatar: '',
              score: Math.round(data?.scores?.player2 || 0)
            },
            matchId: id || 'unknown',
            timestamp: Date.now()
          }
        }
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [id, navigate, user?.id]);

  // Timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (duelState?.status === 'active' && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [duelState?.status, timeRemaining]);

  const handleTestCode = () => {
    if (timeRemaining <= 0) {
      toast.error('Time is over for this duel');
      return;
    }

    if (socket) {
      setIsRunning(true);
      setTestResult(null);
      socket.emit('test_code', { duelId: id, code, language });
    }
  };

  const handleReady = () => {
    if (socket) {
      socket.emit('player_ready', { duelId: id });
    }
  };

  if (!duelState) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center text-[var(--text-primary)]">
      <Loader className="w-8 h-8 text-[var(--brand-primary)] animate-spin mb-4" />
      Loading duel...
    </div>
  );

  const isPlayer1 = duelState.player1.id === user?.id;
  const isPlayer2 = duelState?.player2?.id === user?.id;
  const opponent = isPlayer1 ? duelState.player2 : (isPlayer2 ? duelState.player1 : null);
  const me = isPlayer1 ? duelState.player1 : (isPlayer2 ? duelState.player2 : null);
  const allowedLanguages = duelState?.challenge?.allowedLanguages?.length
    ? duelState.challenge.allowedLanguages
    : ['javascript', 'python', 'cpp'];
  const totalHints = duelState?.challenge?.hints?.length || 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">


      {/* Breadcrumb / Top Bar */}
      <div className="border-b border-[var(--border-default)] bg-[var(--surface-1)]">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-caption text-[var(--text-muted)]">
              <span className="text-[var(--text-primary)] font-bold">ByteBattle Duel Arena</span>
            </div>

            <div className="flex items-center gap-3">
              {focusLostCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Focus Loss: {focusLostCount}x ({totalFocusLostTime}s)</span>
                </div>
              )}

              {duelState.status === 'active' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-[var(--surface-2)] border border-[var(--brand-primary)] rounded-full text-[var(--brand-primary)] text-sm font-bold font-mono">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeRemaining)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-h-[calc(100vh-200px)] lg:min-h-[calc(100vh-160px)]">

          {/* Left Panel */}
          <div className="flex flex-col overflow-hidden">
            <div className="mb-4 flex flex-col gap-2">
              <h2 className="text-xl font-bold font-title text-[var(--text-primary)]">{duelState.challenge.title}</h2>
              <DifficultyBadge difficulty={duelState.challenge.difficulty} />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-[var(--border-default)] overflow-x-auto">
              {(['statement', 'status'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    px-4 py-2 text-[0.875rem] font-medium capitalize whitespace-nowrap
                    border-b-2 transition-colors
                    ${activeTab === tab
                      ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }
                  `}
                >
                  {tab === 'statement' ? 'Statement' : 'Duel Status'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">

              {activeTab === 'statement' && (
                <div className="prose prose-invert max-w-none">
                  <div className="mb-6 whitespace-pre-wrap text-[var(--text-primary)]">
                    {duelState.challenge.descriptionMd || "Description hidden / not loaded. Let's duel!"}
                  </div>
                </div>
              )}

              {activeTab === 'status' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface-2)]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-[var(--text-primary)] text-sm uppercase tracking-wider">Duel State</span>
                      <span className={`px-2 py-1 text-xs rounded-full font-bold ${duelState.status === 'active' ? 'bg-[var(--brand-primary)] text-white animate-pulse' : 'bg-[var(--surface-3)] text-[var(--text-secondary)]'}`}>
                        {duelState.status.toUpperCase()}
                      </span>
                    </div>
                    {duelState.status === 'waiting' && <p className="text-sm text-[var(--text-muted)]">Waiting for an opponent...</p>}
                    {duelState.status === 'ready' && <p className="text-sm text-[var(--text-muted)]">The opponent is here. Get ready!</p>}
                    {duelState.status === 'active' && <p className="text-sm text-[var(--brand-primary)]">The duel is active! Time and AI complexity matter.</p>}
                  </div>

                  {/* Players Overview */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-[var(--radius-md)] border-2 ${me?.ready ? 'border-[var(--brand-primary)]' : 'border-[var(--border-default)]'} bg-[var(--surface-1)]`}>
                      <h3 className="font-bold text-sm mb-2 text-center text-[var(--brand-primary)]">You</h3>
                      <div className="text-center font-medium mb-2">{me?.username || '...'}</div>
                      <div className="text-xs space-y-2 text-center">
                        <div className={me?.ready ? 'text-green-500 font-bold' : 'text-yellow-500'}>{me?.ready ? 'READY' : 'NOT READY'}</div>
                        <div className="p-2 bg-[var(--surface-2)] rounded">
                          <div>Tests passed: {me?.testsPassed || 0} / {me?.testsTotal || 0}</div>
                          <div className="font-bold">Score: {me?.score || 0}%</div>
                        </div>
                        {me?.finishedAt && <div className="text-green-400 font-bold text-xs mt-1">✓ Finished! AI in progress...</div>}
                        {me?.complexityScore !== undefined && (
                          <div className="text-purple-400 font-bold text-xs mt-1 animate-pulse">
                            🔥 AI Complexity: Score {me.complexityScore}
                          </div>
                        )}
                      </div>
                      {!me?.ready && duelState.status === 'ready' && (
                        <Button className="w-full mt-3 h-8 text-xs" onClick={handleReady}>I am ready</Button>
                      )}
                    </div>

                    <div className={`p-4 rounded-[var(--radius-md)] border-2 ${opponent?.ready ? 'border-red-500' : 'border-[var(--border-default)]'} bg-[var(--surface-1)]`}>
                      <h3 className="font-bold text-sm mb-2 text-center text-red-500">Opponent</h3>
                      <div className="text-center font-medium mb-2">{opponent?.username || 'Waiting...'}</div>
                      {opponent?.id ? (
                        <div className="text-xs space-y-2 text-center">
                          <div className={opponent.ready ? 'text-green-500 font-bold' : 'text-yellow-500'}>{opponent.ready ? 'READY' : 'NOT READY'}</div>
                          <div className="p-2 bg-[var(--surface-2)] rounded">
                            <div>Tests passed: {opponent.testsPassed || 0} / {opponent.testsTotal || 0}</div>
                            <div className="font-bold text-red-400">Score: {opponent.score || 0}%</div>
                          </div>
                          {opponent?.finishedAt && <div className="text-green-400 font-bold text-xs mt-1">✓ Finished! AI in progress...</div>}
                          {opponent?.complexityScore !== undefined && (
                            <div className="text-purple-400 font-bold text-xs mt-1">
                              🔥 Score IA: {opponent.complexityScore}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-center text-[var(--text-muted)] mt-2">En recherche...</div>
                      )}
                    </div>
                  </div>

                  {testResult && (
                    <div className="p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)]">
                      <h3 className="font-bold text-sm mb-2 text-[var(--text-primary)]">Execution result</h3>
                      <div className="space-y-2 text-sm font-code">
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Verdict:</span>
                          <span className={`font-bold ${testResult.verdict === 'AC' ? 'text-green-500' : 'text-red-500'}`}>{testResult.verdict}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Tests:</span>
                          <span>{testResult.testsPassed} / {testResult.testsTotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Vitesse:</span>
                          <span>{testResult.timeMs}ms</span>
                        </div>
                        {testResult.memMb ? (
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Memory:</span>
                            <span>{Math.round(testResult.memMb)}MB</span>
                          </div>
                        ) : null}
                      </div>

                      {testResult.stdout && (
                        <div className="mt-3">
                          <span className="text-[var(--text-muted)] text-xs mb-1 block">stdout:</span>
                          <pre className="p-2 bg-[var(--surface-2)] rounded font-code text-xs text-[var(--text-primary)] whitespace-pre-wrap">
                            {testResult.stdout}
                          </pre>
                        </div>
                      )}

                      {testResult.stderr && (
                        <div className="mt-3">
                          <span className="text-[var(--text-muted)] text-xs mb-1 block">stderr:</span>
                          <pre className="p-2 bg-[var(--state-error)]/10 border border-[var(--state-error)]/30 rounded font-code text-xs text-[var(--state-error)] whitespace-pre-wrap">
                            {testResult.stderr}
                          </pre>
                        </div>
                      )}

                      {testResult.firstFailedTest && (
                        <div className="mt-3 p-3 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)]">
                          <div className="text-xs font-medium text-[var(--text-primary)] mb-2">
                            First failing test
                          </div>
                          <div className="font-code text-xs space-y-1">
                            <div>
                              <span className="text-[var(--text-muted)]">Input:</span>
                              <span className="ml-2 text-[var(--text-primary)] whitespace-pre-wrap">
                                {testResult.firstFailedTest.input}
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--text-muted)]">Expected:</span>
                              <span className="ml-2 text-[var(--text-primary)] whitespace-pre-wrap">
                                {testResult.firstFailedTest.expectedOutput}
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--text-muted)]">Actual:</span>
                              <span className="ml-2 text-[var(--text-primary)] whitespace-pre-wrap">
                                {testResult.firstFailedTest.actualOutput}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Code Editor */}
          <div className="flex flex-col border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden">
            <div className="p-3 border-b border-[var(--border-default)] flex justify-between bg-[var(--surface-2)]">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--text-muted)] ml-2">Langage:</span>
                <select
                  className="bg-[var(--surface-1)] text-[var(--text-primary)] px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                  value={language}
                  onChange={e => {
                    const newLanguage = e.target.value;
                    setLanguage(newLanguage);
                    setCode(CODE_TEMPLATES[newLanguage] || '// Write your solution here');
                  }}
                  disabled={duelState.status !== 'active'}
                >
                  {allowedLanguages.map((lang: string) => {
                    const def = LANGUAGES.find((item) => item.value === lang);
                    return (
                      <option key={lang} value={lang}>
                        {def?.label || lang}
                      </option>
                    );
                  })}
                </select>
                {totalHints > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (hintsUsed < totalHints) {
                        toast(duelState.challenge.hints[hintsUsed], {
                          icon: '💡',
                          duration: 5000,
                          style: {
                            background: 'var(--surface-2)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-default)',
                          },
                        });
                        setHintsUsed((prev) => prev + 1);
                      } else {
                        toast.error('No more hints available');
                      }
                    }}
                    disabled={hintsUsed >= totalHints || duelState.status !== 'active'}
                  >
                    <Lightbulb className="w-4 h-4" />
                    Hint ({hintsUsed}/{totalHints})
                  </Button>
                )}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleTestCode}
                loading={isRunning}
                disabled={duelState.status !== 'active' || me?.finishedAt || timeRemaining <= 0}>
                <Send className="w-4 h-4" />
                Soumettre
              </Button>
            </div>
            <div className="flex-1 relative">
              {!isFullScreen && (
                <div className="absolute inset-0 z-[60] bg-[var(--surface-1)]/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                  <AlertTriangle className="w-10 h-10 text-yellow-500 mb-3" />
                  <h3 className="text-lg font-bold mb-2 text-[var(--text-primary)]">Full Screen Mode Required</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-5 max-w-md">
                    To keep duel conditions fair, the editor is locked until full screen is enabled.
                  </p>
                  <Button
                    size="md"
                    variant="primary"
                    onClick={() => document.documentElement.requestFullscreen()}
                  >
                    Enable Full Screen
                  </Button>
                </div>
              )}
              {duelState.status !== 'active' && (
                <div className="absolute inset-0 z-50 bg-[var(--surface-1)]/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-[var(--surface-2)] p-6 rounded-lg text-center shadow-lg border border-[var(--border-default)] text-[var(--text-primary)]">
                    <h3 className="font-bold text-lg mb-2">Éditeur Verrouillé</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {duelState.status === 'waiting' ? 'En attente d\'un adversaire...' : 'Le duel n\'a pas encore commencé. Préparez-vous.'}
                    </p>
                  </div>
                </div>
              )}
              <Editor
                height="100%"
                language={language.replace('cpp', 'cpp')}
                theme={editorTheme || "vs-dark"}
                beforeMount={defineMonacoThemes}
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, monospace',
                  scrollBeyondLastLine: false,
                  padding: { top: 16 }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
