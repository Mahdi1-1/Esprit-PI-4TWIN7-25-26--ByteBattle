import { CheckCircle2, RotateCcw, ArrowRight, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RoadmapNode, RoadmapProgressStatus } from '../../../services/roadmapService';

interface NodeDetailPanelProps {
  isOpen: boolean;
  node: RoadmapNode | null;
  progressStatus: RoadmapProgressStatus;
  onClose: () => void;
  onStatusChange: (status: RoadmapProgressStatus) => void;
}

const buttonClasses = 'flex-1 px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-default)] text-sm font-medium transition-colors';

export function NodeDetailPanel({ isOpen, node, progressStatus, onClose, onStatusChange }: NodeDetailPanelProps) {
  if (!isOpen || !node) {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 z-50 h-full w-full max-w-[400px] bg-[var(--surface-1)] border-l border-[var(--border-default)] shadow-2xl overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">{node.title}</h2>
          <p className="text-xs text-[var(--text-muted)]">{node.type} · {node.style}</p>
        </div>
        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onStatusChange('done')}
              className={`${buttonClasses} ${progressStatus === 'done' ? 'bg-[var(--state-success)]/15 text-[var(--state-success)] border-[var(--state-success)]' : 'hover:bg-[var(--surface-2)]'}`}
            >
              <CheckCircle2 className="w-4 h-4 inline-block mr-1" /> Done
            </button>
            <button
              onClick={() => onStatusChange('in_progress')}
              className={`${buttonClasses} ${progressStatus === 'in_progress' ? 'bg-[var(--state-info)]/15 text-[var(--state-info)] border-[var(--state-info)]' : 'hover:bg-[var(--surface-2)]'}`}
            >
              <RotateCcw className="w-4 h-4 inline-block mr-1" /> In Progress
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onStatusChange('skipped')}
              className={`${buttonClasses} ${progressStatus === 'skipped' ? 'bg-[var(--text-muted)]/15 text-[var(--text-muted)] border-[var(--text-muted)]' : 'hover:bg-[var(--surface-2)]'}`}
            >
              <ArrowRight className="w-4 h-4 inline-block mr-1" /> Skip
            </button>
            <button
              onClick={() => onStatusChange(null)}
              className={`${buttonClasses} hover:bg-[var(--surface-2)] text-[var(--text-secondary)]`}
            >
              <X className="w-4 h-4 inline-block mr-1" /> Clear
            </button>
          </div>
        </div>

        <div className="h-px bg-[var(--border-default)]" />

        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Description</h3>
          {node.description ? (
            <div className="prose prose-sm max-w-none text-[var(--text-secondary)] prose-a:text-[var(--brand-primary)] prose-a:underline">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{node.description}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-[var(--text-muted)]">No description provided.</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Resources</h3>
          {node.resources.length === 0 ? (
            <p className="text-[var(--text-muted)]">No resources added yet.</p>
          ) : (
            <div className="space-y-3">
              {node.resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-2)] px-4 py-3 hover:border-[var(--brand-primary)] transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{resource.title}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{resource.type}</p>
                    </div>
                    <span className="text-[var(--brand-primary)] text-xs">Open</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
