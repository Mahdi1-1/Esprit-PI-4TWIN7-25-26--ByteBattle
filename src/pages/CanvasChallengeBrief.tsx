import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Layout } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { canvasChallenges } from '../data/canvasChallengeData';
import { mockUser } from '../data/mockData';
import { ArrowLeft, Clock, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function CanvasChallengeBrief() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<'solo' | 'duel' | 'hackathon'>('solo');

  const challenge = canvasChallenges.find((c) => c.id === id);

  if (!challenge) {
    return (
      <Layout>
        <Navbar 
          isLoggedIn 
          userAvatar={mockUser.avatar} 
          username={mockUser.username} 
        />
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              Challenge non trouvé
            </h2>
            <Button onClick={() => navigate('/canvas')}>
              Back to Catalog
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-[var(--state-success)]';
      case 'medium': return 'text-[var(--state-warning)]';
      case 'hard': return 'text-[var(--state-error)]';
      case 'expert': return 'text-[var(--brand-secondary)]';
      default: return 'text-[var(--text-muted)]';
    }
  };

  const handleStart = () => {
    navigate(`/canvas/${id}/editor`, { state: { mode: selectedMode } });
  };

  return (
    <Layout>
      <Navbar 
        isLoggedIn 
        userAvatar={mockUser.avatar} 
        username={mockUser.username} 
      />
      <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
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

          {/* Hero Section */}
          <div className="theme-card corner-brackets relative bg-[var(--surface-1)] border-[var(--border-default)] p-8 space-y-6">
            {/* Title & Meta */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                    {challenge.title}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-sm font-semibold ${getDifficultyColor(challenge.difficulty)}`}>
                      ⚡ {challenge.difficulty.toUpperCase()}
                    </span>
                    <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {challenge.duration} minutes
                    </span>
                    <span className="text-sm text-[var(--text-secondary)]">
                      📊 {challenge.rubric.reduce((sum, r) => sum + r.maxPoints, 0)} points max
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {challenge.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-[var(--surface-2)] text-[var(--text-secondary)] rounded-full border border-[var(--border-default)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                Description
              </h3>
              <p className="text-[var(--text-primary)] leading-relaxed">
                {challenge.description}
              </p>
            </div>
          </div>

          {/* Context Section */}
          <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Contexte</h2>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {challenge.context}
            </p>
          </div>

          {/* Requirements */}
          <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-[var(--brand-primary)]" />
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Exigences</h2>
            </div>
            <ul className="space-y-2">
              {challenge.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[var(--text-secondary)]">
                  <CheckCircle2 className="w-5 h-5 text-[var(--state-success)] flex-shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Constraints */}
          <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-[var(--state-warning)]" />
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Contraintes</h2>
            </div>
            <ul className="space-y-2">
              {challenge.constraints.map((constraint, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[var(--text-secondary)]">
                  <span className="text-[var(--state-warning)] flex-shrink-0">⚠️</span>
                  <span>{constraint}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Deliverables */}
          <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📦</span>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">À livrer</h2>
            </div>
            <ul className="space-y-2">
              {challenge.deliverables.map((deliverable, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[var(--text-secondary)]">
                  <span className="text-[var(--brand-primary)] flex-shrink-0">✓</span>
                  <span>{deliverable}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Success Criteria */}
          <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Critères de réussite</h2>
            </div>
            <ul className="space-y-2">
              {challenge.successCriteria.map((criterion, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[var(--text-secondary)]">
                  <span className="text-[var(--brand-secondary)] flex-shrink-0">★</span>
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Rubric */}
          <div className="theme-card bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Grille d'évaluation</h2>
            </div>
            <div className="space-y-3">
              {challenge.rubric.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between gap-4 pb-3 border-b border-[var(--border-default)] last:border-0">
                  <div className="flex-1">
                    <div className="font-semibold text-[var(--text-primary)] mb-1">
                      {item.criterion}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {item.description}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-[var(--brand-primary)] flex-shrink-0">
                    {item.maxPoints}
                  </div>
                </div>
              ))}
              <div className="pt-3 flex items-center justify-between font-bold text-lg">
                <span className="text-[var(--text-primary)]">Total</span>
                <span className="gradient-brand-text">
                  {challenge.rubric.reduce((sum, r) => sum + r.maxPoints, 0)} points
                </span>
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="theme-card corner-brackets relative bg-[var(--surface-1)] border-[var(--border-default)] p-6 space-y-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              Choisir un mode
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: 'solo',
                  name: 'Training (Solo)',
                  icon: '🧑‍💻',
                  description: 'Practice at your own pace',
                  available: true
                },
                {
                  name: 'Duel 1v1',
                  icon: '⚔️',
                  description: 'Challenge an opponent',
                  available: true
                },
                {
                  id: 'hackathon',
                  name: 'Hackathon',
                  icon: '🏆',
                  description: 'Team competition',
                  available: false
                }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => mode.available && setSelectedMode(mode.id as any)}
                  disabled={!mode.available}
                  className={`
                    p-4 rounded-lg border-2 text-left
                    transition-all duration-150
                    ${!mode.available ? 'opacity-50 cursor-not-allowed' : ''}
                    ${selectedMode === mode.id && mode.available
                      ? 'border-[var(--brand-primary)] bg-[var(--surface-2)]'
                      : 'border-[var(--border-default)] hover:border-[var(--brand-primary)]'
                    }
                  `}
                >
                  <div className="text-3xl mb-2">{mode.icon}</div>
                  <div className="font-bold text-[var(--text-primary)] mb-1">
                    {mode.name}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {mode.description}
                  </div>
                  {!mode.available && (
                    <Badge variant="warning" className="mt-2">Bientôt disponible</Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/canvas')}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleStart}
              className="min-w-[200px]"
            >
              🎨 Ouvrir le Canvas
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}