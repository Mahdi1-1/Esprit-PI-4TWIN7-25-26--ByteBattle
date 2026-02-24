import { useState, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { ExcalidrawEditor } from '../components/ExcalidrawEditor';
import type { SavedScene } from '../components/ExcalidrawEditor';
import { ThemeEffects } from '../components/ThemeEffects';
import { useLanguage } from '../context/LanguageContext';
import { Pencil, FolderOpen, Trash2, X, Clock, Plus } from 'lucide-react';

const STORAGE_KEY = 'bytebattle-sketchpad-scenes';

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

export function SketchpadPage() {
  const { t } = useLanguage();
  const [savedScenes, setSavedScenes] = useState<SavedScene[]>(loadSavedScenes);
  const [showGallery, setShowGallery] = useState(false);
  const [activeScene, setActiveScene] = useState<SavedScene | null>(null);
  const [editorKey, setEditorKey] = useState(0);

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
  }, []);

  const handleLoadScene = (scene: SavedScene) => {
    setActiveScene(scene);
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
    setActiveScene(null);
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

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <ThemeEffects />
      <Navbar />

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
          initialScenes={savedScenes}
          initialData={
            activeScene
              ? {
                  elements: JSON.parse(activeScene.data)?.elements,
                  appState: JSON.parse(activeScene.data)?.appState,
                  files: JSON.parse(activeScene.data)?.files,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
