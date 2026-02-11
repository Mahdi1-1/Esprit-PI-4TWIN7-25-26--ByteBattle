export type Theme = "light" | "dark";

export interface SavedScene {
  name: string;
  data: string;
  thumbnail: string;
  date: string;
}

export interface ExcalidrawEditorProps {
  /** Thème initial ("light" ou "dark") */
  initialTheme?: Theme;
  /** Langue de l'interface */
  langCode?: string;
  /** Hauteur du composant (CSS) */
  height?: string;
  /** Largeur du composant (CSS) */
  width?: string;
  /** Callback quand la scène change */
  onChange?: (elements: readonly any[], appState: any, files: any) => void;
  /** Callback quand on sauvegarde */
  onSave?: (scene: SavedScene) => void;
  /** Callback quand on exporte */
  onExport?: (type: "png" | "json", data: Blob | string) => void;
  /** Scènes pré-chargées */
  initialScenes?: SavedScene[];
  /** Données initiales à charger */
  initialData?: {
    elements?: readonly any[];
    appState?: Record<string, any>;
    files?: any;
  };
  /** Masquer la toolbar du haut */
  hideToolbar?: boolean;
  /** Masquer le bouton de thème */
  hideThemeToggle?: boolean;
  /** Classe CSS additionnelle */
  className?: string;
}
