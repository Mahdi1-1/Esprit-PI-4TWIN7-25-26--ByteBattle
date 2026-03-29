import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { CountdownTimer } from '../components/Timer';
import { Loader, Send, Play, Upload, MessageSquare, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { hackathonsService } from '../services/hackathonsService';
import { useHackathonSocket } from '../hooks/useHackathonSocket';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { WorkspaceSkeleton } from '../components/HackathonSkeletons';

export function HackathonWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activePanel, setActivePanel] = useState<'chat' | 'clarifications'>('chat');
  const [cooldownTimer, setCooldownTimer] = useState(0);

  const userId = localStorage.getItem('userId') || '';

  const myTeam = useMemo(() => {
    if (!hackathon?.hackathonTeams) return null;
    return hackathon.hackathonTeams.find((t: any) =>
      t.members.some((m: any) => m.userId === userId),
    );
  }, [hackathon, userId]);

  const socket = useHackathonSocket({
    hackathonId: id || '',
    teamId: myTeam?.id,
  });

  // Load hackathon data
  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const data = await hackathonsService.getById(id);
        setHackathon(data);
        if (data.challengeIds?.length > 0) setSelectedProblem(data.challengeIds[0]);
        if (!['active', 'frozen'].includes(data.status)) {
          if (['lobby', 'checkin'].includes(data.status)) navigate(`/hackathon/${id}/lobby`);
          else if (data.status === 'ended') navigate(`/hackathon/${id}/results`);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  // Load submissions when problem changes
  useEffect(() => {
    if (!id || !myTeam?.id || !selectedProblem) return;
    hackathonsService.getTeamSubmissions(id, myTeam.id, selectedProblem).then(setSubmissions).catch(console.error);
  }, [id, myTeam?.id, selectedProblem]);

  // Load chat messages
  useEffect(() => {
    if (!id || !myTeam?.id) return;
    hackathonsService.getTeamMessages(id, myTeam.id).then(setChatMessages).catch(console.error);
  }, [id, myTeam?.id]);

  // Real-time events
  useEffect(() => {
    const cleanups = [
      socket.onSubmissionVerdict((data: any) => {
        setSubmissions((prev) => prev.map((s) => (s.id === data.id ? data : s)));
      }),
      socket.onTeamMessage((data: any) => {
        setChatMessages((prev) => [...prev, data]);
      }),
      socket.onStatusChange((data: any) => {
        if (data.newStatus === 'ended') navigate(`/hackathon/${id}/results`);
        setHackathon((prev: any) => prev ? { ...prev, status: data.newStatus } : prev);
      }),
    ];
    return () => cleanups.forEach((fn) => fn?.());
  }, [socket, navigate, id]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownTimer <= 0) return;
    const interval = setInterval(() => setCooldownTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [cooldownTimer]);

  const handleSubmit = async () => {
    if (!id || !myTeam || !selectedProblem || cooldownTimer > 0) return;
    setSubmitting(true);
    try {
      const result = await hackathonsService.submitCode(id, myTeam.id, {
        challengeId: selectedProblem,
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
    if (!id || !selectedProblem) return;
    setRunning(true);
    try {
      const result = await hackathonsService.runCode(id, {
        challengeId: selectedProblem,
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

  const handleSendMessage = async () => {
    if (!id || !myTeam || !chatInput.trim()) return;
    try {
      await hackathonsService.sendTeamMessage(id, myTeam.id, { content: chatInput.trim() });
      setChatInput('');
    } catch (err) {
      console.error(err);
    }
  };

  // T140: Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'Enter',
      ctrl: true,
      description: 'Submit code',
      handler: () => handleSubmit(),
      enabled: !submitting && cooldownTimer <= 0,
    },
    {
      key: 'r',
      ctrl: true,
      description: 'Run code',
      handler: () => handleRun(),
      enabled: !running,
    },
    {
      key: '/',
      ctrl: true,
      description: 'Toggle chat panel',
      handler: () => setActivePanel((p) => (p === 'chat' ? 'clarifications' : 'chat')),
    },
    {
      key: '.',
      ctrl: true,
      description: 'Toggle clarifications panel',
      handler: () => setActivePanel('clarifications'),
    },
  ]);

  if (loading) return <WorkspaceSkeleton />;

  const problemLabels = hackathon?.challengeIds?.map((_: string, i: number) => String.fromCharCode(65 + i)) || [];

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* Top bar */}
      <div className="h-12 flex items-center justify-between px-4 bg-[var(--surface-1)] border-b border-[var(--border-default)]">
        <div className="flex items-center gap-4">
          <span className="font-bold text-[var(--text-primary)]">{hackathon?.title}</span>
          <Badge variant={hackathon?.status}>{hackathon?.status}</Badge>
          {myTeam && <span className="text-caption text-[var(--text-muted)]">Team: {myTeam.name}</span>}
        </div>
        <div className="flex items-center gap-4">
          <CountdownTimer targetDate={hackathon?.endTime} />
        </div>
      </div>

      {/* Main layout: 3 panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem sidebar */}
        <div className="w-56 border-r border-[var(--border-default)] bg-[var(--surface-1)] overflow-y-auto">
          <div className="p-3">
            <h4 className="text-caption text-[var(--text-muted)] mb-2">Problems</h4>
            {hackathon?.challengeIds?.map((cId: string, i: number) => {
              const solved = submissions.some((s) => s.challengeId === cId && s.verdict === 'AC');
              const attempted = submissions.some((s) => s.challengeId === cId);
              return (
                <button
                  key={cId}
                  onClick={() => setSelectedProblem(cId)}
                  className={`w-full text-left p-2 rounded mb-1 flex items-center gap-2 ${
                    selectedProblem === cId ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]' : 'hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                    ${solved ? 'bg-green-500/20 text-green-500' : attempted ? 'bg-red-500/20 text-red-500' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}">
                    {problemLabels[i]}
                  </span>
                  <span className="text-sm truncate">Problem {problemLabels[i]}</span>
                  {solved && <span className="ml-auto text-green-500">✓</span>}
                  {attempted && !solved && <span className="ml-auto text-red-500">✗</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Editor + bottom panel */}
        <div className="flex-1 flex flex-col">
          {/* Language + actions bar */}
          <div className="h-10 flex items-center justify-between px-3 bg-[var(--surface-2)] border-b border-[var(--border-default)]">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-sm text-[var(--text-primary)] border border-[var(--border-default)] rounded px-2 py-1"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleRun} disabled={running}>
                <Play className="w-3 h-3" /> {running ? 'Running...' : 'Run'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={submitting || cooldownTimer > 0}
              >
                <Upload className="w-3 h-3" />
                {cooldownTimer > 0 ? `Wait ${cooldownTimer}s` : submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>

          {/* Code editor area (placeholder — Monaco will replace this) */}
          <div className="flex-1 overflow-hidden">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full p-4 bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono text-sm resize-none outline-none"
              placeholder="Write your code here..."
            />
          </div>

          {/* Bottom: Run results + Submissions */}
          <div className="h-48 border-t border-[var(--border-default)] bg-[var(--surface-1)] overflow-y-auto">
            {runResult && (
              <div className="p-3">
                <h4 className="text-caption mb-2">Run Results</h4>
                <div className="text-sm space-y-1">
                  <span className="text-[var(--text-muted)]">
                    {runResult.passed}/{runResult.total} tests passed — {runResult.verdict}
                  </span>
                </div>
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
                      {s.isFirstBlood && <span className="text-yellow-500">🩸 First Blood</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Chat + Clarifications */}
        <div className="w-72 border-l border-[var(--border-default)] bg-[var(--surface-1)] flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-[var(--border-default)]">
            <button
              onClick={() => setActivePanel('chat')}
              className={`flex-1 py-2 text-sm flex items-center justify-center gap-1 ${
                activePanel === 'chat' ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <MessageSquare className="w-3 h-3" /> Chat
            </button>
            <button
              onClick={() => setActivePanel('clarifications')}
              className={`flex-1 py-2 text-sm flex items-center justify-center gap-1 ${
                activePanel === 'clarifications' ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <HelpCircle className="w-3 h-3" /> Q&A
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-3">
            {activePanel === 'chat' && (
              <div className="space-y-2">
                {chatMessages.map((msg: any) => (
                  <div key={msg.id} className="text-sm">
                    <span className="font-medium text-[var(--brand-primary)]">{msg.userId}: </span>
                    <span className="text-[var(--text-primary)]">{msg.content}</span>
                    {msg.codeSnippet && (
                      <pre className="mt-1 p-2 bg-[var(--surface-2)] rounded text-xs overflow-x-auto">
                        {msg.codeSnippet}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
            {activePanel === 'clarifications' && (
              <div className="text-sm text-[var(--text-muted)]">
                <p>Submit a question to the judges via the clarification system.</p>
              </div>
            )}
          </div>

          {/* Chat input */}
          {activePanel === 'chat' && (
            <div className="p-2 border-t border-[var(--border-default)] flex gap-2">
              <input
                type="text"
                className="flex-1 px-2 py-1 bg-[var(--surface-2)] border border-[var(--border-default)] rounded text-sm text-[var(--text-primary)]"
                placeholder="Message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={handleSendMessage} className="text-[var(--brand-primary)]">
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
