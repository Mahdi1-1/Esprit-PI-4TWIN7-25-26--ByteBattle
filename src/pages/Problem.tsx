import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { DifficultyBadge, VerdictBadge } from '../components/Badge';
import { Select } from '../components/Input';
import { mockProblems, mockUser } from '../data/mockData';
import { 
  Play, 
  Send, 
  Lightbulb, 
  ChevronLeft, 
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

const LANGUAGES = [
  { value: 'python', label: 'Python 3' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
];

type Tab = 'statement' | 'tests' | 'submissions' | 'editorial';

export function Problem() {
  const { id } = useParams();
  const problem = mockProblems.find(p => p.id === id);
  const [activeTab, setActiveTab] = useState<Tab>('statement');
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(`def solution(nums, target):
    # Votre code ici
    pass`);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);

  if (!problem) {
    return <div>Problem not found</div>;
  }

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setShowResults(true);
    }, 1500);
  };

  const handleSubmit = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setShowResults(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar 
        isLoggedIn 
        userAvatar={mockUser.avatar} 
        username={mockUser.username} 
      />

      {/* Breadcrumb */}
      <div className="border-b border-[var(--border-default)] bg-[var(--surface-1)]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20 py-3">
          <div className="flex items-center gap-2 text-caption text-[var(--text-muted)]">
            <Link to="/problems" className="hover:text-[var(--brand-primary)] flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              Problèmes
            </Link>
            <span>/</span>
            <span className="text-[var(--text-primary)]">{problem.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-20 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Problem Statement */}
          <div className="flex flex-col overflow-hidden">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="mb-2">{problem.title}</h2>
                <div className="flex items-center gap-2">
                  <DifficultyBadge difficulty={problem.difficulty} />
                  {problem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-caption bg-[var(--surface-2)] text-[var(--text-secondary)] rounded-[var(--radius-sm)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-[var(--border-default)]">
              {(['statement', 'tests', 'submissions', 'editorial'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    px-4 py-2 text-[0.875rem] font-medium capitalize
                    border-b-2 transition-colors
                    ${activeTab === tab
                      ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }
                  `}
                >
                  {tab === 'statement' ? 'Énoncé' : 
                   tab === 'tests' ? 'Tests' : 
                   tab === 'submissions' ? 'Soumissions' : 
                   'Éditorial'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
              {activeTab === 'statement' && (
                <div className="prose prose-invert max-w-none">
                  <div className="mb-6 whitespace-pre-wrap text-[var(--text-primary)]">
                    {problem.description}
                  </div>

                  {problem.examples.length > 0 && (
                    <>
                      <h3 className="mb-3">Exemples</h3>
                      {problem.examples.map((example, i) => (
                        <div key={i} className="mb-4 p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)] font-code text-[0.875rem]">
                          <div className="mb-2">
                            <div className="text-[var(--text-muted)] mb-1">Input:</div>
                            <div className="text-[var(--text-primary)]">{example.input}</div>
                          </div>
                          <div className="mb-2">
                            <div className="text-[var(--text-muted)] mb-1">Output:</div>
                            <div className="text-[var(--text-primary)]">{example.output}</div>
                          </div>
                          {example.explanation && (
                            <div>
                              <div className="text-[var(--text-muted)] mb-1">Explanation:</div>
                              <div className="text-[var(--text-secondary)]">{example.explanation}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  {problem.constraints.length > 0 && (
                    <>
                      <h3 className="mb-3">Contraintes</h3>
                      <ul className="space-y-1">
                        {problem.constraints.map((constraint, i) => (
                          <li key={i} className="text-[var(--text-secondary)] font-code text-[0.875rem]">
                            {constraint}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'tests' && (
                <div className="space-y-3">
                  <TestCase number={1} status="passed" input="[2,7,11,15], 9" output="[0,1]" expected="[0,1]" time="2ms" />
                  <TestCase number={2} status="passed" input="[3,2,4], 6" output="[1,2]" expected="[1,2]" time="1ms" />
                  <TestCase number={3} status="hidden" />
                </div>
              )}

              {activeTab === 'submissions' && (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  Aucune soumission pour le moment
                </div>
              )}

              {activeTab === 'editorial' && (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  L'éditorial sera disponible après votre première soumission acceptée
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Code Editor */}
          <div className="flex flex-col overflow-hidden">
            {/* Editor Toolbar */}
            <div className="mb-4 flex items-center justify-between">
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                options={LANGUAGES}
              />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Lightbulb className="w-4 h-4" />
                  Hint (2/3)
                </Button>
                <Button variant="secondary" size="sm" onClick={handleRun} loading={isRunning}>
                  <Play className="w-4 h-4" />
                  Run
                </Button>
                <Button variant="primary" size="sm" onClick={handleSubmit} loading={isRunning}>
                  <Send className="w-4 h-4" />
                  Submit
                </Button>
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)]">
              <div className="bg-[var(--surface-1)] px-4 py-2 border-b border-[var(--border-default)] flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[var(--state-error)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--state-warning)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--state-success)]" />
                </div>
                <span className="text-caption text-[var(--text-muted)] ml-2 font-code">
                  solution.py
                </span>
              </div>
              
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 p-4 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-code text-[0.875rem] resize-none focus:outline-none"
                spellCheck={false}
              />
            </div>

            {/* Console / Results */}
            {showResults && (
              <div className="mt-4 p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[var(--state-success)]" />
                    <span className="font-semibold text-[var(--text-primary)]">
                      Tests Passed: 2/3
                    </span>
                  </div>
                  <VerdictBadge verdict="ACCEPTED" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-caption">
                  <div>
                    <span className="text-[var(--text-muted)]">Runtime:</span>
                    <span className="ml-2 font-code text-[var(--text-primary)]">68ms</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Memory:</span>
                    <span className="ml-2 font-code text-[var(--text-primary)]">15.2MB</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TestCase({ 
  number, 
  status, 
  input, 
  output, 
  expected, 
  time 
}: { 
  number?: number;
  status: 'passed' | 'failed' | 'hidden';
  input?: string;
  output?: string;
  expected?: string;
  time?: string;
}) {
  if (status === 'hidden') {
    return (
      <div className="p-4 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)]">
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Info className="w-4 h-4" />
          <span>Test caché #{number || '?'}</span>
        </div>
      </div>
    );
  }

  const icon = status === 'passed' 
    ? <CheckCircle2 className="w-5 h-5 text-[var(--state-success)]" />
    : <XCircle className="w-5 h-5 text-[var(--state-error)]" />;

  return (
    <div className={`
      p-4 border rounded-[var(--radius-md)]
      ${status === 'passed' 
        ? 'bg-[var(--state-success)]/5 border-[var(--state-success)]/20' 
        : 'bg-[var(--state-error)]/5 border-[var(--state-error)]/20'
      }
    `}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-[var(--text-primary)]">
            Test #{number}
          </span>
        </div>
        {time && (
          <div className="flex items-center gap-1 text-caption text-[var(--text-muted)]">
            <Clock className="w-3 h-3" />
            {time}
          </div>
        )}
      </div>
      <div className="font-code text-[0.75rem] space-y-1">
        <div>
          <span className="text-[var(--text-muted)]">Input:</span>
          <span className="ml-2 text-[var(--text-primary)]">{input}</span>
        </div>
        <div>
          <span className="text-[var(--text-muted)]">Output:</span>
          <span className="ml-2 text-[var(--text-primary)]">{output}</span>
        </div>
        {expected && (
          <div>
            <span className="text-[var(--text-muted)]">Expected:</span>
            <span className="ml-2 text-[var(--text-primary)]">{expected}</span>
          </div>
        )}
      </div>
    </div>
  );
}
