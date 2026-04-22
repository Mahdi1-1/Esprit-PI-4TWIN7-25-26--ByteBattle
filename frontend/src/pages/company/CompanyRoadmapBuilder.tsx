import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useReactFlow,
  type NodeTypes,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  Loader2,
  Eye,
  EyeOff,
  Send,
  MousePointer2,
  Check,
  PencilLine,
  Zap,
  BookOpen,
  Video,
  GraduationCap,
  FileText,
  Link2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  roadmapService,
  type RoadmapDetail,
  type RoadmapNode,
  type RoadmapProgressStatus,
  type RoadmapNodeType,
  type RoadmapNodeStyle,
  type RoadmapResource,
} from '../../services/roadmapService';
import RoadmapNodeComponent from '../../components/company/roadmap/RoadmapNodeComponent';

const nodeTypes: NodeTypes = { roadmapNode: RoadmapNodeComponent as any };
type ResourceType = 'article' | 'video' | 'course' | 'docs';
const ROADMAP_DRAFT_STORAGE_KEY = 'company-roadmap-draft-id';

type CanvasNodeData = {
  label: string;
  nodeStyle: RoadmapNodeStyle;
  nodeType: RoadmapNodeType;
  progressStatus: RoadmapProgressStatus;
  description: string;
  resources: RoadmapResource[];
} & Record<string, unknown>;

// ─── BuilderCanvas ────────────────────────────────────────────────────────────
function BuilderCanvas({
  nodes,
  edges,
  onNodeDragStop,
  onConnect,
  onPaneClick,
  onSelectNode,
  onDeleteEdge,
  previewMode,
  addMode,
}: {
  nodes: Node<CanvasNodeData>[];
  edges: Edge[];
  onNodeDragStop: (_e: unknown, n: Node<CanvasNodeData>) => void;
  onConnect: (c: Connection) => void;
  onPaneClick: (pos: { x: number; y: number }) => void;
  onSelectNode: (id: string) => void;
  onDeleteEdge: (id: string) => void;
  previewMode: boolean;
  addMode: boolean;
}) {
  const { screenToFlowPosition } = useReactFlow();

  const handlePaneClick = useCallback(
    (e: any) => {
      if (previewMode || !addMode) return;
      onPaneClick(screenToFlowPosition({ x: e.clientX, y: e.clientY }));
    },
    [previewMode, addMode, screenToFlowPosition, onPaneClick],
  );

  return (
    <div className="h-full w-full">
      <ReactFlow<Node<CanvasNodeData>, Edge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onPaneClick={handlePaneClick}
        onNodeClick={(_, n) => onSelectNode(n.id)}
        onEdgesDelete={(eds) => eds.forEach((e) => onDeleteEdge(e.id))}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={!previewMode}
        nodesConnectable={!previewMode}
        panOnScroll
        zoomOnScroll
        minZoom={0.2}
        maxZoom={2}
        deleteKeyCode="Delete"
        attributionPosition="bottom-left"
        className={
          addMode && !previewMode
            ? 'cursor-crosshair bg-[var(--surface-1)]'
            : 'bg-[var(--surface-1)]'
        }
      >
        <Background gap={20} size={1} color="var(--border-default)" />
        <Controls
          showInteractive={false}
          className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] shadow-sm"
        />
        <MiniMap
          zoomable
          pannable
          className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] shadow-sm"
          maskColor="rgba(0,0,0,0.3)"
        />
      </ReactFlow>
    </div>
  );
}

// ─── PillSelect ───────────────────────────────────────────────────────────────
function PillSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; color: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors duration-150 ${
              active
                ? 'bg-[var(--brand-primary)] text-white'
                : 'border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)]/40 hover:text-[var(--text-primary)]'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── EditableTitle ────────────────────────────────────────────────────────────
function EditableTitle({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== value) onSave(draft.trim());
    else setDraft(value);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="w-52 rounded-md border border-[var(--brand-primary)]/50 bg-[var(--surface-2)] px-2.5 py-1 text-sm font-semibold text-[var(--text-primary)] outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className="group flex max-w-[220px] items-center gap-1.5 rounded-md px-2 py-1 text-left transition-colors duration-150 hover:bg-[var(--surface-2)]"
    >
      <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{value}</span>
      <PencilLine className="h-3 w-3 shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
    </button>
  );
}

// ─── Resource helpers ─────────────────────────────────────────────────────────
function ResourceIcon({ type }: { type: string }) {
  const cls = 'h-3.5 w-3.5 shrink-0';
  if (type === 'video') return <Video className={cls} />;
  if (type === 'course') return <GraduationCap className={cls} />;
  if (type === 'docs') return <BookOpen className={cls} />;
  return <FileText className={cls} />;
}

const RESOURCE_COLOR_CLASS: Record<string, string> = {
  article: 'text-[var(--brand-secondary)]',
  video: 'text-[var(--brand-primary)]',
  course: 'text-[var(--state-success)]',
  docs: 'text-[var(--text-secondary)]',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export function CompanyRoadmapBuilder() {
  const { roadmapId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [roadmap, setRoadmap] = useState<RoadmapDetail | null>(null);
  const [nodes, setNodes] = useState<Node<CanvasNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [addMode, setAddMode] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [addForm, setAddForm] = useState({
    title: '',
    description: '',
    type: 'topic' as RoadmapNodeType,
    style: 'required' as RoadmapNodeStyle,
  });
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    type: 'topic' as RoadmapNodeType,
    style: 'required' as RoadmapNodeStyle,
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceType, setNewResourceType] = useState<ResourceType>('article');
  const [savingNode, setSavingNode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [panelTab, setPanelTab] = useState<'properties' | 'resources'>('properties');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canManage = user?.companyRole === 'owner' || user?.companyRole === 'recruiter';

  useEffect(() => {
    if (!user) return;
    if (!canManage) {
      navigate(roadmapId ? `/company/roadmaps/${roadmapId}` : '/company/roadmaps', {
        replace: true,
      });
      return;
    }
    const run = async () => {
      if (!roadmapId) {
        const stored = localStorage.getItem(ROADMAP_DRAFT_STORAGE_KEY);
        if (stored) {
          navigate(`/company/roadmaps/${stored}/build`, { replace: true });
          return;
        }
        try {
          setLoading(true);
          const created = await roadmapService.createRoadmap({ title: 'Untitled Roadmap' });
          localStorage.setItem(ROADMAP_DRAFT_STORAGE_KEY, created.id);
          navigate(`/company/roadmaps/${created.id}/build`, { replace: true });
        } catch (e: any) {
          setError(e?.response?.data?.message || 'Failed to create roadmap');
          setLoading(false);
        }
        return;
      }
      try {
        setLoading(true);
        const data = await roadmapService.getRoadmapDetail(roadmapId);
        localStorage.setItem(ROADMAP_DRAFT_STORAGE_KEY, roadmapId);
        setRoadmap(data);
        setNodes(
          data.nodes.map((n) => ({
            id: n.id,
            type: 'roadmapNode',
            position: { x: n.positionX, y: n.positionY },
            data: {
              label: n.title,
              nodeStyle: n.style,
              nodeType: n.type,
              progressStatus: null,
              description: n.description || '',
              resources: n.resources || [],
            },
          })),
        );
        setEdges(
          data.edges.map((e) => ({
            id: e.id,
            source: e.sourceId,
            target: e.targetId,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
            style: { stroke: 'var(--border-default)', strokeWidth: 1.5 },
          })),
        );
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load roadmap');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user, canManage, roadmapId, navigate]);

  const handleTitleSave = useCallback(
    async (t: string) => {
      if (!roadmapId) return;
      const u = await roadmapService.updateRoadmap(roadmapId, { title: t });
      setRoadmap((c) => (c ? { ...c, title: u.title } : c));
    },
    [roadmapId],
  );

  const handleNodeDragStop = useCallback(
    async (_e: unknown, n: Node<CanvasNodeData>) => {
      if (!roadmapId) return;
      await roadmapService.updateNode(roadmapId, n.id, {
        positionX: n.position.x,
        positionY: n.position.y,
      });
      setNodes((cur) => cur.map((x) => (x.id === n.id ? { ...x, position: n.position } : x)));
    },
    [roadmapId],
  );

  const handleConnect = useCallback(
    async (connection: Connection) => {
      if (!roadmapId || !connection.source || !connection.target) return;
      const edge = await roadmapService.createEdge(roadmapId, connection.source, connection.target);
      setEdges((cur) => [
        ...cur,
        {
          id: edge.id,
          source: edge.sourceId,
          target: edge.targetId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
          style: { stroke: 'var(--border-default)', strokeWidth: 1.5 },
        },
      ]);
    },
    [roadmapId],
  );

  const handlePaneClick = useCallback(
    (pos: { x: number; y: number }) => {
      if (!addMode) return;
      setPendingPosition(pos);
    },
    [addMode],
  );

  const handleAddNode = useCallback(async () => {
    if (!roadmapId || !addForm.title.trim() || !pendingPosition) return;
    const created = await roadmapService.createNode(roadmapId, {
      title: addForm.title.trim(),
      description: addForm.description.trim() || undefined,
      type: addForm.type,
      style: addForm.style,
      positionX: pendingPosition.x,
      positionY: pendingPosition.y,
    });
    setNodes((cur) => [
      ...cur,
      {
        id: created.id,
        type: 'roadmapNode',
        position: { x: created.positionX, y: created.positionY },
        data: {
          label: created.title,
          nodeStyle: created.style,
          nodeType: created.type,
          progressStatus: null,
          description: created.description || '',
          resources: [],
        },
      },
    ]);
    setRoadmap((cur) => (cur ? { ...cur, nodes: [...cur.nodes, created] } : cur));
    setPendingPosition(null);
    setAddForm({ title: '', description: '', type: 'topic', style: 'required' });
    setAddMode(false);
  }, [roadmapId, addForm, pendingPosition]);

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      if (addMode) return;
      const match = roadmap?.nodes.find((n) => n.id === nodeId) || null;
      setSelectedNode(match);
      setConfirmDelete(false);
      setPanelTab('properties');
      if (match)
        setEditForm({
          title: match.title,
          description: match.description ?? '',
          type: match.type,
          style: match.style,
        });
    },
    [roadmap, addMode],
  );

  const handleUpdateNode = useCallback(async () => {
    if (!roadmapId || !selectedNode) return;
    setSavingNode(true);
    try {
      const updated = await roadmapService.updateNode(roadmapId, selectedNode.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        type: editForm.type,
        style: editForm.style,
      });
      setNodes((cur) =>
        cur.map((n) =>
          n.id === updated.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  label: updated.title,
                  nodeStyle: updated.style,
                  nodeType: updated.type,
                  description: updated.description || '',
                },
              }
            : n,
        ),
      );
      setRoadmap((cur) =>
        cur ? { ...cur, nodes: cur.nodes.map((n) => (n.id === updated.id ? updated : n)) } : cur,
      );
      setSelectedNode(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2200);
    } finally {
      setSavingNode(false);
    }
  }, [roadmapId, selectedNode, editForm]);

  const handleDeleteNode = useCallback(async () => {
    if (!roadmapId || !selectedNode) return;
    await roadmapService.deleteNode(roadmapId, selectedNode.id);
    setNodes((cur) => cur.filter((n) => n.id !== selectedNode.id));
    setEdges((cur) =>
      cur.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id),
    );
    setRoadmap((cur) =>
      cur
        ? {
            ...cur,
            nodes: cur.nodes.filter((n) => n.id !== selectedNode.id),
            edges: cur.edges.filter(
              (e) => e.sourceId !== selectedNode.id && e.targetId !== selectedNode.id,
            ),
          }
        : cur,
    );
    setSelectedNode(null);
    setConfirmDelete(false);
  }, [roadmapId, selectedNode]);

  const handleDeleteEdge = useCallback(
    async (edgeId: string) => {
      if (!roadmapId) return;
      await roadmapService.deleteEdge(roadmapId, edgeId);
      setEdges((cur) => cur.filter((e) => e.id !== edgeId));
    },
    [roadmapId],
  );

  const handlePublishToggle = useCallback(async () => {
    if (!roadmapId || !roadmap) return;
    setPublishLoading(true);
    try {
      const u = await roadmapService.updateRoadmap(roadmapId, {
        isPublished: !roadmap.isPublished,
      });
      setRoadmap((cur) => (cur ? { ...cur, isPublished: u.isPublished } : cur));
    } finally {
      setPublishLoading(false);
    }
  }, [roadmapId, roadmap]);

  const handleAddResource = useCallback(async () => {
    if (!roadmapId || !selectedNode || !newResourceTitle.trim() || !newResourceUrl.trim()) return;
    const created = await roadmapService.createResource(roadmapId, selectedNode.id, {
      title: newResourceTitle.trim(),
      url: newResourceUrl.trim(),
      type: newResourceType,
    });
    setSelectedNode((cur) => (cur ? { ...cur, resources: [...cur.resources, created] } : cur));
    setRoadmap((cur) =>
      cur
        ? {
            ...cur,
            nodes: cur.nodes.map((n) =>
              n.id === selectedNode.id
                ? { ...n, resources: [...(n.resources ?? []), created] }
                : n,
            ),
          }
        : cur,
    );
    setNodes((cur) =>
      cur.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, resources: [...(n.data.resources ?? []), created] } }
          : n,
      ),
    );
    setNewResourceTitle('');
    setNewResourceUrl('');
    setNewResourceType('article');
  }, [roadmapId, selectedNode, newResourceTitle, newResourceUrl, newResourceType]);

  const handleDeleteResource = useCallback(
    async (resourceId: string) => {
      if (!roadmapId || !selectedNode) return;
      await roadmapService.deleteResource(roadmapId, selectedNode.id, resourceId);
      setSelectedNode((cur) =>
        cur ? { ...cur, resources: cur.resources.filter((r) => r.id !== resourceId) } : cur,
      );
      setNodes((cur) =>
        cur.map((n) =>
          n.id === selectedNode.id
            ? {
                ...n,
                data: { ...n.data, resources: n.data.resources.filter((r) => r.id !== resourceId) },
              }
            : n,
        ),
      );
    },
    [roadmapId, selectedNode],
  );

  // ─── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--surface-1)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-primary)]" />
          <p className="text-xs font-medium text-[var(--text-muted)]">Loading builder…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--surface-1)] p-6">
        <div className="max-w-sm rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-8 text-center">
          <X className="mx-auto mb-3 h-6 w-6 text-[var(--state-error)]" />
          <p className="mb-5 text-sm text-[var(--text-primary)]">{error}</p>
          <button
            onClick={() => navigate('/company/roadmaps')}
            className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
          >
            Back to Roadmaps
          </button>
        </div>
      </div>
    );
  }

  const typeOptions = [
    { value: 'topic' as RoadmapNodeType, label: 'Topic', color: 'var(--brand-primary)' },
    { value: 'subtopic' as RoadmapNodeType, label: 'Subtopic', color: 'var(--brand-secondary)' },
    { value: 'resource' as RoadmapNodeType, label: 'Resource', color: 'var(--state-success)' },
  ];
  const styleOptions = [
    { value: 'required' as RoadmapNodeStyle, label: 'Required', color: 'var(--brand-primary)' },
    { value: 'optional' as RoadmapNodeStyle, label: 'Optional', color: 'var(--text-secondary)' },
    { value: 'alternative' as RoadmapNodeStyle, label: 'Alt', color: 'var(--brand-secondary)' },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--surface-1)]">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header className="z-20 flex h-12 shrink-0 items-center justify-between border-b border-[var(--border-default)] bg-[var(--surface-1)] px-3 sm:px-4">

        {/* Left: back + title + status */}
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={() => navigate('/company/roadmaps')}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-px bg-[var(--border-default)]" />

          {roadmap && <EditableTitle value={roadmap.title} onSave={handleTitleSave} />}

          {roadmap && (
            <span
              className={`hidden items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold sm:inline-flex ${
                roadmap.isPublished
                  ? 'bg-[var(--state-success)]/10 text-[var(--state-success)]'
                  : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
              }`}
            >
              {roadmap.isPublished && (
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--state-success)]" />
              )}
              {roadmap.isPublished ? 'Live' : 'Draft'}
            </span>
          )}
        </div>

        {/* Center: stats */}
        <div className="hidden items-center gap-3 lg:flex">
          {[
            { l: 'Nodes', v: roadmap?.nodes.length ?? 0 },
            { l: 'Edges', v: roadmap?.edges.length ?? 0 },
          ].map(({ l, v }) => (
            <div key={l} className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{v}</span>
              <span className="text-xs text-[var(--text-muted)]">{l}</span>
            </div>
          ))}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode((p) => !p)}
            className={`hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:inline-flex ${
              previewMode
                ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                : 'border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'
            }`}
          >
            {previewMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {previewMode ? 'Exit Preview' : 'Preview'}
          </button>

          <button
            onClick={handlePublishToggle}
            disabled={publishLoading}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
              roadmap?.isPublished
                ? 'border border-[var(--state-success)]/30 bg-[var(--state-success)]/10 text-[var(--state-success)] hover:bg-[var(--state-success)]/15'
                : 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary)]/90'
            }`}
          >
            {publishLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {roadmap?.isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </header>

      {/* ── Canvas area ──────────────────────────────────────────────────────── */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">

        {/* Left toolbar */}
        {!previewMode && (
          <div className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-1.5 shadow-sm">
            <ToolBtn
              active={!addMode}
              icon={<MousePointer2 className="h-3.5 w-3.5" />}
              label="Select"
              onClick={() => setAddMode(false)}
            />
            <ToolBtn
              active={addMode}
              icon={<Plus className="h-3.5 w-3.5" />}
              label="Add Node"
              onClick={() => setAddMode(true)}
            />
          </div>
        )}

        {/* Add-mode hint */}
        {addMode && !previewMode && (
          <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/10 px-4 py-1.5 text-xs font-medium text-[var(--brand-primary)]">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Click anywhere on the canvas to place a node
            </span>
          </div>
        )}

        {/* Empty state */}
        {!loading && nodes.length === 0 && !addMode && (
          <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
            <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-1)] px-8 py-8 text-center">
              <Zap className="mx-auto mb-2.5 h-6 w-6 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                Select the + tool, then click the canvas to add your first node.
              </p>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="relative min-w-0 flex-1">
          <ReactFlowProvider>
            <BuilderCanvas
              nodes={nodes}
              edges={edges}
              onNodeDragStop={handleNodeDragStop}
              onConnect={handleConnect}
              onPaneClick={handlePaneClick}
              onSelectNode={handleSelectNode}
              onDeleteEdge={handleDeleteEdge}
              previewMode={previewMode}
              addMode={addMode}
            />
          </ReactFlowProvider>
        </div>

        {/* ── Node editor panel ────────────────────────────────────────────── */}
        {selectedNode && !previewMode && (
          <aside className="z-10 flex w-[320px] shrink-0 flex-col border-l border-[var(--border-default)] bg-[var(--surface-1)]">

            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {selectedNode.title}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Node properties</p>
              </div>
              <button
                onClick={() => {
                  setSelectedNode(null);
                  setConfirmDelete(false);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Panel tabs */}
            <div className="flex border-b border-[var(--border-default)] px-4">
              {(['properties', 'resources'] as const).map((tab) => {
                const active = panelTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setPanelTab(tab)}
                    className={`relative mr-4 py-2.5 text-xs font-medium capitalize transition-colors duration-150 ${
                      active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {tab}
                    {tab === 'resources' && (selectedNode.resources?.length ?? 0) > 0 && (
                      <span className="ml-1.5 rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--text-secondary)]">
                        {selectedNode.resources.length}
                      </span>
                    )}
                    {active && (
                      <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--brand-primary)]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Panel content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {panelTab === 'properties' && (
                <div className="space-y-4">
                  <Field label="Title">
                    <StyledInput
                      value={editForm.title}
                      onChange={(v) => setEditForm((p) => ({ ...p, title: v }))}
                    />
                  </Field>

                  <Field label="Description">
                    <StyledTextarea
                      value={editForm.description}
                      onChange={(v) => setEditForm((p) => ({ ...p, description: v }))}
                      placeholder="What should learners know?"
                    />
                  </Field>

                  <Field label="Type">
                    <PillSelect
                      value={editForm.type}
                      options={typeOptions}
                      onChange={(v) => setEditForm((p) => ({ ...p, type: v }))}
                    />
                  </Field>

                  <Field label="Style">
                    <PillSelect
                      value={editForm.style}
                      options={styleOptions}
                      onChange={(v) => setEditForm((p) => ({ ...p, style: v }))}
                    />
                  </Field>

                  <button
                    onClick={handleUpdateNode}
                    disabled={savingNode}
                    className={`w-full rounded-md py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                      saveSuccess
                        ? 'bg-[var(--state-success)]/10 text-[var(--state-success)]'
                        : 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary)]/90'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {savingNode ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      {saveSuccess ? 'Saved' : 'Save Changes'}
                    </span>
                  </button>

                  <div className="pt-1">
                    {!confirmDelete ? (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--state-error)]/8 hover:text-[var(--state-error)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete node
                      </button>
                    ) : (
                      <div className="rounded-lg border border-[var(--state-error)]/20 bg-[var(--state-error)]/5 p-3">
                        <p className="mb-3 text-center text-xs text-[var(--text-secondary)]">
                          Delete this node permanently?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmDelete(false)}
                            className="flex-1 rounded-md border border-[var(--border-default)] bg-[var(--surface-1)] py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDeleteNode}
                            className="flex-1 rounded-md bg-[var(--state-error)]/15 py-1.5 text-xs font-semibold text-[var(--state-error)] transition-colors hover:bg-[var(--state-error)]/25"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {panelTab === 'resources' && (
                <div className="space-y-3">
                  {(selectedNode.resources?.length ?? 0) === 0 ? (
                    <div className="rounded-lg border border-dashed border-[var(--border-default)] py-8 text-center">
                      <Link2 className="mx-auto mb-2 h-5 w-5 text-[var(--text-muted)]" />
                      <p className="text-xs text-[var(--text-muted)]">No resources yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedNode.resources.map((r) => (
                        <div
                          key={r.id}
                          className="group flex items-center gap-2.5 rounded-md border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2 transition-colors hover:bg-[var(--surface-2)]"
                        >
                          <span className={RESOURCE_COLOR_CLASS[r.type] ?? 'text-[var(--text-secondary)]'}>
                            <ResourceIcon type={r.type} />
                          </span>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="min-w-0 flex-1 truncate text-xs text-[var(--text-primary)] hover:text-[var(--brand-primary)]"
                          >
                            {r.title}
                          </a>
                          <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                            {r.type}
                          </span>
                          <button
                            onClick={() => handleDeleteResource(r.id)}
                            className="text-[var(--text-muted)] opacity-0 transition-opacity hover:text-[var(--state-error)] group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add resource form */}
                  <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)]/50 p-3">
                    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Add resource
                    </p>
                    <div className="space-y-2">
                      <StyledInput
                        value={newResourceTitle}
                        onChange={setNewResourceTitle}
                        placeholder="Resource title"
                        small
                      />
                      <StyledInput
                        value={newResourceUrl}
                        onChange={setNewResourceUrl}
                        placeholder="https://…"
                        small
                      />
                      <div className="flex gap-2">
                        <select
                          value={newResourceType}
                          onChange={(e) => setNewResourceType(e.target.value as ResourceType)}
                          className="flex-1 rounded-md border border-[var(--border-default)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--brand-primary)]"
                        >
                          <option value="article">Article</option>
                          <option value="video">Video</option>
                          <option value="course">Course</option>
                          <option value="docs">Docs</option>
                        </select>
                        <button
                          onClick={handleAddResource}
                          disabled={!newResourceTitle.trim() || !newResourceUrl.trim()}
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--brand-primary)] text-white transition-colors hover:bg-[var(--brand-primary)]/90 disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ── Add-node modal ────────────────────────────────────────────────────── */}
      {pendingPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] shadow-xl">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Add Node</h2>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Define the next step in your roadmap.
                </p>
              </div>
              <button
                onClick={() => {
                  setPendingPosition(null);
                  setAddMode(false);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-4 px-5 py-5">
              <Field label="Title" required>
                <StyledInput
                  value={addForm.title}
                  onChange={(v) => setAddForm((p) => ({ ...p, title: v }))}
                  placeholder="e.g. HTML & CSS Basics"
                  onEnter={handleAddNode}
                />
              </Field>

              <Field label="Description">
                <StyledTextarea
                  value={addForm.description}
                  onChange={(v) => setAddForm((p) => ({ ...p, description: v }))}
                  placeholder="What does this step teach?"
                  rows={3}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Type">
                  <PillSelect
                    value={addForm.type}
                    options={typeOptions}
                    onChange={(v) => setAddForm((p) => ({ ...p, type: v }))}
                  />
                </Field>
                <Field label="Style">
                  <PillSelect
                    value={addForm.style}
                    options={styleOptions}
                    onChange={(v) => setAddForm((p) => ({ ...p, style: v }))}
                  />
                </Field>
              </div>

              {/* Modal actions */}
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => {
                    setPendingPosition(null);
                    setAddMode(false);
                  }}
                  className="flex-1 rounded-md border border-[var(--border-default)] bg-[var(--surface-1)] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNode}
                  disabled={!addForm.title.trim()}
                  className="flex-1 rounded-md bg-[var(--brand-primary)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-primary)]/90 disabled:opacity-40"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Plus className="h-4 w-4" />
                    Add Node
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function ToolBtn({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={`group relative flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150 ${
        active
          ? 'bg-[var(--brand-primary)] text-white'
          : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'
      }`}
    >
      {icon}
      <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md border border-[var(--border-default)] bg-[var(--surface-1)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)] opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--brand-primary)]">*</span>}
      </label>
      {children}
    </div>
  );
}

function StyledInput({
  value,
  onChange,
  placeholder,
  small,
  onEnter,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  small?: boolean;
  onEnter?: () => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
      placeholder={placeholder}
      className={`w-full rounded-md border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:bg-[var(--surface-1)] ${
        small ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
      }`}
    />
  );
}

function StyledTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-md border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:bg-[var(--surface-1)]"
    />
  );
}

export default CompanyRoadmapBuilder;