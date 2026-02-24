import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { Button } from '../components/Button';
import { canvasChallenges } from '../data/canvasChallengeData';
import { ExcalidrawEditor } from '../components/ExcalidrawEditor';
import {
  CanvasTimer
} from '../components/canvas/CanvasComponents';
import {
  Save,
  Download,
  Send,
  Undo2,
  Redo2,
  X,
  Menu,
  CheckSquare,
  FileJson
} from 'lucide-react';

export function CanvasEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = (location.state as any)?.mode || 'solo';

  const challenge = canvasChallenges.find((c) => c.id === id);
  const [showBrief, setShowBrief] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionBlob, setSubmissionBlob] = useState<Blob | null>(null);
  const [submissionElements, setSubmissionElements] = useState<readonly any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(challenge?.duration ? challenge.duration * 60 : 0);
  const [lastSaveTime, setLastSaveTime] = useState<Date>(new Date());

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!challenge) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Challenge non trouvé
          </h2>
          <Button onClick={() => navigate('/canvas')}>
            Retour au catalogue
          </Button>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isWarning = timeRemaining < 600 && timeRemaining > 300;
  const isCritical = timeRemaining <= 300;

  const handleSave = async () => {
    if ((window as any).excalidrawAPI) {
      try {
        await (window as any).excalidrawAPI.save();
        setLastSaveTime(new Date());
      } catch (error) {
        console.error('Failed to save:', error);
      }
    }
  };

  const handleExportPNG = async () => {
    if ((window as any).excalidrawAPI) {
      try {
        await (window as any).excalidrawAPI.export('png');
      } catch (error) {
        console.error('Failed to export PNG:', error);
      }
    }
  };

  const handleExportJSON = async () => {
    if ((window as any).excalidrawAPI) {
      try {
        await (window as any).excalidrawAPI.export('json');
      } catch (error) {
        console.error('Failed to export JSON:', error);
      }
    }
  };

  const handleSubmit = async () => {
    if ((window as any).excalidrawAPI) {
      try {
        const { elements, blob } = await (window as any).excalidrawAPI.save();
        setSubmissionElements(elements);
        setSubmissionBlob(blob);
        setShowSubmitModal(true);
      } catch (error) {
        console.error('Failed to prepare submission:', error);
      }
    }
  };

  const confirmSubmit = () => {
    // Save submission to localStorage
    if (submissionBlob && submissionElements) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const submission = {
          challengeId: id,
          timestamp: Date.now(),
          imageData: base64data,
          elements: submissionElements,
          mode
        };
        localStorage.setItem(`canvas_submission_${id}`, JSON.stringify(submission));
        navigate(`/canvas/${id}/result`);
      };
      reader.readAsDataURL(submissionBlob);
    }
  };

  const getTimeSinceLastSave = () => {
    const seconds = Math.floor((Date.now() - lastSaveTime.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      {/* Top Bar */}
      <div className="flex-shrink-0 h-16 border-b border-[var(--border-default)] bg-[var(--surface-1)] px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Challenge Info */}
          <div className="hidden sm:block">
            <h2 className="font-bold text-[var(--text-primary)] text-sm lg:text-base">
              {challenge.title}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Mode: {mode === 'solo' ? '🧑‍💻 Training' : mode === 'duel' ? '⚔️ Duel' : '🏆 Hackathon'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Timer */}
          <CanvasTimer
            minutes={minutes}
            seconds={seconds}
            warning={isWarning}
            critical={isCritical}
          />

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleSave}>
              <Save className="w-4 h-4" />
              <span className="hidden lg:inline">Save</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportPNG}>
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">PNG</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExportJSON}>
              <FileJson className="w-4 h-4" />
              <span className="hidden lg:inline">JSON</span>
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit}>
              <Send className="w-4 h-4" />
              <span className="hidden lg:inline">Submit</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Brief (Desktop) */}
        <div className={`
          ${showBrief ? 'w-80' : 'w-0'} 
          hidden lg:block
          flex-shrink-0 border-r border-[var(--border-default)] bg-[var(--surface-1)] overflow-y-auto transition-all duration-200
        `}>
          {showBrief && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[var(--text-primary)]">📋 Brief</h3>
                <button
                  onClick={() => setShowBrief(false)}
                  className="p-1 hover:bg-[var(--surface-2)] rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Context */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[var(--brand-primary)]">Context</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {challenge.context}
                </p>
              </div>

              {/* Key Requirements */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[var(--brand-primary)]">Key Requirements</h4>
                <ul className="space-y-1">
                  {challenge.requirements.slice(0, 5).map((req, idx) => (
                    <li key={idx} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                      <CheckSquare className="w-3 h-3 flex-shrink-0 mt-0.5 text-[var(--state-success)]" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/canvas/${id}/brief`)}
              >
                View Full Brief
              </Button>
            </div>
          )}
        </div>

        {/* Center - Excalidraw Canvas */}
        <div className="flex-1 flex flex-col bg-[var(--bg-secondary)] overflow-hidden relative">
          {!showBrief && (
            <div className="absolute top-4 left-4 z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowBrief(true)}
                className="gap-2"
              >
                <Menu className="w-4 h-4" />
                Brief
              </Button>
            </div>
          )}

          <ExcalidrawEditor
            hideToolbar
            hideThemeToggle
            onChange={(elements) => {
              // Auto-save draft to localStorage
              localStorage.setItem(`canvas_draft_${id}`, JSON.stringify({
                elements,
                timestamp: Date.now()
              }));
            }}
          />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex-shrink-0 h-10 border-t border-[var(--border-default)] bg-[var(--surface-1)] px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-[var(--text-secondary)]">
            <span className="text-[var(--state-success)]">●</span> Auto-save enabled
          </span>
          <span className="text-[var(--text-muted)]">
            Last saved: {getTimeSinceLastSave()}
          </span>
        </div>
        <div className="text-[var(--text-muted)]">
          Draw, connect, and annotate your architecture
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="theme-card corner-brackets relative bg-[var(--surface-1)] border-[var(--brand-primary)] p-6 max-w-lg w-full space-y-4">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              Submit your solution?
            </h3>
            <p className="text-[var(--text-secondary)]">
              You are about to submit your diagram for evaluation.
              This action is final and will launch the AI analysis.
            </p>
            
            {/* Preview */}
            <div className="h-48 bg-[var(--surface-2)] rounded-lg border border-[var(--border-default)] flex items-center justify-center overflow-hidden">
              {submissionBlob ? (
                <img
                  src={URL.createObjectURL(submissionBlob)}
                  alt="Submission preview"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-4xl">🎨</span>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowSubmitModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={confirmSubmit}
              >
                Confirm and Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}