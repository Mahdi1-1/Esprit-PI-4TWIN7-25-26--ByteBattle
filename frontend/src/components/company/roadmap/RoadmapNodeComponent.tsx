import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Circle, CheckCircle, Clock, SkipForward } from 'lucide-react';

type ProgressStatus = 'done' | 'in_progress' | 'skipped';

interface RoadmapNodeData {
  label: string;
  nodeStyle: 'required' | 'optional' | 'alternative';
  nodeType: 'topic' | 'subtopic' | 'resource';
  progressStatus: ProgressStatus | null;
  description?: string;
  resources?: any[];
}

function getStatusStyles(status: ProgressStatus | null) {
  if (status === 'done') {
    return {
      background: 'rgba(22, 163, 74, 0.1)',
      borderColor: '#16a34a',
      labelColor: '#16a34a',
      icon: <CheckCircle className="w-4 h-4 text-[#16a34a]" />,
    };
  }
  if (status === 'in_progress') {
    return {
      background: 'rgba(37, 99, 235, 0.1)',
      borderColor: '#2563eb',
      labelColor: '#2563eb',
      icon: <Clock className="w-4 h-4 text-[#2563eb]" />,
    };
  }
  if (status === 'skipped') {
    return {
      background: 'rgba(107, 114, 128, 0.1)',
      borderColor: '#6b7280',
      labelColor: '#6b7280',
      icon: <SkipForward className="w-4 h-4 text-[#6b7280]" />,
    };
  }

  return {
    background: 'var(--surface-1)',
    borderColor: 'var(--border-default)',
    labelColor: 'var(--text-primary)',
    icon: <Circle className="w-4 h-4 text-[var(--text-muted)]" />,
  };
}

function RoadmapNodeComponent({ data }: NodeProps<RoadmapNodeData>) {
  const { background, borderColor, labelColor, icon } = getStatusStyles(data.progressStatus);
  const borderStyle = data.nodeStyle === 'optional'
    ? 'dashed'
    : data.nodeStyle === 'alternative'
      ? 'dotted'
      : 'solid';

  return (
    <div
      className="min-w-[180px] max-w-[240px] px-4 py-3 cursor-pointer"
      style={{
        borderRadius: '12px',
        background,
        border: `2px solid ${borderColor}`,
        borderStyle,
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: 'var(--border-default)',
          width: 8,
          height: 8,
          border: '2px solid var(--surface-1)',
        }}
      />

      <div className="flex items-center gap-2">
        <span className="shrink-0">{icon}</span>
        <span
          className="text-sm font-semibold truncate"
          style={{ color: labelColor }}
          title={data.label}
        >
          {data.label}
        </span>
      </div>

      <div className="mt-2">
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-[var(--surface-2)] text-[var(--text-muted)]">
          {data.nodeType}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: 'var(--border-default)',
          width: 8,
          height: 8,
          border: '2px solid var(--surface-1)',
        }}
      />
    </div>
  );
}

export default RoadmapNodeComponent;
export { RoadmapNodeComponent };
