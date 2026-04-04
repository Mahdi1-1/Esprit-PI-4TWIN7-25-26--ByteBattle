import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { EndGameScreen } from '../components/EndGameScreen/EndGameScreen';
import { Layout } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { Loader, Trophy, Zap, Clock, Target } from 'lucide-react';
import { duelsService } from '../services/duelsService';

export const DuelResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { duelId } = useParams();
  const [duelData, setDuelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const data = location.state?.endGameData;

  useEffect(() => {
    const fetchDuelResult = async () => {
      try {
        setLoading(true);
        if (duelId) {
          const res = await duelsService.getDuelResult(duelId);
          if (res) {
            const formattedData = {
              player1: {
                username: res.player1?.username || 'Player 1',
                score: res.player1Score || 0,
                level: res.player1?.level || 1,
                avatar: res.player1?.avatar || '',
                executionTime: res.player1ExecutionTime,
                isWinner: res.winnerId === res.player1?.id,
              },
              player2: {
                username: res.player2?.username || 'Player 2',
                score: res.player2Score || 0,
                level: res.player2?.level || 1,
                avatar: res.player2?.avatar || '',
                executionTime: res.player2ExecutionTime,
                isWinner: res.winnerId === res.player2?.id,
              },
              problem: {
                title: res.problem?.title || 'Unknown Problem',
                difficulty: res.problem?.difficulty || 'medium',
              },
              duration: res.durationSeconds || 0,
              startedAt: new Date(res.createdAt),
              status: res.status || 'FINISHED',
            };
            setDuelData(formattedData);
          }
        } else if (data) {
          setDuelData(data);
        } else {
          navigate('/duel/matchmaking', { replace: true });
        }
      } catch (err) {
        console.error('Failed to load duel result:', err);
        if (data) {
          setDuelData(data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDuelResult();
  }, [duelId, data, navigate]);

  if (loading) {
    return (
      <Layout>
        <Navbar />
        <div className="w-full h-screen flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
        </div>
      </Layout>
    );
  }

  if (!duelData) {
    return null;
  }

  // Si c'est un ancien format avec endGameData
  if (duelData.isVisible !== undefined) {
    return (
      <div className="w-screen h-screen bg-black">
        <EndGameScreen
          data={duelData}
          isVisible={true}
          onRetry={() => navigate('/duel/matchmaking')}
          onBackToMenu={() => navigate('/')}
        />
      </div>
    );
  }

  // Nouveau format avec données réelles
  const winner = duelData.player1.isWinner ? duelData.player1 : duelData.player2;
  const loser = duelData.player1.isWinner ? duelData.player2 : duelData.player1;

  return (
    <Layout>
      <Navbar />
      <div className="w-full min-h-screen bg-gradient-to-b from-[var(--surface-1)] to-[var(--surface-2)] px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Title */}
          <div className="text-center">
            <h1 className="text-4xl font-bold gradient-brand-text font-title mb-2">Duel Finished!</h1>
            <p className="text-[var(--text-secondary)]">{duelData.problem.title}</p>
          </div>

          {/* Winner Card */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/50 rounded-lg p-6 text-center">
            <Trophy className="w-8 h-8 mx-auto text-yellow-500 mb-3" />
            <p className="text-sm text-[var(--text-muted)] mb-2">Winner</p>
            <h2 className="text-3xl font-bold text-yellow-500 mb-3">{winner.username}</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{winner.score}</p>
                <p className="text-xs text-[var(--text-muted)]">Score</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">Lv. {winner.level}</p>
                <p className="text-xs text-[var(--text-muted)]">Level</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{winner.executionTime || 'N/A'}</p>
                <p className="text-xs text-[var(--text-muted)]">Execution</p>
              </div>
            </div>
          </div>

          {/* Stats Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Player 1 */}
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={duelData.player1.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${duelData.player1.username}`}
                  alt={duelData.player1.username}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full border-2 border-[var(--brand-primary)]"
                />
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">{duelData.player1.username}</h3>
                  <p className="text-xs text-[var(--text-muted)]">Lv. {duelData.player1.level}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-default)]">
                  <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Target className="w-4 h-4" />
                    Score
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">{duelData.player1.score}</span>
                </div>
                
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-default)]">
                  <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Zap className="w-4 h-4" />
                    Execution Time
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">{duelData.player1.executionTime || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Clock className="w-4 h-4" />
                    Status
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${duelData.player1.isWinner ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {duelData.player1.isWinner ? '✓ Won' : '✗ Lost'}
                  </span>
                </div>
              </div>
            </div>

            {/* Player 2 */}
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={duelData.player2.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${duelData.player2.username}`}
                  alt={duelData.player2.username}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full border-2 border-[var(--brand-primary)]"
                />
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">{duelData.player2.username}</h3>
                  <p className="text-xs text-[var(--text-muted)]">Lv. {duelData.player2.level}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-default)]">
                  <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Target className="w-4 h-4" />
                    Score
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">{duelData.player2.score}</span>
                </div>
                
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-default)]">
                  <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Zap className="w-4 h-4" />
                    Execution Time
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">{duelData.player2.executionTime || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Clock className="w-4 h-4" />
                    Status
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${duelData.player2.isWinner ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {duelData.player2.isWinner ? '✓ Won' : '✗ Lost'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Match Info */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Duration</p>
              <p className="font-bold text-[var(--text-primary)]">{duelData.duration}s</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Difficulty</p>
              <p className="font-bold capitalize text-[var(--text-primary)]">{duelData.problem.difficulty}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Started</p>
              <p className="font-bold text-[var(--text-primary)]">{duelData.startedAt.toLocaleTimeString()}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Status</p>
              <p className="font-bold capitalize text-green-400">{duelData.status}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/duel/matchmaking')}
              className="px-6 py-3 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              New Duel
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-2)] transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
