import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Layout } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { canvasChallenges } from '../data/canvasChallengeData';
import { mockUser } from '../data/mockData';
import { ArrowLeft, Download, Share2, Trophy, Clock, Zap } from 'lucide-react';

interface SubmissionData {
  challengeId: string;
  timestamp: number;
  imageData: string;
  elements: any[];
  mode: string;
}

export function CanvasResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(true);

  const challenge = canvasChallenges.find((c) => c.id === id);

  useEffect(() => {
    // Load submission from localStorage
    const savedSubmission = localStorage.getItem(`canvas_submission_${id}`);
    if (savedSubmission) {
      try {
        const parsed = JSON.parse(savedSubmission);
        setSubmission(parsed);
      } catch (error) {
        console.error('Failed to load submission:', error);
      }
    }

    // Simulate AI analysis
    const timer = setTimeout(() => {
      setAiAnalyzing(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [id]);

  if (!challenge) {
    return (
      <Layout>
        <Navbar isLoggedIn userAvatar={mockUser.avatar} username={mockUser.username} />
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              Challenge not found
            </h2>
            <Button onClick={() => navigate('/canvas')}>
              Back to Catalog
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const maxScore = challenge.rubric.reduce((sum, r) => sum + r.maxPoints, 0);
  const score = aiAnalyzing ? 0 : Math.floor(maxScore * (0.7 + Math.random() * 0.25)); // Mock score 70-95%
  const percentage = Math.floor((score / maxScore) * 100);

  const handleDownload = () => {
    if (submission?.imageData) {
      const link = document.createElement('a');
      link.href = submission.imageData;
      link.download = `canvas_${id}_${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <Layout>
      <Navbar isLoggedIn userAvatar={mockUser.avatar} username={mockUser.username} />
      
      <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full px-4 sm:px-6 lg:px-10 space-y-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/canvas')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </Button>

          {/* Result Header */}
          <div className="theme-card corner-brackets relative bg-[var(--surface-1)] border-[var(--border-default)] p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                  Submission Result
                </h1>
                <p className="text-[var(--text-secondary)]">
                  {challenge.title}
                </p>
              </div>
              <Badge variant={percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'error'}>
                {submission?.mode === 'solo' ? '🧑‍💻 Training' : submission?.mode === 'duel' ? '⚔️ Duel' : '🏆 Hackathon'}
              </Badge>
            </div>

            {/* Score Display */}
            {aiAnalyzing ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center gap-3 text-[var(--brand-primary)]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)]"></div>
                  <span className="text-lg font-semibold">AI is analyzing your submission...</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-[var(--surface-2)] rounded-lg border border-[var(--border-default)]">
                  <Trophy className="w-8 h-8 text-[var(--brand-primary)] mx-auto mb-2" />
                  <div className="text-3xl font-bold gradient-brand-text mb-1">
                    {score}/{maxScore}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">Total Score</div>
                </div>
                <div className="text-center p-6 bg-[var(--surface-2)] rounded-lg border border-[var(--border-default)]">
                  <Zap className="w-8 h-8 text-[var(--state-warning)] mx-auto mb-2" />
                  <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">
                    {percentage}%
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">Accuracy</div>
                </div>
                <div className="text-center p-6 bg-[var(--surface-2)] rounded-lg border border-[var(--border-default)]">
                  <Clock className="w-8 h-8 text-[var(--state-info)] mx-auto mb-2" />
                  <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">
                    {Math.floor((challenge.duration * 60 - Math.random() * 300) / 60)}m
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">Time Taken</div>
                </div>
              </div>
            )}
          </div>

          {/* Submitted Canvas */}
          <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Your Submission</h2>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Canvas Image */}
            <div className="bg-[var(--surface-2)] rounded-lg border-2 border-[var(--border-default)] p-8 flex items-center justify-center min-h-[400px]">
              {submission?.imageData ? (
                <img
                  src={submission.imageData}
                  alt="Submitted canvas"
                  className="max-w-full max-h-[600px] object-contain rounded shadow-lg"
                />
              ) : (
                <div className="text-center text-[var(--text-muted)]">
                  <p>No submission image available</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Feedback */}
          {!aiAnalyzing && (
            <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">AI Evaluation</h2>
              
              <div className="space-y-4">
                {challenge.rubric.map((item, idx) => {
                  const itemScore = Math.floor(item.maxPoints * (0.7 + Math.random() * 0.25));
                  const itemPercentage = Math.floor((itemScore / item.maxPoints) * 100);
                  
                  return (
                    <div key={idx} className="p-4 bg-[var(--surface-2)] rounded-lg border border-[var(--border-default)]">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-[var(--text-primary)]">
                            {item.criterion}
                          </h4>
                          <p className="text-sm text-[var(--text-secondary)] mt-1">
                            {item.description}
                          </p>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <div className="text-xl font-bold text-[var(--brand-primary)]">
                            {itemScore}/{item.maxPoints}
                          </div>
                          <Badge variant={itemPercentage >= 70 ? 'success' : itemPercentage >= 50 ? 'warning' : 'error'}>
                            {itemPercentage}%
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-[var(--surface-3)] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] transition-all duration-500"
                          style={{ width: `${itemPercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          {!aiAnalyzing && (
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="secondary" size="lg" onClick={() => navigate(`/canvas/${id}/brief`)}>
                Try Again
              </Button>
              <Button variant="primary" size="lg" onClick={() => navigate('/canvas')}>
                Browse More Challenges
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
