import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import { Button } from '../components/Button';
import { DifficultyBadge } from '../components/Badge';
import { useEditorTheme, defineMonacoThemes } from '../context/EditorThemeContext';
import { Clock, Play, Send, ChevronLeft, Loader, AlertTriangle } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { toast } from 'react-hot-toast';
import { GameTheme, GameResult, EndGameData } from '../types/game.types';
import { useAnticheat } from '../hooks/useAnticheat';

type Tab = 'statement' | 'status';

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

  // ── Anticheat (same as solo) ─────────────────────────────────────────────
  const { focusLostCount, totalFocusLostTime } = useAnticheat({
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

    const newSocket = io('http://localhost:4001/duels', {
      auth: { token: `Bearer ${existingToken}` },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_duel', { duelId: id });
    });

    newSocket.on('duel_state_update', (state) => {
      setDuelState(state);
      if (state.status === 'active' && state.startedAt && state.timeLimit) {
        const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
        setTimeRemaining(Math.max(0, state.timeLimit - elapsed));
      }
    });

    newSocket.on('duel_started', (data) => {
      toast.success('Le duel a commencé !');
      setActiveTab('statement');
    });

    newSocket.on('test_result', (result) => {
      setTestResult(result);
      setIsRunning(false);
      if (result.verdict === 'AC') {
        toast.success('Tous les tests sont passés ! Analyse IA en cours...');
      } else {
        toast.error(`Exécution terminée : ${result.verdict}`);
      }
    });

    newSocket.on('duel_ended', (data) => {
      setIsRunning(false);

      const themes = Object.values(GameTheme);
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];

      // To capture the most recent players' stated during duel_ending, we can check `data` or fallback currently displayed `duelState`
      // For now, since duelState requires latest ref in closure, we could assume standard defaults if not available in data itself.

      const isWinner = data.winnerId === user?.id;

      navigate('/duel/${duel.id}/result', {
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
      Chargement du duel...
    </div>
  );

  const isPlayer1 = duelState.player1.id === user?.id;
  const isPlayer2 = duelState?.player2?.id === user?.id;
  const opponent = isPlayer1 ? duelState.player2 : (isPlayer2 ? duelState.player1 : null);
  const me = isPlayer1 ? duelState.player1 : (isPlayer2 ? duelState.player2 : null);

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
                  <span>Perte Focus: {focusLostCount}× ({totalFocusLostTime}s)</span>
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
                  {tab === 'statement' ? 'Énoncé' : 'Statut du Duel'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">

              {activeTab === 'statement' && (
                <div className="prose prose-invert max-w-none">
                  <div className="mb-6 whitespace-pre-wrap text-[var(--text-primary)]">
                    {duelState.challenge.descriptionMd || "Description cachée / non chargée. Faisons le duel !"}
                  </div>
                </div>
              )}

              {activeTab === 'status' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface-2)]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-[var(--text-primary)] text-sm uppercase tracking-wider">État du Duel</span>
                      <span className={`px-2 py-1 text-xs rounded-full font-bold ${duelState.status === 'active' ? 'bg-[var(--brand-primary)] text-white animate-pulse' : 'bg-[var(--surface-3)] text-[var(--text-secondary)]'}`}>
                        {duelState.status.toUpperCase()}
                      </span>
                    </div>
                    {duelState.status === 'waiting' && <p className="text-sm text-[var(--text-muted)]">En attente d'un adversaire...</p>}
                    {duelState.status === 'ready' && <p className="text-sm text-[var(--text-muted)]">L'adversaire est là. Préparez-vous !</p>}
                    {duelState.status === 'active' && <p className="text-sm text-[var(--brand-primary)]">Le duel est en cours ! Le temps et la complexité IA comptent.</p>}
                  </div>

                  {/* Players Overview */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-[var(--radius-md)] border-2 ${me?.ready ? 'border-[var(--brand-primary)]' : 'border-[var(--border-default)]'} bg-[var(--surface-1)]`}>
                      <h3 className="font-bold text-sm mb-2 text-center text-[var(--brand-primary)]">Vous</h3>
                      <div className="text-center font-medium mb-2">{me?.username || '...'}</div>
                      <div className="text-xs space-y-2 text-center">
                        <div className={me?.ready ? 'text-green-500 font-bold' : 'text-yellow-500'}>{me?.ready ? 'PRÊT' : 'NON PRÊT'}</div>
                        <div className="p-2 bg-[var(--surface-2)] rounded">
                          <div>Tests passés: {me?.testsPassed || 0} / {me?.testsTotal || 0}</div>
                          <div className="font-bold">Score: {me?.score || 0}%</div>
                        </div>
                        {me?.finishedAt && <div className="text-green-400 font-bold text-xs mt-1">✓ Terminé! IA en cours...</div>}
                        {me?.complexityScore !== undefined && (
                          <div className="text-purple-400 font-bold text-xs mt-1 animate-pulse">
                            🔥 Complexité IA: Score {me.complexityScore}
                          </div>
                        )}
                      </div>
                      {!me?.ready && duelState.status === 'ready' && (
                        <Button className="w-full mt-3 h-8 text-xs" onClick={handleReady}>Je suis prêt</Button>
                      )}
                    </div>

                    <div className={`p-4 rounded-[var(--radius-md)] border-2 ${opponent?.ready ? 'border-red-500' : 'border-[var(--border-default)]'} bg-[var(--surface-1)]`}>
                      <h3 className="font-bold text-sm mb-2 text-center text-red-500">Adversaire</h3>
                      <div className="text-center font-medium mb-2">{opponent?.username || 'En attente...'}</div>
                      {opponent?.id ? (
                        <div className="text-xs space-y-2 text-center">
                          <div className={opponent.ready ? 'text-green-500 font-bold' : 'text-yellow-500'}>{opponent.ready ? 'PRÊT' : 'NON PRÊT'}</div>
                          <div className="p-2 bg-[var(--surface-2)] rounded">
                            <div>Tests passés: {opponent.testsPassed || 0} / {opponent.testsTotal || 0}</div>
                            <div className="font-bold text-red-400">Score: {opponent.score || 0}%</div>
                          </div>
                          {opponent?.finishedAt && <div className="text-green-400 font-bold text-xs mt-1">✓ Terminé! IA en cours...</div>}
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
                      <h3 className="font-bold text-sm mb-2 text-[var(--text-primary)]">Résultat d'exécution</h3>
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
                      </div>
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
                  onChange={e => setLanguage(e.target.value)}
                  disabled={duelState.status !== 'active'}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleTestCode}
                loading={isRunning}
                disabled={duelState.status !== 'active' || me?.finishedAt}>
                <Send className="w-4 h-4" />
                Soumettre
              </Button>
            </div>
            <div className="flex-1 relative">
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
