import { useState, useCallback, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { ExcalidrawEditor } from '../components/ExcalidrawEditor';
import type { SavedScene } from '../components/ExcalidrawEditor';
import { ThemeEffects } from '../components/ThemeEffects';
import { useLanguage } from '../context/LanguageContext';
import { challengesService } from '../services/challengesService';
import { Pencil, FolderOpen, Trash2, X, Clock, Plus, Sparkles, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'bytebattle-sketchpad-scenes';
const DRAFT_KEY = 'bytebattle-sketchpad-current';

function loadSavedScenes(): SavedScene[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistScenes(scenes: SavedScene[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
}

function loadCurrentDraft(): SavedScene | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistCurrentDraft(draft: SavedScene) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function clearCurrentDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function SketchpadPage() {
  const { t } = useLanguage();
  const [savedScenes, setSavedScenes] = useState<SavedScene[]>(loadSavedScenes);
  const [showGallery, setShowGallery] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<SavedScene | null>(loadCurrentDraft);
  const [activeScene, setActiveScene] = useState<SavedScene | null>(loadCurrentDraft);
  const [editorKey, setEditorKey] = useState(0);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState<{
    title: string;
    difficulty?: string;
    category?: string;
    briefMd?: string;
    deliverables?: string;
    rubric?: any;
    assets?: string[];
    hints?: string[];
    excalidrawElements?: any[];
  } | null>(null);
  const [injectedElements, setInjectedElements] = useState<any[] | null>(null);
  const lastPersistedDraft = useRef<string | null>(null);

  const initialSceneData = useMemo(() => {
    if (injectedElements) {
      return {
        elements: injectedElements,
        appState: { viewBackgroundColor: '#ffffff' },
        files: undefined,
      };
    }

    return activeScene
      ? {
          elements: JSON.parse(activeScene.data)?.elements,
          appState: JSON.parse(activeScene.data)?.appState,
          files: JSON.parse(activeScene.data)?.files,
        }
      : undefined;
  }, [activeScene, injectedElements]);

  const handleSave = useCallback((scene: SavedScene) => {
    setSavedScenes((prev) => {
      const idx = prev.findIndex((s) => s.name === scene.name);
      let updated: SavedScene[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = scene;
      } else {
        updated = [scene, ...prev];
      }
      persistScenes(updated);
      return updated;
    });
    setCurrentDraft(scene);
    persistCurrentDraft(scene);
  }, []);

  const handleLoadScene = (scene: SavedScene) => {
    setInjectedElements(null);
    setActiveScene(scene);
    setCurrentDraft(scene);
    persistCurrentDraft(scene);
    setEditorKey((k) => k + 1);
    setShowGallery(false);
  };

  const handleDeleteScene = (name: string) => {
    setSavedScenes((prev) => {
      const updated = prev.filter((s) => s.name !== name);
      persistScenes(updated);
      return updated;
    });
  };

  const handleNewCanvas = () => {
    setInjectedElements(null);
    setActiveScene(null);
    setCurrentDraft(null);
    clearCurrentDraft();
    setEditorKey((k) => k + 1);
    setShowGallery(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleEditorChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      const draftName = activeScene?.name || 'Draft';
      const data = JSON.stringify({ elements, appState, files });
      if (lastPersistedDraft.current === data) {
        return;
      }

      const draft: SavedScene = {
        name: draftName,
        data,
        thumbnail: activeScene?.thumbnail || '',
        date: new Date().toLocaleString('fr-FR'),
      };

      lastPersistedDraft.current = data;
      setCurrentDraft(draft);
      persistCurrentDraft(draft);
    },
    [activeScene],
  );

  const handleGenerateCanvasDraft = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Veuillez saisir un prompt pour générer un brouillon.');
      return;
    }

    setAiError(null);
    setAiLoading(true);

    try {
      const result = await challengesService.generateDraft({ prompt: aiPrompt, kind: 'CANVAS' });
      if (!result || result.title === 'AI Draft Error' || !result.title?.trim()) {
        throw new Error('AI service returned an invalid draft.');
      }

      setAiDraft(result as any);

      if (result.excalidrawElements?.length > 0) {
        setInjectedElements(result.excalidrawElements);
        setEditorKey((k) => k + 1);
        toast.success(`✏️ ${result.excalidrawElements.length} éléments dessinés sur le canvas`);
      } else {
        setInjectedElements(null);
        toast.success('Brouillon Canvas AI généré');
      }
    } catch (err: any) {
      const isServiceUnavailable = err?.response?.status === 503 || err?.status === 503;
      const message = isServiceUnavailable
        ? 'AI service temporarily unavailable, please retry.'
        : err?.response?.data?.message || err?.message || 'Erreur lors de la génération du brouillon AI';

      setAiError(message);
      toast.error(message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <ThemeEffects />


      {/* Header bar */}
      <div className="bg-[var(--surface-1)] border-b border-[var(--border-default)] px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-3">
            <Pencil className="w-5 h-5 text-[var(--brand-primary)]" />
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              {t('nav.drawing')}
            </h1>
            {activeScene && (
              <span className="text-sm text-[var(--text-muted)] hidden sm:inline">
                — {activeScene.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAiPanel((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Générer avec AI</span>
            </button>
            <button
              onClick={handleNewCanvas}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-[var(--radius-md)] bg-[var(--brand-primary)] text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('sketchpad.new') || 'New'}</span>
            </button>
            <button
              onClick={() => setShowGallery(!showGallery)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-[var(--radius-md)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">{t('sketchpad.myDrawings') || 'My Drawings'}</span>
              {savedScenes.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                  {savedScenes.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {showAiPanel && (
  <div className="bg-[var(--surface-2)] border-b border-[var(--border-default)] px-4 py-4 sm:px-6 lg:px-10 max-h-[45vh] overflow-y-auto flex-shrink-0">
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Génération de brouillon Canvas par AI
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Saisis un prompt, puis génère un brouillon de challenge Canvas avec le modèle AI.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateCanvasDraft}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-3 py-1.5 text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Génération...
              </>
            ) : (
              'Générer le brouillon AI'
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowAiPanel(false)}
            className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface-1)] text-[var(--text-muted)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <textarea
        rows={2}
        value={aiPrompt}
        onChange={(e) => setAiPrompt(e.target.value)}
        placeholder="Décris le type de challenge Canvas..."
        className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
      />

      {aiError && (
        <div className="rounded-[var(--radius-md)] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 flex items-center justify-between">
          <p>{aiError}</p>
          <button
            type="button"
            onClick={handleGenerateCanvasDraft}
            disabled={aiLoading}
            className="ml-3 shrink-0 rounded-[var(--radius-md)] border border-red-500 px-3 py-1 text-sm text-red-600 hover:bg-red-500/20 disabled:opacity-50"
          >
            Réessayer
          </button>
        </div>
      )}

      {aiDraft && aiDraft.title !== 'AI Draft Error' && (
        <details className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] overflow-hidden">
          <summary className="cursor-pointer px-4 py-3 flex items-center justify-between hover:bg-[var(--surface-2)] transition-colors">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] inline">
                Brouillon généré
              </h3>
              <span className="ml-2 text-sm text-[var(--text-secondary)]">
                — {aiDraft.title}
              </span>
            </div>
            <span className="text-xs text-[var(--text-muted)]">Cliquer pour développer</span>
          </summary>

          <div className="px-4 pb-4 pt-2 border-t border-[var(--border-default)]">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Titre</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{aiDraft.title}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Catégorie</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{aiDraft.category || '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Difficulté</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{aiDraft.difficulty || '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Hints</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">
                  {aiDraft.hints?.join(', ') || 'Aucun'}
                </p>
              </div>
            </div>

            {aiDraft.briefMd && (
              <div className="mt-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Description</p>
                <p className="mt-1 whitespace-pre-line text-sm text-[var(--text-primary)] max-h-40 overflow-y-auto">
                  {aiDraft.briefMd}
                </p>
              </div>
            )}

            {aiDraft.deliverables && (
              <div className="mt-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Livrables</p>
                <p className="mt-1 whitespace-pre-line text-sm text-[var(--text-primary)]">
                  {aiDraft.deliverables}
                </p>
              </div>
            )}

            <div className="mt-4 px-4 pb-4">
              <button
                type="button"
                onClick={() => {
                  if (aiDraft?.excalidrawElements?.length > 0) {
                    setInjectedElements(aiDraft.excalidrawElements);
                    setEditorKey((k) => k + 1);
                    setShowAiPanel(false);
                    toast.success('✏️ Éléments dessinés sur le canvas');
                  } else {
                    toast.error('Aucun élément canvas généré. Réessayez.');
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                <Sparkles className="w-4 h-4" />
                Dessiner sur le Canvas
              </button>
            </div>
          </div>
        </details>
      )}
    </div>
  </div>
)}

      {/* Gallery overlay */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowGallery(false)}
          />

          {/* Side panel */}
          <div className="relative ml-auto w-full max-w-md bg-[var(--surface-1)] border-l border-[var(--border-default)] shadow-2xl flex flex-col animate-slide-in-right">
            {/* Panel header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[var(--brand-primary)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {t('sketchpad.myDrawings') || 'My Drawings'}
                </h2>
              </div>
              <button
                onClick={() => setShowGallery(false)}
                className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scene list */}
            <div className="flex-1 overflow-y-auto p-4">
              {savedScenes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Pencil className="w-12 h-12 text-[var(--text-muted)] mb-4 opacity-30" />
                  <p className="text-[var(--text-secondary)] mb-2">
                    {t('sketchpad.noDrawings') || 'No saved drawings yet'}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {t('sketchpad.startDrawing') || 'Start drawing and save your work to see it here'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedScenes.map((scene) => (
                    <div
                      key={scene.name + scene.date}
                      className="group relative bg-[var(--surface-2)] rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border-default)] hover:border-[var(--brand-primary)]/40 transition-colors"
                    >
                      {/* Thumbnail */}
                      {scene.thumbnail && (
                        <div className="h-32 bg-white overflow-hidden">
                          <img
                            src={scene.thumbnail}
                            alt={scene.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}

                      {/* Info */}
                      <div className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-[var(--text-primary)] truncate">
                              {scene.name}
                            </h3>
                            <div className="flex items-center gap-1 mt-1 text-xs text-[var(--text-muted)]">
                              <Clock className="w-3 h-3" />
                              {formatDate(scene.date)}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => handleLoadScene(scene)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-[var(--radius-md)] bg-[var(--brand-primary)] text-white hover:opacity-90 transition-opacity"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            {t('sketchpad.open') || 'Open'}
                          </button>
                          <button
                            onClick={() => handleDeleteScene(scene.name)}
                            className="p-1.5 rounded-[var(--radius-md)] text-red-400 hover:bg-red-500/10 transition-colors"
                            title={t('sketchpad.delete') || 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Excalidraw Editor — fill remaining space */}
      <div key={editorKey} className="flex-1 min-h-0">
        <ExcalidrawEditor
          onSave={handleSave}
          onChange={handleEditorChange}
          initialScenes={savedScenes}
          initialData={initialSceneData}
        />
      </div>
    </div>
  );
}
