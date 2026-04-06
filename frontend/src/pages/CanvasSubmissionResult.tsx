import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { type CanvasChallenge, type CanvasSubmission } from '../data/canvasChallengeData';
import { canvasService } from '../services/canvasService';
import { CheckCircle2, Lightbulb, Download, Share2, BookmarkPlus, ArrowRight, Loader } from 'lucide-react';

export function CanvasSubmissionResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<CanvasChallenge | null>(null);
  const [submission, setSubmission] = useState<CanvasSubmission | null>(null);
  const [allChallenges, setAllChallenges] = useState<CanvasChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [challengeRes, submissionsRes, allChallengesRes] = await Promise.allSettled([
          canvasService.getChallengeById(id!),
          canvasService.getSubmissions(id!),
          canvasService.getChallenges(),
        ]);
        if (challengeRes.status === 'fulfilled' && challengeRes.value) {
          setChallenge(challengeRes.value);
        }
        if (submissionsRes.status === 'fulfilled' && submissionsRes.value?.length) {
          setSubmission(submissionsRes.value[0]);
        }
        if (allChallengesRes.status === 'fulfilled' && allChallengesRes.value) {
          setAllChallenges(allChallengesRes.value);
        }
      } catch (err) {
        console.error('Failed to load submission result:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <Layout>

        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
        </div>
      </Layout>
    );
  }

  if (!challenge || !submission) {
    return (
      <Layout>
                <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              Résultat non trouvé
            </h2>
            <Button onClick={() => navigate('/canvas')}>
              Back to Catalog
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const scorePercentage = (submission.score / submission.maxScore) * 100;
  const getScoreColor = () => {
    if (scorePercentage >= 80) return 'text-[var(--state-success)]';
    if (scorePercentage >= 60) return 'text-[var(--state-warning)]';
    return 'text-[var(--state-error)]';
  };

  const getScoreGrade = () => {
    if (scorePercentage >= 90) return 'Excellent';
    if (scorePercentage >= 80) return 'Très bien';
    if (scorePercentage >= 70) return 'Bien';
    if (scorePercentage >= 60) return 'Satisfaisant';
    return 'À améliorer';
  };

  return (
    <Layout>
            <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Hero - Score */}
          <div className="theme-card corner-brackets relative bg-[var(--surface-1)] border-[var(--border-default)] p-8 text-center space-y-6">
            <div className="inline-block px-4 py-2 bg-[var(--surface-2)] rounded-full">
              <span className="text-sm font-semibold text-[var(--text-secondary)]">
                Challenge complété !
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                {challenge.title}
              </h1>
              
              {/* Score Display */}
              <div className="flex items-center justify-center gap-4">
                <div className={`text-7xl font-bold ${getScoreColor()}`}>
                  {submission.score}
                </div>
                <div className="text-left">
                  <div className="text-2xl text-[var(--text-secondary)]">/ {submission.maxScore}</div>
                  <div className="text-sm text-[var(--text-muted)]">points</div>
                </div>
              </div>

              <div className="text-xl font-semibold text-[var(--brand-primary)]">
                {getScoreGrade()}
              </div>

              {/* Badges */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {submission.badges.map((badge) => (
                  <Badge key={badge.name} variant="default" className="gap-1">
                    <span>{badge.icon}</span>
                    {badge.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-center gap-3">
              <Button variant="ghost" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Télécharger
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                Partager
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <BookmarkPlus className="w-4 h-4" />
                Portfolio
              </Button>
            </div>
          </div>

          {/* Diagram Preview */}
          <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Your Diagram
              </h2>
              <Button variant="secondary" size="sm" onClick={() => {}}>
                Voir en plein écran
              </Button>
            </div>
            
            {/* Diagram Placeholder */}
            <div className="aspect-video bg-[var(--surface-2)] rounded-lg border-2 border-dashed border-[var(--border-default)] flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl block mb-4">🎨</span>
                <p className="text-[var(--text-secondary)]">Your architecture diagram</p>
              </div>
            </div>
          </div>

          {/* AI Feedback */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Feedback IA</h2>
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {submission.feedback.summary}
              </p>
            </div>

            {/* Strengths */}
            <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-[var(--state-success)]" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Strengths</h3>
              </div>
              <ul className="space-y-3">
                {submission.feedback.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-[var(--state-success)] flex-shrink-0 mt-1">✓</span>
                    <span className="text-[var(--text-secondary)]">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-[var(--brand-primary)]" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Improvement Suggestions</h3>
              </div>
              <ul className="space-y-3">
                {submission.feedback.improvements.map((improvement, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-[var(--brand-primary)] flex-shrink-0 mt-1">💡</span>
                    <span className="text-[var(--text-secondary)]">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Rubric Breakdown */}
          <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Evaluation Details
            </h2>
            <div className="space-y-4">
              {challenge.rubric.map((criterion, idx) => {
                // Mock score for each criterion
                const earnedPoints = Math.floor(criterion.maxPoints * (0.7 + Math.random() * 0.3));
                const percentage = (earnedPoints / criterion.maxPoints) * 100;

                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {criterion.category}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)]">
                          {criterion.description}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-bold text-[var(--brand-primary)]">
                          {earnedPoints} / {criterion.maxPoints}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {percentage.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-brand transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-4 text-center">
              <div className="text-3xl font-bold text-[var(--brand-primary)] mb-1">
                +250
              </div>
              <div className="text-sm text-[var(--text-secondary)]">XP Earned</div>
            </div>
            <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-4 text-center">
              <div className="text-3xl font-bold text-[var(--brand-primary)] mb-1">
                #{12}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">Global Ranking</div>
            </div>
            <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-4 text-center">
              <div className="text-3xl font-bold text-[var(--brand-primary)] mb-1">
                🏆
              </div>
              <div className="text-sm text-[var(--text-secondary)]">3 Badges Unlocked</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate(`/canvas/${id}/editor`)}
              >
                Retry
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/canvas')}
              >
                Catalog
              </Button>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                // Navigate to next challenge
                const currentIndex = allChallenges.findIndex(c => c.id === id);
                const nextChallenge = allChallenges[currentIndex + 1] || allChallenges[0];
                navigate(`/canvas/${nextChallenge.id}/brief`);
              }}
              className="gap-2"
            >
              Next Challenge
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Related Challenges */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Similar Challenges
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allChallenges.filter(c => c.id !== id).slice(0, 3).map((relatedChallenge) => (
                <div
                  key={relatedChallenge.id}
                  className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-4 space-y-3 hover:border-[var(--brand-primary)] cursor-pointer transition-colors"
                  onClick={() => navigate(`/canvas/${relatedChallenge.id}/brief`)}
                >
                  <h3 className="font-bold text-[var(--text-primary)] line-clamp-2">
                    {relatedChallenge.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-[var(--surface-2)] rounded">
                      {relatedChallenge.difficulty}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {relatedChallenge.duration} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}