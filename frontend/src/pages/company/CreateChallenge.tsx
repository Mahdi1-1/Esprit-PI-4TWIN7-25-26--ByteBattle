import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../../components/Layout';
import { CompanyLayout } from '../../components/company/CompanyLayout';
import { Button } from '../../components/Button';
import { Input, Select } from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { useCurrentCompanyId } from '../../hooks/useCurrentCompanyId';
import { ArrowLeft, Globe, Users } from 'lucide-react';
import api from '../../api/axios';

export function CreateChallenge() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = useCurrentCompanyId();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visibility: 'employees_only' as 'public' | 'employees_only',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    timeLimit: 60,
    points: 100,
  });

  const userRole = user?.companyRole as string;
  const canCreate = userRole === 'owner' || userRole === 'recruiter';

  useEffect(() => {
    if (companyId !== undefined) {
      setInitialLoading(false);
    }
  }, [companyId]);

  if (initialLoading) {
    return (
      <CompanyLayout>
        
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full" />
          </div>
        </div>
      </CompanyLayout>
    );
  }

  if (!companyId) {
    return (
      <CompanyLayout>
        
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Company</h2>
            <p className="text-[var(--text-secondary)] mb-4">You need to be a member of a company to create challenges.</p>
            <Button variant="primary" onClick={() => navigate('/company/overview')}>
              Go to Company
            </Button>
          </div>
        </div>
      </CompanyLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !formData.title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await api.post('/challenges/company', {
        title: formData.title,
        description: formData.description,
        difficulty: formData.difficulty,
        companyId: companyId,
        visibility: formData.visibility,
        kind: 'CODE',
        tags: [],
        allowedLanguages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'go', 'rust'],
        constraints: {},
        hints: [],
        tests: [],
        examples: [],
      });
      navigate('/company/challenges');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  if (!canCreate) {
    return (
      <CompanyLayout>
        
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Access Denied</h2>
            <p className="text-[var(--text-secondary)]">Only owners and recruiters can create challenges.</p>
            <Button variant="primary" onClick={() => navigate('/company/challenges')} className="mt-4">
              Back to Challenges
            </Button>
          </div>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/company/challenges')}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Challenges
          </button>

          <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-6">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Create New Challenge</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Challenge Title *
                </label>
                <Input
                  placeholder="e.g., Full Stack Developer Assessment"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Describe the challenge, requirements, and evaluation criteria..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Visibility *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, visibility: 'public' })}
                    className={`p-4 border rounded-[var(--radius-md)] text-left transition-colors ${
                      formData.visibility === 'public'
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10'
                        : 'border-[var(--border-default)] hover:border-[var(--brand-primary)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className={`w-5 h-5 ${formData.visibility === 'public' ? 'text-[var(--brand-primary)]' : 'text-[var(--text-secondary)]'}`} />
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">Public</div>
                        <div className="text-xs text-[var(--text-secondary)]">All users of the platform can see and attempt</div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, visibility: 'employees_only' })}
                    className={`p-4 border rounded-[var(--radius-md)] text-left transition-colors ${
                      formData.visibility === 'employees_only'
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10'
                        : 'border-[var(--border-default)] hover:border-[var(--brand-primary)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className={`w-5 h-5 ${formData.visibility === 'employees_only' ? 'text-[var(--brand-primary)]' : 'text-[var(--text-secondary)]'}`} />
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">Company Only</div>
                        <div className="text-xs text-[var(--text-secondary)]">Only company members can see and attempt</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)]"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Time Limit (min)
                  </label>
                  <Input
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 60 })}
                    min={15}
                    max={240}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Points
                  </label>
                  <Input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 100 })}
                    min={10}
                    max={1000}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-[var(--state-error)]/10 border border-[var(--state-error)]/30 rounded-[var(--radius-md)] text-[var(--state-error)] text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4 justify-end pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/company/challenges')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !formData.title.trim()}
                >
                  {loading ? 'Creating...' : 'Create Challenge'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </CompanyLayout>
  );
}