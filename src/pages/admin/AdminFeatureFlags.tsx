import { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Breadcrumb } from '../../components/admin/AdminComponents';
import { ToggleLeft, ToggleRight } from 'lucide-react';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'features' | 'modes' | 'experimental';
}

export function AdminFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([
    {
      id: 'duels',
      name: 'Duels Mode',
      description: '1v1 real-time coding battles',
      enabled: true,
      category: 'modes'
    },
    {
      id: 'hackathons',
      name: 'Hackathons',
      description: 'ICPC-style team competitions',
      enabled: true,
      category: 'modes'
    },
    {
      id: 'canvas',
      name: 'Canvas Challenges',
      description: 'Architecture drawing challenges',
      enabled: true,
      category: 'modes'
    },
    {
      id: 'betting',
      name: 'XP Betting',
      description: 'Bet XP on duel outcomes',
      enabled: false,
      category: 'features'
    },
    {
      id: 'ugc',
      name: 'User-Generated Content',
      description: 'Allow users to create problems',
      enabled: false,
      category: 'features'
    },
    {
      id: 'replay',
      name: 'Replay System',
      description: 'Watch recordings of duels',
      enabled: false,
      category: 'features'
    },
    {
      id: 'ai_copilot',
      name: 'AI Copilot (Experimental)',
      description: 'AI-powered coding assistant',
      enabled: false,
      category: 'experimental'
    },
    {
      id: 'voice_chat',
      name: 'Voice Chat (Experimental)',
      description: 'Voice communication during duels',
      enabled: false,
      category: 'experimental'
    }
  ]);

  const toggleFlag = (id: string) => {
    setFlags((prev) =>
      prev.map((flag) => (flag.id === id ? { ...flag, enabled: !flag.enabled } : flag))
    );
  };

  const categories = [
    { id: 'modes', label: 'Game Modes' },
    { id: 'features', label: 'Features' },
    { id: 'experimental', label: 'Experimental' }
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <Breadcrumb items={[{ label: 'Admin' }, { label: 'Feature Flags' }]} />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Feature Flags</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Enable or disable features across the platform
          </p>
        </div>

        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6"
          >
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">{category.label}</h2>
            <div className="space-y-4">
              {flags
                .filter((flag) => flag.category === category.id)
                .map((flag) => (
                  <div
                    key={flag.id}
                    className="flex items-center justify-between py-3 border-b border-[var(--border-default)] last:border-0"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--text-primary)] mb-1">{flag.name}</h3>
                      <p className="text-sm text-[var(--text-muted)]">{flag.description}</p>
                    </div>
                    <button
                      onClick={() => toggleFlag(flag.id)}
                      className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        flag.enabled
                          ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                          : 'bg-gray-500/10 text-gray-500 border border-gray-500/30'
                      }`}
                    >
                      {flag.enabled ? (
                        <>
                          <ToggleRight className="w-5 h-5" />
                          <span className="text-sm font-medium">Enabled</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5" />
                          <span className="text-sm font-medium">Disabled</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* Environment Selector */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Environment</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Changes will apply to the selected environment
          </p>
          <div className="flex gap-3">
            {['Development', 'Staging', 'Production'].map((env) => (
              <button
                key={env}
                className={`px-4 py-2 border-2 rounded-lg transition-colors ${
                  env === 'Development'
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
                    : 'border-[var(--border-default)] hover:border-[var(--brand-primary)]/50'
                }`}
              >
                {env}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
