import React, { useState, useCallback, useRef } from "react";
import {
  Excalidraw,
  exportToBlob,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";

import "@excalidraw/excalidraw/index.css";

import { useTheme } from "../../context/ThemeContext";
import { Notification } from "./Notification";
import { ToolbarButton } from "./ToolbarButton";
import { Sidebar } from "./Sidebar";
import type { Theme, SavedScene, ExcalidrawEditorProps } from "./types";

export function ExcalidrawEditor({
  initialTheme,
  langCode = "fr-FR",
  height = "100%",
  width = "100%",
  onChange,
  onSave,
  onExport,
  initialScenes = [],
  initialData,
  hideToolbar = false,
  hideThemeToggle = false,
  className = "",
}: ExcalidrawEditorProps) {
  const { colorScheme, toggleColorScheme } = useTheme();
  const excalidrawTheme: Theme = initialTheme || (colorScheme === "dark" ? "dark" : "light");

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [savedScenes, setSavedScenes] =
    useState<SavedScene[]>(initialScenes);
  const [sceneName, setSceneName] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ──────────────────────────────────────────────
  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // ── Export PNG ───────────────────────────────────────────
  const handleExportPNG = useCallback(async () => {
    if (!excalidrawAPI) return;
    const elements = excalidrawAPI.getSceneElements();
    if (elements.length === 0) {
      showNotification("⚠️ Le canvas est vide !");
      return;
    }
    try {
      const blob = await exportToBlob({
        elements,
        appState: {
          ...excalidrawAPI.getAppState(),
          exportWithDarkMode: excalidrawTheme === "dark",
        },
        files: excalidrawAPI.getFiles(),
      });

      onExport?.("png", blob);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "excalidraw-export.png";
      a.click();
      URL.revokeObjectURL(url);
      showNotification("✅ Image PNG exportée !");
    } catch (err) {
      console.error(err);
      showNotification("❌ Erreur lors de l'export");
    }
  }, [excalidrawAPI, excalidrawTheme, showNotification, onExport]);

  // ── Export JSON ──────────────────────────────────────────
  const handleExportJSON = useCallback(() => {
    if (!excalidrawAPI) return;
    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const files = excalidrawAPI.getFiles();
    const json = serializeAsJSON(
      elements as readonly ExcalidrawElement[],
      appState as AppState,
      files as BinaryFiles,
      "local"
    );

    onExport?.("json", json);

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "excalidraw-scene.excalidraw";
    a.click();
    URL.revokeObjectURL(url);
    showNotification("✅ Fichier JSON exporté !");
  }, [excalidrawAPI, showNotification, onExport]);

  // ── Import JSON ──────────────────────────────────────────
  const handleImportJSON = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !excalidrawAPI) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        excalidrawAPI.updateScene({ elements: data.elements || [] });
        if (data.appState) {
          excalidrawAPI.updateScene({ appState: { ...data.appState } });
        }
        showNotification("✅ Scène importée !");
      } catch (err) {
        console.error(err);
        showNotification("❌ Fichier invalide");
      }
      e.target.value = "";
    },
    [excalidrawAPI, showNotification]
  );

  // ── Save Scene ───────────────────────────────────────────
  const handleSaveScene = useCallback(async () => {
    if (!excalidrawAPI) return;
    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const files = excalidrawAPI.getFiles();
    const name = sceneName.trim() || `Scène ${savedScenes.length + 1}`;

    const json = serializeAsJSON(
      elements as readonly ExcalidrawElement[],
      appState as AppState,
      files as BinaryFiles,
      "local"
    );

    let thumbnail = "📄";
    if (elements.length > 0) {
      try {
        const blob = await exportToBlob({
          elements,
          appState: { ...appState, exportWithDarkMode: false },
          files,
          getDimensions: () => ({ width: 200, height: 150, scale: 1 }),
        });
        thumbnail = URL.createObjectURL(blob);
      } catch {
        thumbnail = "📄";
      }
    }

    const newScene: SavedScene = {
      name,
      data: json,
      thumbnail,
      date: new Date().toLocaleString("fr-FR"),
    };

    setSavedScenes((prev) => [...prev, newScene]);
    setSceneName("");
    onSave?.(newScene);
    showNotification(`✅ "${name}" sauvegardée !`);
  }, [excalidrawAPI, sceneName, savedScenes.length, showNotification, onSave]);

  // ── Load Scene ───────────────────────────────────────────
  const handleLoadScene = useCallback(
    (sceneData: string) => {
      if (!excalidrawAPI) return;
      try {
        const data = JSON.parse(sceneData);
        excalidrawAPI.updateScene({ elements: data.elements || [] });
        showNotification("✅ Scène chargée !");
        setShowSidebar(false);
      } catch (err) {
        console.error(err);
        showNotification("❌ Erreur de chargement");
      }
    },
    [excalidrawAPI, showNotification]
  );

  // ── Delete Scene ─────────────────────────────────────────
  const handleDeleteScene = useCallback(
    (index: number) => {
      setSavedScenes((prev) => prev.filter((_, i) => i !== index));
      showNotification("🗑️ Scène supprimée");
    },
    [showNotification]
  );

  // ── Clear Canvas ─────────────────────────────────────────
  const handleClearCanvas = useCallback(() => {
    if (!excalidrawAPI) return;
    excalidrawAPI.updateScene({ elements: [] });
    excalidrawAPI.scrollToContent();
    showNotification("🧹 Canvas nettoyé !");
  }, [excalidrawAPI, showNotification]);

  // ── onChange handler ─────────────────────────────────────
  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      onChange?.(elements, appState, files);
    },
    [onChange]
  );

  // ── Expose API globally for CanvasEditor page ───────────
  React.useEffect(() => {
    if (excalidrawAPI) {
      (window as any).excalidrawAPI = {
        save: async () => {
          const elements = excalidrawAPI.getSceneElements();
          const blob = await exportToBlob({
            elements,
            appState: {
              ...excalidrawAPI.getAppState(),
              exportBackground: true,
              exportWithDarkMode: excalidrawTheme === "dark",
            },
            files: excalidrawAPI.getFiles(),
          });
          return { elements, blob };
        },
        export: async (format: 'png' | 'json') => {
          if (format === 'json') handleExportJSON();
          else await handleExportPNG();
        },
        getElements: () => excalidrawAPI.getSceneElements(),
      };
    }
  }, [excalidrawAPI, excalidrawTheme, handleExportJSON, handleExportPNG]);

  // ── Render ───────────────────────────────────────────────
  return (
    <div
      style={{ height, width }}
      className={`flex flex-col overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] ${className}`}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".excalidraw,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Notification */}
      <Notification message={notification} theme={excalidrawTheme} />

      {/* Toolbar */}
      {!hideToolbar && (
        <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-default)] z-50 shrink-0 bg-[var(--surface-1)]">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-[var(--btn-radius)] bg-[var(--brand-primary)] shadow-lg glow">
              <svg
                className="w-5 h-5 text-[var(--bg-primary)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block font-title">
              <span className="gradient-brand-text">
                Excalidraw
              </span>
              <span className="text-xs font-normal ml-2 text-[var(--text-muted)]">
                Canvas
              </span>
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <ToolbarButton
              onClick={handleImportJSON}
              theme={excalidrawTheme}
              title="Importer"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              }
              label="Importer"
            />
            <ToolbarButton
              onClick={handleExportJSON}
              theme={excalidrawTheme}
              title="Exporter JSON"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
              label="JSON"
            />
            <ToolbarButton
              onClick={handleExportPNG}
              theme={excalidrawTheme}
              title="Exporter PNG"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              label="PNG"
            />

            <div className="w-px h-6 mx-1 bg-[var(--border-default)]" />

            <ToolbarButton
              onClick={() => setShowSidebar(!showSidebar)}
              theme={excalidrawTheme}
              title="Scènes sauvegardées"
              active={showSidebar}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
              label="Scènes"
            />
            <ToolbarButton
              onClick={handleClearCanvas}
              theme={excalidrawTheme}
              title="Nettoyer le canvas"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
              label="Effacer"
              danger
            />

            {!hideThemeToggle && (
              <>
                <div className="w-px h-6 mx-1 bg-[var(--border-default)]" />
                <button
                  onClick={toggleColorScheme}
                  title="Changer le thème"
                  className="p-2 rounded-[var(--btn-radius)] transition-all duration-200 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-secondary)] hover:text-[var(--brand-primary)]"
                >
                  {colorScheme === "dark" ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              </>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            theme={excalidrawTheme}
            savedScenes={savedScenes}
            sceneName={sceneName}
            onSceneNameChange={setSceneName}
            onSave={handleSaveScene}
            onLoad={handleLoadScene}
            onDelete={handleDeleteScene}
          />
        )}

        {/* Excalidraw Canvas */}
        <div className="flex-1 relative">
          <Excalidraw
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            theme={excalidrawTheme}
            langCode={langCode}
            onChange={handleChange}
            UIOptions={{
              canvasActions: {
                loadScene: true,
                saveToActiveFile: false,
                toggleTheme: false,
                export: false,
              },
            }}
            initialData={{
              appState: {
                viewBackgroundColor:
                  excalidrawTheme === "dark" ? "#1e1e1e" : "#ffffff",
                currentItemFontFamily: 1,
                ...initialData?.appState,
              },
              elements: initialData?.elements || [],
              files: initialData?.files,
            }}
          />
        </div>
      </div>
    </div>
  );
}
