import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-hot-toast';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Breadcrumb } from '../../components/admin/AdminComponents';
import { challengesService } from '../../services/challengesService';
import { ArrowLeft, Save, Trash2, Plus, Minus } from 'lucide-react';

export function AdminProblem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    status: 'draft' as 'draft' | 'published' | 'archived',
    statementMd: '',
    tags: [] as string[],
    tagInput: '',
    allowedLanguages: ['javascript', 'python', 'java'] as string[],
    testCases: [] as { input: string; expectedOutput: string; isHidden: boolean }[],
    constraints: {} as Record<string, string>,
    hints: [] as string[],
    hintInput: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState<any>(null);

  useEffect(() => {
    if (id && id !== 'new') {
      const fetchProblem = async () => {
        try {
          const problem = await challengesService.getByIdAdmin(id);
          if (problem) {
            setFormData({
              title: problem.title || '',
              slug: problem.slug || problem.title?.toLowerCase().replace(/\s+/g, '-') || '',
              difficulty: problem.difficulty || 'medium',
              status: problem.status || 'draft',
              statementMd: problem.descriptionMd || problem.statementMd || '',
              tags: problem.tags || [],
              tagInput: '',
              allowedLanguages: problem.allowedLanguages || ['javascript', 'python', 'java'],
              testCases: problem.tests || [],
              constraints: problem.constraints || {},
              hints: problem.hints || [],
              hintInput: ''
            });
          }
        } catch (err) {
          console.error('Failed to load problem:', err);
          setError('Failed to load problem data.');
        }
      };
      fetchProblem();
    }
  }, [id]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(formData.tagInput.trim())) {
        setFormData({
          ...formData,
          tags: [...formData.tags, formData.tagInput.trim()],
          tagInput: ''
        });
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleAddHint = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.hintInput.trim()) {
      e.preventDefault();
      setFormData({
        ...formData,
        hints: [...formData.hints, formData.hintInput.trim()],
        hintInput: ''
      });
    }
  };

  const handleRemoveHint = (index: number) => {
    setFormData({
      ...formData,
      hints: formData.hints.filter((_, i) => i !== index)
    });
  };

  const handleAddTestCase = () => {
    setFormData({
      ...formData,
      testCases: [...formData.testCases, { input: '', expectedOutput: '', isHidden: true }]
    });
  };

  const handleUpdateTestCase = (index: number, field: string, value: any) => {
    const updatedTestCases = [...formData.testCases];
    updatedTestCases[index] = { ...updatedTestCases[index], [field]: value };
    setFormData({ ...formData, testCases: updatedTestCases });
  };

  const handleRemoveTestCase = (index: number) => {
    setFormData({
      ...formData,
      testCases: formData.testCases.filter((_, i) => i !== index)
    });
  };

  const handleLanguageToggle = (lang: string) => {
    const newLangs = formData.allowedLanguages.includes(lang)
      ? formData.allowedLanguages.filter(l => l !== lang)
      : [...formData.allowedLanguages, lang];
    setFormData({ ...formData, allowedLanguages: newLangs });
  };

  const handleGenerateDraft = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Please enter a prompt to generate a draft.');
      return;
    }

    setAiError(null);
    setAiLoading(true);

    try {
      const result = await challengesService.generateDraftAdmin({ prompt: aiPrompt, kind: 'CODE' });

      setFormData(prev => ({
        ...prev,
        title: result.title || prev.title,
        statementMd: result.statementMd || prev.statementMd,
        difficulty: result.difficulty || prev.difficulty,
        tags: result.tags?.length ? result.tags : prev.tags,
        allowedLanguages: result.allowedLanguages?.length ? result.allowedLanguages : prev.allowedLanguages,
        testCases: result.tests?.length ? result.tests : prev.testCases,
        hints: result.hints?.length ? result.hints : prev.hints,
      }));
      setAiDraft(result);
      toast.success('Brouillon AI généré avec succès');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Erreur lors de la génération du brouillon AI';
      setAiError(message);
      toast.error(message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.statementMd.trim()) {
      setError('Title and problem statement are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: formData.title,
        kind: 'CODE' as const,
        difficulty: formData.difficulty,
        tags: formData.tags,
        statementMd: formData.statementMd,
        status: formData.status,
        allowedLanguages: formData.allowedLanguages,
        constraints: formData.constraints,
        tests: formData.testCases,
        hints: formData.hints
      };

      if (isNew) {
        await challengesService.createCodeChallenge(payload);
      } else {
        await challengesService.update(id as string, payload);
      }
      navigate('/admin/problems');
    } catch (err: any) {
      console.error('Failed to save problem:', err);
      setError(err.response?.data?.message || 'Failed to save problem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
        <Breadcrumb
          items={[
            { label: 'Admin' },
            { label: 'Problems', href: '/admin/problems' },
            { label: isNew ? 'New Code Challenge' : 'Edit Code Challenge' }
          ]}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/problems')}
              className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {isNew ? 'Create New Code Challenge' : `Edit: ${formData.title}`}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAiPanel(prev => !prev)}
              className="px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Générer avec AI
            </button>
            {!isNew && (
              <button type="button" className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Challenge'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        )}

        {showAiPanel && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-xl mb-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-semibold">Génération de brouillon AI</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Entrez une description du challenge souhaité, puis générez un brouillon que vous pourrez modifier.
                </p>
              </div>
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                {aiLoading ? 'Génération en cours...' : 'Prêt à générer'}
              </span>
            </div>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-[var(--text-primary)] outline-none focus:border-blue-400"
              placeholder="Décris le type de défi à générer, ex: challenge d'algorithme facile sur les tableaux et les boucles"
            />
            {aiError && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
                {aiError}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={aiLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Générer le brouillon
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAiPanel(false);
                  setAiError(null);
                }}
                className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Fermer
              </button>
            </div>
            {aiDraft && (
              <div className="mt-5 bg-blue-100 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Résultat AI</h3>
                <p className="text-sm"><strong>Titre :</strong> {aiDraft.title}</p>
                <p className="text-sm"><strong>Difficulté :</strong> {aiDraft.difficulty}</p>
                <p className="text-sm"><strong>Catégorie :</strong> {aiDraft.category}</p>
                <p className="text-sm"><strong>Tests générés :</strong> {aiDraft.tests?.length ?? 0}</p>
                <p className="text-sm"><strong>Tags :</strong> {(aiDraft.tags || []).join(', ')}</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">General Information</h2>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Title *</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                  placeholder="e.g. Two Sum"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Problem Statement (Markdown) *</label>
                <textarea
                  required
                  value={formData.statementMd}
                  onChange={e => setFormData({ ...formData, statementMd: e.target.value })}
                  className="w-full h-64 px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] font-mono text-sm"
                  placeholder="# Problem Statement&#10;Write a function that..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-[var(--surface-2)] text-[var(--text-primary)] text-sm rounded-full border border-[var(--border-default)]">
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="text-[var(--text-secondary)] hover:text-red-500">
                        <Minus className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.tagInput}
                  onChange={e => setFormData({ ...formData, tagInput: e.target.value })}
                  onKeyDown={handleAddTag}
                  className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                  placeholder="Type a tag and press Enter"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Hints</label>
                <div className="flex flex-col gap-2 mb-2">
                  {formData.hints.map((hint, index) => (
                    <div key={index} className="flex items-center justify-between px-3 py-2 bg-[var(--surface-2)] text-[var(--text-primary)] text-sm rounded-lg border border-[var(--border-default)]">
                      <span>{index + 1}. {hint}</span>
                      <button type="button" onClick={() => handleRemoveHint(index)} className="text-[var(--text-secondary)] hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.hintInput}
                  onChange={e => setFormData({ ...formData, hintInput: e.target.value })}
                  onKeyDown={handleAddHint}
                  className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                  placeholder="Type a hint and press Enter to add"
                />
              </div>
            </div>

            {/* Test Cases */}
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Test Cases</h2>
                <button
                  type="button"
                  onClick={handleAddTestCase}
                  className="text-sm px-3 py-1.5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-primary)] rounded-lg transition-colors border border-[var(--border-default)] flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Test Case
                </button>
              </div>

              {formData.testCases.map((tc, index) => (
                <div key={index} className="p-4 border border-[var(--border-default)] rounded-lg bg-[var(--surface-2)] space-y-4 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveTestCase(index)}
                    className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <h3 className="font-semibold text-sm text-[var(--text-primary)]">Test Case #{index + 1}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--text-secondary)]">Input</label>
                      <textarea
                        value={tc.input}
                        onChange={e => handleUpdateTestCase(index, 'input', e.target.value)}
                        className="w-full h-24 px-3 py-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] font-mono text-sm"
                        placeholder="1 2\n3 4"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--text-secondary)]">Expected Output</label>
                      <textarea
                        value={tc.expectedOutput}
                        onChange={e => handleUpdateTestCase(index, 'expectedOutput', e.target.value)}
                        className="w-full h-24 px-3 py-2 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] font-mono text-sm"
                        placeholder="3\n7"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tc.isHidden}
                      onChange={e => handleUpdateTestCase(index, 'isHidden', e.target.checked)}
                      className="rounded border-[var(--border-default)] bg-[var(--surface-1)]"
                    />
                    Hidden test case (used for final evaluation)
                  </label>
                </div>
              ))}

              {formData.testCases.length === 0 && (
                <div className="text-center py-8 text-[var(--text-secondary)] text-sm italic">
                  No test cases added yet. Add some to evaluate user submissions.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h2>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Difficulty *</label>
                <select
                  value={formData.difficulty}
                  onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })}
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
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Environment</h2>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">Allowed Languages</label>
                <div className="space-y-2">
                  {['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'go'].map(lang => (
                    <label key={lang} className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allowedLanguages.includes(lang)}
                        onChange={() => handleLanguageToggle(lang)}
                        className="rounded border-[var(--border-default)] bg-[var(--surface-1)]"
                      />
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}

export const AdminProblemForm = AdminProblem;
