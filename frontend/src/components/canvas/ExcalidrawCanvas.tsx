import { useState, useEffect, useCallback, useRef } from 'react';
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI, ExcalidrawElement } from '@excalidraw/excalidraw/types/types';
import { useTheme } from '../../context/ThemeContext';
import { canvasService } from '../../services/canvasService';

interface ExcalidrawCanvasProps {
  challengeId: string;
  onSave?: (elements: readonly ExcalidrawElement[], blob: Blob) => void;
  onExport?: (blob: Blob) => void;
  readOnly?: boolean;
}

export function ExcalidrawCanvas({ challengeId, onSave, onExport, readOnly = false }: ExcalidrawCanvasProps) {
  const { colorScheme } = useTheme();
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [elements, setElements] = useState<readonly ExcalidrawElement[]>([]);
  const [appState, setAppState] = useState<any>(null);
  const [draftTimestamp, setDraftTimestamp] = useState<number>(0);
  const draftSaveTimeout = useRef<number | null>(null);

  // Load from localStorage on mount and merge with server draft if newer
  useEffect(() => {
    let localTimestamp = 0;
    const savedDraft = localStorage.getItem(`canvas_draft_${challengeId}`);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setElements(parsed.elements || []);
        setAppState(parsed.appState || null);
        localTimestamp = parsed.timestamp || 0;
        setDraftTimestamp(localTimestamp);
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }

    const loadServerDraft = async () => {
      try {
        const serverDraft = await canvasService.getDraft(challengeId);
        const serverDraftJson = serverDraft?.canvasJson;
        const serverTimestamp = serverDraftJson?.timestamp || 0;

        if (serverTimestamp > localTimestamp) {
          setElements(serverDraftJson.elements || []);
          setAppState(serverDraftJson.appState || null);
          localStorage.setItem(`canvas_draft_${challengeId}`, JSON.stringify(serverDraftJson));
          setDraftTimestamp(serverTimestamp);
        }
      } catch (error) {
        console.error('Failed to load canvas draft from server:', error);
      }
    };

    loadServerDraft();
  }, [challengeId]);

  useEffect(() => {
    return () => {
      if (draftSaveTimeout.current) {
        window.clearTimeout(draftSaveTimeout.current);
      }
    };
  }, []);

  const scheduleServerSave = useCallback((draftData: any) => {
    if (draftSaveTimeout.current) {
      window.clearTimeout(draftSaveTimeout.current);
    }

    draftSaveTimeout.current = window.setTimeout(async () => {
      try {
        await canvasService.saveDraft(challengeId, draftData);
      } catch (error) {
        console.error('Failed to persist canvas draft to server:', error);
      }
      draftSaveTimeout.current = null;
    }, 1500);
  }, [challengeId]);

  // Auto-save to localStorage and server
  const handleChange = useCallback((newElements: readonly ExcalidrawElement[], newAppState: any) => {
    setElements(newElements);
    setAppState(newAppState);

    const draftData = {
      elements: newElements,
      appState: newAppState,
      timestamp: Date.now(),
    };
    localStorage.setItem(`canvas_draft_${challengeId}`, JSON.stringify(draftData));
    setDraftTimestamp(draftData.timestamp);
    scheduleServerSave(draftData);
  }, [challengeId, scheduleServerSave]);

  // Save snapshot with PNG export
  const handleSaveSnapshot = useCallback(async () => {
    if (!excalidrawAPI) return;

    try {
      const elements = excalidrawAPI.getSceneElements();
      const blob = await exportToBlob({
        elements,
        appState: {
          ...excalidrawAPI.getAppState(),
          exportBackground: true,
          exportWithDarkMode: colorScheme === 'dark'
        },
        files: excalidrawAPI.getFiles(),
        mimeType: 'image/png',
        quality: 0.95
      });

      if (onSave) {
        onSave(elements, blob);
      }

      return { elements, blob };
    } catch (error) {
      console.error('Failed to save snapshot:', error);
      throw error;
    }
  }, [excalidrawAPI, colorScheme, onSave]);

  // Export as PNG
  const handleExport = useCallback(async (format: 'png' | 'json' = 'png') => {
    if (!excalidrawAPI) return;

    try {
      const elements = excalidrawAPI.getSceneElements();

      if (format === 'json') {
        const dataStr = JSON.stringify({
          type: 'excalidraw',
          version: 2,
          source: 'bytebattle',
          elements,
          appState: excalidrawAPI.getAppState()
        }, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `canvas_${challengeId}_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = await exportToBlob({
          elements,
          appState: {
            ...excalidrawAPI.getAppState(),
            exportBackground: true,
            exportWithDarkMode: colorScheme === 'dark'
          },
          files: excalidrawAPI.getFiles(),
          mimeType: 'image/png',
          quality: 0.95
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `canvas_${challengeId}_${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);

        if (onExport) {
          onExport(blob);
        }
      }
    } catch (error) {
      console.error('Failed to export:', error);
      throw error;
    }
  }, [excalidrawAPI, challengeId, colorScheme, onExport]);

  // Expose methods via ref
  useEffect(() => {
    if (excalidrawAPI) {
      (window as any).excalidrawAPI = {
        save: handleSaveSnapshot,
        export: handleExport,
        getElements: () => excalidrawAPI.getSceneElements()
      };
    }
  }, [excalidrawAPI, handleSaveSnapshot, handleExport]);

  return (
    <div className="w-full h-full">
      <Excalidraw
        ref={(api) => setExcalidrawAPI(api as ExcalidrawImperativeAPI)}
        initialData={{
          elements: elements,
          appState: appState || {
            viewBackgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
            theme: colorScheme === 'dark' ? 'dark' : 'light'
          }
        }}
        onChange={handleChange}
        viewModeEnabled={readOnly}
        theme={colorScheme === 'dark' ? 'dark' : 'light'}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: false,
            changeViewBackgroundColor: true
          }
        }}
      />
    </div>
  );
}
