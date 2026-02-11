import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Shuffle,
} from 'lucide-react';

interface Step {
  array: number[];
  activeIndices: number[];
  comparingIndices: number[];
  description: string;
  code: string;
}

export function ArrayVisualizer() {
  const [array, setArray] = useState<number[]>([5, 2, 8, 1, 9]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [algorithm, setAlgorithm] = useState('bubble');
  const [inputValue, setInputValue] = useState('');
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      intervalRef.current = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, speed);
    } else {
      setIsPlaying(false);
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isPlaying, currentStep, steps.length, speed]);

  const bubbleSort = (arr: number[]): Step[] => {
    const steps: Step[] = [];
    const workingArray = [...arr];
    const n = workingArray.length;

    steps.push({
      array: [...workingArray],
      activeIndices: [],
      comparingIndices: [],
      description: 'Starting Bubble Sort',
      code: 'function bubbleSort(arr) {',
    });

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        steps.push({
          array: [...workingArray],
          activeIndices: [j, j + 1],
          comparingIndices: [j, j + 1],
          description: `Comparing elements at indices ${j} and ${j + 1}`,
          code: `  if (arr[${j}] > arr[${j + 1}]) {`,
        });

        if (workingArray[j] > workingArray[j + 1]) {
          [workingArray[j], workingArray[j + 1]] = [
            workingArray[j + 1],
            workingArray[j],
          ];
          steps.push({
            array: [...workingArray],
            activeIndices: [j, j + 1],
            comparingIndices: [],
            description: `Swapped ${workingArray[j + 1]} and ${workingArray[j]}`,
            code: `    swap(arr[${j}], arr[${j + 1}]);`,
          });
        }
      }
    }

    steps.push({
      array: [...workingArray],
      activeIndices: [],
      comparingIndices: [],
      description: 'Sorting completed!',
      code: '}',
    });

    return steps;
  };

  const quickSort = (arr: number[]): Step[] => {
    const steps: Step[] = [];
    const workingArray = [...arr];

    const partition = (low: number, high: number): number => {
      const pivot = workingArray[high];
      let i = low - 1;

      steps.push({
        array: [...workingArray],
        activeIndices: [high],
        comparingIndices: [],
        description: `Pivot selected: ${pivot} at index ${high}`,
        code: `pivot = arr[${high}];`,
      });

      for (let j = low; j < high; j++) {
        steps.push({
          array: [...workingArray],
          activeIndices: [high],
          comparingIndices: [j],
          description: `Comparing ${workingArray[j]} with pivot ${pivot}`,
          code: `if (arr[${j}] <= pivot) {`,
        });

        if (workingArray[j] <= pivot) {
          i++;
          [workingArray[i], workingArray[j]] = [
            workingArray[j],
            workingArray[i],
          ];
          steps.push({
            array: [...workingArray],
            activeIndices: [high, i, j],
            comparingIndices: [],
            description: `Swapped ${workingArray[j]} and ${workingArray[i]}`,
            code: `  swap(arr[${i}], arr[${j}]);`,
          });
        }
      }

      [workingArray[i + 1], workingArray[high]] = [
        workingArray[high],
        workingArray[i + 1],
      ];
      steps.push({
        array: [...workingArray],
        activeIndices: [i + 1],
        comparingIndices: [],
        description: `Placed pivot ${pivot} at correct position`,
        code: `swap(arr[${i + 1}], arr[${high}]);`,
      });

      return i + 1;
    };

    const quickSortHelper = (low: number, high: number) => {
      if (low < high) {
        const pi = partition(low, high);
        quickSortHelper(low, pi - 1);
        quickSortHelper(pi + 1, high);
      }
    };

    steps.push({
      array: [...workingArray],
      activeIndices: [],
      comparingIndices: [],
      description: 'Starting Quick Sort',
      code: 'function quickSort(arr, low, high) {',
    });

    quickSortHelper(0, workingArray.length - 1);

    steps.push({
      array: [...workingArray],
      activeIndices: [],
      comparingIndices: [],
      description: 'Quick Sort completed!',
      code: '}',
    });

    return steps;
  };

  const mergeSort = (arr: number[]): Step[] => {
    const steps: Step[] = [];
    const workingArray = [...arr];

    const merge = (left: number, mid: number, right: number) => {
      const leftArr = workingArray.slice(left, mid + 1);
      const rightArr = workingArray.slice(mid + 1, right + 1);
      let i = 0,
        j = 0,
        k = left;

      steps.push({
        array: [...workingArray],
        activeIndices: Array.from(
          { length: right - left + 1 },
          (_, idx) => left + idx
        ),
        comparingIndices: [],
        description: `Merging subarrays [${left}..${mid}] and [${mid + 1}..${right}]`,
        code: `merge(arr, ${left}, ${mid}, ${right});`,
      });

      while (i < leftArr.length && j < rightArr.length) {
        if (leftArr[i] <= rightArr[j]) {
          workingArray[k] = leftArr[i];
          i++;
        } else {
          workingArray[k] = rightArr[j];
          j++;
        }
        steps.push({
          array: [...workingArray],
          activeIndices: [k],
          comparingIndices: [],
          description: `Placed ${workingArray[k]} at position ${k}`,
          code: `arr[${k}] = ${workingArray[k]};`,
        });
        k++;
      }

      while (i < leftArr.length) {
        workingArray[k] = leftArr[i];
        steps.push({
          array: [...workingArray],
          activeIndices: [k],
          comparingIndices: [],
          description: `Placed remaining element ${workingArray[k]}`,
          code: `arr[${k}] = ${workingArray[k]};`,
        });
        i++;
        k++;
      }

      while (j < rightArr.length) {
        workingArray[k] = rightArr[j];
        steps.push({
          array: [...workingArray],
          activeIndices: [k],
          comparingIndices: [],
          description: `Placed remaining element ${workingArray[k]}`,
          code: `arr[${k}] = ${workingArray[k]};`,
        });
        j++;
        k++;
      }
    };

    const mergeSortHelper = (left: number, right: number) => {
      if (left < right) {
        const mid = Math.floor((left + right) / 2);
        mergeSortHelper(left, mid);
        mergeSortHelper(mid + 1, right);
        merge(left, mid, right);
      }
    };

    steps.push({
      array: [...workingArray],
      activeIndices: [],
      comparingIndices: [],
      description: 'Starting Merge Sort',
      code: 'function mergeSort(arr, left, right) {',
    });

    mergeSortHelper(0, workingArray.length - 1);

    steps.push({
      array: [...workingArray],
      activeIndices: [],
      comparingIndices: [],
      description: 'Merge Sort completed!',
      code: '}',
    });

    return steps;
  };

  const startVisualization = () => {
    let sortSteps: Step[] = [];

    switch (algorithm) {
      case 'bubble':
        sortSteps = bubbleSort(array);
        break;
      case 'quick':
        sortSteps = quickSort(array);
        break;
      case 'merge':
        sortSteps = mergeSort(array);
        break;
    }

    setSteps(sortSteps);
    setCurrentStep(0);
    toast.success(`${algorithm} sort visualization started!`);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const reset = () => {
    setSteps([]);
    setCurrentStep(0);
    setIsPlaying(false);
    toast.info('Visualization reset');
  };

  const addElement = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value)) {
      setArray([...array, value]);
      setInputValue('');
      toast.success(`Added ${value} to array`);
    }
  };

  const generateRandomArray = () => {
    const newArray = Array.from(
      { length: 8 },
      () => Math.floor(Math.random() * 50) + 1
    );
    setArray(newArray);
    reset();
    toast.success('Generated random array');
  };

  const currentArray =
    steps.length > 0 ? steps[currentStep]?.array || array : array;
  const activeIndices =
    steps.length > 0 ? steps[currentStep]?.activeIndices || [] : [];
  const comparingIndices =
    steps.length > 0 ? steps[currentStep]?.comparingIndices || [] : [];

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Code Editor Section */}
      <div className="rounded-[var(--card-radius)] p-6" style={{ background: 'var(--surface-1)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            Code Editor
          </h2>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="px-3 py-1.5 rounded-[var(--btn-radius)] font-medium text-xs border transition-all"
              style={outlineBtnStyle}
            >
              <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
              Reset
            </button>
            <button
              onClick={generateRandomArray}
              className="px-3 py-1.5 rounded-[var(--btn-radius)] font-medium text-xs border transition-all"
              style={outlineBtnStyle}
            >
              <Shuffle className="w-3.5 h-3.5 inline mr-1" />
              Generate
            </button>
            <button
              onClick={startVisualization}
              className="px-3 py-1.5 rounded-[var(--btn-radius)] font-medium text-xs transition-all"
              style={{ background: 'var(--brand-primary)', color: 'var(--bg-primary)' }}
            >
              <Play className="w-3.5 h-3.5 inline mr-1" />
              Visualize
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="h-9 px-3 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] transition-all w-48"
              style={inputStyle}
            >
              <option value="bubble">Bubble Sort</option>
              <option value="quick">Quick Sort</option>
              <option value="merge">Merge Sort</option>
            </select>
            <span className="flex-grow" />
            <input
              type="number"
              placeholder="Add element"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addElement()}
              className="h-9 px-3 w-28 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
              style={inputStyle}
            />
            <button
              onClick={addElement}
              disabled={isNaN(parseInt(inputValue))}
              className="px-3 py-1.5 rounded-[var(--btn-radius)] font-medium text-xs border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={outlineBtnStyle}
            >
              Add
            </button>
          </div>

          {/* Code display */}
          <div
            className="rounded-[var(--radius-md)] p-4 font-mono text-sm"
            style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
          >
            <div style={{ color: 'var(--text-muted)' }} className="mb-2">
              // Array Operations Example
            </div>
            <div>
              <span style={{ color: 'var(--brand-secondary)' }}>let</span>
              <span style={{ color: 'var(--text-primary)' }}> arr = [</span>
              <span style={{ color: 'var(--state-success)' }}>{array.join(', ')}</span>
              <span style={{ color: 'var(--text-primary)' }}>];</span>
            </div>
            <div className="mt-2" style={{ color: 'var(--brand-primary)' }}>
              {steps.length > 0 && steps[currentStep]
                ? steps[currentStep].code
                : `${algorithm}Sort(arr);`}
            </div>
          </div>
        </div>
      </div>

      {/* Array Visualization Section */}
      <div className="rounded-[var(--card-radius)] p-6" style={{ background: 'var(--surface-1)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Array Visualization
          </h2>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {steps.length > 0
              ? `${currentStep + 1} / ${steps.length}`
              : 'Ready to visualize'}
          </span>
        </div>

        <div className="space-y-6">
          {/* Array Display */}
          <div className="flex flex-wrap gap-2 justify-center min-h-[80px] items-center">
            {currentArray.map((value, index) => (
              <div
                key={index}
                className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center font-bold text-lg transition-all duration-300"
                style={{
                  background: activeIndices.includes(index)
                    ? 'var(--brand-primary)'
                    : comparingIndices.includes(index)
                    ? 'var(--surface-3)'
                    : 'var(--surface-2)',
                  color: activeIndices.includes(index)
                    ? 'var(--bg-primary)'
                    : 'var(--text-primary)',
                  border: `2px solid ${
                    activeIndices.includes(index)
                      ? 'var(--brand-primary)'
                      : comparingIndices.includes(index)
                      ? 'var(--brand-primary)'
                      : 'var(--border-default)'
                  }`,
                  boxShadow: activeIndices.includes(index)
                    ? '0 0 12px var(--brand-primary)'
                    : 'none',
                  transform: activeIndices.includes(index)
                    ? 'scale(1.1)'
                    : 'scale(1)',
                }}
              >
                {value}
              </div>
            ))}
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0 || steps.length === 0}
              className="px-3 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={outlineBtnStyle}
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlayback}
              disabled={steps.length === 0 || currentStep >= steps.length - 1}
              className="w-12 h-12 rounded-full flex items-center justify-center font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--brand-primary)', color: 'var(--bg-primary)' }}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={() =>
                setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
              }
              disabled={currentStep >= steps.length - 1 || steps.length === 0}
              className="px-3 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={outlineBtnStyle}
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Speed Control */}
          <div className="flex items-center gap-2 justify-center">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Speed:</span>
            <select
              value={speed.toString()}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="h-8 px-3 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] transition-all w-28"
              style={inputStyle}
            >
              <option value="2000">Slow</option>
              <option value="1000">Normal</option>
              <option value="500">Fast</option>
            </select>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full" style={{ background: 'var(--surface-2)' }}>
            <div
              className="h-2.5 rounded-full transition-all duration-300"
              style={{
                background: 'var(--brand-primary)',
                width:
                  steps.length > 0
                    ? `${((currentStep + 1) / steps.length) * 100}%`
                    : '0%',
              }}
            />
          </div>

          {/* Description */}
          {steps.length > 0 && steps[currentStep] && (
            <div
              className="text-center text-sm rounded-[var(--radius-md)] p-3"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
            >
              {steps[currentStep].description}
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-4 text-xs flex-wrap justify-center" style={{ color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: 'var(--brand-primary)' }} />
              <span>Active / Swapped</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border" style={{ background: 'var(--surface-3)', borderColor: 'var(--brand-primary)' }} />
              <span>Comparing</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-default)' }} />
              <span>Default</span>
            </div>
          </div>

          {/* Operations Info */}
          <div
            className="rounded-[var(--radius-md)] p-4 text-sm space-y-2"
            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
          >
            <div><strong style={{ color: 'var(--brand-primary)' }}>Bubble Sort:</strong> O(n²) — Compare adjacent, swap if needed</div>
            <div><strong style={{ color: 'var(--brand-primary)' }}>Quick Sort:</strong> O(n log n) avg — Pivot-based partitioning</div>
            <div><strong style={{ color: 'var(--brand-primary)' }}>Merge Sort:</strong> O(n log n) — Divide, sort halves, merge</div>
          </div>
        </div>
      </div>
    </div>
  );
}
