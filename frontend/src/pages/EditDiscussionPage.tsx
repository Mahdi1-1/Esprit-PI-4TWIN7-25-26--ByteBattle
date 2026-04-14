import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSearchParams } from 'react-router';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { useLanguage } from '../context/LanguageContext';
import { discussionCategories } from '../data/discussionData';
import { discussionsService } from '../services/discussionsService';
import { ArrowLeft, Save } from 'lucide-react';

export function EditDiscussionPage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || undefined;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const d = await discussionsService.getById(id!, companyId);
        if (d) {
          setTitle(d.title);
          setContent(d.content);
          setCategory(d.tags?.[0] || 'general');
          setTagsInput(d.tags?.join(', ') || '');
        } else {
          setError('Discussion not found');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch discussion');
      } finally {
        setInitLoading(false);
      }
    };
    fetchPost();
  }, [id, companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0).slice(0, 5);
    
    setLoading(true);
    setError('');

    try {
      await discussionsService.update(id!, {
        title,
        content,
        category,
        tags,
      });

      navigate(companyId
        ? `/discussion/${id}?companyId=${encodeURIComponent(companyId)}`
        : `/discussion/${id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update discussion');
      setLoading(false);
    }
  };

  if (initLoading) {
    return (
      <Layout>

        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 rounded-full border-b-2 border-[var(--brand-primary)]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <button
          onClick={() => navigate(companyId ? `/discussion/${id}?companyId=${encodeURIComponent(companyId)}` : `/discussion/${id}`)}
          className="flex items-center text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Discussion
        </button>

        <h1 className="text-3xl font-bold gradient-brand-text mb-2">Edit Discussion</h1>
        <p className="text-[var(--text-muted)] mb-8">Make changes to your post below.</p>

        {error && (
          <div className="bg-[var(--state-error)]/10 text-[var(--state-error)] border border-[var(--state-error)]/20 p-4 rounded-[var(--radius-md)] mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="theme-card p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Discussion Title"
                className="w-full px-4 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
                maxLength={200}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors appearance-none"
                >
                  {discussionCategories.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Tags (comma separated, max 5)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. React, Algorithms, Help"
                  className="w-full px-4 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Content (Markdown supported)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your content here..."
                rows={12}
                className="w-full px-4 py-2.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors resize-y"
                maxLength={10000}
                required
              />
              <p className="text-xs text-[var(--text-muted)] mt-1 text-right">{content.length} / 10000</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-default)]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(companyId ? `/discussion/${id}?companyId=${encodeURIComponent(companyId)}` : `/discussion/${id}`)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !title.trim() || !content.trim()}
              isLoading={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
