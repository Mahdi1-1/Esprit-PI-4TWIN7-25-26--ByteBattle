import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { DifficultyBadge, VerdictBadge } from '../components/Badge';
import { CodeFocusManager } from '../components/CodeFocusManager';
import { Select } from '../components/Input';
import { challengesService } from '../services/challengesService';
import { submissionsService } from '../services/submissionsService';
import { adminService } from '../services/adminService';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import Editor from "@monaco-editor/react";
import { useAnticheat } from '../hooks/useAnticheat';
import {
  Play,
  Send,
  Lightbulb,
  ChevronLeft,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const LANGUAGES = [
  { value: 'python', label: 'Python 3' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
];

type Tab = 'statement' | 'tests' | 'submissions' | 'editorial';

export function Problem() {
  const { id } = useParams();
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<Tab>('statement');
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [aiReview, setAiReview] = useState<any>(null);
  const [loadingAiReview, setLoadingAiReview] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120);

  const [hintsUsed, setHintsUsed] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth();

  // ── Anticheat ────────────────────────────────────────────────────────────
  const { focusLostCount, totalFocusLostTime, isFullScreen } = useAnticheat({
    autoFullscreen: true,
    blockCopyPaste: true,
  });
  const submissionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const data = await challengesService.getById(id as string);
        setProblem(data);

        // Set default code template based on selected language
        if (data.allowedLanguages?.length > 0) {
          const firstLang = data.allowedLanguages[0];
          setLanguage(firstLang);
          if (firstLang === 'python') {
            setCode(`def solution():\n    # Votre code ici\n    pass`);
          } else if (firstLang === 'javascript') {
            setCode(`function solution() {\n  // Votre code ici\n}`);
          } else {
            setCode(`// Votre code ici`);
          }
        } else {
          setCode(`// Votre code ici`);
        }
      } catch (err) {
        toast.error('Erreur lors du chargement du problème');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProblem();
  }, [id]);

  // Socket connection for submission status
  useEffect(() => {
    if (!user) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001';
    const wsUrl = apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    const newSocket = io(`${wsUrl}/submissions`, { 
      transports: ['websocket', 'polling'],
      withCredentials: true 
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('subscribe_user', { userId: user.id });
    });

    newSocket.on('submission_status', (data) => {
      if (data.status === 'executing') {
        toast.loading('Exécution en cours...', { id: 'submission-toast' });
      } else if (data.status === 'completed') {
        setIsRunning(false);
        const result = data.result || {};
        setSubmissionResult({
          id: data.submissionId,
          verdict: result.verdict || 'OK',
          testsPassed: result.passed || 0,
          testsTotal: result.total || 0,
          timeMs: result.totalTimeMs || result.timeMs || 0,
          memMb: result.maxMemMb || result.memMb || 0,
          stdout: result.results?.[0]?.actualOutput || result.stdout || ''
        });
        setShowResults(true);
        toast.success('Exécution terminée !', { id: 'submission-toast' });
      } else if (data.status === 'error') {
        setIsRunning(false);
        toast.error('Erreur: ' + data.error, { id: 'submission-toast' });
      } else if (data.status === 'queued') {
        toast.loading('Dans la file d\'attente...', { id: 'submission-toast' });
      }
    });

    return () => {
      newSocket.close();
    };
  }, [user]);

  // Timer logic
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRunning && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 60000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeRemaining]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader className="w-8 h-8 text-[var(--brand-primary)] animate-spin" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-primary)]">
        Problem not found
      </div>
    );
  }

  const handleRun = async () => {
    if (!problem) return;
    setIsRunning(true);
    setShowResults(false);

    try {
      const result = await submissionsService.runCode({
        challengeId: problem.id,
        language: language,
        code: code
      });

      setSubmissionResult({
        verdict: result.verdict || 'OK',
        testsPassed: result.passed || 0,
        testsTotal: result.total || problem.tests?.length || 0,
        timeMs: result.totalTimeMs || result.timeMs || 0,
        memMb: result.maxMemMb || result.memMb || 0,
        stdout: result.stdout || result.results?.[0]?.actualOutput || ''
      });
      setShowResults(true);
      toast.success('Exécution terminée');
    } catch (err) {
      toast.error("Erreur lors de l'exécution");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem) return;
    setIsRunning(true);
    setShowResults(false);

    try {
      const submission = await submissionsService.submitCode({
        challengeId: problem.id,
        kind: 'CODE',
        language: language,
        code: code,
        context: 'solo'
      });

      submissionIdRef.current = submission?.id;
      setAiReview(null);
      toast.success('Code soumis ! En attente des résultats...');
    } catch (err) {
      toast.error('Erreur lors de la soumission');
      setIsRunning(false);
    }
  };

  const handleGetAiReview = async () => {
    if (!submissionResult?.id) return;
    setLoadingAiReview(true);
    try {
      const review = await submissionsService.getAiReview(submissionResult.id);
      setAiReview(review);
    } catch (err) {
      toast.error("Erreur lors de la récupération de l'analyse IA. Assurez-vous que la clé API Gemini est configurée.");
    } finally {
      setLoadingAiReview(false);
    }
  };

  // Convert allowed languages into react-select format
  const allowedLanguagesOptions = problem.allowedLanguages?.map((l: string) => {
    const found = LANGUAGES.find(def => def.value === l);
    return found || { value: l, label: l };
  }) || LANGUAGES;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar isLoggedIn />

      {/* Breadcrumb */}
      <div className="border-b border-[var(--border-default)] bg-[var(--surface-1)]">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-caption text-[var(--text-muted)]">
              <Link to="/problems" className="hover:text-[var(--brand-primary)] flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" />
                Problems
              </Link>
              <span>/</span>
              <span className="text-[var(--text-primary)]">{problem.title}</span>
            </div>

            {focusLostCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs">
                <AlertTriangle className="w-3 h-3" />
                <span>Perte Focus: {focusLostCount} fois ({totalFocusLostTime}s)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Problem Statement */}
          <div className="flex flex-col overflow-hidden">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="mb-2">{problem.title}</h2>
                <div className="flex items-center gap-2">
                  <DifficultyBadge difficulty={problem.difficulty} />
                  {problem.tags?.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-caption bg-[var(--surface-2)] text-[var(--text-secondary)] rounded-[var(--radius-sm)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-[var(--border-default)]">
              {(['statement', 'tests', 'submissions', 'editorial'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    px-4 py-2 text-[0.875rem] font-medium capitalize
                    border-b-2 transition-colors
                    ${activeTab === tab
                      ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }
                  `}
                >
                  {tab === 'statement' ? 'Énoncé' :
                    tab === 'tests' ? 'Tests' :
                      tab === 'submissions' ? 'Soumissions' :
                        'Éditorial'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
              {activeTab === 'statement' && (
                <div className="prose prose-invert max-w-none">
                  <div className="mb-6 whitespace-pre-wrap text-[var(--text-primary)]">
                    {problem.descriptionMd || problem.statementMd || "Aucune description fournie."}
                  </div>

                  {problem.examples && problem.examples.length > 0 && (
                    <>
                      <h3 className="mb-3">Exemples</h3>
                      {problem.examples.map((example: any, i: number) => (
                        <div key={i} className="mb-4 p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)] font-code text-[0.875rem]">
                          <div className="mb-2">
                            <div className="text-[var(--text-muted)] mb-1">Input:</div>
                            <div className="text-[var(--text-primary)]">{example.input}</div>
                          </div>
                          <div className="mb-2">
                            <div className="text-[var(--text-muted)] mb-1">Output:</div>
                            <div className="text-[var(--text-primary)]">{example.output}</div>
                          </div>
                          {example.explanation && (
                            <div>
                              <div className="text-[var(--text-muted)] mb-1">Explanation:</div>
                              <div className="text-[var(--text-secondary)]">{example.explanation}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  {problem.constraints && Object.keys(problem.constraints).length > 0 && (
                    <>
                      <h3 className="mb-3">Contraintes</h3>
                      <ul className="space-y-1">
                        {Object.entries(problem.constraints).map(([key, value], i) => (
                          <li key={i} className="text-[var(--text-secondary)] font-code text-[0.875rem]">
                            {key}: {String(value)}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'tests' && (
                <div className="space-y-3">
                  {problem.tests && problem.tests.length > 0 ? (
                    problem.tests.map((test: any, i: number) => (
                      <TestCase
                        key={i}
                        number={i + 1}
                        status={test.isHidden ? 'hidden' : 'passed'}
                        input={test.input}
                        expected={test.expectedOutput}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-[var(--text-muted)]">
                      Aucun test public configuré pour ce problème
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'submissions' && (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  Aucune soumission pour le moment
                </div>
              )}

              {activeTab === 'editorial' && (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  L'éditorial sera disponible après votre première soumission acceptée
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Code Editor */}
          <div className="flex flex-col overflow-hidden">
            {/* Editor Toolbar */}
            <div className="mb-4 flex items-center justify-between">
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                options={allowedLanguagesOptions}
              />
              <div className="flex items-center gap-2">
                {problem.hints && problem.hints.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (hintsUsed < problem.hints.length) {
                        toast(problem.hints[hintsUsed], {
                          icon: '💡',
                          duration: 5000,
                          style: {
                            background: 'var(--surface-2)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-default)',
                          }
                        });
                        setHintsUsed(prev => prev + 1);
                      } else {
                        toast.error('Plus de hints disponibles');
                      }
                    }}
                    disabled={hintsUsed >= problem.hints.length}
                  >
                    <Lightbulb className="w-4 h-4" />
                    Hint ({hintsUsed}/{problem.hints.length})
                  </Button>
                )}
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] bg-[var(--surface-2)] px-2 py-1 rounded">
                  <Clock size={14} />
                  <span>{timeRemaining}m restant</span>
                </div>
                <Button variant="secondary" size="sm" onClick={handleRun} loading={isRunning}>
                  <Play className="w-4 h-4" />
                  Run
                </Button>
                <Button variant="primary" size="sm" onClick={handleSubmit} loading={isRunning}>
                  <Send className="w-4 h-4" />
                  Submit
                </Button>
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] relative">
              {!isFullScreen && (
                <div className="absolute inset-0 z-50 bg-[var(--surface-1)]/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Mode Plein Écran Requis</h3>
                  <p className="text-[var(--text-secondary)] mb-6 max-w-md">
                    Pour garantir l'équité du test, l'éditeur est verrouillé. Veuillez activer le mode plein écran pour continuer.
                  </p>
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={() => document.documentElement.requestFullscreen()}
                  >
                    Activer le Mode Plein Écran
                  </Button>
                </div>
              )}

              <div className="bg-[var(--surface-1)] px-4 py-2 border-b border-[var(--border-default)] flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[var(--state-error)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--state-warning)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--state-success)]" />
                </div>
                <span className="text-caption text-[var(--text-muted)] ml-2 font-code">
                  solution.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'cpp' ? 'cpp' : 'java'}
                </span>
              </div>

              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                onMount={(editor) => {
                  editor.updateOptions({ contextmenu: false });
                  editor.onKeyDown((e) => {
                    const { keyCode, ctrlKey, metaKey } = e;
                    if ((ctrlKey || metaKey) && (keyCode === 33 || keyCode === 52)) {
                      e.preventDefault();
                      e.stopPropagation();
                      toast.error('Copier-coller désactivé dans l\'éditeur', { icon: '🚫' });
                    }
                  });
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 },
                }}
              />
            </div>

            {/* Console / Results */}
            {showResults && submissionResult && (
              <div className="mt-4 p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {submissionResult.verdict === 'AC' ? (
                      <CheckCircle2 className="w-5 h-5 text-[var(--state-success)]" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[var(--state-error)]" />
                    )}
                    <span className="font-semibold text-[var(--text-primary)]">
                      Tests Passed: {submissionResult.testsPassed || 0}/{submissionResult.testsTotal || problem.tests?.length || 0}
                    </span>
                  </div>
                  <VerdictBadge verdict={submissionResult.verdict === 'AC' ? 'ACCEPTED' : submissionResult.verdict === 'WA' ? 'WRONG_ANSWER' : submissionResult.verdict || 'PENDING'} />
                </div>

                {submissionResult.stdout && (
                  <div className="mb-4">
                    <span className="text-[var(--text-muted)] text-sm mb-1 block">Output / Console:</span>
                    <pre className="p-3 bg-[var(--surface-2)] rounded font-code text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                      {submissionResult.stdout}
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-caption">
                  <div>
                    <span className="text-[var(--text-muted)]">Runtime:</span>
                    <span className="ml-2 font-code text-[var(--text-primary)]">
                      {submissionResult.timeMs ? `${Math.round(submissionResult.timeMs)}ms` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Memory:</span>
                    <span className="ml-2 font-code text-[var(--text-primary)]">
                      {submissionResult.memMb ? `${Math.round(submissionResult.memMb)}MB` : 'N/A'}
                    </span>
                  </div>
                </div>

                {submissionResult.id && submissionResult.verdict === 'AC' && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                    {!aiReview && (
                      <Button
                        variant="secondary"
                        className="w-full flex items-center justify-center gap-2 text-[var(--brand-primary)] border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/10"
                        onClick={handleGetAiReview}
                        loading={loadingAiReview}
                      >
                        <Sparkles className="w-4 h-4" />
                        Obtenir l'analyse IA du code (Gemini)
                      </Button>
                    )}
                    
                    {aiReview && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 font-bold text-lg">
                          <Sparkles className="text-[var(--brand-primary)]" />
                          <span>Analyse IA (Score: {aiReview.score}/100)</span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {aiReview.summary}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-[var(--state-success)]/10 border border-[var(--state-success)]/20 p-3 rounded-lg">
                            <h4 className="text-sm font-semibold text-[var(--state-success)] mb-2 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Points forts</h4>
                            <ul className="list-disc list-inside text-xs space-y-1 text-[var(--text-secondary)]">
                              {aiReview.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                          <div className="bg-[var(--state-warning)]/10 border border-[var(--state-warning)]/20 p-3 rounded-lg">
                            <h4 className="text-sm font-semibold text-[var(--state-warning)] mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Améliorations</h4>
                            <ul className="list-disc list-inside text-xs space-y-1 text-[var(--text-secondary)]">
                              {aiReview.improvements?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                            </ul>
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
      </div>

      {!isFullScreen && (
        <div className="w-full px-4 sm:px-6 lg:px-10 py-2">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center justify-between text-yellow-500 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Le mode plein écran est recommandé pour ce défi.</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-yellow-500 hover:bg-yellow-500/20"
              onClick={() => document.documentElement.requestFullscreen()}
            >
              Activer plein écran
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TestCase({
  number,
  status,
  input,
  output,
  expected,
  time
}: {
  number?: number;
  status: 'passed' | 'failed' | 'hidden';
  input?: string;
  output?: string;
  expected?: string;
  time?: string;
}) {
  if (status === 'hidden') {
    return (
      <div className="p-4 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)]">
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Info className="w-4 h-4" />
          <span>Test caché #{number || '?'}</span>
        </div>
      </div>
    );
  }

  const icon = status === 'passed'
    ? <CheckCircle2 className="w-5 h-5 text-[var(--state-success)]" />
    : <XCircle className="w-5 h-5 text-[var(--state-error)]" />;

  return (
    <div className={`
      p-4 border rounded-[var(--radius-md)]
      ${status === 'passed'
        ? 'bg-[var(--state-success)]/5 border-[var(--state-success)]/20'
        : 'bg-[var(--state-error)]/5 border-[var(--state-error)]/20'
      }
    `}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-[var(--text-primary)]">
            Test #{number}
          </span>
        </div>
        {time && (
          <div className="flex items-center gap-1 text-caption text-[var(--text-muted)]">
            <Clock className="w-3 h-3" />
            {time}
          </div>
        )}
      </div>
      <div className="font-code text-[0.75rem] space-y-1">
        <div>
          <span className="text-[var(--text-muted)]">Input:</span>
          <span className="ml-2 text-[var(--text-primary)] whitespace-pre-wrap">{input}</span>
        </div>
        {output && (
          <div>
            <span className="text-[var(--text-muted)]">Output:</span>
            <span className="ml-2 text-[var(--text-primary)]">{output}</span>
          </div>
        )}
        {expected && (
          <div>
            <span className="text-[var(--text-muted)]">Expected:</span>
            <span className="ml-2 text-[var(--text-primary)] whitespace-pre-wrap">{expected}</span>
          </div>
        )}
      </div>
    </div>
  );
}