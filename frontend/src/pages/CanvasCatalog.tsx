import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { canvasChallenges, CanvasChallenge } from '../data/canvasChallengeData';
import { mockUser } from '../data/mockData';

export function CanvasCatalog() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const filteredChallenges = canvasChallenges.filter((challenge) => {
    if (selectedType !== 'all' && challenge.type !== selectedType) return false;
    if (selectedDifficulty !== 'all' && challenge.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-[var(--state-success)]';
      case 'medium': return 'bg-[var(--state-warning)]';
      case 'hard': return 'bg-[var(--state-error)]';
      case 'expert': return 'bg-[var(--brand-secondary)]';
      default: return 'bg-[var(--text-muted)]';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'new': return <Badge variant="info">🆕 New</Badge>;
      case 'attempted': return <Badge variant="warning">🔄 In Progress</Badge>;
      case 'completed': return <Badge variant="success">✅ Completed</Badge>;
      default: return null;
    }
  };

  return (
    <Layout>
      <Navbar 
              isLoggedIn 
              userAvatar={mockUser.avatar} 
              username={mockUser.username} 
            />
      <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full px-4 sm:px-6 lg:px-10 space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🎨</span>
              <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                  Canvas Challenges
                </h1>
                <p className="text-[var(--text-secondary)] mt-1">
                  Draw software architectures, design complex systems
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="theme-card corner-brackets relative bg-[var(--surface-1)] border-[var(--border-default)] p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Type Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--text-secondary)]">
                  Challenge Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'architecture-logique', label: 'Logical Architecture' },
                    { value: 'architecture-physique', label: 'Physical Architecture' },
                    { value: 'dataflow', label: 'Dataflow' },
                    { value: 'securite', label: 'Security' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value)}
                      className={`
                        px-3 py-1.5 text-sm rounded-lg border
                        transition-all duration-150
                        ${selectedType === type.value
                          ? 'bg-[var(--brand-primary)] text-[var(--bg-primary)] border-[var(--brand-primary)]'
                          : 'bg-[var(--surface-2)] text-[var(--text-primary)] border-[var(--border-default)] hover:border-[var(--brand-primary)]'
                        }
                      `}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--text-secondary)]">
                  Difficulty
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'easy', label: 'Easy' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'hard', label: 'Hard' },
                    { value: 'expert', label: 'Expert' }
                  ].map((diff) => (
                    <button
                      key={diff.value}
                      onClick={() => setSelectedDifficulty(diff.value)}
                      className={`
                        px-3 py-1.5 text-sm rounded-lg border
                        transition-all duration-150
                        ${selectedDifficulty === diff.value
                          ? 'bg-[var(--brand-primary)] text-[var(--bg-primary)] border-[var(--brand-primary)]'
                          : 'bg-[var(--surface-2)] text-[var(--text-primary)] border-[var(--border-default)] hover:border-[var(--brand-primary)]'
                        }
                      `}
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Available Challenges', value: canvasChallenges.length, icon: '🎯' },
              { label: 'Completed', value: canvasChallenges.filter(c => c.status === 'completed').length, icon: '✅' },
              { label: 'In Progress', value: canvasChallenges.filter(c => c.status === 'attempted').length, icon: '🔄' },
              { label: 'New', value: canvasChallenges.filter(c => c.status === 'new').length, icon: '🆕' }
            ].map((stat, idx) => (
              <div key={idx} className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className="text-3xl font-bold gradient-brand-text">{stat.value}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Challenge Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onStart={() => navigate(`/canvas/${challenge.id}/brief`)}
                getDifficultyColor={getDifficultyColor}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredChallenges.length === 0 && (
            <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-12 text-center">
              <span className="text-6xl mb-4 block">🔍</span>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                No challenges found
              </h3>
              <p className="text-[var(--text-secondary)] mb-4">
                Try modifying your filters
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedType('all');
                  setSelectedDifficulty('all');
                }}
              >
                Reset filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

interface ChallengeCardProps {
  challenge: CanvasChallenge;
  onStart: () => void;
  getDifficultyColor: (difficulty: string) => string;
  getStatusBadge: (status?: string) => React.ReactNode;
}

function ChallengeCard({ challenge, onStart, getDifficultyColor, getStatusBadge }: ChallengeCardProps) {
  return (
    <div className="theme-card corner-brackets relative bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4 hover:border-[var(--brand-primary)] transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
            {challenge.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`
              px-2 py-0.5 text-xs font-semibold rounded-full
              ${getDifficultyColor(challenge.difficulty)}
              text-white
            `}>
              {challenge.difficulty.toUpperCase()}
            </span>
            <span className="px-2 py-0.5 text-xs border border-[var(--border-default)] rounded-full text-[var(--text-secondary)]">
              ⏱️ {challenge.duration} min
            </span>
          </div>
        </div>
        {getStatusBadge(challenge.status)}
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--text-secondary)] line-clamp-3">
        {challenge.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {challenge.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 text-xs bg-[var(--surface-2)] text-[var(--text-secondary)] rounded"
          >
            {tag}
          </span>
        ))}
        {challenge.tags.length > 3 && (
          <span className="px-2 py-1 text-xs text-[var(--text-muted)]">
            +{challenge.tags.length - 3}
          </span>
        )}
      </div>

      {/* Thumbnail Preview */}
      <div className="h-32 bg-[var(--surface-2)] rounded-lg border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)]">
        <span className="text-4xl">🎨</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <div className="font-semibold text-[var(--text-primary)]">{challenge.requirements.length}</div>
          <div className="text-[var(--text-muted)]">Requirements</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-[var(--text-primary)]">{challenge.constraints.length}</div>
          <div className="text-[var(--text-muted)]">Constraints</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-[var(--brand-primary)]">{challenge.rubric.reduce((sum, r) => sum + r.maxPoints, 0)}</div>
          <div className="text-[var(--text-muted)]">Max points</div>
        </div>
      </div>

      {/* Action */}
      <Button
        variant="primary"
        size="lg"
        onClick={onStart}
        className="w-full"
      >
        {challenge.status === 'completed' ? 'Retry' : challenge.status === 'attempted' ? 'Continue' : 'Start'}
      </Button>
    </div>
  );
}