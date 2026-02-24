import type { Theme, SavedScene } from "./types";

interface SidebarProps {
  theme: Theme;
  savedScenes: SavedScene[];
  sceneName: string;
  onSceneNameChange: (name: string) => void;
  onSave: () => void;
  onLoad: (data: string) => void;
  onDelete: (index: number) => void;
}

export function Sidebar({
  savedScenes,
  sceneName,
  onSceneNameChange,
  onSave,
  onLoad,
  onDelete,
}: SidebarProps) {
  return (
    <div className="w-72 shrink-0 border-r border-[var(--border-default)] flex flex-col overflow-hidden z-40 bg-[var(--surface-1)]">
      {/* Header avec input de sauvegarde */}
      <div className="p-4 space-y-3 border-b border-[var(--border-default)]">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-[var(--text-muted)] font-title">
          💾 Scènes sauvegardées
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={sceneName}
            onChange={(e) => onSceneNameChange(e.target.value)}
            placeholder="Nom de la scène..."
            onKeyDown={(e) => e.key === "Enter" && onSave()}
            className="flex-1 px-3 py-2 text-sm rounded-[var(--btn-radius)] border border-[var(--border-default)] outline-none transition-all bg-[var(--surface-2)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--brand-primary)]"
          />
          <button
            onClick={onSave}
            className="px-3 py-2 text-sm font-medium rounded-[var(--btn-radius)] bg-[var(--brand-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-all shadow-md hover:shadow-lg theme-btn"
          >
            Sauver
          </button>
        </div>
      </div>

      {/* Liste des scènes */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {savedScenes.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm">Aucune scène sauvegardée</p>
          </div>
        ) : (
          savedScenes.map((scene, index) => (
            <div
              key={`${scene.name}-${index}`}
              className="theme-card rounded-[var(--card-radius)] border border-[var(--border-default)] p-3 transition-all hover:shadow-md bg-[var(--surface-2)] hover:border-[var(--brand-primary)]"
            >
              {scene.thumbnail !== "📄" ? (
                <img
                  src={scene.thumbnail}
                  alt={scene.name}
                  className="w-full h-24 object-cover rounded-[var(--btn-radius)] mb-2 border border-[var(--border-default)]"
                />
              ) : (
                <div className="w-full h-24 rounded-[var(--btn-radius)] mb-2 bg-[var(--surface-3)] flex items-center justify-center text-3xl">
                  📄
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate text-[var(--text-primary)]">{scene.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{scene.date}</p>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => onLoad(scene.data)}
                    className="p-1.5 rounded-md transition-colors text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10"
                    title="Charger"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(index)}
                    className="p-1.5 rounded-md transition-colors text-[var(--state-error)] hover:bg-[var(--state-error)]/10"
                    title="Supprimer"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
