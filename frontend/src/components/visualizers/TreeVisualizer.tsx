import React, { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { RotateCcw, ZoomIn, ZoomOut, Maximize2, Minimize2, GitBranch } from 'lucide-react';

interface TreeNode {
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
  id: string;
}

export function TreeVisualizer() {
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [rootChangeValue, setRootChangeValue] = useState('');
  const [lastOperation, setLastOperation] = useState('');
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // Animation state for new nodes
  const [animatingNodes, setAnimatingNodes] = useState<Set<string>>(new Set());
  const [animatingLines, setAnimatingLines] = useState<Set<string>>(new Set());

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const insertNode = (node: TreeNode | null, value: number): TreeNode => {
    if (node === null) {
      const newId = generateId();
      setAnimatingNodes(prev => new Set(prev).add(newId));
      setTimeout(() => {
        setAnimatingNodes(prev => {
          const next = new Set(prev);
          next.delete(newId);
          return next;
        });
      }, 600);
      return { value, left: null, right: null, id: newId };
    }
    if (value < node.value) {
      const lineKey = `line-left-${node.id}`;
      setAnimatingLines(prev => new Set(prev).add(lineKey));
      setTimeout(() => {
        setAnimatingLines(prev => {
          const next = new Set(prev);
          next.delete(lineKey);
          return next;
        });
      }, 600);
      return { ...node, left: insertNode(node.left, value) };
    } else if (value > node.value) {
      const lineKey = `line-right-${node.id}`;
      setAnimatingLines(prev => new Set(prev).add(lineKey));
      setTimeout(() => {
        setAnimatingLines(prev => {
          const next = new Set(prev);
          next.delete(lineKey);
          return next;
        });
      }, 600);
      return { ...node, right: insertNode(node.right, value) };
    }
    return node;
  };

  const findMin = (node: TreeNode): TreeNode => {
    let current = node;
    while (current.left !== null) {
      current = current.left;
    }
    return current;
  };

  const deleteNode = (node: TreeNode | null, value: number): TreeNode | null => {
    if (node === null) return null;
    if (value < node.value) {
      return { ...node, left: deleteNode(node.left, value) };
    } else if (value > node.value) {
      return { ...node, right: deleteNode(node.right, value) };
    } else {
      if (node.left === null) return node.right;
      if (node.right === null) return node.left;
      const minNode = findMin(node.right);
      return { ...node, value: minNode.value, right: deleteNode(node.right, minNode.value) };
    }
  };

  const searchNode = (node: TreeNode | null, value: number, path: string[] = []): string[] | null => {
    if (node === null) return null;
    path.push(node.id);
    if (node.value === value) return path;
    if (value < node.value) return searchNode(node.left, value, path);
    return searchNode(node.right, value, path);
  };

  // Collect all values via in-order traversal
  const collectValues = (node: TreeNode | null): number[] => {
    if (!node) return [];
    return [...collectValues(node.left), node.value, ...collectValues(node.right)];
  };

  // Build a balanced BST from sorted array
  const buildBalancedBST = (values: number[], lo: number, hi: number): TreeNode | null => {
    if (lo > hi) return null;
    const mid = Math.floor((lo + hi) / 2);
    return {
      value: values[mid],
      left: buildBalancedBST(values, lo, mid - 1),
      right: buildBalancedBST(values, mid + 1, hi),
      id: generateId(),
    };
  };

  // Rebuild tree with a new root value
  const rebuildWithNewRoot = (oldRoot: TreeNode | null, newRootValue: number): TreeNode | null => {
    const values = collectValues(oldRoot);
    if (!values.includes(newRootValue)) {
      values.push(newRootValue);
      values.sort((a, b) => a - b);
    }
    // Build tree by inserting with newRootValue as root first
    let newRoot: TreeNode = { value: newRootValue, left: null, right: null, id: generateId() };
    for (const v of values) {
      if (v !== newRootValue) {
        newRoot = insertNodePure(newRoot, v);
      }
    }
    return newRoot;
  };

  // Pure insert (no animation side effects)
  const insertNodePure = (node: TreeNode | null, value: number): TreeNode => {
    if (node === null) {
      return { value, left: null, right: null, id: generateId() };
    }
    if (value < node.value) {
      return { ...node, left: insertNodePure(node.left, value) };
    } else if (value > node.value) {
      return { ...node, right: insertNodePure(node.right, value) };
    }
    return node;
  };

  const insert = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value)) {
      setRoot((prevRoot) => insertNode(prevRoot, value));
      setLastOperation(`insert(${value})`);
      setInputValue('');
      toast.success(`Inserted ${value} into BST`);
    }
  };

  const deleteValue = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value)) {
      setRoot((prevRoot) => deleteNode(prevRoot, value));
      setLastOperation(`delete(${value})`);
      setInputValue('');
      toast.success(`Deleted ${value} from BST`);
    }
  };

  const search = () => {
    const value = parseInt(searchValue);
    if (!isNaN(value) && root) {
      const path = searchNode(root, value);
      if (path) {
        setHighlightedNodes(new Set(path));
        setLastOperation(`search(${value}) → found`);
        toast.success(`Found ${value} in BST`);
        setTimeout(() => setHighlightedNodes(new Set()), 3000);
      } else {
        setLastOperation(`search(${value}) → not found`);
        toast.error(`${value} not found in BST`);
      }
      setSearchValue('');
    }
  };

  const changeRoot = () => {
    const value = parseInt(rootChangeValue);
    if (!isNaN(value)) {
      setRoot((prevRoot) => rebuildWithNewRoot(prevRoot, value));
      setLastOperation(`changeRoot(${value})`);
      setRootChangeValue('');
      toast.success(`Root changed to ${value}`);
    }
  };

  const clear = () => {
    setRoot(null);
    setHighlightedNodes(new Set());
    setLastOperation('clear()');
    setZoom(1);
    setPan({ x: 0, y: 0 });
    toast.info('Tree cleared');
  };

  const getTreeHeight = (node: TreeNode | null): number => {
    if (node === null) return 0;
    return 1 + Math.max(getTreeHeight(node.left), getTreeHeight(node.right));
  };

  const getNodeCount = (node: TreeNode | null): number => {
    if (node === null) return 0;
    return 1 + getNodeCount(node.left) + getNodeCount(node.right);
  };

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      setIsFullscreen(true);
    } else {
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // ESC to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const getTreeBounds = useCallback((node: TreeNode | null, x: number, y: number, xOffset: number): { minX: number; maxX: number; minY: number; maxY: number } => {
    if (!node) return { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    let bounds = { minX: x - 25, maxX: x + 25, minY: y - 25, maxY: y + 25 };
    if (node.left) {
      const leftBounds = getTreeBounds(node.left, x - xOffset, y + 80, xOffset / 2);
      bounds.minX = Math.min(bounds.minX, leftBounds.minX);
      bounds.maxX = Math.max(bounds.maxX, leftBounds.maxX);
      bounds.minY = Math.min(bounds.minY, leftBounds.minY);
      bounds.maxY = Math.max(bounds.maxY, leftBounds.maxY);
    }
    if (node.right) {
      const rightBounds = getTreeBounds(node.right, x + xOffset, y + 80, xOffset / 2);
      bounds.minX = Math.min(bounds.minX, rightBounds.minX);
      bounds.maxX = Math.max(bounds.maxX, rightBounds.maxX);
      bounds.minY = Math.min(bounds.minY, rightBounds.minY);
      bounds.maxY = Math.max(bounds.maxY, rightBounds.maxY);
    }
    return bounds;
  }, []);

  const getInitialXOffset = useCallback((node: TreeNode | null): number => {
    const height = getTreeHeight(node);
    return Math.max(80, Math.pow(2, height - 1) * 30);
  }, []);

  const renderTree = (node: TreeNode | null, x: number, y: number, xOffset: number): React.ReactNode[] => {
    if (!node) return [];
    const elements: React.ReactNode[] = [];
    const isHighlighted = highlightedNodes.has(node.id);
    const isAnimating = animatingNodes.has(node.id);

    if (node.left) {
      const leftX = x - xOffset;
      const leftY = y + 80;
      const lineKey = `line-left-${node.id}`;
      const isLineAnimating = animatingLines.has(lineKey);
      elements.push(
        <line
          key={lineKey}
          x1={x} y1={y + 20}
          x2={leftX} y2={leftY - 20}
          stroke={isHighlighted ? 'var(--brand-primary)' : 'var(--border-default)'}
          strokeWidth="2"
          className={isLineAnimating ? 'animate-line-draw' : ''}
          style={{
            strokeDasharray: isLineAnimating ? '200' : 'none',
            strokeDashoffset: isLineAnimating ? '200' : '0',
            animation: isLineAnimating ? 'lineDraw 0.5s ease forwards' : 'none',
          }}
        />
      );
      elements.push(...renderTree(node.left, leftX, leftY, xOffset / 2));
    }

    if (node.right) {
      const rightX = x + xOffset;
      const rightY = y + 80;
      const lineKey = `line-right-${node.id}`;
      const isLineAnimating = animatingLines.has(lineKey);
      elements.push(
        <line
          key={lineKey}
          x1={x} y1={y + 20}
          x2={rightX} y2={rightY - 20}
          stroke={isHighlighted ? 'var(--brand-primary)' : 'var(--border-default)'}
          strokeWidth="2"
          style={{
            strokeDasharray: isLineAnimating ? '200' : 'none',
            strokeDashoffset: isLineAnimating ? '200' : '0',
            animation: isLineAnimating ? 'lineDraw 0.5s ease forwards' : 'none',
          }}
        />
      );
      elements.push(...renderTree(node.right, rightX, rightY, xOffset / 2));
    }

    elements.push(
      <g key={`node-${node.id}`}
        style={{
          animation: isAnimating ? 'nodeAppear 0.5s ease forwards' : 'none',
          opacity: isAnimating ? 0 : 1,
          transformOrigin: `${x}px ${y}px`,
        }}
      >
        <circle
          cx={x} cy={y} r="20"
          fill={isHighlighted ? 'var(--brand-primary)' : node === root ? '#2563eb' : 'var(--surface-3)'}
          stroke={isHighlighted ? 'var(--brand-primary)' : node === root ? '#1d4ed8' : 'var(--border-default)'}
          strokeWidth={node === root ? 3 : 2}
          className="transition-colors duration-300"
        />
        {node === root && (
          <text
            x={x} y={y - 28}
            textAnchor="middle"
            fill="#2563eb"
            fontSize="10"
            fontWeight="bold"
          >
            ROOT
          </text>
        )}
        <text
          x={x} y={y + 5}
          textAnchor="middle"
          fill={isHighlighted || node === root ? '#ffffff' : 'var(--text-primary)'}
          fontSize="12"
          fontWeight="bold"
        >
          {node.value}
        </text>
      </g>
    );

    return elements;
  };

  const initialXOffset = getInitialXOffset(root);
  const treeBounds = root ? getTreeBounds(root, 0, 40, initialXOffset) : null;
  const svgWidth = treeBounds ? (treeBounds.maxX - treeBounds.minX + 80) : 400;
  const svgHeight = treeBounds ? (treeBounds.maxY - treeBounds.minY + 80) : 300;
  const viewBoxX = treeBounds ? (treeBounds.minX - 40) : 0;
  const viewBoxY = treeBounds ? (treeBounds.minY - 40) : 0;

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.3, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.3, 0.1));
  const handleFitToView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.1), 5));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      setPanStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  }, [pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isPanning && e.touches.length === 1) {
      setPan({ x: e.touches[0].clientX - panStart.x, y: e.touches[0].clientY - panStart.y });
    }
  }, [isPanning, panStart]);

  const handleTouchEnd = useCallback(() => setIsPanning(false), []);

  useEffect(() => {
    if (root) {
      const containerEl = svgContainerRef.current;
      if (containerEl && treeBounds) {
        const containerWidth = containerEl.clientWidth;
        const containerHeight = containerEl.clientHeight;
        const scaleX = containerWidth / svgWidth;
        const scaleY = containerHeight / svgHeight;
        const autoZoom = Math.min(scaleX, scaleY, 1) * 0.85;
        setZoom(autoZoom);
        setPan({ x: 0, y: 0 });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getNodeCount(root), isFullscreen]);

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

  const visualizationPanel = (
    <div
      ref={fullscreenRef}
      className={`rounded-[var(--card-radius)] p-6 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
      style={{ background: 'var(--surface-1)' }}
    >
      {/* CSS animations */}
      <style>{`
        @keyframes lineDraw {
          from { stroke-dashoffset: 200; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes nodeAppear {
          0% { opacity: 0; transform: scale(0); }
          50% { opacity: 0.7; transform: scale(1.3); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          BST Visualization
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Left &lt; Root &lt; Right
          </span>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-2 mb-3 flex-wrap justify-between">
        <div className="flex items-center gap-2">
          <button onClick={handleZoomOut} className="p-2 rounded-[var(--btn-radius)] border transition-all hover:opacity-80" style={outlineBtnStyle} title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm min-w-[60px] text-center" style={{ color: 'var(--text-muted)' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={handleZoomIn} className="p-2 rounded-[var(--btn-radius)] border transition-all hover:opacity-80" style={outlineBtnStyle} title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleFitToView} className="p-2 rounded-[var(--btn-radius)] border transition-all hover:opacity-80" style={outlineBtnStyle} title="Fit to View">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-[var(--btn-radius)] border transition-all hover:opacity-80"
            style={{
              ...outlineBtnStyle,
              background: isFullscreen ? 'var(--brand-primary)' : 'var(--surface-2)',
              color: isFullscreen ? '#fff' : 'var(--text-secondary)',
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Scroll to zoom • Drag to pan {isFullscreen && '• ESC to exit'}
        </span>
      </div>

      {/* SVG Container */}
      <div
        ref={svgContainerRef}
        className="w-full border rounded-lg overflow-hidden relative flex-1"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--surface-2)',
          minHeight: isFullscreen ? '0' : '450px',
          cursor: isPanning ? 'grabbing' : 'grab',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grid background */}
        {root && (
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle, var(--text-primary) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />
        )}

        {!root ? (
          <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--text-muted)' }}>
            <GitBranch className="w-12 h-12 opacity-30" />
            <span>Empty Binary Search Tree</span>
            <span className="text-xs">Insert a value to begin</span>
          </div>
        ) : (
          <svg
            width="100%"
            height="100%"
            viewBox={`${viewBoxX} ${viewBoxY} ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <g transform={`translate(${pan.x / zoom}, ${pan.y / zoom}) scale(${zoom})`}
              style={{ transformOrigin: `${viewBoxX + svgWidth / 2}px ${viewBoxY + svgHeight / 2}px` }}
            >
              {renderTree(root, 0, 40, initialXOffset)}
            </g>
          </svg>
        )}
      </div>

      {/* Bottom bar */}
      {!isFullscreen && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ background: '#2563eb' }} />
              <span>Root Node</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ background: 'var(--brand-primary)' }} />
              <span>Search Path</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full border" style={{ background: 'var(--surface-3)', borderColor: 'var(--border-default)' }} />
              <span>Tree Node</span>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] p-4 w-full text-sm space-y-2" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
            <div><strong style={{ color: 'var(--brand-primary)' }}>Insert:</strong> O(log n) average, O(n) worst case</div>
            <div><strong style={{ color: 'var(--brand-primary)' }}>Delete:</strong> O(log n) average, O(n) worst case</div>
            <div><strong style={{ color: 'var(--brand-primary)' }}>Search:</strong> O(log n) average, O(n) worst case</div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel - Controls */}
        <div className="rounded-[var(--card-radius)] p-6" style={{ background: 'var(--surface-1)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Binary Search Tree
            </h2>
          </div>

          <div className="space-y-4">
            {/* Insert */}
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Enter value"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && insert()}
                className="h-10 px-3 flex-1 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
                style={inputStyle}
              />
              <button
                onClick={insert}
                disabled={isNaN(parseInt(inputValue))}
                className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--brand-primary)', color: 'var(--bg-primary)' }}
              >
                Insert
              </button>
            </div>

            {/* Delete / Clear */}
            <div className="flex gap-2">
              <button
                onClick={deleteValue}
                disabled={isNaN(parseInt(inputValue)) || !root}
                className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={outlineBtnStyle}
              >
                Delete
              </button>
              <button
                onClick={clear}
                className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all"
                style={outlineBtnStyle}
              >
                <RotateCcw className="w-4 h-4 inline mr-1" />
                Clear
              </button>
            </div>

            {/* Search */}
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Search value"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search()}
                className="h-10 px-3 flex-1 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
                style={inputStyle}
              />
              <button
                onClick={search}
                disabled={isNaN(parseInt(searchValue)) || !root}
                className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={outlineBtnStyle}
              >
                Search
              </button>
            </div>

            {/* Change Root */}
            <div className="border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                Change Root Node
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="New root value"
                  value={rootChangeValue}
                  onChange={(e) => setRootChangeValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && changeRoot()}
                  className="h-10 px-3 flex-1 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
                  style={inputStyle}
                />
                <button
                  onClick={changeRoot}
                  disabled={isNaN(parseInt(rootChangeValue))}
                  className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: '#2563eb', color: '#ffffff' }}
                >
                  Set Root
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Rebuilds the tree with the specified value as root. All existing values are preserved.
              </p>
            </div>

            {/* Code block */}
            <div className="rounded-[var(--radius-md)] p-4 font-mono text-sm" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
              <div style={{ color: 'var(--text-muted)' }} className="mb-2">// Binary Search Tree</div>
              <div>
                <span style={{ color: 'var(--brand-secondary)' }}>class</span>
                <span style={{ color: 'var(--text-primary)' }}> BST {'{'}</span>
              </div>
              <div className="ml-4">
                <div>
                  <span style={{ color: 'var(--brand-secondary)' }}>constructor</span>
                  <span style={{ color: 'var(--text-primary)' }}>() {'{'}</span>
                </div>
                <div className="ml-4">
                  <span style={{ color: 'var(--text-primary)' }}>this.root = null;</span>
                </div>
                <div style={{ color: 'var(--text-primary)' }}>{'}'}</div>
                <br />
                <div style={{ color: 'var(--brand-primary)' }}>
                  {lastOperation || '// Operations will appear here'}
                </div>
              </div>
              <div style={{ color: 'var(--text-primary)' }}>{'}'}</div>
            </div>

            {/* Stats */}
            <div className="text-sm space-y-1" style={{ color: 'var(--text-muted)' }}>
              <div><strong>Nodes:</strong> {getNodeCount(root)}</div>
              <div><strong>Height:</strong> {getTreeHeight(root)}</div>
              <div><strong>Root:</strong> {root ? root.value : 'null'}</div>
              <div><strong>Empty:</strong> {!root ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>

        {/* Right panel - Visualization (normal mode) */}
        {!isFullscreen && visualizationPanel}
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50" style={{ background: 'var(--surface-1)' }}>
          {visualizationPanel}
        </div>
      )}
    </>
  );
}