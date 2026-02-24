// components/GraphVisualizer.tsx

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  GitBranch,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type NodeState = 'default' | 'current' | 'visiting' | 'visited' | 'path' | 'start' | 'end';
type EdgeState = 'default' | 'active' | 'path' | 'considering';
type AnimationState = 'idle' | 'running' | 'paused' | 'completed';

interface GNode {
  id: string;
  value: number;
  x: number;
  y: number;
  state: NodeState;
  distance?: number;
}

interface GEdge {
  from: string;
  to: string;
  weight?: number;
  state: EdgeState;
}

interface AnimationStep {
  type: 'visit' | 'explore' | 'enqueue' | 'dequeue' | 'found' | 'complete' | 'backtrack';
  nodeId?: string;
  edgeKey?: string;
  visitedNodes: Set<string>;
  visitedEdges: Set<string>;
  currentPath: string[];
  queue?: string[];
  stack?: string[];
  message: string;
}

interface SearchResult {
  found: boolean;
  path: string[];
  steps: AnimationStep[];
  visitOrder: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRAPH ALGORITHMS
// ═══════════════════════════════════════════════════════════════════════════════

const getNeighbors = (
  nodeId: string,
  edges: GEdge[],
  graphType: 'directed' | 'undirected'
): { neighborId: string; edgeKey: string }[] => {
  const neighbors: { neighborId: string; edgeKey: string }[] = [];

  edges.forEach(edge => {
    if (edge.from === nodeId) {
      neighbors.push({ neighborId: edge.to, edgeKey: `${edge.from}-${edge.to}` });
    }
    if (graphType === 'undirected' && edge.to === nodeId) {
      neighbors.push({ neighborId: edge.from, edgeKey: `${edge.from}-${edge.to}` });
    }
  });

  return neighbors;
};

const bfsWithSteps = (
  nodes: GNode[],
  edges: GEdge[],
  startId: string,
  endId: string,
  graphType: 'directed' | 'undirected'
): SearchResult => {
  const steps: AnimationStep[] = [];
  const visited = new Set<string>();
  const visitedEdges = new Set<string>();
  const queue: string[] = [startId];
  const parent = new Map<string, string | null>();
  const visitOrder: string[] = [];

  visited.add(startId);
  parent.set(startId, null);

  steps.push({
    type: 'enqueue',
    nodeId: startId,
    visitedNodes: new Set(visited),
    visitedEdges: new Set(visitedEdges),
    currentPath: [],
    queue: [...queue],
    message: `Starting BFS from node ${nodes.find(n => n.id === startId)?.value}`,
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    visitOrder.push(current);
    const currentValue = nodes.find(n => n.id === current)?.value;

    steps.push({
      type: 'dequeue',
      nodeId: current,
      visitedNodes: new Set(visited),
      visitedEdges: new Set(visitedEdges),
      currentPath: [],
      queue: [...queue],
      message: `Dequeued node ${currentValue} - exploring neighbors`,
    });

    if (current === endId) {
      // Reconstruct path
      const path: string[] = [];
      let c: string | null | undefined = endId;
      while (c) {
        path.unshift(c);
        c = parent.get(c);
      }

      // Mark path edges
      const pathEdges = new Set<string>();
      for (let i = 0; i < path.length - 1; i++) {
        const edge = edges.find(
          e =>
            (e.from === path[i] && e.to === path[i + 1]) ||
            (graphType === 'undirected' && e.from === path[i + 1] && e.to === path[i])
        );
        if (edge) pathEdges.add(`${edge.from}-${edge.to}`);
      }

      steps.push({
        type: 'found',
        nodeId: endId,
        visitedNodes: new Set(visited),
        visitedEdges: pathEdges,
        currentPath: path,
        queue: [],
        message: `Found target! Path: ${path.map(id => nodes.find(n => n.id === id)?.value).join(' → ')}`,
      });

      return { found: true, path, steps, visitOrder };
    }

    const neighbors = getNeighbors(current, edges, graphType);

    for (const { neighborId, edgeKey } of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        visitedEdges.add(edgeKey);
        queue.push(neighborId);
        parent.set(neighborId, current);

        const neighborValue = nodes.find(n => n.id === neighborId)?.value;

        steps.push({
          type: 'explore',
          nodeId: neighborId,
          edgeKey,
          visitedNodes: new Set(visited),
          visitedEdges: new Set(visitedEdges),
          currentPath: [],
          queue: [...queue],
          message: `Discovered node ${neighborValue} from ${currentValue}`,
        });
      }
    }
  }

  steps.push({
    type: 'complete',
    visitedNodes: new Set(visited),
    visitedEdges: new Set(visitedEdges),
    currentPath: [],
    queue: [],
    message: 'BFS complete - no path found',
  });

  return { found: false, path: [], steps, visitOrder };
};

const dfsWithSteps = (
  nodes: GNode[],
  edges: GEdge[],
  startId: string,
  endId: string,
  graphType: 'directed' | 'undirected'
): SearchResult => {
  const steps: AnimationStep[] = [];
  const visited = new Set<string>();
  const visitedEdges = new Set<string>();
  const path: string[] = [];
  const visitOrder: string[] = [];
  let found = false;

  const dfsRecursive = (nodeId: string): boolean => {
    if (found) return true;

    visited.add(nodeId);
    visitOrder.push(nodeId);
    path.push(nodeId);

    const nodeValue = nodes.find(n => n.id === nodeId)?.value;

    steps.push({
      type: 'visit',
      nodeId,
      visitedNodes: new Set(visited),
      visitedEdges: new Set(visitedEdges),
      currentPath: [...path],
      stack: [...path],
      message: `Visiting node ${nodeValue}`,
    });

    if (nodeId === endId) {
      found = true;
      steps.push({
        type: 'found',
        nodeId,
        visitedNodes: new Set(visited),
        visitedEdges: new Set(visitedEdges),
        currentPath: [...path],
        stack: [...path],
        message: `Found target! Path: ${path.map(id => nodes.find(n => n.id === id)?.value).join(' → ')}`,
      });
      return true;
    }

    const neighbors = getNeighbors(nodeId, edges, graphType);

    for (const { neighborId, edgeKey } of neighbors) {
      if (!visited.has(neighborId)) {
        visitedEdges.add(edgeKey);

        steps.push({
          type: 'explore',
          nodeId: neighborId,
          edgeKey,
          visitedNodes: new Set(visited),
          visitedEdges: new Set(visitedEdges),
          currentPath: [...path],
          stack: [...path, neighborId],
          message: `Exploring edge to ${nodes.find(n => n.id === neighborId)?.value}`,
        });

        if (dfsRecursive(neighborId)) {
          return true;
        }
      }
    }

    path.pop();

    if (!found && path.length > 0) {
      steps.push({
        type: 'backtrack',
        nodeId,
        visitedNodes: new Set(visited),
        visitedEdges: new Set(visitedEdges),
        currentPath: [...path],
        stack: [...path],
        message: `Backtracking from node ${nodeValue}`,
      });
    }

    return false;
  };

  steps.push({
    type: 'visit',
    nodeId: startId,
    visitedNodes: new Set(),
    visitedEdges: new Set(),
    currentPath: [],
    stack: [startId],
    message: `Starting DFS from node ${nodes.find(n => n.id === startId)?.value}`,
  });

  dfsRecursive(startId);

  if (!found) {
    steps.push({
      type: 'complete',
      visitedNodes: new Set(visited),
      visitedEdges: new Set(visitedEdges),
      currentPath: [],
      stack: [],
      message: 'DFS complete - no path found',
    });
  }

  return { found, path: found ? path : [], steps, visitOrder };
};

const dijkstraWithSteps = (
  nodes: GNode[],
  edges: GEdge[],
  startId: string,
  endId: string,
  graphType: 'directed' | 'undirected'
): SearchResult => {
  const steps: AnimationStep[] = [];
  const distances = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const visited = new Set<string>();
  const visitedEdges = new Set<string>();
  const visitOrder: string[] = [];

  // Initialize
  nodes.forEach(node => {
    distances.set(node.id, node.id === startId ? 0 : Infinity);
    parent.set(node.id, null);
  });

  steps.push({
    type: 'visit',
    nodeId: startId,
    visitedNodes: new Set(),
    visitedEdges: new Set(),
    currentPath: [],
    message: `Starting Dijkstra from node ${nodes.find(n => n.id === startId)?.value}`,
  });

  while (visited.size < nodes.length) {
    // Find minimum distance unvisited node
    let minDist = Infinity;
    let minNode: string | null = null;

    distances.forEach((dist, nodeId) => {
      if (!visited.has(nodeId) && dist < minDist) {
        minDist = dist;
        minNode = nodeId;
      }
    });

    if (minNode === null || minDist === Infinity) break;

    visited.add(minNode);
    visitOrder.push(minNode);

    const currentValue = nodes.find(n => n.id === minNode)?.value;

    steps.push({
      type: 'dequeue',
      nodeId: minNode,
      visitedNodes: new Set(visited),
      visitedEdges: new Set(visitedEdges),
      currentPath: [],
      message: `Processing node ${currentValue} with distance ${minDist}`,
    });

    if (minNode === endId) {
      // Reconstruct path
      const path: string[] = [];
      let c: string | null | undefined = endId;
      while (c) {
        path.unshift(c);
        c = parent.get(c);
      }

      const pathEdges = new Set<string>();
      for (let i = 0; i < path.length - 1; i++) {
        const edge = edges.find(
          e =>
            (e.from === path[i] && e.to === path[i + 1]) ||
            (graphType === 'undirected' && e.from === path[i + 1] && e.to === path[i])
        );
        if (edge) pathEdges.add(`${edge.from}-${edge.to}`);
      }

      steps.push({
        type: 'found',
        nodeId: endId,
        visitedNodes: new Set(visited),
        visitedEdges: pathEdges,
        currentPath: path,
        message: `Shortest path found! Distance: ${distances.get(endId)}`,
      });

      return { found: true, path, steps, visitOrder };
    }

    // Update neighbors
    const neighbors = getNeighbors(minNode, edges, graphType);

    for (const { neighborId, edgeKey } of neighbors) {
      if (!visited.has(neighborId)) {
        const edge = edges.find(
          e =>
            (e.from === minNode && e.to === neighborId) ||
            (graphType === 'undirected' && e.from === neighborId && e.to === minNode)
        );
        const weight = edge?.weight ?? 1;
        const newDist = (distances.get(minNode) ?? Infinity) + weight;

        if (newDist < (distances.get(neighborId) ?? Infinity)) {
          distances.set(neighborId, newDist);
          parent.set(neighborId, minNode);
          visitedEdges.add(edgeKey);

          const neighborValue = nodes.find(n => n.id === neighborId)?.value;

          steps.push({
            type: 'explore',
            nodeId: neighborId,
            edgeKey,
            visitedNodes: new Set(visited),
            visitedEdges: new Set(visitedEdges),
            currentPath: [],
            message: `Updated distance to ${neighborValue}: ${newDist}`,
          });
        }
      }
    }
  }

  steps.push({
    type: 'complete',
    visitedNodes: new Set(visited),
    visitedEdges: new Set(visitedEdges),
    currentPath: [],
    message: 'Dijkstra complete - no path found',
  });

  return { found: false, path: [], steps, visitOrder };
};

// ═══════════════════════════════════════════════════════════════════════════════
// SAMPLE GRAPHS
// ═══════════════════════════════════════════════════════════════════════════════

const sampleGraphs = {
  basic: {
    nodes: [
      { id: '1', value: 1, x: 120, y: 120, state: 'default' as NodeState },
      { id: '2', value: 2, x: 320, y: 70, state: 'default' as NodeState },
      { id: '3', value: 3, x: 520, y: 120, state: 'default' as NodeState },
      { id: '4', value: 4, x: 170, y: 300, state: 'default' as NodeState },
      { id: '5', value: 5, x: 370, y: 320, state: 'default' as NodeState },
      { id: '6', value: 6, x: 520, y: 280, state: 'default' as NodeState },
    ],
    edges: [
      { from: '1', to: '2', state: 'default' as EdgeState },
      { from: '1', to: '4', state: 'default' as EdgeState },
      { from: '2', to: '3', state: 'default' as EdgeState },
      { from: '2', to: '5', state: 'default' as EdgeState },
      { from: '3', to: '6', state: 'default' as EdgeState },
      { from: '4', to: '5', state: 'default' as EdgeState },
      { from: '5', to: '6', state: 'default' as EdgeState },
    ],
  },
  weighted: {
    nodes: [
      { id: 'A', value: 1, x: 100, y: 150, state: 'default' as NodeState },
      { id: 'B', value: 2, x: 250, y: 80, state: 'default' as NodeState },
      { id: 'C', value: 3, x: 250, y: 220, state: 'default' as NodeState },
      { id: 'D', value: 4, x: 400, y: 80, state: 'default' as NodeState },
      { id: 'E', value: 5, x: 400, y: 220, state: 'default' as NodeState },
      { id: 'F', value: 6, x: 550, y: 150, state: 'default' as NodeState },
    ],
    edges: [
      { from: 'A', to: 'B', weight: 4, state: 'default' as EdgeState },
      { from: 'A', to: 'C', weight: 2, state: 'default' as EdgeState },
      { from: 'B', to: 'C', weight: 1, state: 'default' as EdgeState },
      { from: 'B', to: 'D', weight: 5, state: 'default' as EdgeState },
      { from: 'C', to: 'E', weight: 3, state: 'default' as EdgeState },
      { from: 'D', to: 'E', weight: 1, state: 'default' as EdgeState },
      { from: 'D', to: 'F', weight: 2, state: 'default' as EdgeState },
      { from: 'E', to: 'F', weight: 4, state: 'default' as EdgeState },
    ],
  },
};

const generateRandomGraph = (nodeCount: number = 6): { nodes: GNode[]; edges: GEdge[] } => {
  const nodes: GNode[] = [];
  const edges: GEdge[] = [];

  // Generate nodes in circular layout
  const centerX = 320;
  const centerY = 200;
  const radius = 140;

  for (let i = 0; i < nodeCount; i++) {
    const angle = (2 * Math.PI * i) / nodeCount - Math.PI / 2;
    nodes.push({
      id: String(i + 1),
      value: i + 1,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      state: 'default',
    });
  }

  // Generate edges
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      if (Math.random() < 0.4) {
        edges.push({
          from: String(i + 1),
          to: String(j + 1),
          weight: Math.random() > 0.5 ? Math.floor(Math.random() * 9) + 1 : undefined,
          state: 'default',
        });
      }
    }
  }

  // Ensure connectivity
  for (let i = 1; i < nodeCount; i++) {
    const hasConnection = edges.some(
      e =>
        (e.from === String(i + 1) || e.to === String(i + 1)) &&
        (e.from === String(i) || e.to === String(i))
    );
    if (!hasConnection) {
      edges.push({
        from: String(i),
        to: String(i + 1),
        state: 'default',
      });
    }
  }

  return { nodes, edges };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function GraphVisualizer() {
  // ─── Graph State ───
  const [graph, setGraph] = useState<{ nodes: GNode[]; edges: GEdge[] }>({
    nodes: [],
    edges: [],
  });
  const [graphType, setGraphType] = useState<'directed' | 'undirected'>('undirected');

  // ─── Input State ───
  const [nodeValue, setNodeValue] = useState('');
  const [fromNode, setFromNode] = useState('');
  const [toNode, setToNode] = useState('');
  const [edgeWeight, setEdgeWeight] = useState('');
  const [searchStart, setSearchStart] = useState('');
  const [searchEnd, setSearchEnd] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'bfs' | 'dfs' | 'dijkstra'>('bfs');

  // ─── Operation State ───
  const [lastOperation, setLastOperation] = useState('');

  // ─── Highlight State ───
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [highlightedEdges, setHighlightedEdges] = useState<Set<string>>(new Set());
  const [currentPath, setCurrentPath] = useState<string[]>([]);

  // ─── Animation State ───
  const [animNodeIds, setAnimNodeIds] = useState<Set<string>>(new Set());
  const [animEdgeKeys, setAnimEdgeKeys] = useState<Set<string>>(new Set());
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [animationSteps, setAnimationSteps] = useState<AnimationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [animationSpeed, setAnimationSpeed] = useState(50);
  const [stepMessage, setStepMessage] = useState('');
  const [dataStructure, setDataStructure] = useState<{ type: 'queue' | 'stack'; items: string[] } | null>(null);

  // ─── View State ───
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragNodeOffset, setDragNodeOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ─── Refs ───
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Helpers ───
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const screenToGraph = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      return {
        x: (clientX - rect.left - offset.x) / scale,
        y: (clientY - rect.top - offset.y) / scale,
      };
    },
    [offset, scale]
  );

  // ─── Node Operations ───
  const addNode = useCallback(() => {
    const value = parseInt(nodeValue);
    if (isNaN(value)) return;

    if (graph.nodes.find(n => n.value === value)) {
      toast.error('Node already exists!');
      return;
    }

    const id = generateId();
    const count = graph.nodes.length;
    const angle = count * 2.399 + Math.random() * 0.3;
    const radius = 100 + count * 25;

    const newNode: GNode = {
      id,
      value,
      x: 300 + radius * Math.cos(angle),
      y: 220 + radius * Math.sin(angle),
      state: 'default',
    };

    setAnimNodeIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      setAnimNodeIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 700);

    setGraph(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    setLastOperation(`addNode(${value})`);
    setNodeValue('');
    toast.success(`Added node ${value}`);
  }, [nodeValue, graph.nodes]);

  const removeNode = useCallback(() => {
    const value = parseInt(nodeValue);
    if (isNaN(value)) return;

    const node = graph.nodes.find(n => n.value === value);
    if (!node) {
      toast.error('Node not found!');
      return;
    }

    setGraph(prev => ({
      nodes: prev.nodes.filter(n => n.id !== node.id),
      edges: prev.edges.filter(e => e.from !== node.id && e.to !== node.id),
    }));
    setLastOperation(`removeNode(${value})`);
    setNodeValue('');
    toast.success(`Removed node ${value}`);
  }, [nodeValue, graph.nodes]);

  // ─── Edge Operations ───
  const addEdge = useCallback(() => {
    const from = parseInt(fromNode);
    const to = parseInt(toNode);
    const weight = edgeWeight ? parseInt(edgeWeight) : undefined;

    if (isNaN(from) || isNaN(to)) {
      toast.error('Invalid node values!');
      return;
    }

    const fObj = graph.nodes.find(n => n.value === from);
    const tObj = graph.nodes.find(n => n.value === to);

    if (!fObj || !tObj) {
      toast.error("One or both nodes don't exist!");
      return;
    }

    const exists = graph.edges.some(
      e =>
        (e.from === fObj.id && e.to === tObj.id) ||
        (graphType === 'undirected' && e.from === tObj.id && e.to === fObj.id)
    );

    if (exists) {
      toast.error('Edge already exists!');
      return;
    }

    const key = `${fObj.id}-${tObj.id}`;
    setAnimEdgeKeys(prev => new Set(prev).add(key));
    setTimeout(() => {
      setAnimEdgeKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 700);

    setGraph(prev => ({
      ...prev,
      edges: [...prev.edges, { from: fObj.id, to: tObj.id, weight, state: 'default' }],
    }));

    setLastOperation(`addEdge(${from}, ${to}${weight !== undefined ? `, w:${weight}` : ''})`);
    setFromNode('');
    setToNode('');
    setEdgeWeight('');
    toast.success(`Added edge ${from} → ${to}`);
  }, [fromNode, toNode, edgeWeight, graph.nodes, graph.edges, graphType]);

  // ─── Animation Control ───
  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const resetHighlights = useCallback(() => {
    setHighlightedNodes(new Set());
    setHighlightedEdges(new Set());
    setCurrentPath([]);
    setStepMessage('');
    setDataStructure(null);
    setCurrentStepIndex(-1);
    setAnimationSteps([]);
    setAnimationState('idle');
  }, []);

  const applyStep = useCallback(
    (step: AnimationStep) => {
      setHighlightedNodes(step.visitedNodes);
      setHighlightedEdges(step.visitedEdges);
      setCurrentPath(step.currentPath);
      setStepMessage(step.message);

      if (step.queue) {
        setDataStructure({
          type: 'queue',
          items: step.queue.map(id => String(graph.nodes.find(n => n.id === id)?.value)),
        });
      } else if (step.stack) {
        setDataStructure({
          type: 'stack',
          items: step.stack.map(id => String(graph.nodes.find(n => n.id === id)?.value)),
        });
      }
    },
    [graph.nodes]
  );

  const playNextStep = useCallback(() => {
    if (currentStepIndex >= animationSteps.length - 1) {
      setAnimationState('completed');
      return;
    }

    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    applyStep(animationSteps[nextIndex]);
  }, [currentStepIndex, animationSteps, applyStep]);

  // Animation loop
  useEffect(() => {
    if (animationState !== 'running') return;

    const delay = Math.max(100, 2000 - animationSpeed * 18);
    animationRef.current = setTimeout(() => {
      playNextStep();
    }, delay);

    return () => stopAnimation();
  }, [animationState, animationSpeed, playNextStep, stopAnimation]);

  const runAlgorithm = useCallback(() => {
    const start = parseInt(searchStart);
    const end = parseInt(searchEnd);

    if (isNaN(start) || isNaN(end)) {
      toast.error('Invalid start or end node!');
      return;
    }

    const sNode = graph.nodes.find(n => n.value === start);
    const eNode = graph.nodes.find(n => n.value === end);

    if (!sNode || !eNode) {
      toast.error('Start or end node not found!');
      return;
    }

    resetHighlights();

    let result: SearchResult;

    switch (selectedAlgorithm) {
      case 'bfs':
        result = bfsWithSteps(graph.nodes, graph.edges, sNode.id, eNode.id, graphType);
        break;
      case 'dfs':
        result = dfsWithSteps(graph.nodes, graph.edges, sNode.id, eNode.id, graphType);
        break;
      case 'dijkstra':
        result = dijkstraWithSteps(graph.nodes, graph.edges, sNode.id, eNode.id, graphType);
        break;
      default:
        result = bfsWithSteps(graph.nodes, graph.edges, sNode.id, eNode.id, graphType);
    }

    setAnimationSteps(result.steps);
    setCurrentStepIndex(-1);
    setAnimationState('running');
    setLastOperation(`${selectedAlgorithm.toUpperCase()}(${start}, ${end})`);
    setSearchStart('');
    setSearchEnd('');
  }, [searchStart, searchEnd, graph, graphType, selectedAlgorithm, resetHighlights]);

  const handlePlay = useCallback(() => {
    if (animationState === 'completed') {
      setCurrentStepIndex(-1);
    }
    setAnimationState('running');
  }, [animationState]);

  const handlePause = useCallback(() => {
    stopAnimation();
    setAnimationState('paused');
  }, [stopAnimation]);

  const handleStepForward = useCallback(() => {
    if (currentStepIndex < animationSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      applyStep(animationSteps[nextIndex]);
      setAnimationState('paused');
    }
  }, [currentStepIndex, animationSteps, applyStep]);

  const handleStepBackward = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      applyStep(animationSteps[prevIndex]);
      setAnimationState('paused');
    }
  }, [currentStepIndex, animationSteps, applyStep]);

  const handleReset = useCallback(() => {
    stopAnimation();
    resetHighlights();
  }, [stopAnimation, resetHighlights]);

  // ─── Graph Operations ───
  const clearGraph = useCallback(() => {
    stopAnimation();
    resetHighlights();
    setGraph({ nodes: [], edges: [] });
    setLastOperation('clear()');
    setScale(1);
    setOffset({ x: 0, y: 0 });
    toast.info('Graph cleared');
  }, [stopAnimation, resetHighlights]);

  const generateSampleGraph = useCallback(
    (type: 'basic' | 'weighted' | 'random' = 'basic') => {
      stopAnimation();
      resetHighlights();

      if (type === 'random') {
        setGraph(generateRandomGraph(6));
      } else {
        setGraph(sampleGraphs[type]);
      }

      setScale(1);
      setOffset({ x: 0, y: 0 });
      toast.success(`Generated ${type} graph`);
    },
    [stopAnimation, resetHighlights]
  );

  // ─── Zoom / Pan / Fullscreen ───
  const zoomIn = useCallback(() => setScale(p => Math.min(p * 1.3, 6)), []);
  const zoomOut = useCallback(() => setScale(p => Math.max(p / 1.3, 0.15)), []);
  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);
  const toggleFullscreen = useCallback(() => setIsFullscreen(p => !p), []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
      if (e.key === ' ' && animationSteps.length > 0) {
        e.preventDefault();
        if (animationState === 'running') handlePause();
        else handlePlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen, animationState, animationSteps.length, handlePlay, handlePause]);

  // Prevent wheel scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => e.preventDefault();
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [isFullscreen]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    setScale(p => Math.min(Math.max(p * (e.deltaY > 0 ? 0.9 : 1.1), 0.15), 6));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const nodeEl = (e.target as HTMLElement).closest('[data-node-id]');
      if (nodeEl) {
        const nodeId = nodeEl.getAttribute('data-node-id')!;
        const node = graph.nodes.find(n => n.id === nodeId);
        if (node) {
          const gPos = screenToGraph(e.clientX, e.clientY);
          setDragNodeId(nodeId);
          setDragNodeOffset({ x: gPos.x - node.x, y: gPos.y - node.y });
        }
        return;
      }
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    },
    [offset, graph.nodes, screenToGraph]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragNodeId) {
        const gPos = screenToGraph(e.clientX, e.clientY);
        setGraph(prev => ({
          ...prev,
          nodes: prev.nodes.map(n =>
            n.id === dragNodeId
              ? { ...n, x: gPos.x - dragNodeOffset.x, y: gPos.y - dragNodeOffset.y }
              : n
          ),
        }));
        return;
      }
      if (isPanning) {
        setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      }
    },
    [dragNodeId, dragNodeOffset, isPanning, panStart, screenToGraph]
  );

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
    setDragNodeId(null);
  }, []);

  // ─── Adjacency List ───
  const adjacencyList = useMemo(() => {
    const adj: Record<number, { to: number; weight?: number }[]> = {};
    graph.nodes.forEach(n => {
      adj[n.value] = [];
    });
    graph.edges.forEach(e => {
      const fNode = graph.nodes.find(n => n.id === e.from);
      const tNode = graph.nodes.find(n => n.id === e.to);
      if (fNode && tNode) {
        adj[fNode.value].push({ to: tNode.value, weight: e.weight });
        if (graphType === 'undirected') {
          adj[tNode.value].push({ to: fNode.value, weight: e.weight });
        }
      }
    });
    return adj;
  }, [graph, graphType]);

  // ─── SVG Rendering ───
  const renderSvgContent = () => {
    if (graph.nodes.length === 0) return null;

    return (
      <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
        {/* Edges */}
        {graph.edges.map((edge, idx) => {
          const fNode = graph.nodes.find(n => n.id === edge.from);
          const tNode = graph.nodes.find(n => n.id === edge.to);
          if (!fNode || !tNode) return null;

          const key = `${edge.from}-${edge.to}`;
          const isHighlighted =
            highlightedEdges.has(key) || highlightedEdges.has(`${edge.to}-${edge.from}`);
          const isInPath =
            currentPath.length > 0 &&
            currentPath.some(
              (id, i) =>
                i < currentPath.length - 1 &&
                ((currentPath[i] === edge.from && currentPath[i + 1] === edge.to) ||
                  (graphType === 'undirected' &&
                    currentPath[i] === edge.to &&
                    currentPath[i + 1] === edge.from))
            );
          const isAnimating = animEdgeKeys.has(key);

          const dx = tNode.x - fNode.x;
          const dy = tNode.y - fNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = dx / dist;
          const ny = dy / dist;
          const r = 22;

          const x1 = fNode.x + nx * r;
          const y1 = fNode.y + ny * r;
          const x2 = tNode.x - nx * r;
          const y2 = tNode.y - ny * r;
          const lineLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

          const midX = (fNode.x + tNode.x) / 2;
          const midY = (fNode.y + tNode.y) / 2;

          const edgeColor = isInPath
            ? 'var(--state-success)'
            : isHighlighted
            ? 'var(--brand-primary)'
            : 'var(--border-default)';

          return (
            <g key={`edge-${idx}`}>
              {/* Glow for highlighted */}
              {(isHighlighted || isInPath) && (
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={edgeColor}
                  strokeWidth="8"
                  opacity="0.2"
                  strokeLinecap="round"
                />
              )}

              {/* Main line */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={edgeColor}
                strokeWidth={isHighlighted || isInPath ? 3 : 2}
                strokeLinecap="round"
                strokeDasharray={isAnimating ? lineLen : 'none'}
                strokeDashoffset={isAnimating ? lineLen : 0}
                style={{
                  transition: isAnimating ? 'none' : 'stroke 0.3s, stroke-width 0.3s',
                  animation: isAnimating ? 'edgeDraw 0.6s ease forwards' : 'none',
                }}
              />

              {/* Arrow for directed */}
              {graphType === 'directed' && (
                <polygon
                  points={(() => {
                    const al = 12;
                    const angle = Math.atan2(dy, dx);
                    return `${x2},${y2} ${x2 - al * Math.cos(angle - 0.35)},${
                      y2 - al * Math.sin(angle - 0.35)
                    } ${x2 - al * Math.cos(angle + 0.35)},${y2 - al * Math.sin(angle + 0.35)}`;
                  })()}
                  fill={edgeColor}
                  style={{ transition: 'fill 0.3s' }}
                />
              )}

              {/* Weight label */}
              {edge.weight !== undefined && (
                <>
                  <rect
                    x={midX - 16}
                    y={midY - 12}
                    width="32"
                    height="22"
                    rx="6"
                    fill="var(--surface-1)"
                    stroke={isHighlighted ? 'var(--brand-primary)' : 'var(--border-default)'}
                    strokeWidth="1.5"
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    textAnchor="middle"
                    fill="var(--brand-primary)"
                    fontSize="12"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {edge.weight}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {graph.nodes.map(node => {
          const isHighlighted = highlightedNodes.has(node.id);
          const isInPath = currentPath.includes(node.id);
          const isCurrent =
            currentStepIndex >= 0 &&
            animationSteps[currentStepIndex]?.nodeId === node.id &&
            animationSteps[currentStepIndex]?.type !== 'complete';
          const isAnimating = animNodeIds.has(node.id);

          const nodeColor = isCurrent
            ? 'var(--state-warning)'
            : isInPath
            ? 'var(--state-success)'
            : isHighlighted
            ? 'var(--brand-primary)'
            : 'var(--surface-3)';

          return (
            <g
              key={`node-${node.id}`}
              data-node-id={node.id}
              style={{
                cursor: 'grab',
                animation: isAnimating ? 'nodeAppear 0.5s ease forwards' : 'none',
                opacity: isAnimating ? 0 : 1,
                transformOrigin: `${node.x}px ${node.y}px`,
              }}
            >
              {/* Pulse ring */}
              {(isHighlighted || isCurrent) && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="30"
                  fill="none"
                  stroke={isCurrent ? 'var(--state-warning)' : 'var(--brand-primary)'}
                  strokeWidth="2.5"
                  opacity="0.4"
                  style={{ animation: 'pulseRing 1.2s ease infinite' }}
                />
              )}

              {/* Shadow */}
              <circle cx={node.x} cy={node.y + 2} r="20" fill="rgba(0,0,0,0.15)" />

              {/* Main circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r="20"
                fill={nodeColor}
                stroke={
                  isCurrent
                    ? 'var(--state-warning)'
                    : isHighlighted || isInPath
                    ? 'var(--brand-primary)'
                    : 'var(--border-default)'
                }
                strokeWidth="2.5"
                style={{ transition: 'fill 0.3s, stroke 0.3s' }}
              />

              {/* Label */}
              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                fill={isHighlighted || isCurrent || isInPath ? 'var(--bg-primary)' : 'var(--text-primary)'}
                fontSize="14"
                fontWeight="bold"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {node.value}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  // ─── Styles ───
  const inputStyle = {
    background: 'var(--surface-2)',
    borderColor: 'var(--border-default)',
    color: 'var(--text-primary)',
  };

  const outlineBtnStyle = {
    background: 'var(--surface-2)',
    borderColor: 'var(--border-default)',
    color: 'var(--text-secondary)',
  };

  const toolBtnClass = 'p-2 rounded-[var(--radius-md)] border transition-all hover:opacity-80';

  // ─── Visualization Panel ───
  const vizPanel = (
    <div
      className={`rounded-[var(--card-radius)] p-6 flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-[9999] rounded-none' : ''
      }`}
      style={{ background: 'var(--surface-1)' }}
    >
      <style>{`
        @keyframes edgeDraw { to { stroke-dashoffset: 0; } }
        @keyframes nodeAppear {
          0%   { opacity: 0; transform: scale(0); }
          60%  { opacity: 1; transform: scale(1.35); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pulseRing {
          0%, 100% { opacity: 0.3; }
          50%      { opacity: 0.7; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Graph Visualization
        </h2>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {graph.nodes.length} nodes, {graph.edges.length} edges
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {/* Zoom controls */}
          <button
            onClick={zoomOut}
            className={toolBtnClass}
            style={outlineBtnStyle}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span
            className="text-xs min-w-[48px] text-center font-mono"
            style={{ color: 'var(--text-muted)' }}
          >
            {Math.round(scale * 100)}%
          </span>
          <button onClick={zoomIn} className={toolBtnClass} style={outlineBtnStyle} title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={resetView} className={toolBtnClass} style={outlineBtnStyle} title="Reset">
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="w-px h-6 mx-1" style={{ background: 'var(--border-default)' }} />

          {/* Animation controls */}
          {animationSteps.length > 0 && (
            <>
              <button
                onClick={handleStepBackward}
                disabled={currentStepIndex <= 0}
                className={toolBtnClass}
                style={outlineBtnStyle}
                title="Step Back"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {animationState === 'running' ? (
                <button
                  onClick={handlePause}
                  className={toolBtnClass}
                  style={{
                    background: 'var(--state-warning)',
                    borderColor: 'var(--state-warning)',
                    color: 'var(--bg-primary)',
                  }}
                  title="Pause"
                >
                  <Pause className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handlePlay}
                  className={toolBtnClass}
                  style={{
                    background: 'var(--state-success)',
                    borderColor: 'var(--state-success)',
                    color: 'var(--bg-primary)',
                  }}
                  title="Play"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleStepForward}
                disabled={currentStepIndex >= animationSteps.length - 1}
                className={toolBtnClass}
                style={outlineBtnStyle}
                title="Step Forward"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button onClick={handleReset} className={toolBtnClass} style={outlineBtnStyle} title="Reset">
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="w-px h-6 mx-1" style={{ background: 'var(--border-default)' }} />

              {/* Speed control */}
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Speed:
              </span>
              <input
                type="range"
                min={1}
                max={100}
                value={animationSpeed}
                onChange={e => setAnimationSpeed(Number(e.target.value))}
                className="w-16 accent-[var(--brand-primary)]"
              />

              <div className="w-px h-6 mx-1" style={{ background: 'var(--border-default)' }} />
            </>
          )}

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className={toolBtnClass}
            style={
              isFullscreen
                ? {
                    background: 'var(--brand-primary)',
                    borderColor: 'var(--brand-primary)',
                    color: 'var(--bg-primary)',
                  }
                : outlineBtnStyle
            }
            title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {animationSteps.length > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Step {currentStepIndex + 1}/{animationSteps.length}
            </span>
          )}
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Scroll = zoom · Drag = pan · Drag node = move{isFullscreen ? ' · ESC = exit' : ''}
          </span>
        </div>
      </div>

      {/* Step Message */}
      {stepMessage && (
        <div
          className="mb-3 px-4 py-2 rounded-[var(--radius-md)] text-sm"
          style={{
            background: 'var(--brand-primary)',
            color: 'var(--bg-primary)',
          }}
        >
          {stepMessage}
        </div>
      )}

      {/* SVG Container */}
      <div
        ref={containerRef}
        className="w-full border rounded-lg relative overflow-hidden flex-1"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--surface-2)',
          minHeight: isFullscreen ? 0 : 420,
          cursor: dragNodeId ? 'grabbing' : isPanning ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Grid background */}
        {graph.nodes.length > 0 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.04,
              backgroundImage:
                'linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)',
              backgroundSize: `${20 * scale}px ${20 * scale}px`,
              backgroundPosition: `${offset.x}px ${offset.y}px`,
            }}
          />
        )}

        {/* Empty state */}
        {graph.nodes.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-3"
            style={{ color: 'var(--text-muted)' }}
          >
            <GitBranch className="w-16 h-16 opacity-20" />
            <span className="text-lg">Empty Graph</span>
            <span className="text-xs">Add nodes to get started</span>
          </div>
        ) : (
          <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
            {renderSvgContent()}
          </svg>
        )}

        {/* Data structure visualization */}
        {dataStructure && dataStructure.items.length > 0 && (
          <div
            className="absolute top-3 left-3 rounded-lg p-3"
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border-default)',
              minWidth: '100px',
            }}
          >
            <div
              className="text-xs font-bold mb-2 capitalize"
              style={{ color: 'var(--text-muted)' }}
            >
              {dataStructure.type}
            </div>
            <div className="space-y-1">
              {dataStructure.items.map((item, index) => (
                <div
                  key={index}
                  className="px-2 py-1 rounded text-xs font-medium text-center"
                  style={{
                    background: index === 0 ? 'var(--brand-primary)' : 'var(--surface-3)',
                    color: index === 0 ? 'var(--bg-primary)' : 'var(--text-primary)',
                  }}
                >
                  {item}
                  {dataStructure.type === 'queue' && index === 0 && ' ← front'}
                  {dataStructure.type === 'stack' && index === dataStructure.items.length - 1 && ' ← top'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom section (not in fullscreen) */}
      {!isFullscreen && (
        <div className="mt-3 space-y-3 flex-shrink-0">
          {/* Relations list */}
          {graph.edges.length > 0 && (
            <div
              className="rounded-[var(--radius-md)] p-4"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border-default)' }}
            >
              <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                Relations ({graphType})
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {graph.edges.map((edge, idx) => {
                  const fNode = graph.nodes.find(n => n.id === edge.from);
                  const tNode = graph.nodes.find(n => n.id === edge.to);
                  if (!fNode || !tNode) return null;

                  const key = `${edge.from}-${edge.to}`;
                  const isHighlighted =
                    highlightedEdges.has(key) || highlightedEdges.has(`${edge.to}-${edge.from}`);

                  return (
                    <div
                      key={`rel-${idx}`}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-sm font-mono transition-all"
                      style={{
                        background: isHighlighted ? 'var(--brand-primary)' : 'var(--surface-3)',
                        color: isHighlighted ? 'var(--bg-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      <span
                        className="font-bold min-w-[28px] text-center"
                        style={{ color: isHighlighted ? 'var(--bg-primary)' : 'var(--text-primary)' }}
                      >
                        {fNode.value}
                      </span>

                      <div className="flex items-center flex-1 mx-1">
                        <div
                          className="h-[2px] flex-1 rounded"
                          style={{
                            background: isHighlighted ? 'var(--bg-primary)' : 'var(--border-default)',
                          }}
                        />
                        {graphType === 'directed' ? (
                          <div
                            style={{
                              width: 0,
                              height: 0,
                              borderTop: '5px solid transparent',
                              borderBottom: '5px solid transparent',
                              borderLeft: `8px solid ${
                                isHighlighted ? 'var(--bg-primary)' : 'var(--border-default)'
                              }`,
                            }}
                          />
                        ) : (
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              background: isHighlighted ? 'var(--bg-primary)' : 'var(--border-default)',
                            }}
                          />
                        )}
                      </div>

                      <span
                        className="font-bold min-w-[28px] text-center"
                        style={{ color: isHighlighted ? 'var(--bg-primary)' : 'var(--text-primary)' }}
                      >
                        {tNode.value}
                      </span>

                      {edge.weight !== undefined && (
                        <span
                          className="ml-2 px-2 py-0.5 rounded text-xs font-bold"
                          style={{
                            background: isHighlighted ? 'rgba(255,255,255,0.2)' : 'var(--surface-2)',
                            color: isHighlighted ? 'var(--bg-primary)' : 'var(--brand-primary)',
                          }}
                        >
                          w:{edge.weight}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Adjacency list */}
          {graph.nodes.length > 0 && (
            <div className="rounded-[var(--radius-md)] p-4" style={{ background: 'var(--surface-2)' }}>
              <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Adjacency List
              </div>
              <div className="space-y-1 font-mono text-xs max-h-32 overflow-y-auto pr-1">
                {Object.entries(adjacencyList).map(([nodeVal, neighbors]) => (
                  <div key={nodeVal} className="flex items-center gap-1">
                    <span className="font-bold min-w-[24px]" style={{ color: 'var(--brand-primary)' }}>
                      {nodeVal}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      [
                      {neighbors.map((n, i) => (
                        <span key={i}>
                          {n.to}
                          {n.weight !== undefined ? `(${n.weight})` : ''}
                          {i < neighbors.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                      ]
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div
            className="flex gap-4 text-xs flex-wrap justify-center"
            style={{ color: 'var(--text-muted)' }}
          >
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: 'var(--brand-primary)' }} />
              <span>Visited</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: 'var(--state-warning)' }} />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: 'var(--state-success)' }} />
              <span>Path</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full border"
                style={{ background: 'var(--surface-3)', borderColor: 'var(--border-default)' }}
              />
              <span>Node</span>
            </div>
          </div>

          {/* Info */}
          <div
            className="rounded-[var(--radius-md)] p-4 text-sm space-y-1.5"
            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
          >
            <div>
              <strong style={{ color: 'var(--brand-primary)' }}>BFS:</strong> Level by level (shortest
              in unweighted)
            </div>
            <div>
              <strong style={{ color: 'var(--brand-primary)' }}>DFS:</strong> Deep exploration then
              backtrack
            </div>
            <div>
              <strong style={{ color: 'var(--brand-primary)' }}>Dijkstra:</strong> Shortest path in
              weighted graphs
            </div>
            <div>
              <strong style={{ color: 'var(--brand-primary)' }}>Tip:</strong> Drag nodes to rearrange ·
              Space to play/pause
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Controls */}
        <div className="rounded-[var(--card-radius)] p-6" style={{ background: 'var(--surface-1)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Graph Operations
            </h2>
            <select
              value={graphType}
              onChange={e => setGraphType(e.target.value as 'directed' | 'undirected')}
              className="h-9 px-3 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] transition-all"
              style={inputStyle}
            >
              <option value="directed">Directed</option>
              <option value="undirected">Undirected</option>
            </select>
          </div>

          <div className="space-y-4">
            {/* Node Operations */}
            <div className="space-y-2">
              <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Node Operations
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Node value"
                  value={nodeValue}
                  onChange={e => setNodeValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addNode()}
                  className="h-10 px-3 flex-1 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
                  style={inputStyle}
                />
                <button
                  onClick={addNode}
                  disabled={isNaN(parseInt(nodeValue))}
                  className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'var(--brand-primary)', color: 'var(--bg-primary)' }}
                >
                  Add
                </button>
                <button
                  onClick={removeNode}
                  disabled={isNaN(parseInt(nodeValue))}
                  className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={outlineBtnStyle}
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Edge Operations */}
            <div className="space-y-2">
              <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Edge Operations
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="From"
                  value={fromNode}
                  onChange={e => setFromNode(e.target.value)}
                  className="h-10 px-3 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="To"
                  value={toNode}
                  onChange={e => setToNode(e.target.value)}
                  className="h-10 px-3 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="Weight"
                  value={edgeWeight}
                  onChange={e => setEdgeWeight(e.target.value)}
                  className="h-10 px-3 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
                  style={inputStyle}
                />
              </div>
              <button
                onClick={addEdge}
                disabled={isNaN(parseInt(fromNode)) || isNaN(parseInt(toNode))}
                className="w-full px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--brand-primary)', color: 'var(--bg-primary)' }}
              >
                Add Edge
              </button>
            </div>

            {/* Search Algorithms */}
            <div className="space-y-2">
              <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Search Algorithms
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Start"
                  value={searchStart}
                  onChange={e => setSearchStart(e.target.value)}
                  className="h-10 px-3 flex-1 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="End"
                  value={searchEnd}
                  onChange={e => setSearchEnd(e.target.value)}
                  className="h-10 px-3 flex-1 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
                  style={inputStyle}
                />
              </div>

              {/* Algorithm selector */}
              <div className="flex gap-2">
                {(['bfs', 'dfs', 'dijkstra'] as const).map(algo => (
                  <button
                    key={algo}
                    onClick={() => setSelectedAlgorithm(algo)}
                    className={`flex-1 px-3 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all ${
                      selectedAlgorithm === algo ? 'ring-2 ring-[var(--brand-primary)]' : ''
                    }`}
                    style={
                      selectedAlgorithm === algo
                        ? { background: 'var(--brand-primary)', borderColor: 'var(--brand-primary)', color: 'var(--bg-primary)' }
                        : outlineBtnStyle
                    }
                  >
                    {algo.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                onClick={runAlgorithm}
                disabled={
                  isNaN(parseInt(searchStart)) ||
                  isNaN(parseInt(searchEnd)) ||
                  animationState === 'running'
                }
                className="w-full px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'var(--state-success)', color: 'var(--bg-primary)' }}
              >
                <Play className="w-4 h-4" />
                Run {selectedAlgorithm.toUpperCase()}
              </button>
            </div>

            {/* Utilities */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => generateSampleGraph('basic')}
                className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all"
                style={outlineBtnStyle}
              >
                Sample
              </button>
              <button
                onClick={() => generateSampleGraph('weighted')}
                className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all"
                style={outlineBtnStyle}
              >
                Weighted
              </button>
              <button
                onClick={() => generateSampleGraph('random')}
                className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all"
                style={outlineBtnStyle}
              >
                <Shuffle className="w-4 h-4 inline mr-1" />
                Random
              </button>
              <button
                onClick={clearGraph}
                className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all"
                style={outlineBtnStyle}
              >
                <RotateCcw className="w-4 h-4 inline mr-1" />
                Clear
              </button>
            </div>

            {/* Code Display */}
            <div
              className="rounded-[var(--radius-md)] p-4 font-mono text-sm"
              style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
            >
              <div style={{ color: 'var(--text-muted)' }} className="mb-2">
                // Graph Implementation
              </div>
              <div>
                <span style={{ color: 'var(--brand-secondary)' }}>class</span>
                <span style={{ color: 'var(--text-primary)' }}> Graph {'{'}</span>
              </div>
              <div className="ml-4">
                <div style={{ color: 'var(--text-primary)' }}>nodes: {graph.nodes.length}</div>
                <div style={{ color: 'var(--text-primary)' }}>edges: {graph.edges.length}</div>
                <div style={{ color: 'var(--text-primary)' }}>type: {graphType}</div>
                <br />
                <div style={{ color: 'var(--brand-primary)' }}>
                  {lastOperation || '// Operations will appear here'}
                </div>
              </div>
              <div style={{ color: 'var(--text-primary)' }}>{'}'}</div>
            </div>

            {/* Statistics */}
            {animationSteps.length > 0 && (
              <div className="rounded-[var(--radius-md)] p-4" style={{ background: 'var(--surface-2)' }}>
                <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Animation Statistics
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Algorithm: </span>
                    <span style={{ color: 'var(--brand-primary)' }}>{selectedAlgorithm.toUpperCase()}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Steps: </span>
                    <span style={{ color: 'var(--brand-primary)' }}>{animationSteps.length}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Status: </span>
                    <span
                      style={{
                        color:
                          animationState === 'running'
                            ? 'var(--state-success)'
                            : animationState === 'paused'
                            ? 'var(--state-warning)'
                            : animationState === 'completed'
                            ? 'var(--brand-primary)'
                            : 'var(--text-secondary)',
                      }}
                    >
                      {animationState}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Current: </span>
                    <span style={{ color: 'var(--brand-primary)' }}>
                      {currentStepIndex + 1}/{animationSteps.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Visualization (not in fullscreen) */}
        {!isFullscreen && vizPanel}
      </div>

      {/* Fullscreen visualization */}
      {isFullscreen && vizPanel}
    </>
  );
}