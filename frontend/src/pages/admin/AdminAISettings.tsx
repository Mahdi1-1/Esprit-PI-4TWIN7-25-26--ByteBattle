import { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Breadcrumb, CodeViewer } from '../../components/admin/AdminComponents';
import { Brain, Zap, MessageSquare, Code } from 'lucide-react';

export function AdminAISettings() {
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [testPrompt, setTestPrompt] = useState('');

  const models = [
    { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
    { id: 'gpt-3.5', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
    { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic' },
    { id: 'llama-2', name: 'Llama 2', provider: 'Meta' }
  ];

  const prompts = [
    {
      id: 'hint',
      name: 'Hint Generation',
      template: 'Generate a helpful hint for this problem without revealing the solution...'
    },
    {
      id: 'review',
      name: 'Code Review',
      template: 'Review this code submission and provide constructive feedback...'
    },
    {
      id: 'canvas',
      name: 'Canvas Evaluation',
      template: 'Evaluate this architecture diagram based on the following criteria...'
    }
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <Breadcrumb items={[{ label: 'Admin' }, { label: 'AI Settings' }]} />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">AI Configuration</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Configure AI models and prompts for hints, reviews, and evaluations
          </p>
        </div>

        {/* Model Selection */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Model Selection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  selectedModel === model.id
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
                    : 'border-[var(--border-default)] hover:border-[var(--brand-primary)]/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Brain className="w-5 h-5 text-[var(--brand-primary)]" />
                  <span className="font-bold text-[var(--text-primary)]">{model.name}</span>
                </div>
                <p className="text-sm text-[var(--text-muted)]">{model.provider}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Rate Limits */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Rate Limits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Hints per user/day
              </label>
              <input
                type="number"
                defaultValue={5}
                className="w-full px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Reviews per user/day
              </label>
              <input
                type="number"
                defaultValue={3}
                className="w-full px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                API timeout (seconds)
              </label>
              <input
                type="number"
                defaultValue={30}
                className="w-full px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Prompt Templates */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Prompt Templates</h2>
          <div className="space-y-4">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="border border-[var(--border-default)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[var(--brand-primary)]" />
                    <h3 className="font-semibold text-[var(--text-primary)]">{prompt.name}</h3>
                  </div>
                  <button className="px-3 py-1 text-xs border border-[var(--border-default)] rounded hover:bg-[var(--surface-2)] transition-colors">
                    Edit
                  </button>
                </div>
                <CodeViewer code={prompt.template} language="text" maxHeight="100px" />
              </div>
            ))}
          </div>
        </div>

        {/* Test Sandbox */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Test Sandbox</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Test your prompts with the selected model
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Test Input
              </label>
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Enter code or problem description to test..."
                rows={6}
                className="w-full px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors resize-none font-mono text-sm"
              />
            </div>
            <button className="px-6 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Test Prompt
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity">
            Save Configuration
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
