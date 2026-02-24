// VisualizerPage.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';
import {
  Play, Pause, RotateCcw, SkipForward, SkipBack, FastForward, Shuffle,
  Info, Clock, Cpu, HardDrive, ChevronDown, BarChart2, Activity
} from 'lucide-react';
import {
  algorithms,
  generateRandomArray,
  sampleGraph,
  generateRandomArrayRandomLen,
  type AlgorithmInfo,
  type AlgorithmCategory,
  type ArrayBar,
  type GraphNode,
  type GraphEdge,
} from '../data/visualizerData';

// Types
type VisualizerState = 'idle' | 'running' | 'paused' | 'completed';

type AnimationStep = {
  type: 'compare' | 'swap' | 'sorted' | 'pivot' | 'visit' | 'path' | 'found';
  indices: number[];
  array?: ArrayBar[];
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  line: number;
  message?: string;
};

type Statistics = {
  comparisons: number;
  swaps: number;
  arrayAccesses: number;
  visited: number;
  elapsedTime: number;
};

// Sorting Algorithms Implementation
const bubbleSort = (arr: ArrayBar[]): AnimationStep[] => {
  const steps: AnimationStep[] = [];
  const array = arr.map(b => ({ ...b }));
  const n = array.length;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      // Comparison step
      steps.push({
        type: 'compare',
        indices: [j, j + 1],
        array: array.map((b, idx) => ({
          ...b,
          state: idx === j || idx === j + 1 ? 'comparing' : 
                 idx >= n - i ? 'sorted' : 'default'
        })),
        line: 2,
        message: `Comparing ${array[j].value} with ${array[j + 1].value}`
      });

      if (array[j].value > array[j + 1].value) {
        // Swap
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        steps.push({
          type: 'swap',
          indices: [j, j + 1],
          array: array.map((b, idx) => ({
            ...b,
            state: idx === j || idx === j + 1 ? 'swapping' : 
                   idx >= n - i ? 'sorted' : 'default'
          })),
          line: 3,
          message: `Swapping ${array[j + 1].value} with ${array[j].value}`
        });
      }
    }
    // Mark element as sorted
    steps.push({
      type: 'sorted',
      indices: [n - i - 1],
      array: array.map((b, idx) => ({
        ...b,
        state: idx >= n - i - 1 ? 'sorted' : 'default'
      })),
      line: 4,
      message: `Element ${array[n - i - 1].value} is in final position`
    });
  }

  // Mark first element as sorted
  steps.push({
    type: 'sorted',
    indices: [0],
    array: array.map(b => ({ ...b, state: 'sorted' })),
    line: 5,
    message: 'Sorting complete!'
  });

  return steps;
};

const quickSort = (arr: ArrayBar[]): AnimationStep[] => {
  const steps: AnimationStep[] = [];
  const array = arr.map(b => ({ ...b }));

  const partition = (low: number, high: number): number => {
    const pivot = array[high].value;
    
    // Mark pivot
    steps.push({
      type: 'pivot',
      indices: [high],
      array: array.map((b, idx) => ({
        ...b,
        state: idx === high ? 'pivot' : 
               idx >= low && idx < high ? 'default' : b.state
      })),
      line: 1,
      message: `Choosing pivot: ${pivot}`
    });

    let i = low - 1;

    for (let j = low; j < high; j++) {
      // Compare with pivot
      steps.push({
        type: 'compare',
        indices: [j, high],
        array: array.map((b, idx) => ({
          ...b,
          state: idx === high ? 'pivot' : 
                 idx === j ? 'comparing' : b.state
        })),
        line: 3,
        message: `Comparing ${array[j].value} with pivot ${pivot}`
      });

      if (array[j].value < pivot) {
        i++;
        [array[i], array[j]] = [array[j], array[i]];
        
        if (i !== j) {
          steps.push({
            type: 'swap',
            indices: [i, j],
            array: array.map((b, idx) => ({
              ...b,
              state: idx === high ? 'pivot' : 
                     idx === i || idx === j ? 'swapping' : b.state
            })),
            line: 4,
            message: `Swapping ${array[j].value} with ${array[i].value}`
          });
        }
      }
    }

    [array[i + 1], array[high]] = [array[high], array[i + 1]];
    
    steps.push({
      type: 'swap',
      indices: [i + 1, high],
      array: array.map((b, idx) => ({
        ...b,
        state: idx === i + 1 ? 'sorted' : b.state
      })),
      line: 5,
      message: `Placing pivot ${pivot} in final position`
    });

    return i + 1;
  };

  const quickSortRecursive = (low: number, high: number) => {
    if (low < high) {
      const pi = partition(low, high);
      quickSortRecursive(low, pi - 1);
      quickSortRecursive(pi + 1, high);
    }
  };

  quickSortRecursive(0, array.length - 1);

  // Mark all as sorted
  steps.push({
    type: 'sorted',
    indices: [],
    array: array.map(b => ({ ...b, state: 'sorted' })),
    line: 6,
    message: 'Sorting complete!'
  });

  return steps;
};

const linearSearch = (arr: ArrayBar[], target: number): AnimationStep[] => {
  const steps: AnimationStep[] = [];
  const array = arr.map(b => ({ ...b }));

  for (let i = 0; i < array.length; i++) {
    steps.push({
      type: 'visit',
      indices: [i],
      array: array.map((b, idx) => ({
        ...b,
        state: idx === i ? 'comparing' : 
               idx < i ? 'visited' : 'default'
      })),
      line: 2,
      message: `Checking index ${i}: ${array[i].value}`
    });

    if (array[i].value === target) {
      steps.push({
        type: 'found',
        indices: [i],
        array: array.map((b, idx) => ({
          ...b,
          state: idx === i ? 'sorted' : 
                 idx < i ? 'visited' : 'default'
        })),
        line: 3,
        message: `Found ${target} at index ${i}!`
      });
      return steps;
    }
  }

  steps.push({
    type: 'found',
    indices: [],
    array: array.map(b => ({ ...b, state: 'visited' })),
    line: 4,
    message: `${target} not found in array`
  });

  return steps;
};

// Graph Algorithms
const bfs = (nodes: GraphNode[], edges: GraphEdge[], start: string = 'A'): AnimationStep[] => {
  const steps: AnimationStep[] = [];
  const visited = new Set<string>();
  const queue: string[] = [start];
  visited.add(start);

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    steps.push({
      type: 'visit',
      indices: [],
      nodes: nodes.map(n => ({
        ...n,
        state: n.id === current ? 'current' : 
               visited.has(n.id) ? 'visited' : 'default'
      })),
      edges: edges.map(e => ({
        ...e,
        state: e.from === current || e.to === current ? 'active' : 'default'
      })),
      line: 2,
      message: `Visiting node ${current}`
    });

    // Find neighbors
    const neighbors = edges
      .filter(e => e.from === current)
      .map(e => e.to)
      .filter(n => !visited.has(n));

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  steps.push({
    type: 'path',
    indices: [],
    nodes: nodes.map(n => ({ ...n, state: 'visited' })),
    edges: edges.map(e => ({ ...e, state: 'active' })),
    line: 5,
    message: 'BFS traversal complete!'
  });

  return steps;
};

const dfs = (nodes: GraphNode[], edges: GraphEdge[], start: string = 'A'): AnimationStep[] => {
  const steps: AnimationStep[] = [];
  const visited = new Set<string>();
  
  const dfsRecursive = (node: string) => {
    visited.add(node);
    
    steps.push({
      type: 'visit',
      indices: [],
      nodes: nodes.map(n => ({
        ...n,
        state: n.id === node ? 'current' : 
               visited.has(n.id) ? 'visited' : 'default'
      })),
      edges: edges.map(e => ({
        ...e,
        state: visited.has(e.from) && visited.has(e.to) ? 'active' : 'default'
      })),
      line: 2,
      message: `Visiting node ${node}`
    });

    const neighbors = edges
      .filter(e => e.from === node)
      .map(e => e.to);

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfsRecursive(neighbor);
      }
    }
  };

  dfsRecursive(start);

  steps.push({
    type: 'path',
    indices: [],
    nodes: nodes.map(n => ({ ...n, state: 'visited' })),
    edges: edges.map(e => ({ ...e, state: 'active' })),
    line: 5,
    message: 'DFS traversal complete!'
  });

  return steps;
};

// Main Component
export function VisualizerPage() {
  const { t } = useLanguage();
  
  // State
  const [selectedCategory, setSelectedCategory] = useState<AlgorithmCategory>('sorting');
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmInfo>(algorithms[0]);
  const [arrayBars, setArrayBars] = useState<ArrayBar[]>(generateRandomArray(30));
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>(sampleGraph.nodes.map(n => ({ ...n })));
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>(sampleGraph.edges.map(e => ({ ...e })));
  const [speed, setSpeed] = useState(50);
  const [arraySize, setArraySize] = useState(30);
  const [customArrayText, setCustomArrayText] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [searchTarget, setSearchTarget] = useState(50);
  const [state, setState] = useState<VisualizerState>('idle');
  const [animationSteps, setAnimationSteps] = useState<AnimationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightedLine, setHighlightedLine] = useState(-1);
  const [showInfo, setShowInfo] = useState(true);
  const [statistics, setStatistics] = useState<Statistics>({
    comparisons: 0,
    swaps: 0,
    arrayAccesses: 0,
    visited: 0,
    elapsedTime: 0
  });
  const [stepMessage, setStepMessage] = useState<string>('');

  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

  const categoryAlgos = useMemo(
    () => algorithms.filter(a => a.category === selectedCategory),
    [selectedCategory]
  );

  // Parse custom array input
  const parseCustomArray = (text: string): number[] | null => {
    try {
      const parsed = text
        .split(/[,\s]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => {
          const num = Number(s);
          if (Number.isNaN(num)) throw new Error('Invalid number');
          if (num < 1 || num > 100) throw new Error('Number out of range (1-100)');
          return num;
        });
      
      if (parsed.length === 0) return null;
      if (parsed.length > 100) throw new Error('Too many elements (max 100)');
      
      return parsed;
    } catch (e: any) {
      setInputError(e.message);
      return null;
    }
  };

  // Generate animation steps
  const generateAnimationSteps = useCallback(() => {
    let steps: AnimationStep[] = [];
    
    switch (selectedAlgo.id) {
      case 'bubble-sort':
        steps = bubbleSort(arrayBars);
        break;
      case 'quick-sort':
        steps = quickSort(arrayBars);
        break;
      case 'linear-search':
        steps = linearSearch(arrayBars, searchTarget);
        break;
      case 'bfs':
        steps = bfs(graphNodes, graphEdges);
        break;
      case 'dfs':
        steps = dfs(graphNodes, graphEdges);
        break;
      default:
        // Fallback to bubble sort for unimplemented algorithms
        steps = bubbleSort(arrayBars);
    }
    
    return steps;
  }, [selectedAlgo, arrayBars, graphNodes, graphEdges, searchTarget]);

  // Apply animation step
  const applyStep = useCallback((step: AnimationStep) => {
    setHighlightedLine(step.line);
    setStepMessage(step.message || '');

    // Update statistics
    if (step.type === 'compare') {
      setStatistics(prev => ({ 
        ...prev, 
        comparisons: prev.comparisons + 1,
        arrayAccesses: prev.arrayAccesses + 2
      }));
    } else if (step.type === 'swap') {
      setStatistics(prev => ({ 
        ...prev, 
        swaps: prev.swaps + 1,
        arrayAccesses: prev.arrayAccesses + 4
      }));
    } else if (step.type === 'visit') {
      setStatistics(prev => ({ 
        ...prev, 
        visited: prev.visited + 1
      }));
    }

    // Apply visualization changes
    if (step.array) {
      setArrayBars(step.array);
    }
    if (step.nodes) {
      setGraphNodes(step.nodes);
    }
    if (step.edges) {
      setGraphEdges(step.edges);
    }
  }, []);

  // Play animation
  const playAnimation = useCallback(() => {
    if (currentStepIndex >= animationSteps.length) {
      setState('completed');
      setStatistics(prev => ({
        ...prev,
        elapsedTime: Date.now() - startTimeRef.current
      }));
      return;
    }

    const step = animationSteps[currentStepIndex];
    applyStep(step);
    setCurrentStepIndex(prev => prev + 1);
  }, [currentStepIndex, animationSteps, applyStep]);

  // Animation loop
  useEffect(() => {
    if (state !== 'running') return;

    animationTimeoutRef.current = setTimeout(() => {
      playAnimation();
    }, Math.max(10, 1000 - speed * 10));

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [state, playAnimation, speed]);

  // Reset visualization
  const resetVisualization = useCallback(() => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    setState('idle');
    setCurrentStepIndex(0);
    setAnimationSteps([]);
    setHighlightedLine(-1);
    setStepMessage('');
    setStatistics({
      comparisons: 0,
      swaps: 0,
      arrayAccesses: 0,
      visited: 0,
      elapsedTime: 0
    });

    if (selectedCategory === 'sorting' || selectedCategory === 'searching') {
      setArrayBars(generateRandomArray(arraySize));
    } else {
      setGraphNodes(sampleGraph.nodes.map(n => ({ ...n, state: 'default' })));
      setGraphEdges(sampleGraph.edges.map(e => ({ ...e, state: 'default' })));
    }
  }, [selectedCategory, arraySize]);

  // Handle play
  const handlePlay = () => {
    if (state === 'completed') {
      resetVisualization();
      return;
    }

    if (state === 'paused') {
      setState('running');
      return;
    }

    const steps = generateAnimationSteps();
    setAnimationSteps(steps);
    setCurrentStepIndex(0);
    setState('running');
    startTimeRef.current = Date.now();
  };

  // Handle pause
  const handlePause = () => {
    setState('paused');
  };

  // Handle step forward
  const handleStepForward = () => {
    if (animationSteps.length === 0) {
      const steps = generateAnimationSteps();
      setAnimationSteps(steps);
    }

    if (currentStepIndex < animationSteps.length) {
      applyStep(animationSteps[currentStepIndex]);
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  // Handle step backward
  const handleStepBackward = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      if (currentStepIndex > 1) {
        applyStep(animationSteps[currentStepIndex - 1]);
      } else {
        resetVisualization();
      }
    }
  };

  // Handle category change
  useEffect(() => {
    const first = algorithms.find(a => a.category === selectedCategory);
    if (first) setSelectedAlgo(first);
    resetVisualization();
  }, [selectedCategory, resetVisualization]);

  // Bar color helper
  const barColor = (s: ArrayBar['state']) => {
    switch (s) {
      case 'comparing': return 'var(--brand-primary)';
      case 'swapping': return 'var(--state-warning)';
      case 'sorted': return 'var(--state-success)';
      case 'pivot': return 'var(--brand-secondary)';
      case 'selected': return 'var(--state-info)';
      case 'visited': return 'var(--text-muted)';
      default: return 'var(--surface-3)';
    }
  };

  // Node color helper
  const nodeColor = (s: GraphNode['state']) => {
    switch (s) {
      case 'current': return 'var(--brand-primary)';
      case 'visiting': return 'var(--state-warning)';
      case 'visited': return 'var(--state-success)';
      case 'path': return 'var(--brand-secondary)';
      case 'start': return 'var(--state-info)';
      case 'end': return 'var(--state-error)';
      default: return 'var(--surface-3)';
    }
  };

  return (
    <Layout>
      <Navbar />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold gradient-brand-text font-title">
            {t('visualizer.title')}
          </h1>
          <p className="text-[var(--text-muted)] mt-1">{t('visualizer.subtitle')}</p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {([
            { key: 'sorting', label: t('visualizer.sorting'), icon: '📊' },
            { key: 'searching', label: t('visualizer.searching'), icon: '🔍' },
            { key: 'graph', label: t('visualizer.graph'), icon: '🕸️' },
          ] as const).map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.key
                  ? 'bg-[var(--brand-primary)] text-[var(--bg-primary)] glow'
                  : 'bg-[var(--surface-1)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:border-[var(--brand-primary)]'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Algorithm List */}
            <div className="theme-card p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                {t('visualizer.algorithms')}
              </h3>
              <div className="space-y-1">
                {categoryAlgos.map(algo => (
                  <button
                    key={algo.id}
                    onClick={() => {
                      setSelectedAlgo(algo);
                      resetVisualization();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors ${
                      selectedAlgo.id === algo.id
                        ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {algo.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Complexity Info */}
            <div className="theme-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {t('visualizer.complexity')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--brand-primary)]" />
                  <span className="text-[var(--text-muted)]">Best:</span>
                  <code className="text-[var(--state-success)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded text-xs">
                    {selectedAlgo.timeComplexity.best}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[var(--state-warning)]" />
                  <span className="text-[var(--text-muted)]">Avg:</span>
                  <code className="text-[var(--state-warning)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded text-xs">
                    {selectedAlgo.timeComplexity.average}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[var(--state-error)]" />
                  <span className="text-[var(--text-muted)]">Worst:</span>
                  <code className="text-[var(--state-error)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded text-xs">
                    {selectedAlgo.timeComplexity.worst}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[var(--state-info)]" />
                  <span className="text-[var(--text-muted)]">Space:</span>
                  <code className="text-[var(--state-info)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded text-xs">
                    {selectedAlgo.spaceComplexity}
                  </code>
                </div>
                {selectedAlgo.stable !== undefined && (
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-[var(--text-muted)]">Stable:</span>
                    <span className={selectedAlgo.stable ? 'text-[var(--state-success)]' : 'text-[var(--state-error)]'}>
                      {selectedAlgo.stable ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="theme-card p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Statistics
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-[var(--text-muted)] text-xs">Comparisons</span>
                  <div className="font-mono text-[var(--brand-primary)] text-lg">
                    {statistics.comparisons}
                  </div>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] text-xs">Swaps</span>
                  <div className="font-mono text-[var(--state-warning)] text-lg">
                    {statistics.swaps}
                  </div>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] text-xs">Array Access</span>
                  <div className="font-mono text-[var(--state-info)] text-lg">
                    {statistics.arrayAccesses}
                  </div>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] text-xs">Time (ms)</span>
                  <div className="font-mono text-[var(--text-secondary)] text-lg">
                    {statistics.elapsedTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Pseudocode */}
            <div className="theme-card p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                {t('visualizer.pseudocode')}
              </h3>
              <div className="bg-[var(--surface-2)] rounded-[var(--radius-md)] p-3 font-mono text-xs space-y-0.5 overflow-x-auto">
                {selectedAlgo.pseudocode.map((line, i) => (
                  <div
                    key={i}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      highlightedLine === i
                        ? 'bg-[var(--brand-primary)]/20 text-[var(--brand-primary)]'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className="text-[var(--text-muted)] mr-2">{i + 1}</span>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Visualization Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Controls */}
            <div className="theme-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Playback Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleStepBackward}
                    disabled={currentStepIndex === 0}
                    className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  
                  {state === 'running' ? (
                    <button
                      onClick={handlePause}
                      className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--state-warning)]/10 text-[var(--state-warning)] hover:bg-[var(--state-warning)]/20 transition-colors"
                    >
                      <Pause className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={handlePlay}
                      className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--state-success)]/10 text-[var(--state-success)] hover:bg-[var(--state-success)]/20 transition-colors"
                    >
                      <Play className="w-5 h-5" />
                    </button>
                  )}
                  
                  <button
                    onClick={handleStepForward}
                    disabled={currentStepIndex >= animationSteps.length}
                    className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={resetVisualization}
                    className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setArrayBars(generateRandomArray(arraySize));
                      resetVisualization();
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
                  >
                    <Shuffle className="w-5 h-5" />
                  </button>
                </div>

                <div className="h-8 w-px bg-[var(--border-default)]" />

                {/* Speed Control */}
                <div className="flex items-center gap-2">
                  <FastForward className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-xs text-[var(--text-muted)]">{t('visualizer.speed')}:</span>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={speed}
                    onChange={e => setSpeed(Number(e.target.value))}
                    className="w-24 accent-[var(--brand-primary)]"
                  />
                  <span className="text-xs text-[var(--text-secondary)] w-8">{speed}%</span>
                </div>

                {(selectedCategory === 'sorting' || selectedCategory === 'searching') && (
                  <>
                    <div className="h-8 w-px bg-[var(--border-default)]" />
                    
                    {/* Array Size */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-muted)]">{t('visualizer.size')}:</span>
                      <input
                        type="range"
                        min={10}
                        max={80}
                        value={arraySize}
                        onChange={e => {
                          const size = Number(e.target.value);
                          setArraySize(size);
                          setArrayBars(generateRandomArray(size));
                          resetVisualization();
                        }}
                        className="w-24 accent-[var(--brand-primary)]"
                      />
                      <span className="text-xs text-[var(--text-secondary)] w-8">{arraySize}</span>
                    </div>
                  </>
                )}

                {/* Status */}
                <div className="ml-auto flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    state === 'running' ? 'bg-[var(--state-success)] animate-pulse'
                    : state === 'paused' ? 'bg-[var(--state-warning)]'
                    : state === 'completed' ? 'bg-[var(--brand-primary)]'
                    : 'bg-[var(--text-muted)]'
                  }`} />
                  <span className="text-xs text-[var(--text-muted)] capitalize">{state}</span>
                  {animationSteps.length > 0 && (
                    <span className="text-xs text-[var(--text-muted)]">
                      | Step {currentStepIndex}/{animationSteps.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Custom Input Section */}
              {(selectedCategory === 'sorting' || selectedCategory === 'searching') && (
                <div className="mt-3 pt-3 border-t border-[var(--border-default)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder={t('visualizer.customPlaceholder')}
                      value={customArrayText}
                      onChange={e => {
                        setCustomArrayText(e.target.value);
                        setInputError(null);
                      }}
                      className={`flex-1 min-w-[200px] bg-[var(--surface-2)] border ${
                        inputError ? 'border-[var(--state-error)]' : 'border-[var(--border-default)]'
                      } rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]`}
                    />
                    
                    <button
                      onClick={() => {
                        const parsed = parseCustomArray(customArrayText);
                        if (parsed) {
                          setArrayBars(parsed.map(v => ({ value: v, state: 'default' })));
                          resetVisualization();
                          setInputError(null);
                        }
                      }}
                      className="px-3 py-1.5 text-sm rounded-[var(--radius-md)] bg-[var(--brand-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
                    >
                      Use Array
                    </button>
                    
                    <button
                      onClick={() => {
                        setArrayBars(generateRandomArrayRandomLen(10));
                        resetVisualization();
                      }}
                      className="px-3 py-1.5 text-sm rounded-[var(--radius-md)] bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:border-[var(--brand-primary)] transition-colors"
                    >
                      Random ≤10
                    </button>

                    {selectedCategory === 'searching' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)]">Target:</span>
                        <input
                          type="number"
                          value={searchTarget}
                          onChange={e => setSearchTarget(Number(e.target.value))}
                          className="w-20 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
                        />
                      </div>
                    )}
                  </div>
                  
                  {inputError && (
                    <div className="mt-2 text-xs text-[var(--state-error)]">{inputError}</div>
                  )}
                </div>
              )}
            </div>

            {/* Step Message */}
            {stepMessage && (
              <div className="theme-card p-3 bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/20">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[var(--brand-primary)]" />
                  <span className="text-sm text-[var(--text-primary)]">{stepMessage}</span>
                </div>
              </div>
            )}

            {/* Visualization Canvas */}
            <div className="theme-card p-6 min-h-[400px] flex items-end justify-center overflow-hidden">
              {(selectedCategory === 'sorting' || selectedCategory === 'searching') ? (
                /* Array Bar Visualization */
                <div className="flex items-end gap-[2px] w-full h-[350px]">
                  {arrayBars.map((bar, i) => (
                    <div key={i} className="relative flex-1 group">
                      <div
                        className="w-full rounded-t-sm transition-all duration-150"
                        style={{
                          height: `${(bar.value / 100) * 100}%`,
                          backgroundColor: barColor(bar.state),
                          minWidth: '2px',
                          boxShadow: bar.state !== 'default' ? `0 0 8px ${barColor(bar.state)}` : 'none',
                        }}
                      />
                      {/* Value tooltip */}
                      {arrayBars.length <= 40 && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                          {bar.value}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Graph Visualization */
                <svg viewBox="0 0 650 300" className="w-full h-[350px]">
                  <defs>
                    {/* Arrow marker */}
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="var(--brand-primary)"
                      />
                    </marker>
                  </defs>
                  
                  {/* Edges */}
                  {graphEdges.map((edge, i) => {
                    const from = graphNodes.find(n => n.id === edge.from);
                    const to = graphNodes.find(n => n.id === edge.to);
                    if (!from || !to) return null;
                    
                    const edgeColor = 
                      edge.state === 'active' ? 'var(--brand-primary)' : 
                      edge.state === 'path' ? 'var(--state-success)' : 
                      'var(--border-default)';
                    
                    return (
                      <g key={i}>
                        <line
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          stroke={edgeColor}
                          strokeWidth={edge.state === 'active' ? 3 : 2}
                          strokeDasharray={edge.state === 'default' ? '4' : '0'}
                          className={edge.state === 'active' ? 'animate-pulse' : ''}
                        />
                        {edge.weight !== undefined && (
                          <g>
                            <circle
                              cx={(from.x + to.x) / 2}
                              cy={(from.y + to.y) / 2}
                              r={12}
                              fill="var(--surface-1)"
                              stroke={edgeColor}
                              strokeWidth={1}
                            />
                            <text
                              x={(from.x + to.x) / 2}
                              y={(from.y + to.y) / 2 + 4}
                              textAnchor="middle"
                              fill="var(--text-primary)"
                              fontSize="11"
                              fontWeight="bold"
                            >
                              {edge.weight}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                  
                  {/* Nodes */}
                  {graphNodes.map(node => (
                    <g key={node.id} className="cursor-pointer">
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={24}
                        fill={nodeColor(node.state)}
                        stroke={node.state === 'current' ? 'var(--brand-primary)' : 'var(--border-default)'}
                        strokeWidth={node.state === 'current' ? 3 : 1}
                        className="transition-all duration-200"
                      />
                      {node.state === 'current' && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={30}
                          fill="none"
                          stroke="var(--brand-primary)"
                          strokeWidth={2}
                          opacity={0.4}
                          className="animate-ping"
                        />
                      )}
                      <text
                        x={node.x}
                        y={node.y + 5}
                        textAnchor="middle"
                        fill={node.state === 'default' ? 'var(--text-secondary)' : 'var(--text-primary)'}
                        fontWeight="bold"
                        fontSize="16"
                      >
                        {node.label}
                      </text>
                    </g>
                  ))}
                </svg>
              )}
            </div>

            {/* Legend */}
            <div className="theme-card p-4">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                {(selectedCategory === 'sorting' || selectedCategory === 'searching') ? (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--surface-3)' }} />
                      Default
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--brand-primary)' }} />
                      Comparing
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--state-warning)' }} />
                      Swapping
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--state-success)' }} />
                      Sorted
                    </span>
                    {selectedCategory === 'searching' && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--text-muted)' }} />
                        Visited
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--surface-3)' }} />
                      Unvisited
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--brand-primary)' }} />
                      Current
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--state-success)' }} />
                      Visited
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--brand-secondary)' }} />
                      Path
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {showInfo && (
              <div className="theme-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {selectedAlgo.name}
                  </h3>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {selectedAlgo.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}