// Mock data for Algorithm Visualizer module

export type AlgorithmCategory = 'sorting' | 'searching' | 'graph' | 'tree';

export interface AlgorithmInfo {
  id: string;
  name: string;
  category: AlgorithmCategory;
  description: string;
  timeComplexity: { best: string; average: string; worst: string };
  spaceComplexity: string;
  stable?: boolean;
  pseudocode: string[];
}

export interface ArrayBar {
  value: number;
  state: 'default' | 'comparing' | 'swapping' | 'sorted' | 'pivot' | 'selected';
}

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  state: 'default' | 'visiting' | 'visited' | 'current' | 'path' | 'start' | 'end';
}

export interface GraphEdge {
  from: string;
  to: string;
  weight?: number;
  state: 'default' | 'active' | 'path' | 'visited';
}

export const algorithms: AlgorithmInfo[] = [
  // Sorting
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    category: 'sorting',
    description: 'Repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order.',
    timeComplexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(1)',
    stable: true,
    pseudocode: [
      'for i = 0 to n-1:',
      '  for j = 0 to n-i-1:',
      '    if arr[j] > arr[j+1]:',
      '      swap(arr[j], arr[j+1])',
    ],
  },
  {
    id: 'selection-sort',
    name: 'Selection Sort',
    category: 'sorting',
    description: 'Finds the minimum element from the unsorted part and puts it at the beginning.',
    timeComplexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(1)',
    stable: false,
    pseudocode: [
      'for i = 0 to n-1:',
      '  minIdx = i',
      '  for j = i+1 to n:',
      '    if arr[j] < arr[minIdx]:',
      '      minIdx = j',
      '  swap(arr[i], arr[minIdx])',
    ],
  },
  {
    id: 'insertion-sort',
    name: 'Insertion Sort',
    category: 'sorting',
    description: 'Builds the sorted array one element at a time by inserting each element into its correct position.',
    timeComplexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(1)',
    stable: true,
    pseudocode: [
      'for i = 1 to n:',
      '  key = arr[i]',
      '  j = i - 1',
      '  while j >= 0 and arr[j] > key:',
      '    arr[j+1] = arr[j]',
      '    j = j - 1',
      '  arr[j+1] = key',
    ],
  },
  {
    id: 'merge-sort',
    name: 'Merge Sort',
    category: 'sorting',
    description: 'Divides the array into halves, recursively sorts them, and merges the sorted halves.',
    timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
    spaceComplexity: 'O(n)',
    stable: true,
    pseudocode: [
      'mergeSort(arr, l, r):',
      '  if l < r:',
      '    mid = (l + r) / 2',
      '    mergeSort(arr, l, mid)',
      '    mergeSort(arr, mid+1, r)',
      '    merge(arr, l, mid, r)',
    ],
  },
  {
    id: 'quick-sort',
    name: 'Quick Sort',
    category: 'sorting',
    description: 'Picks a pivot element and partitions the array around it, then recursively sorts the partitions.',
    timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' },
    spaceComplexity: 'O(log n)',
    stable: false,
    pseudocode: [
      'quickSort(arr, low, high):',
      '  if low < high:',
      '    pi = partition(arr, low, high)',
      '    quickSort(arr, low, pi - 1)',
      '    quickSort(arr, pi + 1, high)',
    ],
  },
  // Searching
  {
    id: 'linear-search',
    name: 'Linear Search',
    category: 'searching',
    description: 'Sequentially checks each element of the list until a match is found or the whole list has been searched.',
    timeComplexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)' },
    spaceComplexity: 'O(1)',
    pseudocode: [
      'for i = 0 to n:',
      '  if arr[i] == target:',
      '    return i',
      'return -1',
    ],
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    category: 'searching',
    description: 'Efficiently searches a sorted array by repeatedly dividing the search interval in half.',
    timeComplexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' },
    spaceComplexity: 'O(1)',
    pseudocode: [
      'low = 0, high = n - 1',
      'while low <= high:',
      '  mid = (low + high) / 2',
      '  if arr[mid] == target: return mid',
      '  if arr[mid] < target: low = mid + 1',
      '  else: high = mid - 1',
      'return -1',
    ],
  },
  // Graph
  {
    id: 'bfs',
    name: 'Breadth-First Search',
    category: 'graph',
    description: 'Explores all neighbor nodes at the present depth before moving on to nodes at the next depth level.',
    timeComplexity: { best: 'O(V+E)', average: 'O(V+E)', worst: 'O(V+E)' },
    spaceComplexity: 'O(V)',
    pseudocode: [
      'BFS(graph, start):',
      '  queue = [start]',
      '  visited = {start}',
      '  while queue is not empty:',
      '    node = queue.dequeue()',
      '    for neighbor in graph[node]:',
      '      if neighbor not in visited:',
      '        visited.add(neighbor)',
      '        queue.enqueue(neighbor)',
    ],
  },
  {
    id: 'dfs',
    name: 'Depth-First Search',
    category: 'graph',
    description: 'Explores as far as possible along each branch before backtracking.',
    timeComplexity: { best: 'O(V+E)', average: 'O(V+E)', worst: 'O(V+E)' },
    spaceComplexity: 'O(V)',
    pseudocode: [
      'DFS(graph, node, visited):',
      '  visited.add(node)',
      '  for neighbor in graph[node]:',
      '    if neighbor not in visited:',
      '      DFS(graph, neighbor, visited)',
    ],
  },
  {
    id: 'dijkstra',
    name: "Dijkstra's Algorithm",
    category: 'graph',
    description: 'Finds the shortest paths from a source node to all other nodes in a weighted graph.',
    timeComplexity: { best: 'O((V+E) log V)', average: 'O((V+E) log V)', worst: 'O((V+E) log V)' },
    spaceComplexity: 'O(V)',
    pseudocode: [
      'Dijkstra(graph, source):',
      '  dist[source] = 0',
      '  pq = [(0, source)]',
      '  while pq is not empty:',
      '    (d, u) = pq.extractMin()',
      '    for (v, w) in graph[u]:',
      '      if d + w < dist[v]:',
      '        dist[v] = d + w',
      '        pq.insert((dist[v], v))',
    ],
  },
];

export function generateRandomArray(size: number, min = 5, max = 100): ArrayBar[] {
  return Array.from({ length: size }, () => ({
    value: Math.floor(Math.random() * (max - min + 1)) + min,
    state: 'default' as const,
  }));
}
 
// Generate an array with a random length between 1 and maxLen (default 10).
// Useful for quick examples that should not exceed a small size for demos/tests.
export function generateRandomArrayRandomLen(maxLen = 10, min = 5, max = 100): ArrayBar[] {
  const size = Math.max(1, Math.floor(Math.random() * maxLen) + 1); // 1..maxLen
  return generateRandomArray(size, min, max);
}

export const sampleGraph: { nodes: GraphNode[]; edges: GraphEdge[] } = {
  nodes: [
    { id: 'A', label: 'A', x: 100, y: 100, state: 'default' },
    { id: 'B', label: 'B', x: 250, y: 50, state: 'default' },
    { id: 'C', label: 'C', x: 250, y: 200, state: 'default' },
    { id: 'D', label: 'D', x: 400, y: 50, state: 'default' },
    { id: 'E', label: 'E', x: 400, y: 200, state: 'default' },
    { id: 'F', label: 'F', x: 550, y: 125, state: 'default' },
  ],
  edges: [
    { from: 'A', to: 'B', weight: 4, state: 'default' },
    { from: 'A', to: 'C', weight: 2, state: 'default' },
    { from: 'B', to: 'D', weight: 5, state: 'default' },
    { from: 'B', to: 'C', weight: 1, state: 'default' },
    { from: 'C', to: 'E', weight: 8, state: 'default' },
    { from: 'D', to: 'F', weight: 6, state: 'default' },
    { from: 'E', to: 'F', weight: 3, state: 'default' },
    { from: 'D', to: 'E', weight: 2, state: 'default' },
  ],
};
