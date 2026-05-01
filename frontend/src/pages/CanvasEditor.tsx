import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { Button } from '../components/Button';
import { type CanvasChallenge } from '../data/canvasChallengeData';
import { canvasService } from '../services/canvasService';
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
  FileJson,
  Loader
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export function CanvasEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = (location.state as any)?.mode || 'solo';

  const [challenge, setChallenge] = useState<CanvasChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBrief, setShowBrief] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionBlob, setSubmissionBlob] = useState<Blob | null>(null);
  const [submissionElements, setSubmissionElements] = useState<readonly any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [lastSaveTime, setLastSaveTime] = useState<Date>(new Date());
  const [focusLostCount, setFocusLostCount] = useState(0);
  const [totalFocusLostTime, setTotalFocusLostTime] = useState(0);
  const [lastBlurTime, setLastBlurTime] = useState<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const res = await canvasService.getChallengeById(id!);
        setChallenge(res);
        setTimeRemaining(res?.duration ? res.duration * 60 : 0);
      } catch (err) {
        console.error('Failed to load challenge:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchChallenge();
  }, [id]);

  // Auto Full Screen on mount
  useEffect(() => {
    const enterFullScreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          setIsFullScreen(true);
        }
      } catch (err) {
        console.warn('Auto-fullscreen blocked:', err);
      }
    };
    enterFullScreen();

    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // Focus tracking for Canvas
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const handleLoss = () => {
      setLastBlurTime((prev) => {
        if (prev === null) {
          setFocusLostCount((c) => c + 1);
          toast.error('Attention ! Focus perdu sur le Canvas.', { icon: '⚠️' });
          return Date.now();
        }
        return prev;
      });
      // Start counting seconds immediately
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
         setTotalFocusLostTime(prev => prev + 1);
      }, 1000);
    };

    const handleGain = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      setLastBlurTime(null);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleLoss();
      } else {
        handleGain();
      }
    };

    window.addEventListener('blur', handleLoss);
    window.addEventListener('focus', handleGain);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('blur', handleLoss);
      window.removeEventListener('focus', handleGain);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Challenge not found
          </h2>
          <Button onClick={() => navigate('/canvas')}>
            Back to catalog
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
      <div className="h-16 px-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-1)]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/canvas')}>
            <Undo2 className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)] leading-none mb-1">
              {challenge.title}
            </h1>
            <div className="flex items-center gap-2 text-caption text-[var(--text-muted)]">
              <span>{mode === 'bi' ? 'Mode Duo' : 'Mode Solo'}</span>
              {mode === 'bi' && <span>• 2 participants</span>}
              <span>• Saved {lastSaveTime.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {focusLostCount > 0 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Focus lost ({focusLostCount}x, {totalFocusLostTime}s)</span>
            </div>
          )}

          {!isFullScreen && (
            <Button variant="ghost" size="sm" onClick={() => document.documentElement.requestFullscreen()}>
              <span className="text-xs text-yellow-500">Full Screen</span>
            </Button>
          )}

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
          {!isFullScreen && (
            <div className="absolute inset-0 z-[100] bg-[var(--surface-1)]/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
              <span className="w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <h3 className="text-xl font-bold mb-2">Full Screen Mode Required</h3>
              <p className="text-[var(--text-secondary)] mb-6 max-w-md">
                To edit the canvas, please enable full screen mode to ensure exam conditions.
              </p>
              <Button 
                size="lg" 
                variant="primary" 
                onClick={() => document.documentElement.requestFullscreen()}
              >
                Enable Full Screen Mode
              </Button>
            </div>
          )}

          <div className="relative flex-1 bg-[var(--surface-2)]">
             <ExcalidrawEditor
                // @ts-ignore
                initialData={challenge?.initialData}
                // @ts-ignore
                onChange={(elements, state) => {
                  setSubmissionElements(elements);
                }}
              />
          </div>
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