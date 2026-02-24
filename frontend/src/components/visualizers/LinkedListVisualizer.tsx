import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight, RotateCcw } from 'lucide-react';

interface ListNode {
  value: number;
  id: string;
}

export function LinkedListVisualizer() {
  const [list, setList] = useState<ListNode[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [insertIndex, setInsertIndex] = useState('');
  const [lastOperation, setLastOperation] = useState('');

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const insertAtBeginning = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value)) {
      const newNode: ListNode = { value, id: generateId() };
      setList([newNode, ...list]);
      setLastOperation(`insertAtBeginning(${value})`);
      setInputValue('');
      toast.success(`Inserted ${value} at beginning`);
    }
  };

  const insertAtEnd = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value)) {
      const newNode: ListNode = { value, id: generateId() };
      setList([...list, newNode]);
      setLastOperation(`insertAtEnd(${value})`);
      setInputValue('');
      toast.success(`Inserted ${value} at end`);
    }
  };

  const insertAtIndex = () => {
    const value = parseInt(inputValue);
    const index = parseInt(insertIndex);
    if (!isNaN(value) && !isNaN(index) && index >= 0 && index <= list.length) {
      const newNode: ListNode = { value, id: generateId() };
      const newList = [...list];
      newList.splice(index, 0, newNode);
      setList(newList);
      setLastOperation(`insertAtIndex(${index}, ${value})`);
      setInputValue('');
      setInsertIndex('');
      toast.success(`Inserted ${value} at index ${index}`);
    } else {
      toast.error('Invalid value or index');
    }
  };

  const deleteAtBeginning = () => {
    if (list.length > 0) {
      const deletedValue = list[0].value;
      setList(list.slice(1));
      setLastOperation(`deleteAtBeginning() → ${deletedValue}`);
      toast.success(`Deleted ${deletedValue} from beginning`);
    } else {
      toast.error('List is empty!');
    }
  };

  const deleteAtEnd = () => {
    if (list.length > 0) {
      const deletedValue = list[list.length - 1].value;
      setList(list.slice(0, -1));
      setLastOperation(`deleteAtEnd() → ${deletedValue}`);
      toast.success(`Deleted ${deletedValue} from end`);
    } else {
      toast.error('List is empty!');
    }
  };

  const deleteAtIndex = () => {
    const index = parseInt(insertIndex);
    if (!isNaN(index) && index >= 0 && index < list.length) {
      const deletedValue = list[index].value;
      const newList = [...list];
      newList.splice(index, 1);
      setList(newList);
      setLastOperation(`deleteAtIndex(${index}) → ${deletedValue}`);
      setInsertIndex('');
      toast.success(`Deleted ${deletedValue} from index ${index}`);
    } else {
      toast.error('Invalid index');
    }
  };

  const clear = () => {
    setList([]);
    setLastOperation('clear()');
    toast.info('List cleared');
  };

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
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Linked List Operations
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Enter value"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="h-10 px-3 flex-1 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
              style={inputStyle}
            />
            <input
              type="number"
              placeholder="Index"
              value={insertIndex}
              onChange={(e) => setInsertIndex(e.target.value)}
              className="h-10 px-3 w-20 rounded-[var(--radius-md)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={insertAtBeginning}
              disabled={isNaN(parseInt(inputValue))}
              className="px-3 py-2 rounded-[var(--btn-radius)] font-medium text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--brand-primary)', color: 'var(--bg-primary)' }}
            >
              Insert at Head
            </button>
            <button
              onClick={insertAtEnd}
              disabled={isNaN(parseInt(inputValue))}
              className="px-3 py-2 rounded-[var(--btn-radius)] font-medium text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--brand-primary)', color: 'var(--bg-primary)' }}
            >
              Insert at Tail
            </button>
            <button
              onClick={insertAtIndex}
              disabled={isNaN(parseInt(inputValue)) || isNaN(parseInt(insertIndex))}
              className="px-3 py-2 rounded-[var(--btn-radius)] font-medium text-xs border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={outlineBtnStyle}
            >
              Insert at Index
            </button>
            <button
              onClick={deleteAtIndex}
              disabled={isNaN(parseInt(insertIndex)) || list.length === 0}
              className="px-3 py-2 rounded-[var(--btn-radius)] font-medium text-xs border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={outlineBtnStyle}
            >
              Delete at Index
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={deleteAtBeginning}
              disabled={list.length === 0}
              className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={outlineBtnStyle}
            >
              Delete Head
            </button>
            <button
              onClick={deleteAtEnd}
              disabled={list.length === 0}
              className="px-4 py-2 rounded-[var(--btn-radius)] font-medium text-sm border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={outlineBtnStyle}
            >
              Delete Tail
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

          {/* Code block */}
          <div
            className="rounded-[var(--radius-md)] p-4 font-mono text-sm"
            style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
          >
            <div style={{ color: 'var(--text-muted)' }} className="mb-2">// Linked List Implementation</div>
            <div>
              <span style={{ color: 'var(--brand-secondary)' }}>class</span>
              <span style={{ color: 'var(--text-primary)' }}> LinkedList {'{'}</span>
            </div>
            <div className="ml-4">
              <div>
                <span style={{ color: 'var(--brand-secondary)' }}>constructor</span>
                <span style={{ color: 'var(--text-primary)' }}>() {'{'}</span>
              </div>
              <div className="ml-4">
                <span style={{ color: 'var(--text-primary)' }}>this.head = null;</span>
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
            <div><strong>Length:</strong> {list.length}</div>
            <div><strong>Head:</strong> {list.length > 0 ? list[0].value : 'null'}</div>
            <div><strong>Tail:</strong> {list.length > 0 ? list[list.length - 1].value : 'null'}</div>
            <div><strong>Empty:</strong> {list.length === 0 ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>

      {/* Linked List Visualization Section */}
      <div className="rounded-[var(--card-radius)] p-6" style={{ background: 'var(--surface-1)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Linked List Visualization
          </h2>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Dynamic Data Structure</span>
        </div>

        <div className="flex flex-col items-center space-y-6">
          {/* Linked List Container */}
          <div className="w-full overflow-x-auto">
            {list.length === 0 ? (
              <div
                className="flex items-center justify-center h-20 border-2 border-dashed rounded-lg"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
              >
                Empty Linked List
              </div>
            ) : (
              <div className="flex items-center gap-2 pb-4 min-w-max">
                {/* Head pointer */}
                <div className="flex flex-col items-center mr-4">
                  <div className="text-sm font-medium mb-1" style={{ color: 'var(--brand-primary)' }}>HEAD</div>
                  <div className="w-0.5 h-6" style={{ background: 'var(--brand-primary)' }} />
                </div>

                {list.map((node, index) => (
                  <div key={node.id} className="flex items-center">
                    {/* Node */}
                    <div
                      className="flex items-center rounded-[var(--radius-md)] overflow-hidden border-2"
                      style={{ borderColor: 'var(--border-default)' }}
                    >
                      <div
                        className="w-16 h-12 flex items-center justify-center font-bold"
                        style={{
                          background:
                            index === 0
                              ? 'var(--brand-primary)'
                              : index === list.length - 1
                              ? 'var(--surface-3)'
                              : 'var(--surface-2)',
                          color:
                            index === 0
                              ? 'var(--bg-primary)'
                              : 'var(--text-primary)',
                        }}
                      >
                        {node.value}
                      </div>
                      <div
                        className="w-8 h-12 flex items-center justify-center border-l"
                        style={{
                          background: 'var(--surface-2)',
                          borderColor: 'var(--border-default)',
                        }}
                      >
                        {index < list.length - 1 ? (
                          <ArrowRight className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>∅</span>
                        )}
                      </div>
                    </div>

                    {/* Arrow between nodes */}
                    {index < list.length - 1 && (
                      <div className="w-8 h-0.5 mx-1" style={{ background: 'var(--brand-primary)' }} />
                    )}
                  </div>
                ))}

                {/* Tail pointer */}
                {list.length > 0 && (
                  <div className="flex flex-col items-center ml-4">
                    <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>TAIL</div>
                    <div className="w-0.5 h-6" style={{ background: 'var(--text-muted)' }} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs flex-wrap justify-center" style={{ color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: 'var(--brand-primary)' }} />
              <span>Head Node</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: 'var(--surface-3)' }} />
              <span>Tail Node</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-default)' }} />
              <span>Node</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: 'var(--surface-2)' }} />
              <span>Pointer</span>
            </div>
          </div>

          {/* Operations Info */}
          <div
            className="rounded-[var(--radius-md)] p-4 w-full text-sm space-y-2"
            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
          >
            <div><strong style={{ color: 'var(--brand-primary)' }}>Insert:</strong> O(1) at head, O(n) at tail/index</div>
            <div><strong style={{ color: 'var(--brand-primary)' }}>Delete:</strong> O(1) at head, O(n) at tail/index</div>
            <div><strong style={{ color: 'var(--brand-primary)' }}>Search:</strong> O(n) - Linear traversal required</div>
            <div><strong style={{ color: 'var(--brand-primary)' }}>Access:</strong> O(n) - No random access</div>
          </div>
        </div>
      </div>
    </div>
  );
}
