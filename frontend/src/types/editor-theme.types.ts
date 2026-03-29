// Editor Theme Types for ByteBattle2
// Defines available code editor themes and their Monaco theme names

export type EditorTheme =
    | 'vs-dark'      // VS Code Dark (default)
    | 'vs-light'     // VS Code Light
    | 'hc-black'     // High Contrast Black
    | 'hc-light'     // High Contrast Light
    | 'monokai'      // Monokai
    | 'dracula'      // Dracula
    | 'github-dark'  // GitHub Dark
    | 'one-dark-pro' // One Dark Pro
    | 'solarized-dark' // Solarized Dark
    | 'solarized-light'; // Solarized Light

export interface EditorThemeOption {
    id: EditorTheme;
    name: string;
    preview: string; // Monaco theme name
    category: 'default' | 'dark' | 'light';
}

export const EDITOR_THEMES: EditorThemeOption[] = [
    { id: 'vs-dark', name: 'VS Code Dark', preview: 'vs-dark', category: 'default' },
    { id: 'vs-light', name: 'VS Code Light', preview: 'vs-light', category: 'light' },
    { id: 'hc-black', name: 'High Contrast', preview: 'hc-black', category: 'dark' },
    { id: 'hc-light', name: 'High Contrast Light', preview: 'hc-light', category: 'light' },
    { id: 'monokai', name: 'Monokai', preview: 'monokai', category: 'dark' },
    { id: 'dracula', name: 'Dracula', preview: 'dracula', category: 'dark' },
    { id: 'github-dark', name: 'GitHub Dark', preview: 'github-dark', category: 'dark' },
    { id: 'one-dark-pro', name: 'One Dark Pro', preview: 'one-dark-pro', category: 'dark' },
    { id: 'solarized-dark', name: 'Solarized Dark', preview: 'solarized-dark', category: 'dark' },
    { id: 'solarized-light', name: 'Solarized Light', preview: 'solarized-light', category: 'light' },
];

export const DEFAULT_EDITOR_THEME: EditorTheme = 'vs-dark';

export const getEditorThemeOption = (themeId: EditorTheme): EditorThemeOption => {
    return EDITOR_THEMES.find(t => t.id === themeId) || {
        id: DEFAULT_EDITOR_THEME,
        name: 'VS Code Dark',
        preview: DEFAULT_EDITOR_THEME,
        category: 'default'
    };
};
