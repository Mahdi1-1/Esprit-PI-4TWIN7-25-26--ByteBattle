import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { Layout } from '../../components/Layout';
import { CompanyLayout } from '../../components/company/CompanyLayout';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';
import { companyService, CompanyRole } from '../../services/companyService';
import { useCurrentCompanyId } from '../../hooks/useCurrentCompanyId';
import { AlertCircle, Plus, Code, Search, Trophy, Clock, Users } from 'lucide-react';
import api from '../../api/axios';

interface CompanyChallenge {
  id: string;
  title: string;
  kind: string;
  difficulty: string;
  tags: string[];
  status: string;
  category: string;
  visibility: string;
  descriptionMd: string;
  createdAt: string;
  _count: { submissions: number };
}

export function CompanyChallengesList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = useCurrentCompanyId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<CompanyChallenge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  const currentUserRole = (user?.companyRole as CompanyRole) || null;
  const canCreate = currentUserRole === 'owner' || currentUserRole === 'recruiter';

  const fetchChallenges = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const data = await companyService.getCompanyChallenges(companyId);
      setChallenges(data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const filteredChallenges = challenges.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDifficulty = difficultyFilter === 'all' || c.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const difficultyColor = (d: string) => {
    switch (d) {
      case 'easy':
        return 'text-[var(--state-success)]';
      case 'medium':
        return 'text-[var(--state-warning)]';
      case 'hard':
        return 'text-[var(--state-error)]';
      default:
        return 'text-[var(--text-secondary)]';
    }
  };

  const difficultyBg = (d: string) => {
    switch (d) {
      case 'easy':
        return 'bg-[var(--state-success)]/10 border-[var(--state-success)]/20';
      case 'medium':
        return 'bg-[var(--state-warning)]/10 border-[var(--state-warning)]/20';
      case 'hard':
        return 'bg-[var(--state-error)]/10 border-[var(--state-error)]/20';
      default:
        return 'bg-[var(--surface-2)] border-[var(--border-default)]';
    }
  };

  if (loading) {
    return (
      <CompanyLayout>
        {/*  */}
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[var(--surface-2)] rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-[var(--surface-2)] rounded-[var(--radius-lg)]"></div>
              ))}
            </div>
          </div>
        </div>
      </CompanyLayout>
    );
  }

  if (error) {
    return (
      <CompanyLayout>
        {/*  */}
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="w-12 h-12 text-[var(--state-error)] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Failed to load challenges</h2>
            <p className="text-[var(--text-secondary)] mb-4">{error}</p>
            <Button onClick={fetchChallenges}>Retry</Button>
          </div>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      {/*  */}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Company Challenges</h1>
            <p className="text-[var(--text-secondary)]">
              {challenges.length} challenge{challenges.length !== 1 ? 's' : ''} available
            </p>
          </div>
          {canCreate && (
            <Button variant="primary" onClick={() => navigate('/company/challenges/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'easy', 'medium', 'hard'].map((d) => (
              <button
                key={d}
                onClick={() => setDifficultyFilter(d)}
                className={`px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium capitalize transition-colors ${
                  difficultyFilter === d
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Challenge Cards */}
        {filteredChallenges.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {challenges.length === 0 ? 'No challenges yet' : 'No matching challenges'}
            </h3>
            <p className="text-[var(--text-secondary)] max-w-sm mx-auto">
              {challenges.length === 0 && canCreate
                ? 'Create your first company challenge to get started.'
                : challenges.length === 0
                ? 'No challenges have been created for this company yet.'
                : 'Try adjusting your search or filters.'}
            </p>
            {challenges.length === 0 && canCreate && (
              <Button variant="primary" onClick={() => navigate('/company/challenges/create')} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create Challenge
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5 hover:border-[var(--brand-primary)]/40 transition-all hover:shadow-md group"
              >
                {/* Challenge header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${difficultyBg(
                        challenge.difficulty
                      )} ${difficultyColor(challenge.difficulty)}`}
                    >
                      {challenge.difficulty}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                      {challenge.kind}
                    </span>
                  </div>
                  {challenge.visibility === 'employees_only' && (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Users className="w-3 h-3" />
                      Internal
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2 line-clamp-2 group-hover:text-[var(--brand-primary)] transition-colors">
                  {challenge.title}
                </h3>

                {/* Description preview */}
                {challenge.descriptionMd && (
                  <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">
                    {challenge.descriptionMd.replace(/[#*`]/g, '').substring(0, 120)}
                    {challenge.descriptionMd.length > 120 ? '...' : ''}
                  </p>
                )}

                {/* Tags */}
                {challenge.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {challenge.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                      >
                        {tag}
                      </span>
                    ))}
                    {challenge.tags.length > 3 && (
                      <span className="text-xs text-[var(--text-muted)]">+{challenge.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-default)]">
                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Code className="w-3 h-3" />
                      {challenge._count.submissions} submissions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(challenge.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Link
                    to={`/problems/${challenge.id}`}
                    className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium bg-[var(--brand-primary)] text-white hover:opacity-90 transition-opacity"
                  >
                    Solve
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
