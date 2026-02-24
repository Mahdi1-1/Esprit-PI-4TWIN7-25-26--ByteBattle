import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Breadcrumb } from '../../components/admin/AdminComponents';
import { problems } from '../../data/adminData';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

export function AdminProblem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    difficulty: 'medium',
    status: 'draft',
    description: '',
    tags: [] as string[],
    testCases: []
  });

  useEffect(() => {
    if (id && id !== 'new') {
      // In a real app, fetch problem data here
      const problem = problems.find(p => p.id === id);
      if (problem) {
        setFormData({
          title: problem.title,
          slug: problem.slug,
          difficulty: problem.difficulty,
          status: problem.status,
          description: '', // This would come from full details
          tags: problem.tags,
          testCases: []
        });
      }
    }
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving problem:', formData);
    navigate('/admin/problems');
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <Breadcrumb 
          items={[
            { label: 'Admin' }, 
            { label: 'Problems', href: '/admin/problems' },
            { label: isNew ? 'New Problem' : 'Edit Problem' }
          ]} 
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin/problems')}
              className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {isNew ? 'Create New Problem' : `Edit: ${formData.title}`}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <button className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <button 
              onClick={handleSubmit}
              className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">General Information</h2>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                  placeholder="e.g. Two Sum"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData({...formData, slug: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                  placeholder="two-sum"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Description (Markdown)</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full h-64 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] font-mono text-sm"
                  placeholder="# Problem Description..."
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={e => setFormData({...formData, difficulty: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Export AdminProblemForm as an alias for now, or create a separate component if needed
export const AdminProblemForm = AdminProblem;
