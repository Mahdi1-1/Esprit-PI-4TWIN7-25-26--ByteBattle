import { useState } from 'react';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';

export function StackVisualizer() {
  const [stack, setStack] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [lastOperation, setLastOperation] = useState('');

  const push = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value)) {
      setStack([...stack, value]);
      setLastOperation(`push(${value})`);
      setInputValue('');
      toast.success(`Pushed ${value} onto stack`);
    }
  };

  const pop = () => {
    if (stack.length > 0) {
      const poppedValue = stack[stack.length - 1];
      setStack(stack.slice(0, -1));
      setLastOperation(`pop() → ${poppedValue}`);
      toast.success(`Popped ${poppedValue} from stack`);
    } else {
      toast.error('Stack is empty!');
    }
  };

  const clear = () => {
    setStack([]);
    setLastOperation('clear()');
    toast.info('Stack cleared');
  };

  const peek = () => {
    if (stack.length > 0) {
      const topValue = stack[stack.length - 1];
      setLastOperation(`peek() → ${topValue}`);
      toast.info(`Top element: ${topValue}`);
    } else {
      toast.error('Stack is empty!');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Code Editor Section */}
      <div className="rounded-[var(--card-radius)] p-6" style={{ background: 'var(--surface-1)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            Stack Operations
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Enter value"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && push()}
              className="h-10 px-3 flex-1 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
              style={{
                background: 'var(--surface-2)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={push}
              disabled={isNaN(parseInt(inputValue))}
              className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--brand-primary)',
                color: 'var(--bg-primary)',
              }}
            >
              Push
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={pop}
              disabled={stack.length === 0}
              className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--surface-2)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              Pop
            </button>
            <button
              onClick={peek}
              disabled={stack.length === 0}
              className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--surface-2)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              Peek
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
            <div style={{ color: 'var(--text-muted)' }} className="mb-2">// Stack Implementation</div>
            <div>
              <span style={{ color: 'var(--brand-secondary)' }}>class</span>
              <span style={{ color: 'var(--text-primary)' }}> Stack {'{'}</span>
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
            <div><strong>Size:</strong> {stack.length}</div>
            <div><strong>Top:</strong> {stack.length > 0 ? stack[stack.length - 1] : 'Empty'}</div>
            <div><strong>Empty:</strong> {stack.length === 0 ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>

      {/* Stack Visualization Section */}
      <div className="rounded-[var(--card-radius)] p-6" style={{ background: 'var(--surface-1)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Stack Visualization
          </h2>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            LIFO (Last In, First Out)
          </span>
        </div>

        <div className="flex flex-col items-center space-y-4">
          {/* Stack Container */}
          <div className="relative">
            <div
              className="flex flex-col-reverse space-y-reverse space-y-1 min-h-[300px] w-32 border-l-4 border-r-4 border-b-4 rounded-b-lg p-2"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-2)',
              }}
            >
              {stack.length === 0 ? (
                <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
                  Empty Stack
                </div>
              ) : (
                stack.map((value, index) => (
                  <div
                    key={index}
                    className="w-full h-12 rounded-[var(--radius-md)] flex items-center justify-center font-bold text-lg transition-all duration-300"
                    style={{
                      background: index === stack.length - 1 ? 'var(--brand-primary)' : 'var(--surface-3)',
                      color: index === stack.length - 1 ? 'var(--bg-primary)' : 'var(--text-primary)',
                      border: `2px solid ${index === stack.length - 1 ? 'var(--brand-primary)' : 'var(--border-default)'}`,
                      boxShadow: index === stack.length - 1 ? '0 0 12px var(--brand-primary)' : 'none',
                    }}
                  >
                    {value}
                  </div>
                ))
              )}
            </div>

            {/* Top Pointer */}
            {stack.length > 0 && (
              <div className="absolute -right-16 top-2 flex items-center">
                <div className="w-8 h-0.5" style={{ background: 'var(--brand-primary)' }} />
                <div className="text-sm font-medium ml-2" style={{ color: 'var(--brand-primary)' }}>
                  TOP
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: 'var(--brand-primary)' }} />
              <span>Top Element</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border" style={{ background: 'var(--surface-3)', borderColor: 'var(--border-default)' }} />
              <span>Stack Element</span>
            </div>
          </div>

          {/* Operations Info */}
          <div
            className="rounded-[var(--radius-md)] p-4 w-full text-sm space-y-2"
            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
          >
            <div><strong style={{ color: 'var(--brand-primary)' }}>Push:</strong> Add element to the top</div>
            <div><strong style={{ color: 'var(--brand-primary)' }}>Pop:</strong> Remove element from the top</div>
            <div><strong style={{ color: 'var(--brand-primary)' }}>Peek:</strong> View top element without removing</div>
            <div><strong style={{ color: 'var(--brand-primary)' }}>Time Complexity:</strong> O(1) for all operations</div>
          </div>
        </div>
      </div>
    </div>
  );
}
