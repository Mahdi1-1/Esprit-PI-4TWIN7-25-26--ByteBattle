import { useState } from 'react';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';

export function QueueVisualizer() {
  const [queue, setQueue] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [lastOperation, setLastOperation] = useState('');

  const enqueue = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value)) {
      setQueue([...queue, value]);
      setLastOperation(`enqueue(${value})`);
      setInputValue('');
      toast.success(`Enqueued ${value}`);
    }
  };

  const dequeue = () => {
    if (queue.length > 0) {
      const dequeuedValue = queue[0];
      setQueue(queue.slice(1));
      setLastOperation(`dequeue() → ${dequeuedValue}`);
      toast.success(`Dequeued ${dequeuedValue}`);
    } else {
      toast.error('Queue is empty!');
    }
  };

  const clear = () => {
    setQueue([]);
    setLastOperation('clear()');
    toast.info('Queue cleared');
  };

  const front = () => {
    if (queue.length > 0) {
      const frontValue = queue[0];
      setLastOperation(`front() → ${frontValue}`);
      toast.info(`Front element: ${frontValue}`);
    } else {
      toast.error('Queue is empty!');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Code Editor Section */}
      <div className="rounded-[var(--card-radius)] p-6" style={{ background: 'var(--surface-1)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            Queue Operations
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Enter value"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enqueue()}
              className="h-10 px-3 flex-1 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
              style={{
                background: 'var(--surface-2)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={enqueue}
              disabled={isNaN(parseInt(inputValue))}
              className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--brand-primary)',
                color: 'var(--bg-primary)',
              }}
            >
              Enqueue
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={dequeue}
              disabled={queue.length === 0}
              className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--surface-2)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              Dequeue
            </button>
            <button
              onClick={front}
              disabled={queue.length === 0}
              className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--surface-2)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              Front
            </button>
            <button
              onClick={clear}
              className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all"
              style={{
                background: 'var(--surface-2)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              <RotateCcw className="w-4 h-4 inline mr-1" />
              Clear
            </button>
          </div>

          {/* Code block */}
          <div
            className="rounded-[var(--radius-md)] p-4 font-mono text-sm"
            style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
          >
            <div style={{ color: 'var(--text-muted)' }} className="mb-2">// Queue Implementation</div>
            <div>
              <span style={{ color: 'var(--brand-secondary)' }}>class</span>
              <span style={{ color: 'var(--text-primary)' }}> Queue {'{'}</span>
            </div>
            <div className="ml-4">
              <div>
                <span style={{ color: 'var(--brand-secondary)' }}>constructor</span>
                <span style={{ color: 'var(--text-primary)' }}>() {'{'}</span>
              </div>
              <div className="ml-4">
                <span style={{ color: 'var(--text-primary)' }}>this.items = [];</span>
              </div>
              <div style={{ color: 'var(--text-primary)' }}>{'}'}</div>
              <br />
              <div style={{ color: 'var(--brand-primary)' }}>
                {lastOperation || '// Operations will appear here'}
              </div>
            </div>
            <div style={{ color: 'var(--text-primary)' }}>{'}'}</div>
          </div>

          <div className="text-sm space-y-1" style={{ color: 'var(--text-muted)' }}>
            <div><strong>Size:</strong> {queue.length}</div>
            <div><strong>Front:</strong> {queue.length > 0 ? queue[0] : 'Empty'}</div>
            <div><strong>Rear:</strong> {queue.length > 0 ? queue[queue.length - 1] : 'Empty'}</div>
            <div><strong>Empty:</strong> {queue.length === 0 ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>

      {/* Queue Visualization Section */}
      <div className="rounded-[var(--card-radius)] p-6" style={{ background: 'var(--surface-1)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Queue Visualization
          </h2>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            FIFO (First In, First Out)
          </span>
        </div>

        <div className="flex flex-col items-center space-y-6">
          {/* Queue Container */}
          <div className="relative w-full max-w-md">
            <div
              className="flex gap-1 min-h-[80px] border-t-4 border-b-4 rounded-lg p-4 overflow-x-auto"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-2)',
              }}
            >
              {queue.length === 0 ? (
                <div className="flex items-center justify-center w-full" style={{ color: 'var(--text-muted)' }}>
                  Empty Queue
                </div>
              ) : (
                queue.map((value, index) => (
                  <div
                    key={index}
                    className="min-w-[3rem] h-12 rounded-[var(--radius-md)] flex items-center justify-center font-bold text-lg transition-all duration-300"
                    style={{
                      background:
                        index === 0
                          ? 'var(--brand-primary)'
                          : index === queue.length - 1
                          ? 'var(--surface-3)'
                          : 'var(--surface-2)',
                      color:
                        index === 0
                          ? 'var(--bg-primary)'
                          : 'var(--text-primary)',
                      border: `2px solid ${index === 0 ? 'var(--brand-primary)' : index === queue.length - 1 ? 'var(--brand-primary)' : 'var(--border-default)'}`,
                      boxShadow: index === 0 ? '0 0 12px var(--brand-primary)' : 'none',
                    }}
                  >
                    {value}
                  </div>
                ))
              )}
            </div>

            {/* Front and Rear Pointers */}
            {queue.length > 0 && (
              <>
                <div className="absolute -top-8 left-4 flex flex-col items-center">
                  <div className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>FRONT</div>
                  <div className="w-0.5 h-4" style={{ background: 'var(--brand-primary)' }} />
                </div>
                <div className="absolute -bottom-8 right-4 flex flex-col items-center">
                  <div className="w-0.5 h-4" style={{ background: 'var(--text-muted)' }} />
                  <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>REAR</div>
                </div>
              </>
            )}
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: 'var(--brand-primary)' }} />
              <span>Front Element</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border" style={{ background: 'var(--surface-3)', borderColor: 'var(--border-default)' }} />
              <span>Rear Element</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-default)' }} />
              <span>Queue Element</span>
            </div>
          </div>

          {/* Operations Info */}
          <div
            className="rounded-[var(--radius-md)] p-4 w-full text-sm space-y-2"
            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
          >
            <div><strong style={{ color: 'var(--brand-primary)' }}>Enqueue:</strong> Add element to the rear</div>
            <div><strong style={{ color: 'var(--brand-primary)' }}>Dequeue:</strong> Remove element from the front</div>
            <div><strong style={{ color: 'var(--brand-primary)' }}>Front:</strong> View front element without removing</div>
            <div><strong style={{ color: 'var(--brand-primary)' }}>Time Complexity:</strong> O(1) for all operations</div>
          </div>
        </div>
      </div>
    </div>
  );
}
