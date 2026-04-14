import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../../components/Layout';
import { CompanyNavbar } from '../../components/CompanyNavbar';
import { Button } from '../../components/Button';
import { toast } from 'react-hot-toast';
import { companiesService, CompanyMembership } from '../../services/companiesService';
import { challengesService } from '../../services/challengesService';

export function CompanyChallengeCreate() {
  const navigate = useNavigate();
  const [activeMembership, setActiveMembership] = useState<CompanyMembership | null>(null);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [statementMd, setStatementMd] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const memberships = await companiesService.getMyCompanies();
        const active = (memberships || []).find(
          (membership) => membership.status === 'active' && membership.company?.status === 'active',
        ) || null;
        setActiveMembership(active);

        if (active && active.role === 'member') {
          toast.error('Only company admins can create private challenges');
          navigate('/company/challenges', { replace: true });
        }
      } catch {
        setActiveMembership(null);
      }
    };

    load();
  }, [navigate]);

  const handleSubmit = async () => {
    if (!activeMembership?.companyId) {
      toast.error('Active company membership is required');
      return;
    }

    if (activeMembership.role === 'member') {
      toast.error('Only company admins can create private challenges');
      return;
    }

    if (!title.trim() || !statementMd.trim()) {
      toast.error('Title and statement are required');
      return;
    }

    try {
      setLoading(true);
      const created = await challengesService.createCompanyCodeChallenge({
        companyId: activeMembership.companyId,
        title: title.trim(),
        kind: 'CODE',
        difficulty,
        statementMd: statementMd.trim(),
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        status: 'draft',
        allowedLanguages: ['javascript', 'python', 'java'],
        tests: [],
      });

      toast.success('Private company challenge created');
      navigate(`/problem/${created.id}`);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to create private challenge';
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setLoading(false);
    }
  };

  const isCompanyAdmin = activeMembership?.role !== 'member';

  return (
    <Layout>
      <CompanyNavbar
        companyName={activeMembership?.company?.name || 'Company'}
        userName="Company User"
        userRole={isCompanyAdmin ? 'admin' : 'member'}
      />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        <div className="max-w-3xl mx-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Create Private Company Challenge</h1>
          <p className="text-[var(--text-secondary)] mt-2">
            This challenge is private to your company members.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block space-y-2 text-sm">
              <span className="font-medium text-[var(--text-primary)]">Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Two Sum Variant"
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)]"
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-[var(--text-primary)]">Difficulty</span>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)]"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-[var(--text-primary)]">Tags (comma separated)</span>
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="arrays, company-screening"
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)]"
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-[var(--text-primary)]">Problem Statement (Markdown)</span>
              <textarea
                value={statementMd}
                onChange={(event) => setStatementMd(event.target.value)}
                rows={12}
                placeholder="Write the full challenge statement here..."
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-primary)]"
              />
            </label>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" loading={loading} onClick={handleSubmit}>
                Create Private Challenge
              </Button>
              <Button variant="secondary" onClick={() => navigate('/company/challenges')}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
