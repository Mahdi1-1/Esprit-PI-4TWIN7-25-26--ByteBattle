// TODO(i18n): All user-facing strings in this file are hardcoded in English.
// Constitution VII requires useTranslation() + react-i18next with FR/EN keys.
// Tracked: https://github.com/mahdimasmoudi1/ByteBattle/issues — spec-010 debt
//
// TODO(WS_NAMING): WebSocket event names use snake_case ('team_message', 'anticheat_event').
// Constitution VI requires kebab-case ('team-message', 'anticheat-event').
// This is a breaking change — requires coordinated frontend + backend update.
// Tracked as spec-010 technical debt.

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { CountdownTimer } from '../components/Timer';
import {
  Loader, Send, Play, Upload, MessageSquare, HelpCircle,
  Lock, CheckCircle, Clock, AlertTriangle, Shield, Timer,
} from 'lucide-react';
import { hackathonsService } from '../services/hackathonsService';
import { useHackathonSocket } from '../hooks/useHackathonSocket';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { WorkspaceSkeleton } from '../components/HackathonSkeletons';

// ─── Anti-cheat warning overlay ────────────────────────────
function AntiCheatWarning({ violations, onDismiss }: { violations: number; onDismiss: () => void }) {
  if (violations === 0) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center">
      <div className="bg-[var(--surface-1)] border-2 border-red-500 rounded-xl p-8 max-w-md text-center space-y-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
        <h2 className="text-2xl font-bold text-red-500">⚠️ Anti-Cheat Warning</h2>
        <p className="text-[var(--text-primary)]">
          Tab switching or leaving the workspace is detected and logged.
        </p>
        <p className="text-[var(--text-muted)] text-sm">
          Violation count: <span className="text-red-500 font-bold">{violations}</span>
        </p>
        <p className="text-[var(--text-muted)] text-xs">
          Multiple violations may result in disqualification.
        </p>
        <Button variant="primary" onClick={onDismiss}>
          I Understand — Return to Workspace
        </Button>
      </div>
    </div>
  );
}

// ─── Problem timer component ───────────────────────────────
function ProblemTimer({ startedAt, timeLimitMinutes }: { startedAt: number; timeLimitMinutes: number }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const total = timeLimitMinutes * 60;
      setRemaining(Math.max(0, total - elapsed));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt, timeLimitMinutes]);

  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  const isLow = remaining < 120;
  const isExpired = remaining <= 0;

  return (
    <div className={`flex items-center gap-1.5 text-sm font-mono px-2 py-1 rounded ${
      isExpired ? 'bg-red-500/20 text-red-500' : isLow ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
    }`}>
      <Timer className="w-3.5 h-3.5" />
      {isExpired ? 'TIME UP' : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
    </div>
  );
}

export function HackathonWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ─── Core state ──────────────────────────────────────────
  const [hackathon, setHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<any[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [cooldownTimer, setCooldownTimer] = useState(0);

  // ─── Chat state ──────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activePanel, setActivePanel] = useState<'chat' | 'clarifications'>('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [usernames] = useState<Record<string, string>>({});

  // ─── Anti-cheat state ────────────────────────────────────
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const violationsRef = useRef(0);
  const lastViolationTimeRef = useRef(0); // Q2: debounce for blur/tab_switch

  // ─── Problem timer state ─────────────────────────────────
  // Q5: Removed client-local problemStartTimes — now uses backend-provided startedAt per problem

  const userId = localStorage.getItem('userId') || '';

  const myTeam = useMemo(() => {
    if (!hackathon?.hackathonTeams) return null;
    const team = hackathon.hackathonTeams.find((t: any) =>
      t.members.some((m: any) => m.userId === userId),
    );
    // Q3: Sync persisted violation count from server on load
    if (team?.anticheatViolations != null && violationsRef.current === 0 && team.anticheatViolations > 0) {
      violationsRef.current = team.anticheatViolations;
      setViolations(team.anticheatViolations);
    }
    return team;
  }, [hackathon, userId]);

  const socket = useHackathonSocket({
    hackathonId: id || '',
    teamId: myTeam?.id,
  });

  const currentProblem = problems[currentProblemIndex] || null;

  // ─── Load hackathon data ─────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const data = await hackathonsService.getById(id);
        setHackathon(data);
        if (!['active', 'frozen'].includes(data.status)) {
          if (['lobby', 'checkin'].includes(data.status)) navigate('/teams');
          else if (data.status === 'ended') navigate(`/hackathon/${id}/results`);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // ─── Load challenges (sequential unlock) ─────────────────
  const loadChallenges = useCallback(async () => {
    if (!id || !myTeam?.id) return;
    try {
      const data = await hackathonsService.getHackathonChallenges(id, myTeam.id);
      setProblems(data);
    } catch (err) {
      console.error('Failed to load challenges:', err);
    }
  }, [id, myTeam?.id]);

  useEffect(() => { loadChallenges(); }, [loadChallenges]);

  // ─── Load submissions when problem changes ───────────────
  useEffect(() => {
    if (!id || !myTeam?.id || !currentProblem?.id) return;
    hackathonsService.getTeamSubmissions(id, myTeam.id, currentProblem.id)
      .then(setSubmissions)
      .catch(console.error);
  }, [id, myTeam?.id, currentProblem?.id]);

  // ─── Load chat messages ──────────────────────────────────
  // Backend returns messages orderBy: { sentAt: 'desc' } (newest first).
  // Reverse unconditionally so oldest message appears at top of chat.
  useEffect(() => {
    if (!id || !myTeam?.id) return;
    hackathonsService.getTeamMessages(id, myTeam.id).then((msgs: any[]) => {
      setChatMessages(Array.isArray(msgs) ? [...msgs].reverse() : []);
    }).catch(console.error);
  }, [id, myTeam?.id]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ─── Real-time events ────────────────────────────────────
  useEffect(() => {
    const cleanups = [
      socket.onSubmissionVerdict((data: any) => {
        setSubmissions((prev) => prev.map((s) => (s.id === data.id ? data : s)));
        // If accepted, reload challenges to unlock next problem
        if (data.verdict === 'AC') {
          setTimeout(() => loadChallenges(), 500);
        }
      }),
      socket.onTeamMessage((data: any) => {
        setChatMessages((prev) => [...prev, data]);
      }),
      socket.onStatusChange((data: any) => {
        if (data.newStatus === 'ended') navigate(`/hackathon/${id}/results`);
        setHackathon((prev: any) => prev ? { ...prev, status: data.newStatus } : prev);
      }),
    ];

    // Q3: Listen for server-confirmed violation count
    const handleViolationCount = (data: { totalViolations: number }) => {
      if (data.totalViolations != null) {
        violationsRef.current = data.totalViolations;
        setViolations(data.totalViolations);
      }
    };
    socket.socket?.on('anticheat:violation_count', handleViolationCount);

    return () => {
      cleanups.forEach((fn) => fn?.());
      socket.socket?.off('anticheat:violation_count', handleViolationCount);
    };
  }, [socket, navigate, id, loadChallenges]);

  // ═══════════════════════════════════════════════════════
  // ANTI-CHEAT SYSTEM
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (!id || !myTeam?.id) return;

    const reportViolation = (eventType: string, details?: any) => {
      // Q2: Debounce blur + tab_switch to avoid double-firing (500ms)
      if (eventType === 'blur' || eventType === 'tab_switch') {
        const now = Date.now();
        if (now - lastViolationTimeRef.current < 500) return;
        lastViolationTimeRef.current = now;
      }

      violationsRef.current += 1;
      setViolations(violationsRef.current);
      setShowWarning(true);
      // Report to backend via WebSocket
      if (socket.socket) {
        socket.socket.emit('anticheat_event', {
          hackathonId: id,
          teamId: myTeam!.id,
          eventType,
          details,
        });
      }
    };

    // 1. Tab visibility change (user switches tabs)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation('tab_switch', { timestamp: Date.now() });
      }
    };

    // 2. Window blur (alt-tab, click outside browser)
    const handleBlur = () => {
      reportViolation('blur', { timestamp: Date.now() });
    };

    // 3. Block copy in code area (allow in chat)
    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest('.chat-panel')) return;
      e.preventDefault();
      reportViolation('copy_attempt');
    };

    // 4. Block paste in code area (allow in chat)
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest('.chat-panel')) return;
      e.preventDefault();
      reportViolation('paste_attempt');
    };

    // 5. Block right-click in code area
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest('.chat-panel')) return;
      e.preventDefault();
    };

    // 6. Block dev tools shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        reportViolation('devtools_attempt');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [id, myTeam?.id, socket]);

  // ─── Cooldown timer ──────────────────────────────────────
  useEffect(() => {
    if (cooldownTimer <= 0) return;
    const interval = setInterval(() => setCooldownTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [cooldownTimer]);

  // ═══════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════

  const handleSubmit = async () => {
    // Q7: Block submission to solved problems
    if (!id || !myTeam || !currentProblem || currentProblem.locked || currentProblem.solved || cooldownTimer > 0) return;
    setSubmitting(true);
    try {
      const result = await hackathonsService.submitCode(id, myTeam.id, {
        challengeId: currentProblem.id,
        code,
        language,
      });
      setSubmissions((prev) => [result, ...prev]);
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('Rate limited')) {
        const match = err.response.data.message.match(/(\d+) seconds/);
        setCooldownTimer(match ? parseInt(match[1]) : 60);
      }
      alert(err.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRun = async () => {
    // Q7: No running on solved problems either
    if (!id || !currentProblem || currentProblem.locked || currentProblem.solved) return;
    setRunning(true);
    try {
      const result = await hackathonsService.runCode(id, {
        challengeId: currentProblem.id,
        code,
        language,
      });
      setRunResult(result);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Run failed');
    } finally {
      setRunning(false);
    }
  };

  // ─── Chat: send via WebSocket for real-time ──────────────
  const handleSendMessage = () => {
    if (!id || !myTeam || !chatInput.trim()) return;
    socket.sendTeamMessage({
      hackathonId: id,
      teamId: myTeam.id,
      content: chatInput.trim(),
    });
    setChatInput('');
  };

  const handleProblemSelect = (index: number) => {
    const problem = problems[index];
    if (!problem || problem.locked) return;
    setCurrentProblemIndex(index);
    setRunResult(null);
    setCode('');
    // Q5: Timer is managed server-side — no client-local start time needed
  };

  // ─── Keyboard shortcuts ──────────────────────────────────
  useKeyboardShortcuts([
    { key: 'Enter', ctrl: true, description: 'Submit code', handler: () => handleSubmit(), enabled: !submitting && cooldownTimer <= 0 },
    { key: 'r', ctrl: true, description: 'Run code', handler: () => handleRun(), enabled: !running },
    { key: '/', ctrl: true, description: 'Toggle chat', handler: () => setActivePanel((p) => (p === 'chat' ? 'clarifications' : 'chat')) },
  ]);

  if (loading) return <WorkspaceSkeleton />;

  return (
    <>
      {/* Anti-cheat warning overlay */}
      {showWarning && <AntiCheatWarning violations={violations} onDismiss={() => setShowWarning(false)} />}

      <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
        {/* ─── Top bar ──────────────────────────────────────── */}
        <div className="h-12 flex items-center justify-between px-4 bg-[var(--surface-1)] border-b border-[var(--border-default)]">
          <div className="flex items-center gap-4">
            <span className="font-bold text-[var(--text-primary)]">{hackathon?.title}</span>
            <Badge variant={hackathon?.status}>{hackathon?.status?.toUpperCase()}</Badge>
            {myTeam && <span className="text-caption text-[var(--text-muted)]">Team: {myTeam.name}</span>}
          </div>
          <div className="flex items-center gap-4">
            {/* Anti-cheat indicator */}
            <div className="flex items-center gap-1.5 text-xs">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-500">Anti-Cheat</span>
              {violations > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded text-xs font-bold">
                  {violations} ⚠
                </span>
              )}
            </div>
            {/* Problem timer */}
            {/* Problem timer — Q5: uses backend-provided team-wide startedAt */}
            {currentProblem && !currentProblem.locked && !currentProblem.solved && currentProblem.startedAt && (
              <ProblemTimer
                startedAt={new Date(currentProblem.startedAt).getTime()}
                timeLimitMinutes={currentProblem.timeLimitMinutes}
              />
            )}
            <CountdownTimer targetDate={hackathon?.endTime} />
          </div>
        </div>

        {/* ─── Main layout: 3 panels ───────────────────────── */}
        <div className="flex-1 flex overflow-hidden">

          {/* ═══ LEFT: Problem sidebar ═══ */}
          <div className="w-56 border-r border-[var(--border-default)] bg-[var(--surface-1)] overflow-y-auto flex flex-col">
            <div className="p-3">
              <h4 className="text-caption text-[var(--text-muted)] mb-2 flex items-center gap-1">
                <span>Problems</span>
                <span className="text-xs ml-auto">
                  {problems.filter((p) => p.solved).length}/{problems.length}
                </span>
              </h4>

              {problems.map((problem, i) => (
                <button
                  key={problem.id}
                  onClick={() => handleProblemSelect(i)}
                  disabled={problem.locked}
                  className={`w-full text-left p-2.5 rounded-lg mb-1.5 flex items-center gap-2 transition-all ${
                    problem.locked
                      ? 'opacity-40 cursor-not-allowed bg-[var(--surface-2)]'
                      : currentProblemIndex === i
                        ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]/30'
                        : 'hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                    problem.solved
                      ? 'bg-green-500/20 text-green-500'
                      : problem.locked
                        ? 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                        : 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                  }`}>
                    {problem.solved ? <CheckCircle className="w-4 h-4" /> : problem.locked ? <Lock className="w-3.5 h-3.5" /> : problem.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block">
                      {problem.locked ? `Problem ${problem.label}` : problem.title}
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        problem.difficulty === 'easy' ? 'bg-green-500/10 text-green-500' :
                        problem.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {problem.difficulty}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {problem.timeLimitMinutes}min
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-auto p-3 border-t border-[var(--border-default)]">
              <div className="text-xs text-[var(--text-muted)] mb-1">Progress</div>
              <div className="w-full h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${problems.length > 0 ? (problems.filter((p) => p.solved).length / problems.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* ═══ CENTER: Problem statement + Editor ═══ */}
          <div className="flex-1 flex flex-col">
            {currentProblem && !currentProblem.locked ? (
              <>
                {/* Problem Statement */}
                <div className="h-[45%] overflow-y-auto border-b border-[var(--border-default)] bg-[var(--bg-primary)]">
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-lg font-bold text-[var(--text-primary)]">
                        {currentProblem.label}. {currentProblem.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        currentProblem.difficulty === 'easy' ? 'bg-green-500/10 text-green-500' :
                        currentProblem.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {currentProblem.difficulty}
                      </span>
                      {currentProblem.solved && (
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Solved
                        </span>
                      )}
                      <span className="ml-auto text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {currentProblem.timeLimitMinutes} min
                      </span>
                    </div>

                    {/* Tags */}
                    {currentProblem.tags?.length > 0 && (
                      <div className="flex gap-1.5 mb-4 flex-wrap">
                        {currentProblem.tags.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 bg-[var(--surface-2)] text-[var(--text-muted)] rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Description (rendered as Markdown-like content) */}
                    <div className="prose prose-sm prose-invert max-w-none text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                      {currentProblem.descriptionMd || 'No description provided.'}
                    </div>

                    {/* Constraints */}
                    {currentProblem.constraints && Object.keys(currentProblem.constraints).length > 0 && (
                      <div className="mt-4 p-3 bg-[var(--surface-2)] rounded-lg">
                        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Constraints</h4>
                        <pre className="text-xs text-[var(--text-muted)] whitespace-pre-wrap">
                          {typeof currentProblem.constraints === 'string'
                            ? currentProblem.constraints
                            : JSON.stringify(currentProblem.constraints, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Examples */}
                    {currentProblem.examples?.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <h4 className="text-sm font-semibold text-[var(--text-primary)]">Examples</h4>
                        {currentProblem.examples.map((ex: any, i: number) => (
                          <div key={i} className="bg-[var(--surface-2)] rounded-lg overflow-hidden">
                            <div className="grid grid-cols-2 gap-0">
                              <div className="p-3 border-r border-[var(--border-default)]">
                                <div className="text-xs text-[var(--text-muted)] mb-1 font-semibold">Input</div>
                                <pre className="text-sm text-[var(--text-primary)] font-mono">{ex.input}</pre>
                              </div>
                              <div className="p-3">
                                <div className="text-xs text-[var(--text-muted)] mb-1 font-semibold">Output</div>
                                <pre className="text-sm text-[var(--text-primary)] font-mono">{ex.expectedOutput || ex.output}</pre>
                              </div>
                            </div>
                            {ex.explanation && (
                              <div className="px-3 py-2 border-t border-[var(--border-default)]">
                                <div className="text-xs text-[var(--text-muted)]">
                                  <span className="font-semibold">Explanation:</span> {ex.explanation}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Visible test cases */}
                    {currentProblem.tests?.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <h4 className="text-sm font-semibold text-[var(--text-primary)]">Sample Test Cases</h4>
                        {currentProblem.tests.map((test: any, i: number) => (
                          <div key={i} className="bg-[var(--surface-2)] rounded-lg overflow-hidden">
                            <div className="grid grid-cols-2 gap-0">
                              <div className="p-3 border-r border-[var(--border-default)]">
                                <div className="text-xs text-[var(--text-muted)] mb-1 font-semibold">Input</div>
                                <pre className="text-sm text-[var(--text-primary)] font-mono">{test.input}</pre>
                              </div>
                              <div className="p-3">
                                <div className="text-xs text-[var(--text-muted)] mb-1 font-semibold">Expected Output</div>
                                <pre className="text-sm text-[var(--text-primary)] font-mono">{test.expectedOutput}</pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Hints (collapsible) */}
                    {currentProblem.hints?.length > 0 && (
                      <details className="mt-4">
                        <summary className="text-sm font-semibold text-[var(--brand-primary)] cursor-pointer hover:underline">
                          💡 Hints ({currentProblem.hints.length})
                        </summary>
                        <div className="mt-2 space-y-2">
                          {currentProblem.hints.map((hint: string, i: number) => (
                            <div key={i} className="p-2 bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/20 rounded text-sm text-[var(--text-primary)]">
                              {hint}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>

                {/* Language + actions bar */}
                <div className="h-10 flex items-center justify-between px-3 bg-[var(--surface-2)] border-b border-[var(--border-default)]">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-transparent text-sm text-[var(--text-primary)] border border-[var(--border-default)] rounded px-2 py-1"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="typescript">TypeScript</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                    <option value="java">Java</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={handleRun} disabled={running || currentProblem.solved}>
                      <Play className="w-3 h-3" /> {running ? 'Running...' : 'Run'}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSubmit}
                      disabled={submitting || cooldownTimer > 0 || currentProblem.solved}
                    >
                      <Upload className="w-3 h-3" />
                      {cooldownTimer > 0 ? `Wait ${cooldownTimer}s` : submitting ? 'Submitting...' : 'Submit'}
                    </Button>
                  </div>
                </div>

                {/* Code editor — Q7: read-only for solved problems */}
                <div className="flex-1 overflow-hidden">
                  {currentProblem.solved && (
                    <div className="px-4 py-2 bg-green-500/10 text-green-500 text-sm flex items-center gap-2 border-b border-[var(--border-default)]">
                      <CheckCircle className="w-4 h-4" /> This problem is solved. Code is read-only.
                    </div>
                  )}
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    readOnly={currentProblem.solved}
                    className={`w-full h-full p-4 bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono text-sm resize-none outline-none ${
                      currentProblem.solved ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    placeholder={currentProblem.solved ? 'Problem already solved — read only' : 'Write your solution here...'}
                    spellCheck={false}
                  />
                </div>

                {/* Bottom: Run results + Submissions */}
                <div className="h-44 border-t border-[var(--border-default)] bg-[var(--surface-1)] overflow-y-auto">
                  {runResult && (
                    <div className="p-3 border-b border-[var(--border-default)]">
                      <h4 className="text-caption mb-2 flex items-center gap-2">
                        Run Results
                        <Badge variant={runResult.verdict === 'AC' ? 'ACCEPTED' : 'default'}>
                          {runResult.verdict}
                        </Badge>
                      </h4>
                      <span className="text-sm text-[var(--text-muted)]">
                        {runResult.passed}/{runResult.total} tests passed
                      </span>
                    </div>
                  )}
                  <div className="p-3">
                    <h4 className="text-caption mb-2">Submissions</h4>
                    {submissions.length === 0 ? (
                      <p className="text-caption text-[var(--text-muted)]">No submissions yet</p>
                    ) : (
                      <div className="space-y-1">
                        {submissions.slice(0, 10).map((s: any) => (
                          <div key={s.id} className="flex items-center gap-3 text-sm">
                            <span className="text-[var(--text-muted)]">#{s.attemptNumber}</span>
                            <Badge variant={s.verdict === 'AC' ? 'ACCEPTED' : 'default'}>
                              {s.verdict}
                            </Badge>
                            <span className="text-[var(--text-muted)]">{s.language}</span>
                            {s.testsPassed != null && s.testsTotal != null && (
                              <span className="text-[var(--text-muted)] text-xs">
                                {s.testsPassed}/{s.testsTotal}
                              </span>
                            )}
                            {s.isFirstBlood && <span className="text-yellow-500">🩸 First Blood</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : currentProblem?.locked ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Lock className="w-16 h-16 text-[var(--text-muted)] mx-auto opacity-30" />
                  <h3 className="text-xl font-bold text-[var(--text-muted)]">Problem {currentProblem.label} — Locked</h3>
                  <p className="text-[var(--text-muted)]">
                    Solve the previous problem first to unlock this one.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Loader className="w-8 h-8 text-[var(--text-muted)] mx-auto animate-spin" />
                  <p className="text-[var(--text-muted)]">Loading problems...</p>
                </div>
              </div>
            )}
          </div>

          {/* ═══ RIGHT: Team Chat + Clarifications ═══ */}
          <div className="chat-panel w-72 border-l border-[var(--border-default)] bg-[var(--surface-1)] flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-[var(--border-default)]">
              <button
                onClick={() => setActivePanel('chat')}
                className={`flex-1 py-2.5 text-sm flex items-center justify-center gap-1.5 transition-colors ${
                  activePanel === 'chat'
                    ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Team Chat
              </button>
              <button
                onClick={() => setActivePanel('clarifications')}
                className={`flex-1 py-2.5 text-sm flex items-center justify-center gap-1.5 transition-colors ${
                  activePanel === 'clarifications'
                    ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" /> Q&A
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto p-3">
              {activePanel === 'chat' && (
                <div className="space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-30" />
                      <p className="text-sm text-[var(--text-muted)]">No messages yet.</p>
                      <p className="text-xs text-[var(--text-muted)]">Start chatting with your team!</p>
                    </div>
                  ) : (
                    chatMessages.map((msg: any, idx: number) => {
                      const isMe = msg.userId === userId;
                      const senderName = isMe ? 'You' : (msg.username || usernames[msg.userId] || 'Teammate');
                      return (
                        <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <span className={`text-[10px] mb-0.5 ${isMe ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'}`}>
                            {senderName}
                          </span>
                          <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                            isMe
                              ? 'bg-[var(--brand-primary)] text-white rounded-br-sm'
                              : 'bg-[var(--surface-2)] text-[var(--text-primary)] rounded-bl-sm'
                          }`}>
                            {msg.content}
                          </div>
                          {msg.codeSnippet && (
                            <pre className="mt-1 p-2 bg-[var(--surface-2)] rounded text-xs overflow-x-auto max-w-[85%] text-[var(--text-primary)]">
                              {msg.codeSnippet}
                            </pre>
                          )}
                          <span className="text-[9px] text-[var(--text-muted)] mt-0.5">
                            {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}

              {activePanel === 'clarifications' && (
                <div className="text-center py-8">
                  <HelpCircle className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-[var(--text-muted)]">Submit a question to the judges.</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Answers may be broadcast to all teams.</p>
                </div>
              )}
            </div>

            {/* Chat input */}
            {activePanel === 'chat' && (
              <div className="p-2 border-t border-[var(--border-default)] flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                  className="p-2 rounded-lg bg-[var(--brand-primary)] text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
